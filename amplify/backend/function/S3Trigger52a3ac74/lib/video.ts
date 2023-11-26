import * as fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { IShot, EQuality, EStatus, generateProgressStatus } from './types'
import { conf } from './config'
import StatusUploader from './StatusUploader'

const execPromise = promisify(exec)

export function getCmd(
  _in: string,
  _out: string,
  shots: IShot[],
  _quality: EQuality = EQuality.LOW,
  isDebug: boolean = false,
) {
  const filterComplex = shots
    .map((c, i) => {
      const trim = `[0:v]trim=start=${c.ts_start}:end=${c.ts_end},setpts=PTS-STARTPTS`
      let filter = trim

      if (c.crop) {
        const crop = `,crop=${c.crop.w}:${c.crop.h}:${c.crop.x}:${c.crop.y}`
        const scale = `,scale=${conf.targetWidth}:${conf.targetHeight}`
        filter += `${crop}${scale}`
      } else {
        // filter += `,scale=${conf.targetWidth}:-2,pad=${conf.targetWidth}:${conf.targetHeight}:(ow-iw)/2:(oh-ih)/2`
        const scaleAndCrop_Bg = `scale=-2:640,crop=360:640`
        filter += `,${conf.blurFilter},${scaleAndCrop_Bg}[bg${i}v];`
        filter += trim
        const scale_Fg = `,scale=360:-2[fg${i}v];`
        const mergeBgAndFg = `[bg${i}v][fg${i}v]overlay=(W-w)/2:(H-h)/2:format=auto`
        filter += `${scale_Fg}${mergeBgAndFg}`
      }
      const trimAudio = `[0:a]atrim=start=${c.ts_start}:end=${c.ts_end},asetpts=PTS-STARTPTS[clip${i}a];`
      return `${filter},setsar=1[clip${i}v];${trimAudio}`
    })
    .join('')

  const concatVideo = shots.map((_, i) => `[clip${i}v]`).join('')
  const concatAudio = shots.map((_, i) => `[clip${i}a]`).join('')
  const fullFilter = `${filterComplex}${concatVideo}concat=n=${shots.length}:v=1:a=0[outv];${concatAudio}concat=n=${shots.length}:v=0:a=1[outa]`

  const high = `-preset slow -crf 18 -profile:v high`
  const bad = `-preset ultrafast -crf 35 -profile:v baseline -tune zerolatency -threads 1 -bufsize 500k -maxrate 500k`

  const quality = _quality === EQuality.HIGH ? high : bad
  const debugCmds = '-loglevel debug -v verbose'

  return `ffmpeg -i "${_in}" -filter_complex "${fullFilter}" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac ${quality} "${_out}" ${
    isDebug ? debugCmds : ''
  }`
}

export async function processVideo(
  _in: string,
  _out: string,
  isDebug: boolean,
) {
  const statusUploader = StatusUploader.getInstance()
  await statusUploader.setStatus(EStatus.ffmpegParse)

  const cropData = JSON.parse(await fs.readFile(conf.cropFile, 'utf-8'))
  const clip: IShot[] = cropData.shots

  const batchSize = conf.batchSize
  const batchStartIndices = Array.from(
    { length: Math.ceil(clip.length / batchSize) },
    (_, i) => i * batchSize,
  )

  const batches = batchStartIndices.map(startIndex =>
    clip.slice(startIndex, startIndex + batchSize),
  )

  const reg = /\.[^/.]+$/
  const baseOut = _out.replace(reg, '')
  let ext = _out.match(reg)[0]

  for (const [index, batchShots] of batches.entries()) {
    const progress = ((index / batches.length) * 100).toFixed(2)
    await statusUploader.setStatus(
      generateProgressStatus(EStatus.ffmpegCmd, progress),
    )

    const batchOutputPrefix = 'batch_'
    const batchOutput = `${baseOut}_${batchOutputPrefix}${index}${ext}`

    const ffmpegCommand = getCmd(
      _in,
      batchOutput,
      batchShots,
      conf.quality,
      isDebug,
    )

    await statusUploader.setStatus(EStatus.ffmpegExec)

    try {
      await execPromise(ffmpegCommand)
    } catch (error) {
      console.log('--ERROR execPromise :')
      throw new Error(error)
    }
  }

  const concatFile = await createConcatFile(baseOut, batches.length, ext)

  const concatCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${_out}"`
  try {
    await execPromise(concatCommand)
  } catch (error) {
    console.log('--ERROR concat execPromise :')
    throw new Error(error)
  }

  await statusUploader.setStatus(EStatus.ffmpegEnded)
}

const createConcatFile = async (outputBase, batchCount, extension) => {
  const concatFileName = `${outputBase}_concatList.txt`
  let fileList = ''

  for (let i = 0; i < batchCount; i++) {
    fileList += `file '${outputBase}_batch_${i}${extension}'\n`
  }

  await fs.writeFile(concatFileName, fileList)
  return concatFileName
}
