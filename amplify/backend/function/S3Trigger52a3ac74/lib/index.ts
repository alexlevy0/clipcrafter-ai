import * as fs from 'fs/promises'
import { Handler } from 'aws-lambda'
import { processVideoWithFFmpeg } from './video'
import { download, upload } from './s3'
import { getData } from './getData'

export const handler: Handler = async event => {
  try {
    const data = await getData(event)
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
