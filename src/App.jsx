import { useState } from 'react'
import { useAuth } from './lib/auth'
import { FEED_ENABLED } from './lib/features'
import Login from './components/Login'
import BottomNav from './components/BottomNav'
import Feed from './views/Feed'
import Arena from './views/Arena'
import Events from './views/Events'
import Game from './views/Game'
import Me from './views/Me'

/* Areena on etusivu niin kauan kuin syöte on piilotettu. */
const HOME = FEED_ENABLED ? 'feed' : 'arena'

export default function App() {
  const { session, loading } = useAuth()
  const [view, setView] = useState(HOME)
  const [prev, setPrev] = useState(HOME)

  if (loading) {
    return <div className="app-shell" style={{ display: 'grid', placeItems: 'center' }}>
      <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Ladataan…</div>
    </div>
  }

  if (!session) {
    return <div className="app-shell"><Login /></div>
  }

  function openProfile() {
    setPrev(view === 'me' ? prev : view)
    setView('me')
  }

  return (
    <div className="app-shell">
      {view === 'feed' && FEED_ENABLED && <Feed onProfile={openProfile} />}
      {view === 'arena'  && <Arena  onProfile={openProfile} />}
      {view === 'events' && <Events onProfile={openProfile} />}
      {view === 'game'   && <Game   onProfile={openProfile} />}
      {view === 'me'     && <Me     onClose={() => setView(prev)} />}
      {view !== 'me' && <BottomNav view={view} onChange={setView} />}
    </div>
  )
}
