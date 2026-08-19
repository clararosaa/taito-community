import { useState } from 'react'
import Sheet from '../Sheet'
import { toLocalInput } from '../../lib/format'

/* Oletusaika: seuraava tasatunti huomenna klo 17. */
function defaultStart() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(17, 0, 0, 0)
  return toLocalInput(d)
}

export default function NewEventSheet({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStart)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const ready = title.trim().length > 0 && startsAt && !busy

  async function submit() {
    if (!ready) return
    setBusy(true)
    const ok = await onCreate({
      title: title.trim().slice(0, 120),
      location: location.trim().slice(0, 120),
      // datetime-local on paikallista aikaa; Date muuntaa sen UTC:hen.
      startsAt: new Date(startsAt).toISOString(),
      description: description.trim().slice(0, 1000)
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Sheet
      title="Uusi tapahtuma"
      subtitle="Näkyy kaikille heti"
      onClose={onClose}
      footer={
        <button
          style={{ ...S.submit, opacity: ready ? 1 : 0.5 }}
          disabled={!ready}
          onClick={submit}
        >
          {busy ? 'Luodaan…' : 'Luo tapahtuma'}
        </button>
      }
    >
      <div style={S.form}>
        <label style={S.field}>
          <span style={S.label}>Nimi</span>
          <input
            autoFocus
            style={S.input}
            value={title}
            maxLength={120}
            placeholder="Esim. Perjantain afterwork"
            onChange={e => setTitle(e.target.value)}
          />
        </label>

        <label style={S.field}>
          <span style={S.label}>Paikka</span>
          <input
            style={S.input}
            value={location}
            maxLength={120}
            placeholder="Esim. Toimiston keittiö"
            onChange={e => setLocation(e.target.value)}
          />
        </label>

        <label style={S.field}>
          <span style={S.label}>Aika</span>
          <input
            style={S.input}
            type="datetime-local"
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
          />
        </label>

        <label style={S.field}>
          <span style={S.label}>Kuvaus</span>
          <textarea
            style={{ ...S.input, minHeight: 96, resize: 'vertical' }}
            value={description}
            maxLength={1000}
            placeholder="Mitä tehdään, kenelle tarkoitettu, tarvitseeko ilmoittautua?"
            onChange={e => setDescription(e.target.value)}
          />
        </label>
      </div>
    </Sheet>
  )
}

const S = {
  form: { display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 2 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontWeight: 700, fontSize: 12, color: 'var(--text-2)' },
  input: {
    padding: '13px 14px', borderRadius: 'var(--r-box)',
    border: '1px solid var(--border-2)', background: 'var(--sand-1)',
    fontSize: 14.5, outline: 'none', width: '100%'
  },
  submit: {
    width: '100%', padding: '15px 18px', borderRadius: 'var(--r-box)',
    background: 'var(--brand)', color: 'var(--white)', fontWeight: 700, fontSize: 14
  }
}
