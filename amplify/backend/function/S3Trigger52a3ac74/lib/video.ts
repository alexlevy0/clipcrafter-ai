import * as fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { IShot, EQuality, EStatus } from './types'
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
  const quality = _quality === EQuality.HIGH ? conf.high : conf.bad
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

  await statusUploader.setStatus(EStatus.ffmpegCmd)
  const ffmpegCommand = getCmd(_in, _out, clip, conf.quality, isDebug)

  await statusUploader.setStatus(EStatus.ffmpegExec)
  try {
    await execPromise(ffmpegCommand)
  } catch (error) {
    console.log('--ERROR execPromise :')
    throw new Error(error)
  }

  await statusUploader.setStatus(EStatus.ffmpegEnded)
}
