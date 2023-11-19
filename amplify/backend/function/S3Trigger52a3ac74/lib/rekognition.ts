import {
  RekognitionClient,
  StartFaceDetectionCommand,
  GetFaceDetectionCommand,
  FaceDetection,
  GetFaceDetectionCommandOutput,
  BoundingBox,
  Emotion,
} from "@aws-sdk/client-rekognition";
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const config = {
  videoUri: 'TODO',
  awsProfile: "AddProfilAWS",
  awsRegion: "eu-west-4",
  videoWidth: 1920,
  videoHeight: 1080,
  cloudWatchLogGroupName: "LogGroup",
  cloudWatchLogStreamName: "LogStream",
  highConfidenceThreshold: 90.0,
  paddingFactorBase: 0.25,
  significantMovementThreshold: 0.1,
  jobCheckDelay: 5000,
};

interface CropCoordinates {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface VideoShot {
  ts_start: number;
  ts_end: number;
  crop: CropCoordinates;
  label: string | null;
}

async function waitForJobCompletion(
  client: RekognitionClient,
  jobId: string
): Promise<GetFaceDetectionCommandOutput> {
  let jobStatus: string = "IN_PROGRESS";
  while (jobStatus === "IN_PROGRESS") {
    const response = await client.send(
      new GetFaceDetectionCommand({ JobId: jobId })
    );
    jobStatus = response.JobStatus || "FAILED";
    if (jobStatus === "SUCCEEDED") {
      return response;
    } else if (jobStatus === "FAILED") {
      throw new Error("Job failed");
    }

    await delay(config.jobCheckDelay);
  }
  throw new Error("Job did not complete successfully");
}

let lastFacePosition: BoundingBox | null = null;

function calculateCropCoordinates(
  box: BoundingBox,
  videoWidth: number,
  videoHeight: number,
  lastFacePosition: BoundingBox | null
): CropCoordinates {
  let paddingFactor = config.paddingFactorBase;

  if (lastFacePosition) {
    const movementX = Math.abs(box.Left - lastFacePosition.Left);
    const movementY = Math.abs(box.Top - lastFacePosition.Top);

    if (
      movementX > config.significantMovementThreshold ||
      movementY > config.significantMovementThreshold
    ) {
      paddingFactor = paddingFactor + 0.1;
    }
  }

  lastFacePosition = box;

  const faceWidth = box.Width * videoWidth;
  const faceHeight = box.Height * videoHeight;

  const faceCenterX = box.Left * videoWidth + faceWidth / 2;
  const faceCenterY = box.Top * videoHeight + faceHeight / 2;

  const cropWidth = Math.min(faceWidth * (1 + paddingFactor), videoWidth);
  const cropHeight = Math.min(faceHeight * (1 + paddingFactor), videoHeight);

  let x = Math.max(faceCenterX - cropWidth / 2, 0);
  let y = Math.max(faceCenterY - cropHeight / 2, 0);

  if (x + cropWidth > videoWidth) {
    x = videoWidth - cropWidth;
  }
  if (y + cropHeight > videoHeight) {
    y = videoHeight - cropHeight;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(cropWidth),
    h: Math.round(cropHeight),
  };
}

function isSignificantEmotionChange(
  prevEmotions: Emotion[],
  newEmotions: Emotion[],
  highConfidenceThreshold: number = config.highConfidenceThreshold
): boolean {
  if (
    !prevEmotions ||
    !newEmotions ||
    prevEmotions.length === 0 ||
    newEmotions.length === 0
  ) {
    return false;
  }

  const prevPrimaryEmotion = prevEmotions.reduce(
    (prev, current) => (prev.Confidence > current.Confidence ? prev : current),
    prevEmotions[0]
  );
  const newPrimaryEmotion = newEmotions.reduce(
    (prev, current) => (prev.Confidence > current.Confidence ? prev : current),
    newEmotions[0]
  );

  const isPrevEmotionHighConfidence =
    prevPrimaryEmotion.Confidence >= highConfidenceThreshold;
  const isNewEmotionHighConfidence =
    newPrimaryEmotion.Confidence >= highConfidenceThreshold;

  return (
    isPrevEmotionHighConfidence &&
    isNewEmotionHighConfidence &&
    prevPrimaryEmotion.Type !== newPrimaryEmotion.Type
  );
}

async function analyzeVideo(
  videoUri: string,
  videoWidth: number,
  videoHeight: number,
  cloudWatchClient: CloudWatchClient
): Promise<VideoShot[]> {
  const client = new RekognitionClient({
    credentials: fromIni({ profile: config.awsProfile }),
    region: config.awsRegion,
  });

  const startCommand = new StartFaceDetectionCommand({
    Video: {
      S3Object: {
        Bucket: "nom-de-votre-bucket",
        Name: videoUri,
      },
    },
    FaceAttributes: "ALL",
  });

  const startResponse = await client.send(startCommand);

  if (!startResponse.JobId) {
    throw new Error("Échec de démarrage de l'analyse de la vidéo");
  }

  const getResponse = await waitForJobCompletion(client, startResponse.JobId);
  const shots: VideoShot[] = [];
  let currentShot: VideoShot | null = null;
  let lastFacePosition: BoundingBox | null = null;
  let prevEmotions: Emotion[] = [];

  getResponse.Faces?.forEach((faceDetection: FaceDetection) => {
    const face = faceDetection.Face;
    const timestamp = faceDetection.Timestamp;

    if (face) {
      const crop = calculateCropCoordinates(
        face.BoundingBox,
        videoWidth,
        videoHeight,
        lastFacePosition
      );

      if (face.MouthOpen?.Value || face.Smile?.Value) {
        if (!currentShot) {
          currentShot = {
            ts_start: timestamp,
            ts_end: timestamp,
            crop: crop,
            label: "Speaking/Smiling",
          };
        } else {
          currentShot.ts_end = timestamp;
        }
      } else if (isSignificantEmotionChange(prevEmotions, face.Emotions)) {
        if (currentShot) {
          shots.push(currentShot);
        }
        currentShot = {
          ts_start: timestamp,
          ts_end: timestamp,
          crop: crop,
          label: "Emotion Change",
        };
      }

      prevEmotions = face.Emotions;
      lastFacePosition = face.BoundingBox;
    }

    if (!face.MouthOpen?.Value && currentShot) {
      shots.push(currentShot);
      currentShot = null;
    }
  });

  if (currentShot) {
    shots.push(currentShot);
  }

  const metricData = {
    MetricData: [
      {
        MetricName: "VideoAnalysisShots",
        Dimensions: [{ Name: "VideoUri", Value: videoUri }],
        Unit: "Count",
        Value: shots.length,
      },
    ],
    Namespace: "VideoAnalysis",
  };

  // @ts-ignore
  await cloudWatchClient.send(new PutMetricDataCommand(metricData));

  return shots;
}

(async () => {
  const cloudWatchLogsClient = new CloudWatchLogsClient({
    region: config.awsRegion,
  });
  const cloudWatchClient = new CloudWatchClient({ region: config.awsRegion });

  try {
    const shots = await analyzeVideo(
      config.videoUri,
      config.videoWidth,
      config.videoHeight,
      cloudWatchClient
    );
    console.log("Shots:", shots);
  } catch (error) {
    console.error("Erreur:", error);

    try {
      const describeLogStreamsResponse = await cloudWatchLogsClient.send(
        new DescribeLogStreamsCommand({
          logGroupName: config.cloudWatchLogGroupName,
          logStreamNamePrefix: config.cloudWatchLogStreamName,
        })
      );
      const logStream = describeLogStreamsResponse.logStreams?.find(
        (stream) => stream.logStreamName === config.cloudWatchLogStreamName
      );
      const sequenceToken = logStream?.uploadSequenceToken;

      const logEvents = [
        {
          message: JSON.stringify({ error: error.message, stack: error.stack }),
          timestamp: new Date().getTime(),
        },
      ];

      await cloudWatchLogsClient.send(
        new PutLogEventsCommand({
          logGroupName: config.cloudWatchLogGroupName,
          logStreamName: config.cloudWatchLogStreamName,
          logEvents,
          sequenceToken,
        })
      );
    } catch (logError) {
      console.error("Erreur lors de l'enregistrement des logs:", logError);
    }
  }
})();
