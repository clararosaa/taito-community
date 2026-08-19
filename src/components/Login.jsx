import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!email.includes('@')) { setError('Tarkista sähköpostiosoite'); return }
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href }
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div style={S.wrap}>
      <div style={S.logo}>
        <span style={{ color: 'var(--ink)' }}>WorkSpace</span>
        <span style={{ color: 'var(--brand)' }}> Hub</span>
      </div>

      {sent ? (
        <div style={S.card}>
          <div style={S.emoji}>📬</div>
          <h2 style={S.title}>Tarkista sähköposti</h2>
          <p style={S.body}>
            Lähetimme kirjautumislinkin osoitteeseen <strong>{email}</strong>.
            Avaa se samalla laitteella. Linkki vanhenee tunnissa.
          </p>
          <button style={S.ghost} onClick={() => { setSent(false); setEmail('') }}>
            Käytä toista osoitetta
          </button>
        </div>
      ) : (
        <div style={S.card}>
          <h2 style={S.title}>Kirjaudu sisään</h2>
          <p style={S.body}>
            Ei salasanaa. Saat linkin sähköpostiin ja olet sisällä.
          </p>
          <input
            style={S.input}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="etunimi.sukunimi@firma.fi"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          {error && <div style={S.error}>{error}</div>}
          <button
            style={{ ...S.primary, opacity: busy || !email ? .5 : 1 }}
            disabled={busy || !email}
            onClick={send}
          >
            {busy ? 'Lähetetään…' : 'Lähetä kirjautumislinkki'}
          </button>
        </div>
      )}
    </div>
  )
}

const S = {
  wrap: {
    minHeight: '100%', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: 28, padding: '0 20px',
    background: 'var(--surface-warm)'
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30,
    textAlign: 'center', letterSpacing: '-.01em'
  },
  card: {
    background: 'var(--white)', borderRadius: 'var(--r-card)',
    border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)',
    padding: 24, display: 'flex', flexDirection: 'column', gap: 12
  },
  emoji: { fontSize: 34, textAlign: 'center' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 },
  body: { margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 },
  input: {
    marginTop: 6, padding: '14px 16px', borderRadius: 'var(--r-box)',
    border: '1px solid var(--border-2)', background: 'var(--sand-1)',
    fontSize: 15, outline: 'none'
  },
  primary: {
    marginTop: 4, padding: '15px 18px', borderRadius: 'var(--r-box)',
    background: 'var(--brand)', color: 'var(--white)',
    fontWeight: 700, fontSize: 14
  },
  ghost: {
    marginTop: 4, padding: '13px 18px', borderRadius: 'var(--r-box)',
    background: 'var(--sand-2)', color: 'var(--text-2)',
    fontWeight: 600, fontSize: 13
  },
  error: { fontSize: 13, color: 'var(--red-text)', fontWeight: 600 }
}
