import { Handler } from 'aws-lambda'
import * as fs from 'fs/promises'
import { processVideo } from './video'
import { download, upload } from './s3'
import { getData } from './getData'
import StatusUploader from './StatusUploader'
import { EStatus, LambdaS3Event, IShot } from './types'
import { cleanTempFiles } from './utils'
import { conf } from './config'
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

    let shots: IShot[]

    if (conf.rekognition) {
      const _shots = await analyzeVideo(
        objKey,
        `${bK}-london`,
        conf.rekognitionWidth,
        conf.rekognitionHeight,
      )
      console.log('_shots before', _shots.length);
      shots = _shots.filter(s => s.ts_end !== s.ts_start)
      console.log('shots after', shots.length);
    } else {
      const cropData = JSON.parse(await fs.readFile(conf.cropFile, 'utf-8'))
      shots = cropData.shots
    }

    await download(bK, objKey, tmpFP)
    await processVideo(tmpFP, outputFP, shots)
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
