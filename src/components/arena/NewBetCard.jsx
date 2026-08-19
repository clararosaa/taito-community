import { forwardRef, useRef, useState } from 'react'

/* Prototyypin "✦ Arvo AI:llä" täyttää satunnaisen ehdotuksen.
   Tämä on paikallinen lista, ei mallikutsu. */
const SUGGESTIONS = [
  'Kuka juo päivän viimeisen kahvin?',
  'Montako kertaa sana ”synergia” sanotaan huomenna?',
  'Kumpi kestää kauemmin: hissi vai portaat kolmanteen?',
  'Alkaako maanantain palaveri ajallaan?',
  'Loppuuko kaurajuoma ennen perjantaita?'
]

const NewBetCard = forwardRef(function NewBetCard({ onPublish }, ref) {
  const [text, setText] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [busy, setBusy] = useState(false)
  const input = useRef(null)

  async function publish() {
    const q = text.trim()
    if (!q || busy) return
    setBusy(true)
    const ok = await onPublish(q, anonymous)
    setBusy(false)
    if (ok) setText('')
  }

  return (
    <section style={S.card}>
      <h3 style={S.title}>Luo oma veto</h3>
      <input
        ref={el => { input.current = el; if (ref) ref.current = el }}
        style={S.input}
        value={text}
        maxLength={300}
        placeholder="Mitä tapahtuu seuraavaksi?"
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') publish() }}
      />
      <div style={S.segment}>
        {[
          { id: true, label: '🕶 Anonyymi' },
          { id: false, label: '👀 Julkinen' }
        ].map(o => (
          <button
            key={String(o.id)}
            onClick={() => setAnonymous(o.id)}
            style={{
              ...S.segmentItem,
              background: anonymous === o.id ? '#FFFDF9' : 'transparent',
              color: anonymous === o.id ? 'var(--ink)' : 'var(--text-4)'
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div style={S.hint}>
        {anonymous
          ? 'Äänestäjiä ei tallenneta lainkaan.'
          : 'Äänestäjien nimet näkyvät muille äänestyksen jälkeen.'}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          style={S.ai}
          onClick={() => {
            setText(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)])
            input.current?.focus()
          }}
        >
          ✦ Arvo ehdotus
        </button>
        <button
          style={{ ...S.publish, opacity: text.trim() && !busy ? 1 : 0.5 }}
          disabled={!text.trim() || busy}
          onClick={publish}
        >
          {busy ? 'Julkaistaan…' : 'Julkaise'}
        </button>
      </div>
    </section>
  )
})

export default NewBetCard

const S = {
  card: {
    background: 'var(--ink)', borderRadius: 22, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 10, flex: 'none'
  },
  title: { fontWeight: 700, fontSize: 16, color: '#FFFDF9' },
  input: {
    background: 'var(--ink-2)', border: 'none', outline: 'none', borderRadius: 14,
    padding: 12, fontWeight: 500, fontSize: 13, color: '#FFFDF9'
  },
  segment: {
    display: 'flex', gap: 6, background: 'var(--ink-2)',
    borderRadius: 'var(--r-pill)', padding: 4
  },
  segmentItem: {
    flex: 1, borderRadius: 'var(--r-pill)', padding: 9, textAlign: 'center',
    fontWeight: 700, fontSize: 12
  },
  hint: { fontWeight: 500, fontSize: 11, color: 'var(--text-3)', marginTop: -2 },
  ai: {
    background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--r-pill)',
    padding: '12px 16px', fontWeight: 700, fontSize: 13
  },
  publish: {
    border: '1.5px solid #4A443C', color: '#EDE7DC', borderRadius: 'var(--r-pill)',
    padding: '11px 16px', fontWeight: 700, fontSize: 13
  }
}
