import * as fs from 'fs/promises'

export async function cleanTempFiles(tmpFP: string, outputFP: string) {
  if (tmpFP) await fs.unlink(tmpFP)
  if (outputFP) await fs.unlink(outputFP)
}

export const decodeS3Key = (key: string) => decodeURIComponent(key.replace(/\+/g, ' '))

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))