import { initials } from '../lib/supabase'
import { avatarColor } from '../lib/format'

export default function Avatar({ name, seed, size = 38, brand = false }) {
  const c = brand
    ? { bg: 'var(--brand)', fg: 'var(--white)' }
    : avatarColor(seed ?? name ?? '')
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%', flex: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: c.bg, color: c.fg,
        fontWeight: 700, fontSize: Math.round(size * 0.34), lineHeight: 1
      }}
    >
      {initials(name)}
    </div>
  )
}
