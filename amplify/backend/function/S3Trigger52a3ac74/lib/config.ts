import { EQuality } from './types'

export const conf = {
  region: 'eu-west-3',
  nameModifier: '_edited',
  quality: EQuality.HIGH,
  targetWidth: 360,
  targetHeight: 640,
  batchSize: 5,
  cropFile: 'qlip-crop-model-out.json',
  blurFilter: `boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1`,
  updateIntervalProgress: 1000,
}
