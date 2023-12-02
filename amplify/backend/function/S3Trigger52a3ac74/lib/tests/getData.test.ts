import { getData } from '../getData' // Assurez-vous que le chemin est correct
import { conf } from '../config'
// import { log } from './logger'

jest.mock('./logger')

describe('getData Function Tests', () => {
  test('should extract bucket name and object key from event', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'folder/test-file.mp4' },
          },
        },
      ],
    }
    const data = await getData(event)
    expect(data.bucket).toBe('test-bucket')
    expect(data.key).toBe('folder/test-file.mp4')
  })

  test('should generate correct file paths', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'folder/test-file.mp4' },
          },
        },
      ],
    }
    const data = await getData(event)
    expect(data.tmpPath).toBe('/tmp/test-file.mp4')
    expect(data.outputPath).toBe(
      `/tmp/processed_test-file${conf.nameModifier}.mp4`,
    )
  })

  test('should throw an error and prevent double processing for files already processed', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: `folder/test-file${conf.nameModifier}.mp4` },
          },
        },
      ],
    }

    await expect(getData(event)).rejects.toThrow('Prevent double processing')
  })
})
