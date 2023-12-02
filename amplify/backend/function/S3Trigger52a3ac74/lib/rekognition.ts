import * as fs from 'fs/promises'
import {
  RekognitionClient,
  StartFaceDetectionCommand,
  GetFaceDetectionCommand,
  FaceDetection,
  GetFaceDetectionCommandOutput,
  BoundingBox,
  Emotion,
} from '@aws-sdk/client-rekognition'
import { conf } from './config'
import { sleep } from './utils'
import { CropCoordinates, VideoShot } from './types'

const {
  jobCheckDelay,
  paddingFactorBase,
  significantMovementThreshold,
  highConfidenceThreshold,
  cropChangeTolerance,
  confidenceThreshold,
  enabled,
  region,
  bucketSufix,
  minShotDuration,
  height,
  width,
} = conf.rekognitionConf

async function waitForJobCompletion(
  client: RekognitionClient,
  jobId: string,
): Promise<GetFaceDetectionCommandOutput> {
  let jobStatus: string = 'IN_PROGRESS'
  while (jobStatus === 'IN_PROGRESS') {
    const response = await client.send(
      new GetFaceDetectionCommand({ JobId: jobId }),
    )
    jobStatus = response.JobStatus || 'FAILED'
    if (jobStatus === 'SUCCEEDED') {
      return response
    } else if (jobStatus === 'FAILED') {
      throw new Error('Job failed')
    }

    await sleep(jobCheckDelay)
  }
  throw new Error('Job did not complete successfully')
}

function calculateCropCoordinates(
  box: BoundingBox,
  videoWidth: number,
  videoHeight: number,
  lastFacePosition: BoundingBox | null,
  lastCrop: CropCoordinates | null,
): { crop: CropCoordinates; newFacePosition: BoundingBox } {
  let paddingFactor = paddingFactorBase

  if (lastFacePosition) {
    const movementX = Math.abs(box.Left - lastFacePosition.Left)
    const movementY = Math.abs(box.Top - lastFacePosition.Top)

    if (
      movementX > significantMovementThreshold ||
      movementY > significantMovementThreshold
    ) {
      paddingFactor = paddingFactor + 0.1
    }
  }

  const faceWidth = box.Width * videoWidth
  const faceHeight = box.Height * videoHeight

  const faceCenterX = box.Left * videoWidth + faceWidth / 2
  const faceCenterY = box.Top * videoHeight + faceHeight / 2

  const cropWidth = Math.min(faceWidth * (1 + paddingFactor), videoWidth)
  const cropHeight = Math.min(faceHeight * (1 + paddingFactor), videoHeight)

  let x = Math.max(faceCenterX - cropWidth / 2, 0)
  let y = Math.max(faceCenterY - cropHeight / 2, 0)

  if (x + cropWidth > videoWidth) {
    x = videoWidth - cropWidth
  }
  if (y + cropHeight > videoHeight) {
    y = videoHeight - cropHeight
  }

  let newCrop = {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(cropWidth),
    h: Math.round(cropHeight),
  }

  if (lastCrop && !isCropChangeSignificant(newCrop, lastCrop)) {
    return { crop: lastCrop, newFacePosition: box }
  }

  return { crop: newCrop, newFacePosition: box }
}

function isEmotionChange(
  prevEmotions: Emotion[],
  newEmotions: Emotion[],
): boolean {
  if (
    !prevEmotions ||
    !newEmotions ||
    prevEmotions.length === 0 ||
    newEmotions.length === 0
  ) {
    return false
  }

  const prevPrimaryEmotion = prevEmotions.reduce(
    (prev, current) => (prev.Confidence > current.Confidence ? prev : current),
    prevEmotions[0],
  )
  const newPrimaryEmotion = newEmotions.reduce(
    (prev, current) => (prev.Confidence > current.Confidence ? prev : current),
    newEmotions[0],
  )

  const isPrevEmotionHighConfidence =
    prevPrimaryEmotion.Confidence >= highConfidenceThreshold
  const isNewEmotionHighConfidence =
    newPrimaryEmotion.Confidence >= highConfidenceThreshold

  return (
    isPrevEmotionHighConfidence &&
    isNewEmotionHighConfidence &&
    prevPrimaryEmotion.Type !== newPrimaryEmotion.Type
  )
}

