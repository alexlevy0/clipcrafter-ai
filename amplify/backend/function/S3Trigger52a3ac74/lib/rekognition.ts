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
    const response = await client.send(new GetFaceDetectionCommand({ JobId: jobId }))
    jobStatus = response.JobStatus || 'FAILED'
    if (jobStatus === 'SUCCEEDED') {
      return response
    } else if (jobStatus === 'FAILED') {
      throw new Error(`Job failed : ${response.StatusMessage}`)
    }

    await sleep(jobCheckDelay)
  }
  throw new Error('Job did not complete successfully')
}

function calculateEuclideanDistance(x1: Number, y1: Number, x2: Number, y2: Number) {
  const diffX = Number(x2) - Number(x1)
  const diffY = Number(y2) - Number(y1)
  return Math.sqrt(diffX * diffX + diffY * diffY)
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
    const lastCenterX =
      lastFacePosition.Left * videoWidth + (lastFacePosition.Width * videoWidth) / 2
    const lastCenterY =
      lastFacePosition.Top * videoHeight + (lastFacePosition.Height * videoHeight) / 2
    const currentCenterX = box.Left * videoWidth + (box.Width * videoWidth) / 2
    const currentCenterY = box.Top * videoHeight + (box.Height * videoHeight) / 2

    const movementDistance = calculateEuclideanDistance(
      lastCenterX,
      lastCenterY,
      currentCenterX,
      currentCenterY,
    )

    if (movementDistance > significantMovementThreshold) {
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

function isEmotionChange(prevEmotions: Emotion[], newEmotions: Emotion[]): boolean {
  if (!prevEmotions || !newEmotions || prevEmotions.length === 0 || newEmotions.length === 0) {
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

  const isPrevEmotionHighConfidence = prevPrimaryEmotion.Confidence >= highConfidenceThreshold
  const isNewEmotionHighConfidence = newPrimaryEmotion.Confidence >= highConfidenceThreshold

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
  // Calculating the center points of both crops
  const centerXNew = newCrop.x + newCrop.w / 2
  const centerYNew = newCrop.y + newCrop.h / 2
  const centerXLast = lastCrop.x + lastCrop.w / 2
  const centerYLast = lastCrop.y + lastCrop.h / 2

  // Calculating Euclidean distance between the centers of the new and last crops
  const distance = calculateEuclideanDistance(centerXNew, centerYNew, centerXLast, centerYLast)

  // Comparing the distance with the tolerance (adjusted for the size of the last crop)
  const adjustedTolerance = Math.sqrt((tolerance * lastCrop.w) ** 2 + (tolerance * lastCrop.h) ** 2)

  return distance > adjustedTolerance
}

function createOrUpdateShots(shots, timestamp, crop, label, minShotDuration) {
  if (shots.length > 0) {
    let lastShot = shots[shots.length - 1]
    // Check if the current shot is similar to the last one
    if (
      lastShot.label === label &&
      (crop === null || JSON.stringify(lastShot.crop) === JSON.stringify(crop))
    ) {
      // Update end timestamp if the current shot is similar to the last one
      lastShot.ts_end = Math.max(lastShot.ts_end, timestamp)
    } else {
      // Create a new shot if the current shot is different from the last one
      const newTsStart = Math.max(lastShot.ts_end, timestamp - minShotDuration)
      shots.push({
        ts_start: newTsStart,
        ts_end: timestamp,
        crop,
        label,
      })
    }
  } else {
    // Create the first shot
    shots.push({
      ts_start: 0,
      ts_end: timestamp,
      crop,
      label,
    })
  }
  return shots
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

  let shots: VideoShot[] = []
  let lastFacePosition: BoundingBox | null = null
  let prevEmotions: Emotion[] = []

  getResponse.Faces?.forEach((faceDetection: FaceDetection) => {
    const timestamp = faceDetection.Timestamp / 1000 // secondes
    const face = faceDetection.Face
    const { MouthOpen, Smile, BoundingBox, Emotions } = face

    const emotionChanged = isEmotionChange(prevEmotions, Emotions)
    const mouthOpen = MouthOpen.Value && MouthOpen.Confidence > confidenceThreshold
    const smiling = Smile.Value && Smile.Confidence > confidenceThreshold

    const shouldCrop = face && (mouthOpen || smiling || emotionChanged)

    let crop, lastCrop

    if (shouldCrop) {
      const cropResult = calculateCropCoordinates(
        BoundingBox,
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
    shots = createOrUpdateShots(shots, timestamp, crop, label, minShotDuration)

    lastFacePosition = face ? BoundingBox : lastFacePosition
    prevEmotions = face ? Emotions : prevEmotions
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
