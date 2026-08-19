import { forwardRef, useEffect, useRef, useState } from 'react'
import Avatar from '../Avatar'

const PROMPTS = [
  'Kehu kollegaa…',
  'Kerro jotain hauskaa…',
  'Jaa päivän pieni voitto…',
  'Kiitä jotakuta avusta…',
  'Mitä opit tällä viikolla?',
  'Suosittele lounaspaikkaa…',
  'Mikä sai sinut nauramaan tänään?'
]

const MAX = 2000

/* Placeholder vaihtuu 3.6 s välein ja pysähtyy heti kun kenttään
   kirjoitetaan. */
const Composer = forwardRef(function Composer({ name, userId, onPublish }, ref) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [promptIndex, setPromptIndex] = useState(0)
  const area = useRef(null)

  useEffect(() => {
    if (text) return
    const t = setInterval(() => setPromptIndex(i => i + 1), 3600)
    return () => clearInterval(t)
  }, [text])

  // Kenttä kasvaa sisällön mukana, mutta lähtee aina samasta korkeudesta.
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 22)}px`
  }, [text])

  const body = text.trim()
  const ready = body.length > 0 && !busy

  async function publish() {
    if (!ready) return
    setBusy(true)
    const ok = await onPublish(body.slice(0, MAX))
    setBusy(false)
    if (ok) setText('')
  }

  return (
    <section style={S.card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar name={name} seed={userId} size={38} />
        <textarea
          ref={el => { area.current = el; if (ref) ref.current = el }}
          value={text}
          maxLength={MAX}
          rows={1}
          onChange={e => setText(e.target.value)}
          placeholder={PROMPTS[promptIndex % PROMPTS.length]}
          style={S.input}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {text.length > MAX - 300 && (
          <div style={S.counter}>{MAX - text.length} merkkiä jäljellä</div>
        )}
        <button
          onClick={publish}
          disabled={!ready}
          style={{
            ...S.send,
            marginLeft: 'auto',
            background: ready ? 'var(--brand)' : '#E7DFD2',
            color: ready ? 'var(--white)' : 'var(--text-4)'
          }}
        >
          {busy ? 'Julkaistaan…' : 'Julkaise'}
        </button>
      </div>
    </section>
  )
})

export default Composer

const S = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 14,
    display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  input: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
    fontWeight: 500, fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)',
    padding: '10px 0 26px', resize: 'none', overflow: 'hidden', maxHeight: 220
  },
  counter: { fontWeight: 600, fontSize: 11, color: 'var(--text-4)' },
  send: {
    borderRadius: 'var(--r-pill)', padding: '10px 15px', fontWeight: 700, fontSize: 12.5,
    flex: 'none', whiteSpace: 'nowrap'
  }
}
