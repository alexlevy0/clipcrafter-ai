import { red, green } from 'ansis';

export const log = (
  data: string | { data: string; err?: boolean },
  err: boolean = false,
) => {
  let message = ''
  let isError = false

  if (typeof data === 'object' && data !== null) {
    message = data.data
    isError = data.err ?? false
  } else if (typeof data === 'string') {
    message = data
    isError = err
  }

  if (!isError) {
    console.log(green.bold(message));
  } else {
    console.log(red.bold(message));
    throw new Error(message)
  }
}
