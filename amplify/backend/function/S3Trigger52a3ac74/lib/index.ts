// import * as AWS from "aws-sdk";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { Handler } from "aws-lambda";
import { S3 } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const execPromise = promisify(exec);

const awsConfig = {
  region: "eu-west-3",
  functionName: "MyLambdaFunction",
  namespace: "qlip-space",
};

interface EventInput {
  objectKey: string;
  bucketName: string;
}

const s3 = new S3(awsConfig);

// const cloudwatch = new AWS.CloudWatch(awsConfig);

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
              Value: awsConfig.functionName,
            },
          ],
          Timestamp: new Date(),
          Unit: "Count",
          Value: value,
        },
      ],
      Namespace: awsConfig.namespace,
    };
    const log = JSON.stringify(params, null, 2);
    if (isError) {
      console.error(log);
    } else console.log(log);
    // await cloudwatch.putMetricData(params).promise();
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

export const handler: Handler = async (event, context) => {
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

    const fileName = objectKey.split("/").pop();

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

    return {
      statusCode: 200,
      body: JSON.stringify({ frameRate: calculatedFrameRate }),
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
