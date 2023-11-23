export const log = (data: string, err: boolean = false) => {
  if (!err) return console.log(data)
  throw new Error(data)
}
