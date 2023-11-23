export interface LambdaS3Event {
  debug?: boolean
  Records: S3Record[]
}

export interface S3Record {
  s3: {
    bucket: {
      name: string
    }
    object: {
      key: string
    }
  }
}

export enum EQuality {
  HIGH,
  LOW,
}

export interface IShot {
  ts_start: number
  ts_end: number
  crop?: { x: number; y: number; w: number; h: number }
  label?: any
}

export enum EStatus {
  Init = 'init',
  dlStart = 'dl-start',
  dlProgress = 'dl-progress',
  dlEnded = 'dl-ended',
  ffmpegParse = 'ffmpeg-parse',
  ffmpegCmd = 'ffmpeg-cmd',
  ffmpegExec = 'ffmpeg-exec',
  ffmpegEnded = 'ffmpeg-ended',
  upStart = 'up-start',
  upProgress = 'up-progress',
  upEnded = 'up-ended',
  Error = 'error',
}

export function generateProgressStatus(status: EStatus, progress: string): string {
  if (status === EStatus.dlProgress) {
    return `${status}-${progress}`
  }
  if (status === EStatus.upProgress) {
    return `${status}-${progress}`
  }
  return status
}
