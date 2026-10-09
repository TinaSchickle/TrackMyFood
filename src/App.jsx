import { useCallback, useEffect, useState } from 'react'
import {
  addCycle, deleteCycle, deleteEntry, loadCycles, loadEntries, saveEntries, supabase, updateEntry,
} from './db.js'
import { DEFAULT_PRESETS, PEOPLE, appendPreset, berlinNow, cycleDay, formatDay } from './utils.js'

const KIND_LABEL = { essen: 'Essen', beobachtung: 'Beobachtung' }

function useBerlinNow() {
  const [now, setNow] = useState(berlinNow())
  useEffect(() => {
    const t = setInterval(() => setNow(berlinNow()), 20000)
    return () => clearInterval(t)
  }, [])
  return now
}

function loadPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem('tmf-presets'))
    if (Array.isArray(saved) && saved.length) return saved
  } catch { /* ignorieren */ }
  return DEFAULT_PRESETS
}

export default function App() {
  const [person, setPerson] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, error = false) => {
    setToast({ msg, error, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (!supabase) {
    return (
      <main className="start">
        <h1>TrackMyFood</h1>
        <p className="error-box">
          Supabase ist nicht konfiguriert (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen).
        </p>
      </main>
    )
  }

  return (
    <>
      {person ? (
        <PersonView key={person} person={person} setPerson={setPerson} showToast={showToast} />
      ) : (
        <Start onPick={setPerson} />
      )}
      {toast && (
        <div className={`toast ${toast.error ? 'toast-error' : ''}`} role="status" key={toast.id}>
          {toast.msg}
        </div>
      )}
    </>
  )
}

function Start({ onPick }) {
  return (
    <main className="start">
      <h1>TrackMyFood</h1>
      <p className="muted">Wer bist du – oder für wen trägst du ein?</p>
      <button className="big-btn tina" onClick={() => onPick('tina')}>Tina</button>
      <button className="big-btn pascal" onClick={() => onPick('pascal')}>Pascal</button>
    </main>
  )
}

function PersonView({ person, setPerson, showToast }) {
  const [view, setView] = useState('input')
  const [cycles, setCycles] = useState([])
  const [listVersion, setListVersion] = useState(0)
  const info = PEOPLE[person]

  const refreshCycles = useCallback(async () => {
    if (person !== 'tina') return
    try { setCycles(await loadCycles()) } catch (e) { showToast(`Zyklen laden fehlgeschlagen: ${e.message}`, true) }
  }, [person, showToast])
  useEffect(() => { refreshCycles() }, [refreshCycles])

  const onSaved = (msg) => {
    showToast(msg)
    setListVersion((v) => v + 1)
  }

  return (
    <div className={`shell ${person}`}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => setPerson(null)} aria-label="Zum Start">⌂</button>
        <div className="switch" role="tablist">
          {Object.values(PEOPLE).map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === person}
              className={`switch-btn ${p.id} ${p.id === person ? 'active' : ''}`}
              onClick={() => p.id !== person && setPerson(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </header>

      <main className="content">
        <h2 className="who">Eintrag für {info.name}</h2>

        {view === 'input' ? (
          <>
            {person === 'tina' && (
              <CycleBox cycles={cycles} refresh={refreshCycles} showToast={showToast} />
            )}
            <EntryForm kind="essen" person={person} onSaved={onSaved} showToast={showToast} />
            <EntryForm kind="beobachtung" person={person} onSaved={onSaved} showToast={showToast} />
            <button className="link-btn" onClick={() => setView('list')}>
              Meine Einträge ansehen →
            </button>
          </>
        ) : (
          <>
            <button className="link-btn" onClick={() => setView('input')}>← Zurück zur Eingabe</button>
            <EntryList
              person={person}
              cycles={cycles}
              version={listVersion}
              showToast={showToast}
            />
          </>
        )}
      </main>
    </div>
  )
}

function CycleBox({ cycles, refresh, showToast }) {
  const now = useBerlinNow()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(now.date)
  const [busy, setBusy] = useState(false)
  const starts = cycles.map((c) => c.start_date)
  const day = cycleDay(now.date, starts)
  const latest = cycles[0]

  const save = async () => {
    if (busy || !date) return
    setBusy(true)
    try {
      await addCycle(date)
      await refresh()
      setOpen(false)
      showToast('Neuer Zyklus gespeichert')
    } catch (e) {
      showToast(`Speichern fehlgeschlagen: ${e.message}`, true)
    } finally { setBusy(false) }
  }

  const undo = async () => {
    if (!latest || !window.confirm('Letzten Zyklusstart wirklich löschen?')) return
    try { await deleteCycle(latest.id); await refresh(); showToast('Zyklusstart gelöscht') }
    catch (e) { showToast(`Löschen fehlgeschlagen: ${e.message}`, true) }
  }

  return (
    <section className="card cycle-card">
      <div className="cycle-info">
        {day ? <strong>Zyklustag {day}</strong> : <strong>Noch kein Zyklus erfasst</strong>}
        {latest && <span className="muted"> · Start {formatDay(latest.start_date)}</span>}
      </div>
      {!open ? (
        <div className="row">
          <button className="btn secondary" onClick={() => { setDate(now.date); setOpen(true) }}>
            Neuer Zyklus hat begonnen
          </button>
          {latest && <button className="text-btn" onClick={undo}>Rückgängig</button>}
        </div>
      ) : (
        <div className="row">
          <label className="field grow">
            <span>Beginn</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button className="btn" disabled={busy} onClick={save}>Speichern</button>
          <button className="text-btn" onClick={() => setOpen(false)}>Abbrechen</button>
        </div>
      )}
    </section>
  )
}

function EntryForm({ kind, person, onSaved, showToast }) {
  const now = useBerlinNow()
  const other = PEOPLE[PEOPLE[person].other]
  const [text, setText] = useState('')
  const [date, setDate] = useState(null) // null = automatisch "heute"
  const [time, setTime] = useState(null) // null = automatisch "jetzt"
  const [link, setLink] = useState(false)
  const [busy, setBusy] = useState(false)
  const [presets, setPresets] = useState(loadPresets)
  const [editPresets, setEditPresets] = useState(false)

  const shownDate = date ?? now.date
  const shownTime = time ?? now.time

  const submit = async (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean || busy) return
    setBusy(true)
    const cur = berlinNow()
    const entry_date = date ?? cur.date
    const entry_time = time ?? cur.time
    const link_id = link ? crypto.randomUUID() : null
    const rows = [{ person, kind, text: clean, entry_date, entry_time, link_id }]
    if (link) rows.push({ person: other.id, kind, text: clean, entry_date, entry_time, link_id })
    try {
      await saveEntries(rows)
      setText(''); setDate(null); setTime(null); setLink(false)
      onSaved(`${KIND_LABEL[kind]} erfolgreich gespeichert`)
    } catch (err) {
      showToast(`Speichern fehlgeschlagen: ${err.message}`, true)
    } finally { setBusy(false) }
  }

  const savePresets = (raw) => {
    const list = raw.split('\n').map((s) => s.trim()).filter(Boolean)
    const next = list.length ? list : DEFAULT_PRESETS
    setPresets(next)
    try { localStorage.setItem('tmf-presets', JSON.stringify(next)) } catch { /* ignorieren */ }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>{kind === 'essen' ? '🍽️ Essen' : '🩺 Beobachtung'}</h3>

      <div className="row">
        <label className="field grow">
          <span>Datum</span>
          <input type="date" value={shownDate} onChange={(e) => setDate(e.target.value || null)} />
        </label>
        <label className="field grow">
          <span>Uhrzeit</span>
          <input type="time" value={shownTime} onChange={(e) => setTime(e.target.value || null)} />
        </label>
      </div>

      {kind === 'beobachtung' && (
        <div className="chips">
          {presets.map((p) => (
            <button type="button" key={p} className="chip" onClick={() => setText((t) => appendPreset(t, p))}>
              {p}
            </button>
          ))}
          <button type="button" className="chip chip-edit" onClick={() => setEditPresets((v) => !v)}>
            ✎
          </button>
        </div>
      )}
      {kind === 'beobachtung' && editPresets && (
        <label className="field">
          <span>Voreingaben (eine pro Zeile, nur auf diesem Gerät)</span>
          <textarea rows={5} defaultValue={presets.join('\n')} onBlur={(e) => savePresets(e.target.value)} />
        </label>
      )}

      <label className="field">
        <span>{kind === 'essen' ? 'Was hast du gegessen?' : 'Was hast du beobachtet?'}</span>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={kind === 'essen' ? 'z. B. Haferflocken mit Banane' : 'z. B. Blähung stark'}
        />
      </label>

      <label className="check">
        <input type="checkbox" checked={link} onChange={(e) => setLink(e.target.checked)} />
        auch bei {other.name} eintragen
      </label>

      <button className="btn" type="submit" disabled={busy || !text.trim()}>
        {busy ? 'Speichert …' : 'Speichern'}
      </button>
    </form>
  )
}

function EntryList({ person, cycles, version, showToast }) {
  const [entries, setEntries] = useState(null)
  const [filter, setFilter] = useState('alle')
  const [editing, setEditing] = useState(null)
  const starts = cycles.map((c) => c.start_date)

  const load = useCallback(async () => {
    try { setEntries(await loadEntries(person)) }
    catch (e) { showToast(`Laden fehlgeschlagen: ${e.message}`, true); setEntries([]) }
  }, [person, showToast])
  useEffect(() => { load() }, [load, version])

  if (!entries) return <p className="muted">Lädt …</p>

  const shown = entries.filter((e) => filter === 'alle' || e.kind === filter)
  const days = []
  for (const e of shown) {
    const last = days[days.length - 1]
    if (last && last.date === e.entry_date) last.items.push(e)
    else days.push({ date: e.entry_date, items: [e] })
  }

  const remove = async (e) => {
    if (!window.confirm('Eintrag löschen?')) return
    try { await deleteEntry(e.id); await load(); showToast('Eintrag gelöscht') }
    catch (err) { showToast(`Löschen fehlgeschlagen: ${err.message}`, true) }
  }

  const saveEdit = async (e, fields) => {
    try { await updateEntry(e.id, fields); setEditing(null); await load(); showToast('Änderung gespeichert') }
    catch (err) { showToast(`Speichern fehlgeschlagen: ${err.message}`, true) }
  }

  return (
    <>
      <div className="filters">
        {[['alle', 'Alle'], ['essen', 'Essen'], ['beobachtung', 'Beobachtung']].map(([k, label]) => (
          <button key={k} className={`filter ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>
      {days.length === 0 && <p className="muted">Noch keine Einträge.</p>}
      {days.map((d) => {
        const cd = person === 'tina' ? cycleDay(d.date, starts) : null
        return (
          <section key={d.date} className="day">
            <h3>
              {formatDay(d.date)}
              {cd && <span className="muted"> · Zyklustag {cd}</span>}
            </h3>
            {d.items.map((e) =>
              editing === e.id ? (
                <EditRow key={e.id} entry={e} onSave={(f) => saveEdit(e, f)} onCancel={() => setEditing(null)} />
              ) : (
                <article key={e.id} className={`item ${e.kind}`}>
                  <div className="item-head">
                    <span className="time">{e.entry_time.slice(0, 5)}</span>
                    <span className={`badge ${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                    <span className="spacer" />
                    <button className="text-btn" onClick={() => setEditing(e.id)}>Bearbeiten</button>
                    <button className="text-btn danger" onClick={() => remove(e)}>Löschen</button>
                  </div>
                  <p className="item-text">{e.text}</p>
                </article>
              )
            )}
          </section>
        )
      })}
    </>
  )
}

function EditRow({ entry, onSave, onCancel }) {
  const [text, setText] = useState(entry.text)
  const [date, setDate] = useState(entry.entry_date)
  const [time, setTime] = useState(entry.entry_time.slice(0, 5))
  return (
    <div className="item editing">
      <div className="row">
        <label className="field grow"><span>Datum</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field grow"><span>Uhrzeit</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      </div>
      <label className="field"><span>Text</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="row">
        <button className="btn" disabled={!text.trim() || !date || !time}
          onClick={() => onSave({ text: text.trim(), entry_date: date, entry_time: time })}>
          Speichern
        </button>
        <button className="text-btn" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  )
}
