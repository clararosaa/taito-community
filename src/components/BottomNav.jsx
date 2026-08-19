import Home from './icons/Home'
import Stadium from './icons/Stadium'
import Event from './icons/Event'
import Abc from './icons/Abc'
import { FEED_ENABLED } from '../lib/features'

/* Syöte on piilotettu lipulla, ei poistettu — kohta palaa listaan
   ensimmäiseksi kun FEED_ENABLED kääntyy trueksi. Kamera-FAB ja
   viides kohta mahtuvat tähän edelleen. */
const ITEMS = [
  { id: 'feed',   label: 'Syöte',      Icon: Home,    enabled: FEED_ENABLED },
  { id: 'arena',  label: 'Areena',     Icon: Stadium, enabled: true },
  { id: 'events', label: 'Tapahtumat', Icon: Event,   enabled: true },
  { id: 'game',   label: 'Sanuli',     Icon: Abc,     enabled: true }
].filter(item => item.enabled)

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
