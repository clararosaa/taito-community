const ITEMS = [
  { id: 'feed',  label: 'Syöte',  icon: '🏠' },
  { id: 'arena', label: 'Areena', icon: '🎯' },
  { id: 'game',  label: 'Sanuli', icon: '🔤' }
]

export default function BottomNav({ view, onChange }) {
  return (
    <nav style={S.nav}>
      {ITEMS.map(it => {
        const active = view === it.id
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            style={{ ...S.item, color: active ? 'var(--accent)' : 'var(--nav-inactive)' }}
          >
            <span style={{ fontSize: 20, filter: active ? 'none' : 'grayscale(1) opacity(.6)' }}>
              {it.icon}
            </span>
            <span style={{ ...S.label, fontWeight: active ? 700 : 600 }}>{it.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

const S = {
  nav: {
    position: 'sticky', bottom: 0, zIndex: 5,
    display: 'flex', background: 'var(--surface-warm)',
    borderTop: '1px solid var(--border-3)',
    paddingBottom: 'env(safe-area-inset-bottom)'
  },
  item: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, padding: '10px 0 8px'
  },
  label: { fontSize: 10.5, letterSpacing: '.02em' }
}
