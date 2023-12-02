import { Storage } from 'aws-amplify'

export const noop = async () => {
  undefined
}

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const retry = async ({
  fn = noop,
  retries = 60 * 5 * 3,
  delay = 333,
  err = '',
}) => {
  const attempt = async (
    remainingRetries: number,
    lastError = null,
  ): Promise<any> => {
    if (remainingRetries <= 0) {
      throw new Error(`RemainingRetries ${retries}, ${lastError}`)
    }
    try {
      return await fn()
    } catch (error) {
      await sleep(delay)
      return attempt(remainingRetries - 1)
    }
  }

  return attempt(retries)
}

export const getData = async (key: string, prefix = '_edited') => {
  try {
    const config = {
      validateObjectExistence: true,
      download: false,
      expires: 3600,
    }
    const [name, format] = key.split('.')
    const newKey = `${name}${prefix}.${format}`
    return await Storage.get(newKey, config)
  } catch (error) {
    throw new Error('No data yet')
  }
}

export async function measurePromise(fn: () => Promise<any>): Promise<string> {
  const start = performance.now()
  await fn()
  const durationInMinutes = (performance.now() - start) / 60000
  const wholeMinutes = Math.floor(durationInMinutes)
  const seconds = Math.round((durationInMinutes - wholeMinutes) * 60)
  const formattedSeconds = seconds.toString().padStart(2, '0');
  return `${wholeMinutes}mn ${formattedSeconds}s`
}
