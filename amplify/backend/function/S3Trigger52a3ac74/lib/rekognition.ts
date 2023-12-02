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
  paddingFactorBase: 0.25,
  significantMovementThreshold: 0.5,
  jobCheckDelay: 5000,
  MIN_SHOT_DURATION: 0.5,
}

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
  let currentShot: VideoShot | null = null
  let lastFacePosition: BoundingBox | null = null
  let prevEmotions: Emotion[] = []

  getResponse.Faces?.forEach((faceDetection: FaceDetection) => {
    const face = faceDetection.Face
    const timestamp = faceDetection.Timestamp / 1000

    if (face) {
      const crop = calculateCropCoordinates(
        face.BoundingBox,
        videoWidth,
        videoHeight,
        lastFacePosition,
      )

      if (face.MouthOpen?.Value || face.Smile?.Value) {
        if (!currentShot) {
          currentShot = {
            ts_start: timestamp,
            ts_end: timestamp,
            crop: crop,
            label: 'Speaking/Smiling',
          }
        } else {
          currentShot.ts_end = timestamp
        }
      } else if (isSignificantEmotionChange(prevEmotions, face.Emotions)) {
        if (currentShot) {
          shots.push(currentShot)
        }
        currentShot = {
          ts_start: timestamp,
          ts_end: timestamp,
          crop: crop,
          label: 'Emotion Change',
        }
      }

      prevEmotions = face.Emotions
      lastFacePosition = face.BoundingBox
    }

    if (!face.MouthOpen?.Value && currentShot) {
      shots.push(currentShot)
      currentShot = null
    }
  })

  if (currentShot) {
    shots.push(currentShot)
  }

  return shots
}
