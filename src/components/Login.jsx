import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

/* Kirjautuminen 6-numeroisella koodilla, ei magic linkillä: iOS:n
   kotinäyttösovelluksella on Safarista erillinen tallennustila, joten
   selaimessa avattu linkki ei kirjaa appia sisään. Koodi kirjoitetaan
   samaan ikkunaan jossa sitä pyydettiinkin. */

const COOLDOWN = 60

export default function Login() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const codeInput = useRef(null)
  const lastTried = useRef('')

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function sendCode(resend = false) {
    if (!email.includes('@')) { setError('Tarkista sähköpostiosoite'); return }
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    setBusy(false)
    if (error) {
      const wait = Number(String(error.message).match(/after (\d+) seconds/)?.[1])
      if (wait) { setCooldown(wait); setError(`Odota ${wait} sekuntia ennen uutta koodia`) }
      else setError(error.message)
      return
    }
    setStep('code')
    setCode('')
    lastTried.current = ''
    setCooldown(COOLDOWN)
    if (resend) setError('')
    requestAnimationFrame(() => codeInput.current?.focus())
  }

  async function verify(value = code) {
    if (value.length !== 6 || busy) return
    lastTried.current = value
    setBusy(true); setError('')
    const { error } = await supabase.auth.verifyOtp({ email, token: value, type: 'email' })
    setBusy(false)
    // Onnistuessa onAuthStateChange vie eteenpäin, tätä komponenttia
    // ei enää renderöidä.
    if (error) setError('Koodi ei kelpaa tai se on vanhentunut')
  }

  function onCodeChange(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError('')
    // iOS täyttää koodin kerralla näppäimistön yläpuolelta.
    if (digits.length === 6 && digits !== lastTried.current) verify(digits)
  }

  return (
    <div style={S.wrap}>
      <div style={S.logo}>
        <span style={{ color: 'var(--ink)' }}>Taito</span>
        <span style={{ color: 'var(--brand)' }}> Community</span>
      </div>

      {step === 'email' ? (
        <div style={S.card}>
          <h2 style={S.title}>Kirjaudu sisään</h2>
          <p style={S.body}>
            Ei salasanaa. Lähetämme sähköpostiin 6-numeroisen koodin, jonka
            kirjoitat tähän.
          </p>
          <input
            style={S.input}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            placeholder="etunimi.sukunimi@firma.fi"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && sendCode()}
          />
          {error && <div style={S.error} role="alert">{error}</div>}
          <button
            style={{ ...S.primary, opacity: busy || !email ? 0.5 : 1 }}
            disabled={busy || !email}
            onClick={() => sendCode()}
          >
            {busy ? 'Lähetetään…' : 'Lähetä koodi'}
          </button>
        </div>
      ) : (
        <div style={S.card}>
          <div style={S.emoji}>📬</div>
          <h2 style={S.title}>Syötä koodi</h2>
          <p style={S.body}>
            Lähetimme 6-numeroisen koodin osoitteeseen <strong>{email}</strong>.
          </p>
          <input
            ref={codeInput}
            style={S.codeInput}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoCorrect="off"
            spellCheck="false"
            maxLength={6}
            placeholder="––––––"
            aria-label="6-numeroinen koodi"
            value={code}
            onChange={e => onCodeChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verify()}
          />
          {error && <div style={S.error} role="alert">{error}</div>}
          <button
            style={{ ...S.primary, opacity: busy || code.length !== 6 ? 0.5 : 1 }}
            disabled={busy || code.length !== 6}
            onClick={() => verify()}
          >
            {busy ? 'Tarkistetaan…' : 'Kirjaudu'}
          </button>
          <button
            style={{ ...S.ghost, opacity: cooldown > 0 || busy ? 0.5 : 1 }}
            disabled={cooldown > 0 || busy}
            onClick={() => sendCode(true)}
          >
            {cooldown > 0 ? `Uuden koodin voi pyytää ${cooldown} s kuluttua` : 'Lähetä uusi koodi'}
          </button>
          <button
            style={S.link}
            onClick={() => { setStep('email'); setCode(''); setError('') }}
          >
            Käytä toista osoitetta
          </button>
        </div>
      )}
    </div>
  )
}

const S = {
  wrap: {
    minHeight: '100%', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: 28, padding: '24px 20px',
    background: 'var(--surface-warm)', overflowY: 'auto'
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30,
    textAlign: 'center', letterSpacing: '-.01em', flex: 'none'
  },
  card: {
    background: 'var(--white)', borderRadius: 'var(--r-card)',
    border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)',
    padding: 24, display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  emoji: { fontSize: 34, textAlign: 'center' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 },
  body: { margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 },
  input: {
    marginTop: 6, padding: '14px 16px', borderRadius: 'var(--r-box)',
    border: '1px solid var(--border-2)', background: 'var(--sand-1)',
    fontSize: 15, outline: 'none'
  },
  codeInput: {
    marginTop: 6, padding: '14px 16px', borderRadius: 'var(--r-box)',
    border: '1.5px solid var(--border-2)', background: 'var(--sand-1)',
    fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 26,
    letterSpacing: '.28em', textAlign: 'center', outline: 'none'
  },
  primary: {
    marginTop: 4, padding: '15px 18px', borderRadius: 'var(--r-box)',
    background: 'var(--brand)', color: 'var(--white)',
    fontWeight: 700, fontSize: 14
  },
  ghost: {
    padding: '13px 18px', borderRadius: 'var(--r-box)',
    background: 'var(--sand-2)', color: 'var(--text-2)',
    fontWeight: 600, fontSize: 13
  },
  link: { padding: '4px 0', color: 'var(--text-3)', fontWeight: 600, fontSize: 12.5 },
  error: { fontSize: 13, color: 'var(--red-text)', fontWeight: 600 }
}
