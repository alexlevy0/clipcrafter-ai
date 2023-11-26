import { describe, expect, test } from '@jest/globals'
import { conf } from './config'
import { EQuality } from './types'
import { getCmd } from './video'

describe('getCmd Function Tests', () => {
  test('should return a valid ffmpeg command', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toMatch(
      /ffmpeg -i ".*" -filter_complex ".*" -map "\[outv\]" -map "\[outa\]" -c:v libx264 -c:a aac .+ ".*"/,
    )
  })
  test('should include quality settings', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmdHighQuality = getCmd(
      'input.mp4',
      'output.mp4',
      shots,
      EQuality.HIGH,
    )
    const cmdLowQuality = getCmd('input.mp4', 'output.mp4', shots, EQuality.LOW)
    // expect(cmdHighQuality).toContain(conf.high)
    // expect(cmdLowQuality).toContain(conf.bad)
  })
  test('should correctly concatenate multiple clips', () => {
    const shots = [
      { ts_start: 0, ts_end: 10 },
      { ts_start: 15, ts_end: 25 },
    ]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('concat=n=2:v=1:a=0')
    expect(cmd).toContain('concat=n=2:v=0:a=1')
  })
  test('should apply blur filter when cropping is not applied', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('boxblur')
  })
  test('should correctly scale clips without cropping', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('scale=')
    expect(cmd).toContain('crop')
  })
  test('should correctly trim audio for each clip', () => {
    const shots = [
      { ts_start: 0, ts_end: 10 },
      { ts_start: 15, ts_end: 25 },
    ]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('atrim=start=0:end=10')
    expect(cmd).toContain('atrim=start=15:end=25')
  })
  test('should correctly handle a single shot without cropping', () => {
    const shots = [{ ts_start: 0, ts_end: 10 }]
    const cmd = getCmd('input.mp4', 'output.mp4', shots)
    expect(cmd).toContain('trim=start=0:end=10')
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
