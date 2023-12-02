import * as fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  IShot,
  EQuality,
  EStatus,
  generateProgressStatus,
  getProgress,
} from './types'
import { conf } from './config'
import StatusUploader from './StatusUploader'

const execPromise = promisify(exec)

const blurFilter = `boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1`

export function getCmd(_in: string, _out: string, shots: IShot[]) {
  const filterComplex = shots
    .map((c, i) => {
      const trim = `[0:v]trim=start=${c.ts_start}:end=${c.ts_end},setpts=PTS-STARTPTS`
      let filter = trim

      if (c.crop) {
        const crop = `,crop=${c.crop.w}:${c.crop.h}:${c.crop.x}:${c.crop.y}`
        const scale = `,scale=${conf.targetWidth}:${conf.targetHeight}`
        filter += `${crop}${scale}`
      } else {
        const scaleAndCrop_Bg = `scale=-2:640,crop=360:640`
        filter += `,${blurFilter},${scaleAndCrop_Bg}[bg${i}v];`
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

  const quality = conf.quality === EQuality.HIGH ? high : bad
  const debugCmds = '-loglevel debug -v verbose'

  return `ffmpeg -i "${_in}" -filter_complex "${fullFilter}" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac ${quality} "${_out}" ${
    conf.debug ? debugCmds : ''
  }`
}

export async function processVideo(_in: string, _out: string, _clip: IShot[]) {
  const statusUploader = StatusUploader.getInstance()
  await statusUploader.setStatus(EStatus.ffmpegParse)

  const clip: IShot[] = _clip

  const batchSize: number = conf.batchSize
  const batchStartIndices = Array.from(
    { length: Math.ceil(clip.length / batchSize) },
    (_, i) => i * batchSize,
  )

  console.log('clip.length : ', clip.length)
  console.log({ clip })
  console.log('batchStartIndices.length : ', batchStartIndices.length)

  const batches = batchStartIndices.map(startIndex =>
    clip.slice(startIndex, startIndex + batchSize),
  )

  const reg = /\.[^/.]+$/
  const baseOut = _out.replace(reg, '')
  let ext = _out.match(reg)[0]

  for (const [index, batchShots] of batches.entries()) {
    try {
      await statusUploader.setStatus(
        generateProgressStatus(
          EStatus.ffmpegCmd,
          getProgress(index, batches.length),
        ),
      )
      const batchOutput = `${baseOut}${conf.batchModifier}${index}${ext}`
      const ffmpegCommand = getCmd(_in, batchOutput, batchShots)
      await execPromise(ffmpegCommand)
    } catch (error) {
      console.log(`--ERROR execPromise at index ${index} : ${error}`)
      throw new Error(error)
    }
  }

  try {
    await statusUploader.setStatus(`${EStatus.ffmpegExec}-${batches.length}`)
    const concatFile = await createConcatFile(baseOut, batches.length, ext)
    const concatCommand = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${_out}"`
    await execPromise(concatCommand)
  } catch (error) {
    console.log(`--ERROR concat execPromise : ${error}`)
    throw new Error(error)
  }

  await statusUploader.setStatus(EStatus.ffmpegEnded)
}

const createConcatFile = async (outputBase, batchCount, extension) => {
  const fileList = Array.from(
    { length: batchCount },
    (_, i) => `file '${outputBase}${conf.batchModifier}${i}${extension}'`,
  ).join('\n')
  const concatFileName = `${outputBase}_concatList.txt`
  await fs.writeFile(concatFileName, fileList)
  return concatFileName
}
