import * as fs from 'fs/promises'
import { log } from './logger'

export async function cleanTempFiles(tmpFP: string, outputFP): Promise<void> {
  if (tmpFP) {
    await fs.unlink(tmpFP)
  }
  if (outputFP) {
    await fs.unlink(outputFP)
  }
  log(`unlink OK`)
}

export function decodeS3Key(key) {
  return decodeURIComponent(key.replace(/\+/g, ' '))
}
