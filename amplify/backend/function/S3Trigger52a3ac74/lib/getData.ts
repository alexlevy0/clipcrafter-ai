import { conf } from './config'
import { log } from './logger'
import { decodeS3Key } from './utils'

export async function getData(event: any) {
  log(`getData start : ${JSON.stringify(event, null, 2)}`)
  log(`config : ${JSON.stringify(conf, null, 2)}`)
  const { bucket: { name: bucketName = '' } = {}, object: { key: objectKey = '' } = {} } =
    event?.Records?.[0]?.s3 || {}

  const [folderName, fileName] = objectKey.split('/').map(decodeS3Key)

  if (!folderName || !fileName || !objectKey || !bucketName)
    throw new Error(`Error in event records : ${event}`)

  if (fileName?.includes(conf.nameModifier)) throw new Error(`Prevent double processing`)

  const extension = fileName.split('.').pop()
  const name = fileName.substring(0, fileName.lastIndexOf('.'))
  const editedFileName = `${name}${conf.nameModifier}.${extension}`

  const data = {
    newKey: `${folderName}/${editedFileName}`,
    bucket: bucketName,
    key: objectKey,
    tmpPath: `/tmp/${fileName}`,
    outputPath: `/tmp/processed_${editedFileName}`,
  }
  log(`getData output : ${JSON.stringify(data, null, 2)}`)
  return data
}
