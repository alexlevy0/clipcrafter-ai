import { S3 } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fsSync from 'fs'
import * as fs from 'fs/promises'
import { Handler } from 'aws-lambda'
import { Readable } from 'stream'

const execPromise = promisify(exec)

enum EQuality {
  HIGH,
  LOW,
}

interface ISourceModel {
  ts_start: number
  ts_end: number
  crop?: { x: number; y: number; w: number; h: number }
  label?: any
}

const conf = {
  region: 'eu-west-3',
  nameModifier: '_edited',
  quality: EQuality.HIGH,
  targetWidth: 360,
  targetHeight: 640,
  cropFile: 'qlip-crop-model-out.json',
  blurFilter: `boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1`,
  high: `-preset slow -crf 18 -profile:v high`,
  bad: `-preset fast -crf 22 -profile:v baseline`,
}

const s3 = new S3({ region: conf.region })

function getCmd(_in: string, _out: string, shots: ISourceModel[]) {
  const filterComplex = shots
    .map((c, i) => {
      const trim = `[0:v]trim=start=${c.ts_start}:end=${c.ts_end},setpts=PTS-STARTPTS`
      let filter = trim

      if (c.crop) {
        const crop = `,crop=${c.crop.w}:${c.crop.h}:${c.crop.x}:${c.crop.y}`
        const scale = `,scale=${conf.targetWidth}:${conf.targetHeight}`
        filter += `${crop}${scale}`
      } else {
        const scaleAndCrop_Bg = `scale=-2:640,crop=360:640`
        filter += `,${conf.blurFilter},${scaleAndCrop_Bg}[bg${i}v];`
        filter += trim
        const scale_Fg = `,scale=360:-2[fg${i}v];`
        const mergeBgAndFg = `[bg${i}v][fg${i}v]overlay=(W-w)/2:(H-h)/2:format=auto`
        filter += `${scale_Fg}${mergeBgAndFg}`
      }
      return `${filter},setsar=1[clip${i}v];`
    })
    .join('')

  const concatFilter = shots.map((_, i) => `[clip${i}v]`).join('')
  const fullFilter = `${filterComplex}${concatFilter}concat=n=${shots.length}:v=1:a=0[outv]`
  const quality = conf.quality === EQuality.HIGH ? conf.high : conf.bad
  return `ffmpeg -i "${_in}" -filter_complex "${fullFilter}" -map "[outv]" -c:v libx264 ${quality} "${_out}"`
}

async function download(Bucket: string, Key: string, filePath: string) {
  const { Body } = await s3.getObject({ Bucket, Key })
  if (Body instanceof Readable) {
    await new Promise((res, rej) => {
      const writeStream = fsSync.createWriteStream(filePath)
      Body.pipe(writeStream)
      Body.on('error', rej)
      writeStream.on('finish', res)
    })
  }
}

const log = (data: string, err: boolean = false) => {
  if (!err) return console.log(data)
  throw new Error(data)
}

async function processVideoWithFFmpeg(_in: string, _out: string) {
  const cropData = JSON.parse(await fs.readFile(conf.cropFile, 'utf-8'))
  const ffmpegCommand = getCmd(_in, _out, cropData.shots.slice(0, 4))
  await execPromise(ffmpegCommand)
}

async function upload(fPath: string, BucketN: string, objKey: string) {
  const stream = await fs.readFile(fPath)
  await s3.putObject({ Bucket: BucketN, Key: objKey, Body: stream })
}

async function getUsedDataFromEvent(event: any) {
  const {
    bucket: { name: bucketName = '' } = {},
    object: { key: objectKey = '' } = {},
  } = event?.Records?.[0]?.s3 || {}
  const [folderName, fileName] = objectKey.split('/')

  if (!folderName || !fileName || !objectKey || !bucketName)
    log(`Error in event records : ${event}`, true)
  if (fileName.includes(conf.nameModifier))
    log(`Prevent double processing`, true)

  const extension = fileName.split('.').pop()
  const name = fileName.substring(0, fileName.lastIndexOf('.'))
  const editedFileName = `${name}${conf.nameModifier}.${extension}`
  return {
    processedObjectKey: `${folderName}/${editedFileName}`,
    bucketName,
    objectKey,
    tmpFilePath: `/tmp/${fileName}`,
    outputFilePath: `/tmp/processed_${editedFileName}`,
  }
}

export const handler: Handler = async event => {
  try {
    const data = await getUsedDataFromEvent(event)
    await download(data.bucketName, data.objectKey, data.tmpFilePath)
    await processVideoWithFFmpeg(data.tmpFilePath, data.outputFilePath)
    await upload(data.outputFilePath, data.bucketName, data.processedObjectKey)
    if (data.tmpFilePath) await fs.unlink(data.tmpFilePath)
    if (data.outputFilePath) await fs.unlink(data.outputFilePath)
    return { statusCode: 200 }
  } catch (error) {
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
