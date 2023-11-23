import { conf } from './config'
import { log } from './logger'

export async function getData(event: any) {
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
