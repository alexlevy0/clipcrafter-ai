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
    const {
      tmpFilePath: tmpFP,
      outputFilePath: outputFP,
      bucketName: bK,
      processedObjectKey: newKey,
      objectKey: objKey,
    } = await getData(event)

    const shotsData = await analyzeVideo(objKey, bK)
    await download(bK, objKey, tmpFP)
    await processVideo(tmpFP, outputFP, shotsData)
    await upload(outputFP, bK, newKey)
    await cleanTempFiles(tmpFP, outputFP)
    await statusUploader.setStatus(EStatus.Succeded)
    return { statusCode: 200 }
  } catch (error) {
    await statusUploader.setStatus(EStatus.Error)
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
