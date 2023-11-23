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
