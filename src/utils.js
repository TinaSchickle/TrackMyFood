// Alle Zeiten sind deutsche Ortszeit (Europe/Berlin), unabhängig vom Standort des Handys.
const TZ = 'Europe/Berlin'

export const PEOPLE = {
  tina: { id: 'tina', name: 'Tina', other: 'pascal' },
  pascal: { id: 'pascal', name: 'Pascal', other: 'tina' },
}

export function berlinNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

// 'YYYY-MM-DD' -> Anzahl Tage seit 1970 (reine Kalenderrechnung, keine Zeitzonen-Effekte)
function dayNumber(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86400000)
}

// Zyklustag (1 = Tag des Periodenstarts) für ein Datum, oder null wenn kein Start davor liegt.
export function cycleDay(isoDate, cycleStarts) {
  let best = null
  for (const s of cycleStarts) {
    if (s <= isoDate && (best === null || s > best)) best = s
  }
  return best === null ? null : dayNumber(isoDate) - dayNumber(best) + 1
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
export function formatDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${wd}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

// Hängt einen Textbaustein an den Freitext an (ohne Doppelungen).
export function appendPreset(text, preset) {
  const parts = text.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
  if (parts.includes(preset)) return text
  return [...parts, preset].join(', ')
}

export const DEFAULT_PRESETS = [
  'Blähung stark',
  'Blähung schwach',
  'Schleim im Hals stark',
  'Schleim im Hals schwach',
]