function isCropChangeSignificant(
  newCrop: CropCoordinates,
  lastCrop: CropCoordinates,
  tolerance: number = cropChangeTolerance,
): boolean {
  const deltaX = Math.abs(newCrop.x - lastCrop.x)
  const deltaY = Math.abs(newCrop.y - lastCrop.y)
  const deltaW = Math.abs(newCrop.w - lastCrop.w)
  const deltaH = Math.abs(newCrop.h - lastCrop.h)

  return (
    deltaX > tolerance * lastCrop.w ||
    deltaY > tolerance * lastCrop.h ||
    deltaW > tolerance * lastCrop.w ||
    deltaH > tolerance * lastCrop.h
  )
}

export async function analyzeVideo(
  Name: string,
  Bucket: string,
  videoWidth: number = width,
  videoHeight: number = height,
): Promise<VideoShot[]> {
  if (!enabled) {
    console.log('analyzeVideo : rekognition disabled')
    const cropData = JSON.parse(await fs.readFile(conf.cropFile, 'utf-8'))
    return cropData.shots
  }

  console.log('analyzeVideo : rekognition enabled, Starting FaceDetection')

  const client = new RekognitionClient({ region })

  const startCommand = new StartFaceDetectionCommand({
    Video: {
      S3Object: {
        Bucket: `${Bucket}${bucketSufix}`,
        Name,
      },
    },
    FaceAttributes: 'ALL',
  })

  const startResponse = await client.send(startCommand)
  if (!startResponse.JobId) {
    throw new Error('Video analysis failed to start')
  }

  const getResponse = await waitForJobCompletion(client, startResponse.JobId)

  const shots: VideoShot[] = []
  let lastFacePosition: BoundingBox | null = null
  let prevEmotions: Emotion[] = []

  getResponse.Faces?.forEach((faceDetection: FaceDetection) => {
    const face = faceDetection.Face
    const timestamp = faceDetection.Timestamp / 1000 // secondes

    const emotionChanged = isEmotionChange(prevEmotions, face.Emotions)
    const shouldCrop =
      face && confidenceThreshold && (face.Smile?.Value || emotionChanged)

    let crop, lastCrop

    if (shouldCrop) {
      const cropResult = calculateCropCoordinates(
        face.BoundingBox,
        videoWidth,
        videoHeight,
        lastFacePosition,
        lastCrop,
      )
      crop = cropResult.crop
      lastFacePosition = cropResult.newFacePosition
      lastCrop = crop // Update the lastCrop with the new crop
    } else {
      crop = null
    }

    const label = shouldCrop ? 'Speaking/Smiling' : 'No Face'
    if (shots.length > 0) {
      let lastShot = shots[shots.length - 1]
      // Fusionner si le shot actuel est similaire au précédent
      if (lastShot.label === label && lastShot.crop === crop) {
        lastShot.ts_end = Math.max(lastShot.ts_end, timestamp)
      } else {
        let newTsStart = lastShot.ts_end
        let newTsEnd = Math.max(newTsStart + minShotDuration, timestamp)
        shots.push({
          ts_start: newTsStart,
          ts_end: newTsEnd,
          crop,
          label,
        })
      }
    } else {
      // Premier shot
      shots.push({
        ts_start: 0,
        ts_end: Math.max(minShotDuration, timestamp),
        crop,
        label,
      })
    }

    lastFacePosition = face ? face.BoundingBox : lastFacePosition
    prevEmotions = face ? face.Emotions : prevEmotions
  })
  // Assurer que le dernier shot a une durée minimale de minShotDuration
  if (shots.length > 0) {
    let lastShot = shots[shots.length - 1]
    if (lastShot.ts_end - lastShot.ts_start < minShotDuration) {
      lastShot.ts_end = lastShot.ts_start + minShotDuration
    }
  }
  return shots.filter(s => s.ts_end !== s.ts_start)
}
