import * as AWS from "aws-sdk";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { Handler } from "aws-lambda";

const execPromise = promisify(exec);

// Configuration modulable pour AWS
const awsConfig = {
  region: "eu-west-3", // Cette valeur peut être modifiée selon les besoins
  functionName: "MyLambdaFunction", // Remplacez par le nom de votre fonction Lambda
};

interface EventInput {
  objectKey: string;
  bucketName: string;
}

const s3 = new AWS.S3(awsConfig);
const cloudwatch = new AWS.CloudWatch(awsConfig);

async function downloadObject(
  bucketName: string,
  objectKey: string,
  filePath: string
): Promise<void> {
  const startTime = Date.now();
  try {
    console.log(`Downloading '${objectKey}' from bucket '${bucketName}'`);
    const objectData = await s3
      .getObject({ Bucket: bucketName, Key: objectKey })
      .promise();
    console.log("->fs", fs);
    console.log("->fs.writeFile", fs.writeFile);
    await fs.writeFile(filePath, objectData.Body as Buffer);
    const fileSize = objectData.ContentLength;
    const duration = Date.now() - startTime;

    if (fileSize !== undefined) {
      await publishMetric("FileSize", fileSize);
    }

    await publishMetric("DownloadDuration", duration);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error downloading object: ${error.message}`);
      await publishMetric("DownloadError", 1);
    }
    throw error;
  }
}

async function getFrameRate(filePath: string): Promise<string> {
  if (!isValidPath(filePath)) {
    throw new Error("Invalid file path");
  }

  try {
    console.log(`Extracting frame rate for '${filePath}'`);
    const ffprobeCommand = `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const { stdout } = await execPromise(ffprobeCommand);
    return stdout.trim();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error extracting frame rate: ${error.message}`);
      await publishMetric("FrameRateExtractionError", 1);
    }
    throw error;
  }
}

function isValidPath(filePath: string): boolean {
  // @ts-ignore
  return path.isAbsolute(filePath) && fs.existsSync(filePath);
}

async function publishMetric(name: string, value: number): Promise<void> {
  try {
    const params = {
      MetricData: [
        {
          MetricName: name,
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
      Namespace: "MyApplication",
    };
    await cloudwatch.putMetricData(params).promise();
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

export const handler: Handler = async (event, context) => {
  if (!event || !event.Records) {
    console.error("Missing Records in event");
    await publishMetric("InputValidationError", 1);
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
    console.log({ bucketName, objectKey });
    const fileName = objectKey.split("/").pop();
    console.log({ fileName });
    if (!fileName)
      throw new Error("Failed to extract file name from objectKey");

    tmpFilePath = `/tmp/${fileName}`;

    await downloadObject(bucketName, objectKey, tmpFilePath);
    await fs.access(tmpFilePath, fs.constants.R_OK | fs.constants.W_OK);

    const frameRate = await getFrameRate(tmpFilePath);
    console.log(`Frame rate: ${frameRate}`);
    await publishMetric("FrameRateExtracted", 1);

    return { statusCode: 200, body: JSON.stringify({ frameRate }) };
  } catch (error: any) {
    console.error(`Error in handler: ${error.message}`);
    await publishMetric("HandlerError", 1);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  } finally {
    if (tmpFilePath) {
      console.log(`Cleaning up temporary files`);
      try {
        await fs.unlink(tmpFilePath);
      } catch (err: any) {
        console.error(`Error deleting tmp file: ${err.message}`);
        await publishMetric("FileCleanupError", 1);
      }
    }
  }
};
