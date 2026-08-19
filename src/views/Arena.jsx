import { useMemo, useState } from 'react'
import Header from '../components/Header'
import BetsTab from '../components/arena/BetsTab'
import TakesTab from '../components/arena/TakesTab'
import ChallengesTab from '../components/arena/ChallengesTab'
import { useAuth } from '../lib/auth'

/* Viikon X jätetään pois toistaiseksi. Kun se palaa, riittää lisätä
   rivi tähän ja oma välilehtikomponentti. */
const TABS = [
  { id: 'bets',       label: 'Vedot' },
  { id: 'takes',      label: 'Hot Takes' },
  { id: 'challenges', label: 'Haasteet' }
]

export default function Arena({ onProfile }) {
  const { profile, session } = useAuth()
  const [tab, setTab] = useState('bets')

  const me = useMemo(
    () => ({ id: session?.user?.id, name: profile?.display_name ?? '' }),
    [session?.user?.id, profile?.display_name]
  )

  return (
    <>
      <Header title="Areena" name={me.name} onAvatar={onProfile} />

      <div style={S.tabs} role="tablist">
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              style={{
                ...S.tab,
                background: active ? 'var(--white)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--text-3)',
                boxShadow: active ? '0 1px 3px rgba(30,27,23,.12)' : 'none',
                fontWeight: active ? 700 : 600
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="view-scroll">
        {tab === 'bets'       && <BetsTab me={me} />}
        {tab === 'takes'      && <TakesTab me={me} />}
        {tab === 'challenges' && <ChallengesTab me={me} />}
      </div>
    </>
  )
}

const S = {
  tabs: {
    display: 'flex', gap: 3, margin: '2px var(--content-pad) 14px',
    background: 'var(--sand-2)', borderRadius: 'var(--r-pill)', padding: 4
  },
  tab: {
    flex: 1, padding: '9px 4px', borderRadius: 'var(--r-pill)',
    fontSize: 12, whiteSpace: 'nowrap', transition: 'background .15s'
  }
}
