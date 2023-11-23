import { describe, expect, test } from '@jest/globals'
import { getCmd } from './video'

describe('getCmd Function Tests', () => {
  test('should correctly handle a single shot without cropping', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('trim=start=0:end=10')
    expect(cmd).not.toContain('crop')
  })

  test('should correctly handle multiple shots with cropping', () => {
    const shots = [
      { ts_start: 0, ts_end: 10, crop: { x: 0, y: 0, w: 100, h: 100 } },
      { ts_start: 15, ts_end: 25, crop: { x: 10, y: 10, w: 150, h: 150 } },
    ]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('crop=100:100:0:0')
    expect(cmd).toContain('crop=150:150:10:10')
  })

  test('should apply blur filter correctly when cropping is not applied', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('boxblur')
  })

  test('should generate correct audio and video filter chains', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('[clip0v]')
    expect(cmd).toContain('[clip0a]')
    expect(cmd).toContain('concat=n=1:v=1:a=0[outv]')
    expect(cmd).toContain('concat=n=1:v=0:a=1[outa]')
  })

  test('should return the correct ffmpeg command format', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toMatch(
      /ffmpeg -i "input.mp4" -filter_complex ".+" -map "\[outv\]" -map "\[outa\]" -c:v libx264 -c:a aac .+ "output.mp4"/,
    )
  })
})
