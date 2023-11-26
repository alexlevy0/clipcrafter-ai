import { Handler } from 'aws-lambda'
import { processVideo } from './video'
import { download, moveLocalFile, upload } from './s3'
import { getData } from './getData'
import { log } from './logger'
import StatusUploader from './StatusUploader'
import { EStatus, LambdaS3Event } from './types'
import { cleanTempFiles } from './utils'

export const handler: Handler = async (event: LambdaS3Event) => {
  if (event.debug) {
    log('Debug mode enabled')
  }
  const statusUploader = StatusUploader.getInstance()
  await statusUploader.setStatus(EStatus.Init)

  try {
    const {
      tmpFilePath: tmpFP,
      outputFilePath: outputFP,
      bucketName: bK,
      processedObjectKey: newKey,
      objectKey: objKey,
    } = await getData(event)

    await download(bK, objKey, tmpFP, event.debug)
    await processVideo(tmpFP, outputFP, event.debug)
    await upload(outputFP, bK, newKey, event.debug)
    await cleanTempFiles(tmpFP, outputFP)

    await statusUploader.setStatus(EStatus.Succeded)
    return { statusCode: 200 }
  } catch (error) {
    await statusUploader.setStatus(EStatus.Error)
    console.error('Handler error:', error)
    return { statusCode: 500, error }
  }
}
