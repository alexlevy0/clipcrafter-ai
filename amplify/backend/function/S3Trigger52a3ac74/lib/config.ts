import { EQuality } from './types'

export const conf = {
  rekognitionWidth: 1920,
  rekognitionHeight: 1080,
  // rekognition: true,
  rekognition: false,
  region: 'eu-west-3',
  nameModifier: '_edited',
  batchModifier: '_batch_',
  // quality: EQuality.HIGH,
  quality: EQuality.LOW,
  debug: false,
  targetWidth: 360,
  targetHeight: 640,
  batchSize: 5,
  // batchSize: 2,
  cropFile: 'qlip-crop-model-out.json',
  updateIntervalProgress: 100,
}
