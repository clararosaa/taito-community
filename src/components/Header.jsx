import { initials } from '../lib/supabase'

export default function Header({ title, name, onAvatar, right }) {
  return (
    <header style={S.bar}>
      {typeof title === 'string' ? (
        <h1 style={S.title}>{title}</h1>
      ) : title}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {right}
        <button style={S.avatar} onClick={onAvatar} aria-label="Oma profiili">
          {initials(name)}
        </button>
      </div>
    </header>
  )
}

export function Wordmark() {
  return (
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 25, letterSpacing: '-.01em' }}>
      <span style={{ color: 'var(--ink)' }}>Taito</span>
      <span style={{ color: 'var(--brand)' }}> Community</span>
    </div>
  )
}

const S = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px var(--header-pad) 10px',
    background: 'var(--surface-warm)'
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 27, color: 'var(--ink)' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-bg)',
    color: 'var(--brand-deep)', fontWeight: 700, fontSize: 12.5,
    display: 'grid', placeItems: 'center', flexShrink: 0
  }
}
