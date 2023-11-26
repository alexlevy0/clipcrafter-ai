import { S3 } from '@aws-sdk/client-s3'
import * as fsSync from 'fs'
import * as fs from 'fs/promises'
import { Readable } from 'stream'
import path from 'node:path'

import { conf } from './config'
import { log } from './logger'
import StatusUploader from './StatusUploader'
import { EStatus, generateProgressStatus, getProgress } from './types'
import { decodeS3Key } from './utils'

const s3 = new S3({ region: conf.region })

export async function moveLocalFile(oldPath: string, newPath: string) {
  try {
    await fs.access(oldPath, fsSync.constants.R_OK)
    await fs.copyFile(oldPath, newPath)
    await fs.access(newPath, fsSync.constants.R_OK)
    log('Move Local File Succeded!')
  } catch (error) {
    throw new Error('moveLocalFile Error', error)
  }
}

export async function download(
  Bucket: string,
  Key: string,
  filePath: string,
  isDebug: boolean,
) {
  const statusUploader = StatusUploader.getInstance()
  await statusUploader.setStatus(EStatus.dlStart)
  try {
    if (isDebug) {
      const name = filePath.split('/').pop()
      const oldPath = `/var/task/${name}`
      await moveLocalFile(oldPath, filePath)
      await statusUploader.setStatus(EStatus.dlEnded)
      return
    }

    const _key = decodeS3Key(Key)
    const _Bucket = decodeS3Key(Bucket)
    const { ContentLength } = await s3.headObject({
      Bucket: _Bucket,
      Key: _key,
    })
    const { Body } = await s3.getObject({ Bucket: _Bucket, Key: _key })

    let downloadedBytes = 0
    let updateInProgress = false

    if (Body instanceof Readable) {
      const statusUpdateInterval = setInterval(async () => {
        if (!updateInProgress) {
          updateInProgress = true
          await statusUploader.setStatus(
            generateProgressStatus(
              EStatus.dlProgress,
              getProgress(downloadedBytes, ContentLength),
            ),
          )
          updateInProgress = false
        }
      }, conf.updateIntervalProgress)

      await new Promise<void>((resolve, reject) => {
        const writeStream = fsSync.createWriteStream(filePath)

        Body.on('data', chunk => {
          downloadedBytes += chunk.length
        })
        Body.pipe(writeStream)
        Body.on('error', error => {
          clearInterval(statusUpdateInterval)
          reject(error)
        })
        writeStream.on('finish', () => {
          clearInterval(statusUpdateInterval)
          resolve()
        })
      })

      await statusUploader.setStatus(EStatus.dlEnded)
    }
  } catch (error) {
    log(`Error downloading object: ${error}`, true)
    throw new Error(error)
  }
}

export async function upload(fPath: string, Bucket: string, Key: string) {
  try {
    const Body = fsSync.createReadStream(fPath)
    await s3.putObject({ Bucket, Key, Body })
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
}

export async function addLifecyclePolicy(bucketName) {
  try {
    await s3.putBucketLifecycleConfiguration({
      Bucket: bucketName,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: 'ExpirationByTag',
            Filter: {
              Tag: { Key: 'StatusTag', Value: 'status' },
            },
            Expiration: { Days: 1 },
            Status: 'Enabled',
          },
        ],
      },
    })
  } catch (error) {
    console.error('Error setting lifecycle policy:', error)
    throw new Error(error)
  }
}
