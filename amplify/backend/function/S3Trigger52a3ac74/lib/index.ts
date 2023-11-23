import { Handler } from 'aws-lambda'
import { processVideo } from './video'
import { download, upload } from './s3'
import { getData } from './getData'
import { log } from './logger'
import StatusUploader from './StatusUploader'
import { EStatus, LambdaS3Event } from './types'
import { cleanTempFiles } from './utils'

export const handler: Handler = async (event: LambdaS3Event) => {
  if (event.debug) {
    log('Debug mode enabled')
  }
  const {
    tmpFilePath: tmpFP,
    outputFilePath: outputFP,
    bucketName: bK,
    processedObjectKey: newKey,
    objectKey: objKey,
  } = await getData(event)
  const statusUploader = StatusUploader.getInstance(bK, newKey)

  try {
    await statusUploader.setStatus(EStatus.Init)
    await download(bK, objKey, tmpFP)
    await processVideo(tmpFP, outputFP)
    await upload(outputFP, bK, newKey)
    await cleanTempFiles(tmpFP, outputFP)
    return { statusCode: 200 }
  } catch (error) {
    await statusUploader.setStatus(EStatus.Error)
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
