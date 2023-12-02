import {
  RekognitionClient,
  StartFaceDetectionCommand,
  GetFaceDetectionCommand,
  FaceDetection,
  GetFaceDetectionCommandOutput,
  BoundingBox,
  Emotion,
} from '@aws-sdk/client-rekognition'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const config = {
  highConfidenceThreshold: 90.0,
  // paddingFactorBase: 0.25,
  paddingFactorBase: 0.95,
  significantMovementThreshold: 0.7,
  jobCheckDelay: 5000,
}
const MIN_SHOT_DURATION = 0.5
const CONFIDENCE_THRESHOLD = 80.0
const CROP_CHANGE_TOLERANCE = 0.2 // Seuil de tolérance pour le changement de crop (20%)

interface CropCoordinates {
  x: number
  y: number
  w: number
  h: number
}

interface VideoShot {
  ts_start: number
  ts_end: number
  crop: CropCoordinates
  label: string | null
}

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

    await delay(config.jobCheckDelay)
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
  let paddingFactor = config.paddingFactorBase

  if (lastFacePosition) {
    const movementX = Math.abs(box.Left - lastFacePosition.Left)
    const movementY = Math.abs(box.Top - lastFacePosition.Top)

    if (
      movementX > config.significantMovementThreshold ||
      movementY > config.significantMovementThreshold
    ) {
      paddingFactor = paddingFactor + 0.1
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
  highConfidenceThreshold: number = config.highConfidenceThreshold,
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
): boolean {
  const deltaX = Math.abs(newCrop.x - lastCrop.x)
  const deltaY = Math.abs(newCrop.y - lastCrop.y)
  const deltaW = Math.abs(newCrop.w - lastCrop.w)
  const deltaH = Math.abs(newCrop.h - lastCrop.h)

  return (
    deltaX > CROP_CHANGE_TOLERANCE * lastCrop.w ||
    deltaY > CROP_CHANGE_TOLERANCE * lastCrop.h ||
    deltaW > CROP_CHANGE_TOLERANCE * lastCrop.w ||
    deltaH > CROP_CHANGE_TOLERANCE * lastCrop.h
  )
}

export async function analyzeVideo(
  Name: string,
  Bucket: string,
  videoWidth: number,
  videoHeight: number,
): Promise<VideoShot[]> {
  const client = new RekognitionClient({
    region: 'eu-west-2',
  })

  const startCommand = new StartFaceDetectionCommand({
    Video: {
      S3Object: {
        Bucket,
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
  let lastTsEnd: number = 0
  let lastCrop: CropCoordinates | null = null
  let lastFacePosition: BoundingBox | null = null
  let prevEmotions: Emotion[] = []

  getResponse.Faces?.forEach((faceDetection: FaceDetection) => {
    const face = faceDetection.Face
    const timestamp = faceDetection.Timestamp / 1000 // Convertir en secondes

    const shouldCrop =
      face &&
      face.Confidence >= CONFIDENCE_THRESHOLD &&
      (face.MouthOpen?.Value ||
        face.Smile?.Value ||
        isSignificantEmotionChange(prevEmotions, face.Emotions))

    let crop = shouldCrop
      ? calculateCropCoordinates(
          face.BoundingBox,
          videoWidth,
          videoHeight,
          lastFacePosition,
          lastCrop,
        )
      : null

    lastCrop = crop
    lastFacePosition = face.BoundingBox

    // Si un visage est détecté ou si nous sommes au début d'un nouveau shot
    if (shouldCrop || shots.length === 0 || lastTsEnd !== timestamp) {
      shots.push({
        ts_start: shots.length === 0 ? 0 : lastTsEnd,
        ts_end: timestamp,
        crop: crop,
        label: shouldCrop ? 'Speaking/Smiling' : 'No Face', // Modifier le label selon le contexte
      })
      lastTsEnd = timestamp
    } else if (shots.length > 0) {
      // Mettre à jour le ts_end du dernier shot si le timestamp actuel est différent
      shots[shots.length - 1].ts_end = timestamp
    }

    if (face) {
      prevEmotions = face.Emotions
      lastFacePosition = face.BoundingBox
    }
  })

  if (shots.length > 0 && shots[shots.length - 1].ts_end === lastTsEnd) {
    shots[shots.length - 1].ts_end = lastTsEnd + MIN_SHOT_DURATION
  }

  return shots
}
