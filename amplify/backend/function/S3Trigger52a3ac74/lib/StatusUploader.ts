import { S3 } from '@aws-sdk/client-s3'
import { conf } from './config'
import { log } from './logger'
import { addLifecyclePolicy } from './s3'
import { EStatus } from './types'

class StatusUploader {
  private static instance: StatusUploader | null = null
  private _s3: S3
  private _bucket: string | null
  private _key: string | null
  private _usedStatuses: Set<EStatus | string> = new Set()
  private _lastUpdateTime = 0
  private _throttleInterval = conf.updateIntervalProgress

  private constructor(bucket: string, key: string) {
    this._s3 = new S3({ region: conf.region })
    this._bucket = bucket
    this._key = key
    addLifecyclePolicy(bucket)
  }

  private useStatus(status: EStatus | string): void {
    if (this._usedStatuses.has(status)) {
      throw new Error(`Status ${status} has already been used`)
    }
    this._usedStatuses.add(status)
  }

  public static getInstance(bucket?: string, key?: string): StatusUploader {
    if (!this.instance) {
      if (!bucket || !key) {
        throw new Error('Bucket and key must be provided for the first instantiation')
      }
      this.instance = new StatusUploader(bucket, key)
    }
    return this.instance
  }

  public async setStatus(status: EStatus | string): Promise<void> {
    try {
      const now = Date.now()
      if (now < this._lastUpdateTime + this._throttleInterval && status !== EStatus.Error) {
        return
      }
      let baseStatus = status

      if (status.startsWith(EStatus.dlProgress) || status.startsWith(EStatus.upProgress)) {
        baseStatus = status.split('-').slice(0, 2).join('-')
      }

      if (!Object.values(EStatus).includes(baseStatus as any)) {
        throw new Error(`Invalid status: ${status}`)
      }

      if (!this._bucket || !this._key) {
        throw new Error('Bucket and key must be set')
      }

      log(`setStatus : ${status}`)

      this.useStatus(status)

      await this._s3.putObject({
        Bucket: this._bucket,
        Key: `${this._key}:status`,
        Body: Buffer.from(''),
        Metadata: { status },
        Tagging: 'StatusTag=status',
      })
      this._lastUpdateTime = now
    } catch (error) {
      console.error('Error when defining status:', error)
    }
  }

  public static isAllUsed(): boolean {
    return Object.keys(EStatus).length / 2 === this.instance._usedStatuses.size
  }
}

export default StatusUploader
