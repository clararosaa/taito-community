import { useState } from 'react'
import { useAuth } from './lib/auth'
import Login from './components/Login'
import BottomNav from './components/BottomNav'
import Feed from './views/Feed'
import Arena from './views/Arena'
import Game from './views/Game'
import Me from './views/Me'

export default function App() {
  const { session, loading } = useAuth()
  const [view, setView] = useState('feed')
  const [prev, setPrev] = useState('feed')

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
      {view === 'feed'  && <Feed  onProfile={openProfile} />}
      {view === 'arena' && <Arena onProfile={openProfile} />}
      {view === 'game'  && <Game  onProfile={openProfile} />}
      {view === 'me'    && <Me    onClose={() => setView(prev)} />}
      {view !== 'me' && <BottomNav view={view} onChange={setView} />}
    </div>
  )
}
