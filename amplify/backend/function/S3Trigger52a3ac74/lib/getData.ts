import { conf } from './config'
import { log } from './logger'
import { decodeS3Key } from './s3'

export async function getData(event: any) {
  const { bucket: { name: bucketName = '' } = {}, object: { key: objectKey = '' } = {} } =
    event?.Records?.[0]?.s3 || {}

  const [folderName, fileName] = objectKey.split('/').map(decodeS3Key)

  log(`getData In ${folderName}, ${fileName}, ${objectKey}, ${bucketName}`)

  if (!folderName || !fileName || !objectKey || !bucketName)
    throw new Error(`Error in event records : ${event}`)

  if (fileName?.includes(conf.nameModifier)) throw new Error(`Prevent double processing`)

  const extension = fileName.split('.').pop()
  const name = fileName.substring(0, fileName.lastIndexOf('.'))
  const editedFileName = `${name}${conf.nameModifier}.${extension}`
  log(`getData ${extension}, ${name}, ${editedFileName}`)

  return {
    processedObjectKey: `${folderName}/${editedFileName}`,
    bucketName,
    objectKey,
    tmpFilePath: `/tmp/${fileName}`,
    outputFilePath: `/tmp/processed_${editedFileName}`,
  }
}
