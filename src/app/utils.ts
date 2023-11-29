import { Storage } from 'aws-amplify';


export const noop = async () => { undefined }

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async ({ fn = noop, retries = 120, delay = 4000, err = '' }) => {
  const attempt = async (remainingRetries: number, lastError = null): Promise<any> => {
    if (remainingRetries <= 0) {
      throw new Error(`RemainingRetries ${retries}, ${lastError}`);
    }
    try {
      return await fn();
    } catch (error) {
      await sleep(delay);
      return attempt(remainingRetries - 1);
    }
  };

  return attempt(retries);
}


export const getData = async (key: string) => {
  try {
    const config = {
      validateObjectExistence: true,
      download: false, expires: 3600
    }
    const [name, format] = key.split('.')
    const newKey = `${name}_edited.${format}`
    return await Storage.get(newKey, config)
  } catch (error) {
    throw new Error("No data yet");
  }
}