import { S3 } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import * as fsSync from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { Handler } from "aws-lambda";
import { Readable } from "stream";
import {
  MediaConvertClient,
  CreateJobCommand,
} from "@aws-sdk/client-mediaconvert";
import { convertInputClippings } from "./convertInputClippings";
import { getMediaConverterParam } from "./getMediaConverterParam";

const execPromise = promisify(exec);

const conf = {
  region: "eu-west-3",
  functionName: "UploadTriggeredLambda",
  namespace: "QlipNameSpace",
  nameModifier: "_edited",
  videoOutputFormat: "mp4",
  endpointUniqueString: "xpxxifqxa",
  jobQueueArn: `arn:aws:mediaconvert:eu-west-3:327852390890:queues/Default`,
  iamRoleArn: `arn:aws:iam::327852390890:role/service-role/MediaConvert_Default_Role`,
};

const mediaConvEndpoint = `https://${conf.endpointUniqueString}.mediaconvert.${conf.region}.amazonaws.com`;

interface EventInput {
  objectKey: string;
  bucketName: string;
}

const s3 = new S3(conf);

// const cloudwatch = new AWS.CloudWatch(conf);

async function downloadObject(
  bucketName: string,
  objectKey: string,
  filePath: string
): Promise<void> {
  const startTime = Date.now();

  try {
    await publishMetric(
      `Downloading '${objectKey}' from bucket '${bucketName}'`,
      1
    );

    const { Body, ContentLength } = await s3.getObject({
      Bucket: bucketName,
      Key: objectKey,
    });

    if (Body instanceof Readable) {
      await new Promise((resolve, reject) => {
        const writeStream = fsSync.createWriteStream(filePath);
        Body.pipe(writeStream);
        Body.on("error", reject);
        writeStream.on("finish", resolve);
      });
    } else {
      throw new Error("Received data is not a stream");
    }

    const duration = Date.now() - startTime;

    if (ContentLength !== undefined) {
      await publishMetric("FileSize", ContentLength);
    }

    await publishMetric("DownloadDuration", duration);
  } catch (error: unknown) {
    if (error instanceof Error) {
      await publishMetric(
        `DownloadError : Error downloading object: ${error.message}`,
        1,
        true
      );
    }
    throw error;
  }
}

async function getFrameRate(filePath: string): Promise<string> {
  try {
    await isValidPath(filePath);

    await publishMetric(`Extracting frame rate for '${filePath}'`, 1);

    const ffprobeCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;

    const { stdout } = await execPromise(ffprobeCommand);

    return stdout.trim();
  } catch (error: unknown) {
    if (error instanceof Error) {
      await publishMetric(
        `FrameRateExtractionError : Error extracting frame rate: ${error.message}`,
        1,
        true
      );
    }
    throw error;
  }
}

async function isValidPath(filePath: string): Promise<boolean> {
  if (!path.isAbsolute(filePath)) {
    throw new Error("File path isnt absolute");
  }

  try {
    await fs.readFile(filePath);
    return true;
  } catch (error) {
    throw new Error(`Invalid file path ${error.message}`);
  }
}

async function publishMetric(
  metricName: string,
  value: number,
  isError: boolean = false
): Promise<void> {
  try {
    const params = {
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: [
            {
              Name: "FunctionName",
              Value: conf.functionName,
            },
          ],
          Timestamp: new Date(),
          Unit: "Count",
          Value: value,
        },
      ],
      Namespace: conf.namespace,
    };
    if (isError) {
      console.error(params);
    } else {
      console.log(params.MetricData[0].MetricName);
      // await cloudwatch.putMetricData(params).promise();
    }
  } catch (error: any) {
    console.error(`Error publishing metric: ${error.message}`);
  }
}

function validateInput(input: EventInput): EventInput {
  const { objectKey: oK, bucketName: bN } = input;
  if (!oK || !bN) {
    throw new Error("Invalid input");
  }
  return { bucketName: bN, objectKey: oK };
}

function calculateFrameRate(frameRateString: string): number {
  const parts = frameRateString.split("/");
  if (parts.length !== 2) {
    throw new Error("Invalid frame rate format");
  }

  const numerator = parseInt(parts[0], 10);
  const denominator = parseInt(parts[1], 10);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    throw new Error("Invalid frame rate numbers");
  }

  return numerator / denominator;
}

export const handler: Handler = async (event) => {
  if (!event || !event.Records) {
    await publishMetric(
      "InputValidationError : Missing Records in event",
      1,
      true
    );
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Records is required in event" }),
    };
  }

  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  const inputBucketKey = {
    bucketName: bucket,
    objectKey: key,
  };
  let tmpFilePath: string | undefined;

  try {
    const { bucketName, objectKey } = validateInput(inputBucketKey);
    const [folderName, fileName] = objectKey.split("/");

    if (!fileName)
      throw new Error("Failed to extract file name from objectKey");

    tmpFilePath = `/tmp/${fileName}`;
    await downloadObject(bucketName, objectKey, tmpFilePath);
    await fs.access(tmpFilePath, fs.constants.R_OK | fs.constants.W_OK);
    const frameRate = await getFrameRate(tmpFilePath);

    const calculatedFrameRate = calculateFrameRate(frameRate);
    await publishMetric(
      `FrameRateExtracted : Frame rate: ${calculatedFrameRate}`,
      1
    );

    const clippingArray = convertInputClippings(calculatedFrameRate);
    await publishMetric(`Clipping Array Created`, 1);

    const base = `s3://${bucketName}/`;
    const outputBucketName = `${base}${folderName}/`;
    const fileInput = `${base}${objectKey}`;

    const params = getMediaConverterParam(clippingArray, {
      fileInput,
      outputBucketName,
      jobQueueArn: conf.jobQueueArn,
      iamRoleArn: conf.iamRoleArn,
      nameModifier: conf.nameModifier,
    });

    await publishMetric(`MediaConverter Param Created`, 1);

    const mediaConvertClient = new MediaConvertClient({
      endpoint: mediaConvEndpoint,
    });

    // @ts-ignore:next-line
    const createJob = new CreateJobCommand(params);
    const mediaConvSendData = await mediaConvertClient.send(createJob);

    const { httpStatusCode } = mediaConvSendData?.$metadata || {};
    const { Id } = mediaConvSendData?.Job || {};
    if (httpStatusCode !== 201 || !Id) {
      throw new Error("Failed to create MediaConvert job");
    }

    const [name] = fileName.split(".");
    const host = `https://${bucketName}.s3.${conf.region}.amazonaws.com/`;
    const url = `${host}${folderName}/${name}${conf.nameModifier}.${conf.videoOutputFormat}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        jobId: mediaConvSendData.Job.Id,
        jobCreatedAt: mediaConvSendData.Job.CreatedAt,
        url,
      }),
    };
  } catch (error: any) {
    await publishMetric(
      `HandlerError : Error in handler: ${error.message}`,
      1,
      true
    );
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  } finally {
    if (tmpFilePath) {
      await publishMetric(`Cleaning up temporary files`, 1);
      try {
        await fs.unlink(tmpFilePath);
      } catch (err: any) {
        await publishMetric(
          `FileCleanupError : Error deleting tmp file: ${err.message}`,
          1,
          true
        );
      }
    }
  }
};
