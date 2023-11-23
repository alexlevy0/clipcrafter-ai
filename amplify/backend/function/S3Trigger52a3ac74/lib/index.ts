import { S3 } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fsSync from 'fs'
import * as fs from 'fs/promises'
import { Handler } from 'aws-lambda'
import { Readable } from 'stream'

const execPromise = promisify(exec)

const conf = {
  region: 'eu-west-3',
  functionName: 'UploadTriggeredLambda',
  namespace: 'QlipNameSpace',
  nameModifier: '_edited',
  videoOutputFormat: 'mp4',
  endpointUniqueString: 'xpxxifqxa',
  jobQueueArn: `arn:aws:mediaconvert:eu-west-3:327852390890:queues/Default`,
  iamRoleArn: `arn:aws:iam::327852390890:role/service-role/MediaConvert_Default_Role`,
}

interface EventInput {
  objectKey: string
  bucketName: string
}
interface SourceModel {
  ts_start: number
  ts_end: number
  crop?: { x: number; y: number; w: number; h: number }
  label?: any
}

interface MainSourceModel {
  video_key: string
  shots: [SourceModel]
}

const s3 = new S3(conf)

const buildFFmpegCmd = (
  inputPath: string,
  outputPath: string,
  shots: SourceModel[],
): string => {
  if (
    !inputPath ||
    !outputPath ||
    !Array.isArray(shots) ||
    shots.length === 0
  ) {
    throw new Error(
      'Paramètres invalides fournis à la fonction buildFFmpegCmd.',
    )
  }

  const filterComplex = `[0:v]scale=iw:-2,boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1[bg];[0:v]scale=iw:ih*9/16[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[outv]`

  return `ffmpeg -i "${inputPath}" -filter_complex "${filterComplex}" -map "[outv]" -c:v libx264 -preset fast -crf 22 "${outputPath}"`
}

async function downloadObject(
  bucketName: string,
  objectKey: string,
  filePath: string,
): Promise<void> {
  const startTime = Date.now()

  try {
    await log(`Downloading '${objectKey}' from bucket '${bucketName}'`)

    const { Body, ContentLength } = await s3.getObject({
      Bucket: bucketName,
      Key: objectKey,
    })

    if (Body instanceof Readable) {
      await new Promise((resolve, reject) => {
        const writeStream = fsSync.createWriteStream(filePath)
        Body.pipe(writeStream)
        Body.on('error', reject)
        writeStream.on('finish', resolve)
      })
    } else {
      await log('Received data is not a stream', true)
    }

    const duration = Date.now() - startTime

    if (ContentLength !== undefined) {
      await log(`FileSize ${ContentLength}`)
    }

    await log(`DownloadDuration ${duration}`)
  } catch (error: unknown) {
    await log(`DownloadError : Error downloading object: ${error}`, true)
  }
}

const log = async (data: string, err: boolean = false) => {
  if (err) {
    // console.error(JSON.stringify(data, null, 2))
    console.error(data)
    throw new Error(data)
  }
  // console.log(JSON.stringify(data, null, 2))
  console.log(data)
}

const validateInput = async (input: EventInput) => {
  const { objectKey: oK, bucketName: bN } = input
  if (!oK || !bN) {
    await log('Invalid input', true)
  }
  return { bucketName: bN, objectKey: oK }
}

async function processVideoWithFFmpeg(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const cropData: MainSourceModel = JSON.parse(
    await fs.readFile('qlip-crop-model-out.json', 'utf-8'),
  )

  const ffmpegCommand = buildFFmpegCmd(
    inputPath,
    outputPath,
    // cropData.shots,
    cropData.shots.slice(0, 7), // TODO Remove only after testing
  )

  try {
    await execPromise(ffmpegCommand)
  } catch (error) {
    await log(`Error processing video with FFmpeg: ${error.message}`, true)
  }
}

const uploadToS3 = async (fPath: string, BucketN: string, objKey: string) => {
  const stream = await fs.readFile(fPath)

  await log(`uploadToS3 Fired w/ : ${fPath}, ${BucketN}, ${objKey}`)
  try {
    await s3.putObject({ Bucket: BucketN, Key: objKey, Body: stream })
  } catch (error) {
    await log(`Error uploading file to S3: ${error.message}`, true)
  }
}

const getUsedDataFromEvent = async (event: any) => {
  try {
    const { bucket: { name: bucket = '' } = {}, object: { key = '' } = {} } =
      event?.Records?.[0]?.s3 || {}

    if (!event || !event.Records || !key || !bucket) {
      await log(`Missing or malformed Records in event: ${event}`, true)
    }

    let tmpFilePath: string | undefined
    let outputFilePath: string | undefined

    const { bucketName, objectKey } = await validateInput({
      bucketName: bucket,
      objectKey: key,
    })

    const [folderName, fileName] = objectKey.split('/')

    if (!fileName || !folderName) {
      await log(
        `Failed to extract file name or folderName from objectKey : ${objectKey}`,
        true,
      )
    }

    if (fileName.includes(conf.nameModifier)) {
      await log(`Canceling prevent double processing`, true)
    }

    const nameParts = fileName.split('.')
    const nameWithoutExtension = nameParts.slice(0, -1).join('.')
    const extension = nameParts.slice(-1)[0]
    const editedFileName = `${nameWithoutExtension}${conf.nameModifier}.${extension}`
    // const processedObjectKey = `processed/${editedFileName}`
    const processedObjectKey = `${folderName}/${editedFileName}`

    tmpFilePath = `/tmp/${fileName}`
    outputFilePath = `/tmp/processed_${editedFileName}`

    return {
      processedObjectKey,
      bucketName,
      objectKey,
      tmpFilePath,
      outputFilePath,
    }
  } catch (error: any) {
    await log(error, true)
  }
}

export const handler: Handler = async event => {
  await log(`Started with event : ${JSON.stringify(event, null, 2)}`)

  const {
    processedObjectKey,
    bucketName,
    objectKey,
    tmpFilePath,
    outputFilePath,
  } = await getUsedDataFromEvent(event)
  await log(`Get Used Data OK`)

  try {
    await downloadObject(bucketName, objectKey, tmpFilePath)
    await log(`Download OK`)

    await processVideoWithFFmpeg(tmpFilePath, outputFilePath)
    await log(`Process Video With FFmpeg OK`)

    await uploadToS3(outputFilePath, bucketName, processedObjectKey)
    await log(`Upload To S3 OK`)

    if (tmpFilePath) await fs.unlink(tmpFilePath)
    if (outputFilePath) await fs.unlink(outputFilePath)
    await log(`Temporary files cleaned up`)

    return { statusCode: 200 }
  } catch (error) {
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
