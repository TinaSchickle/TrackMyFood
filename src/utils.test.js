import { describe, expect, it } from 'vitest'
import { appendPreset, berlinNow, cycleDay } from './utils.js'

describe('cycleDay', () => {
  it('zählt den Starttag als Tag 1', () => {
    expect(cycleDay('2026-10-01', ['2026-10-01'])).toBe(1)
    expect(cycleDay('2026-10-10', ['2026-10-01'])).toBe(10)
  })
  it('nimmt den letzten Start vor dem Datum', () => {
    expect(cycleDay('2026-10-05', ['2026-09-01', '2026-10-03'])).toBe(3)
  })
  it('liefert null ohne vorherigen Start', () => {
    expect(cycleDay('2026-08-01', ['2026-09-01'])).toBeNull()
  })
  it('funktioniert über die Zeitumstellung', () => {
    expect(cycleDay('2026-10-27', ['2026-10-24'])).toBe(4)
  })
})

describe('appendPreset', () => {
  it('hängt an und vermeidet Doppelungen', () => {
    expect(appendPreset('', 'Blähung stark')).toBe('Blähung stark')
    expect(appendPreset('Blähung stark', 'Schleim im Hals schwach')).toBe(
      'Blähung stark, Schleim im Hals schwach'
    )
    expect(appendPreset('Blähung stark', 'Blähung stark')).toBe('Blähung stark')
  })
})

describe('berlinNow', () => {
  it('liefert Berliner Ortszeit', () => {
    expect(berlinNow(new Date('2026-07-01T22:30:00Z'))).toEqual({ date: '2026-07-02', time: '00:30' })
    expect(berlinNow(new Date('2026-12-01T22:30:00Z'))).toEqual({ date: '2026-12-01', time: '23:30' })
  })
})
