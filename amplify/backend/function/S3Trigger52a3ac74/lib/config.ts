import { EQuality } from './types'

export const conf = {
  region: 'eu-west-3',
  nameModifier: '_edited',
  batchModifier: '_batch_',
  quality: EQuality.HIGH,
  debug: false,
  targetWidth: 360,
  targetHeight: 640,
  batchSize: 5,
  cropFile: 'qlip-crop-model-out.json',
  updateIntervalProgress: 3000,
}
