import * as fs from 'fs/promises'
import { Handler } from 'aws-lambda'
import { processVideoWithFFmpeg } from './video'
import { download, upload } from './s3'
import { getData } from './getData'
import { log } from './logger'

export const handler: Handler = async event => {
  try {
    log(`getData try ${JSON.stringify(event, null, 2)}`)
    const data = await getData(event)
    log(`getData OK ${JSON.stringify(data, null, 2)}`)

    log(`download try ${data.bucketName}, ${data.objectKey}, ${data.tmpFilePath}`)
    await download(data.bucketName, data.objectKey, data.tmpFilePath)
    log(`download OK`)

    log(`processVideoWithFFmpeg ${data.tmpFilePath}, ${data.outputFilePath}`)
    await processVideoWithFFmpeg(data.tmpFilePath, data.outputFilePath)
    log(`processVideoWithFFmpeg OK`)

    log(`upload try ${data.bucketName}, ${data.processedObjectKey}, ${data.outputFilePath}`)
    await upload(data.outputFilePath, data.bucketName, data.processedObjectKey)
    log(`upload OK`)

    log(`unlink try ${data.tmpFilePath}, ${data.outputFilePath}`)
    if (data.tmpFilePath) await fs.unlink(data.tmpFilePath)
    if (data.outputFilePath) await fs.unlink(data.outputFilePath)
    log(`unlink OK`)
    return { statusCode: 200 }
  } catch (error) {
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
