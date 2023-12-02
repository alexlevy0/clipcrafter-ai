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

    await sleep(conf.rekognitionConf.jobCheckDelay)
  }
  throw new Error('Job did not complete successfully')
}

function calculateCropCoordinates(
  box: BoundingBox,
  videoWidth: number,
  videoHeight: number,
  lastFacePosition: BoundingBox | null,
  lastCrop: CropCoordinates | null,
): CropCoordinates {
  let paddingFactor = conf.rekognitionConf.paddingFactorBase

  if (lastFacePosition) {
    const movementX = Math.abs(box.Left - lastFacePosition.Left)
    const movementY = Math.abs(box.Top - lastFacePosition.Top)

    if (
      movementX > conf.rekognitionConf.significantMovementThreshold ||
      movementY > conf.rekognitionConf.significantMovementThreshold
    ) {
      paddingFactor = paddingFactor + 0.5
    }
  }

  lastFacePosition = box

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
  if (
    lastCrop &&
    lastFacePosition &&
    !isCropChangeSignificant({ x, y, w: cropWidth, h: cropHeight }, lastCrop)
  ) {
    return lastCrop // Renvoyer les anciennes coordonnées si le changement n'est pas significatif
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(cropWidth),
    h: Math.round(cropHeight),
  }
}

function isSignificantEmotionChange(
  prevEmotions: Emotion[],
  newEmotions: Emotion[],
  highConfidenceThreshold: number = conf.rekognitionConf
    .highConfidenceThreshold,
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
  tolerance: number = conf.rekognitionConf.cropChangeTolerance,
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
  videoWidth: number = conf.rekognitionConf.width,
  videoHeight: number = conf.rekognitionConf.height,
): Promise<VideoShot[]> {
  if (!conf.rekognitionConf.enabled) {
    const cropData = JSON.parse(await fs.readFile(conf.cropFile, 'utf-8'))
    return cropData.shots
  }

  const client = new RekognitionClient({
    region: conf.rekognitionConf.region,
  })

  const startCommand = new StartFaceDetectionCommand({
    Video: {
      S3Object: {
        Bucket: `${Bucket}${conf.rekognitionConf.bucketSufix}`,
        Name,
      },
    },
    FaceAttributes: 'ALL',
  })

  console.log('StartFaceDetectionCommand')
  const startResponse = await client.send(startCommand)

  if (!startResponse.JobId) {
    throw new Error("Échec de démarrage de l'analyse de la vidéo")
  }

  const getResponse = await waitForJobCompletion(client, startResponse.JobId)
  console.log({ getResponse })
  const shots: VideoShot[] = []
  let lastFacePosition: BoundingBox | null = null
  let prevEmotions: Emotion[] = []

  getResponse.Faces?.forEach((faceDetection: FaceDetection) => {
    const face = faceDetection.Face
    const timestamp = faceDetection.Timestamp / 1000 // Convertir en secondes

    const shouldCrop =
      face &&
      conf.rekognitionConf.confidenceThreshold &&
      (face.MouthOpen?.Value ||
        face.Smile?.Value ||
        isSignificantEmotionChange(prevEmotions, face.Emotions))

    let crop = shouldCrop
      ? calculateCropCoordinates(
          face.BoundingBox,
          videoWidth,
          videoHeight,
          lastFacePosition,
          null,
        )
      : null

    if (shots.length > 0) {
      let lastShot = shots[shots.length - 1]
      // Fusionner si le shot actuel est similaire au précédent
      if (
        lastShot.label === (shouldCrop ? 'Speaking/Smiling' : 'No Face') &&
        lastShot.crop === crop
      ) {
        lastShot.ts_end = Math.max(lastShot.ts_end, timestamp)
      } else {
        let newTsStart = lastShot.ts_end
        let newTsEnd = Math.max(
          newTsStart + conf.rekognitionConf.minShotDuration,
          timestamp,
        )
        shots.push({
          ts_start: newTsStart,
          ts_end: newTsEnd,
          crop,
          label: shouldCrop ? 'Speaking/Smiling' : 'No Face',
        })
      }
    } else {
      // Premier shot
      shots.push({
        ts_start: 0,
        ts_end: Math.max(conf.rekognitionConf.minShotDuration, timestamp),
        crop,
        label: shouldCrop ? 'Speaking/Smiling' : 'No Face',
      })
    }

    lastFacePosition = face ? face.BoundingBox : lastFacePosition
    prevEmotions = face ? face.Emotions : prevEmotions
  })
  // Assurer que le dernier shot a une durée minimale de conf.rekognitionConf.minShotDuration
  if (shots.length > 0) {
    let lastShot = shots[shots.length - 1]
    if (
      lastShot.ts_end - lastShot.ts_start <
      conf.rekognitionConf.minShotDuration
    ) {
      lastShot.ts_end = lastShot.ts_start + conf.rekognitionConf.minShotDuration
    }
  }
  return shots.filter(s => s.ts_end !== s.ts_start)
}
