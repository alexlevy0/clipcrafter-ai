import { Handler } from 'aws-lambda'
import { processVideo } from './video'
import { download, upload } from './s3'
import { getData } from './getData'
import StatusUploader from './StatusUploader'
import { EStatus, LambdaS3Event } from './types'
import { cleanTempFiles } from './utils'
import { analyzeVideo } from './rekognition'

export const handler: Handler = async (event: LambdaS3Event) => {
  const statusUploader = StatusUploader.getInstance()

  try {
    await statusUploader.setStatus(EStatus.Init)
    const { tmpPath, outputPath, newKey, key, bucket } = await getData(event)
    await download(bucket, key, tmpPath)
    const shots = await analyzeVideo(key, bucket)
    // console.log({ shots })
    await processVideo(tmpPath, outputPath, shots)
    await upload(outputPath, bucket, newKey)
    await cleanTempFiles(tmpPath, outputPath)
    await statusUploader.setStatus(EStatus.Succeded)
    return { statusCode: 200 }
  } catch (error) {
    await statusUploader.setStatus(EStatus.Error)
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
