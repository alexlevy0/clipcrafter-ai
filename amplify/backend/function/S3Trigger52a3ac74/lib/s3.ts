import { S3 } from '@aws-sdk/client-s3'
import * as fsSync from 'fs'
import { Readable } from 'stream'
import * as fs from 'fs/promises'

import { conf } from './config'

const s3 = new S3({ region: conf.region })

export function decodeS3Key(key) {
  return decodeURIComponent(key.replace(/\+/g, ' '))
}

export async function download(Bucket: string, Key: string, filePath: string) {
  const _key = decodeS3Key(Key)
  const _Bucket = decodeS3Key(Bucket)
  const { Body } = await s3.getObject({ Bucket: _Bucket, Key: _key })
  if (Body instanceof Readable) {
    await new Promise((res, rej) => {
      const writeStream = fsSync.createWriteStream(filePath)
      Body.pipe(writeStream)
      Body.on('error', rej)
      writeStream.on('finish', res)
    })
  }
}
export async function upload(fPath: string, BucketN: string, objKey: string) {
  const stream = await fs.readFile(fPath)
  await s3.putObject({ Bucket: BucketN, Key: objKey, Body: stream })
}
