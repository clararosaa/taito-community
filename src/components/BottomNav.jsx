import Home from './icons/Home'
import Stadium from './icons/Stadium'
import Abc from './icons/Abc'

/* Kolme kohtaa. Kamera-FAB ja viides kohta on suunniteltu lisättäväksi
   myöhemmin: uusi rivi tähän riittää. */
const ITEMS = [
  { id: 'feed',  label: 'Syöte',  Icon: Home },
  { id: 'arena', label: 'Areena', Icon: Stadium },
  { id: 'game',  label: 'Sanuli', Icon: Abc }
]

export default function BottomNav({ view, onChange }) {
  return (
    <nav style={S.nav}>
      {ITEMS.map(({ id, label, Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            // Ikoni perii tämän värin currentColorina.
            style={{ ...S.item, color: active ? 'var(--accent)' : 'var(--nav-inactive)' }}
          >
            <Icon size={24} />
            <span style={{ ...S.label, fontWeight: active ? 700 : 600 }}>{label}</span>
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
