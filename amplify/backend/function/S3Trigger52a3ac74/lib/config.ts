import { EQuality } from './types'

export const conf = {
  rekognitionConf: {
    enabled: false,
    region: 'eu-west-2',
    bucketSufix: '-london',
    width: 1920,
    height: 1080,
    highConfidenceThreshold: 90.0,
    paddingFactorBase: 0.4, // de 0.1 à 0.4 ?
    significantMovementThreshold: 0.8,
    jobCheckDelay: 5000,
    minShotDuration: 0.5,
    confidenceThreshold: 85.0,
    cropChangeTolerance: 0.5,
    labelCrop: 'Speaking/Smiling',
    labelNoCrop: 'No Face',
  },
  debug: false,
  quality: EQuality.LOW,
  // quality: EQuality.HIGH,
  region: 'eu-west-3',
  nameModifier: '_edited',
  batchModifier: '_batch_',
  targetWidth: 360,
  targetHeight: 640,
  batchSize: 5,
  // batchSize: 2,
  cropFile: 'qlip-crop-model-out.json',
  updateIntervalProgress: 500,
}
