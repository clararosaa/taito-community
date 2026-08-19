import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Board from '../components/game/Board'
import Keyboard from '../components/game/Keyboard'
import HelpSheet from '../components/game/HelpSheet'
import LeaderboardSheet from '../components/game/LeaderboardSheet'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { checkGuess, revealWord } from '../lib/supabase'
import {
  loadLocalGame, saveLocalGame, loadMyResult, saveResult,
  loadLeaderboard, wordChangesAt
} from '../lib/game'

const LETTERS = /^[A-ZÅÄÖ]$/

export default function Game({ onProfile }) {
  const { profile, session } = useAuth()
  const toast = useToast()
  const meId = session?.user?.id

  const [guesses, setGuesses] = useState(() => loadLocalGame().guesses ?? [])
  const [current, setCurrent] = useState('')
  const [serverResult, setServerResult] = useState(null)
  const [word, setWord] = useState(null)
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [boardOpen, setBoardOpen] = useState(false)
  const [noWord, setNoWord] = useState(false)
  const changesAt = useRef(wordChangesAt()).current

  const solvedLocally = guesses.some(g => g.marks === 'ggggg')
  const done = solvedLocally || guesses.length >= 6 || !!serverResult
  const won = solvedLocally || (!!serverResult && serverResult.solved)

  const refreshBoard = useCallback(() => {
    loadLeaderboard().then(setRows).catch(e => console.warn('Tulostaulua ei saatu:', e.message))
  }, [])

  useEffect(() => {
    if (!meId) return
    refreshBoard()
    loadMyResult(meId)
      .then(row => {
        if (!row) return
        setServerResult(row)
        // Sana paljastuu vasta kun tulos on kannassa.
        revealWord().then(setWord).catch(() => {})
      })
      .catch(e => console.warn('Omaa tulosta ei saatu:', e.message))
  }, [meId, refreshBoard])

  const finish = useCallback(async (attempts, solved) => {
    try {
      await saveResult(meId, attempts, solved)
      setServerResult({ attempts, solved })
    } catch (e) {
      console.error('Tuloksen tallennus epäonnistui:', e)
      toast('Tulosta ei saatu tallennettua')
    }
    try { setWord(await revealWord()) } catch { /* tulos puuttuu, sana jää piiloon */ }
    refreshBoard()
    if (solved) setTimeout(() => setBoardOpen(true), 800)
  }, [meId, refreshBoard, toast])

  const submit = useCallback(async () => {
    if (busy || done) return
    if (current.length !== 5) { toast('Sanassa on viisi kirjainta'); return }
    setBusy(true)
    try {
      const marks = await checkGuess(current)
      const next = [...guesses, { word: current, marks }]
      setGuesses(next)
      saveLocalGame(next)
      setCurrent('')
      const solved = marks === 'ggggg'
      if (solved || next.length >= 6) await finish(next.length, solved)
    } catch (e) {
      if (String(e.message).includes('päivän sanaa')) {
        setNoWord(true)
        toast('Päivän sanaa ei ole asetettu')
      } else {
        toast('Arvausta ei voitu tarkistaa')
      }
    } finally {
      setBusy(false)
    }
  }, [busy, done, current, guesses, finish, toast])

  const press = useCallback(key => {
    if (done || busy || noWord) return
    if (key === '⏎') return submit()
    if (key === '⌫') return setCurrent(c => c.slice(0, -1))
    setCurrent(c => (c.length < 5 ? c + key : c))
  }, [done, busy, noWord, submit])

  // Fyysinen näppäimistö työpöydällä.
  useEffect(() => {
    const onKey = e => {
      if (helpOpen || boardOpen || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') press('⏎')
      else if (e.key === 'Backspace') press('⌫')
      else {
        const ch = e.key.toUpperCase()
        if (LETTERS.test(ch)) press(ch)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, helpOpen, boardOpen])

  const note = noWord
    ? { text: 'Päivän sanaa ei ole vielä asetettu', bg: 'var(--yellow-bg)', fg: 'var(--yellow-text)' }
    : won
      ? { text: '🎉 Ratkaisit Sanulin', bg: 'var(--brand-bg-2)', fg: 'var(--brand-deep)' }
      : done
        ? { text: word ? `Sana oli ${word}` : 'Kuusi arvausta käytetty', bg: 'var(--red-bg)', fg: 'var(--red-text)' }
        : { text: `${rows.length} ${rows.length === 1 ? 'kollega ratkaisi' : 'kollegaa ratkaisi'} tänään`, bg: 'var(--sand-3)', fg: 'var(--text-3)' }

  return (
    <>
      <Header
        title={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h1 style={S.title}>Sanuli</h1>
            <div style={S.subtitle}>Päivän sana · 5 kirjainta</div>
          </div>
        }
        name={profile?.display_name}
        onAvatar={onProfile}
        right={
          <>
            <button
              style={{
                ...S.help,
                background: helpOpen ? 'var(--ink)' : 'var(--sand-2)',
                color: helpOpen ? 'var(--yellow)' : 'var(--text-2)'
              }}
              onClick={() => setHelpOpen(true)}
              aria-label="Ohjeet"
            >
              ?
            </button>
            <button
              style={{
                ...S.lb,
                background: boardOpen ? 'var(--ink)' : 'var(--sand-3)',
                color: boardOpen ? 'var(--yellow)' : 'var(--text-2)'
              }}
              onClick={() => setBoardOpen(true)}
            >
              🏆 Tulostaulu
            </button>
          </>
        }
      />

      <div className="view-fill">
        <Board guesses={guesses} current={current} />

        <div style={S.noteRow}>
          <div style={{ ...S.note, background: note.bg, color: note.fg }}>{note.text}</div>
        </div>

        {done && guesses.length === 0 && (
          <div style={S.playedElsewhere}>
            Pelasit tämän päivän jo toisella laitteella. Uusi sana klo {changesAt}.
          </div>
        )}

        <Keyboard guesses={guesses} disabled={done || busy || noWord} onKey={press} />
      </div>

      {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} changesAt={changesAt} />}
      {boardOpen && (
        <LeaderboardSheet
          rows={rows}
          meId={meId}
          changesAt={changesAt}
          onClose={() => setBoardOpen(false)}
        />
      )}
    </>
  )
}

const S = {
  title: { fontWeight: 800, fontSize: 26, color: 'var(--ink)' },
  subtitle: { fontWeight: 500, fontSize: 12, color: 'var(--text-2)' },
  help: {
    width: 34, height: 34, borderRadius: 17, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 15, flex: 'none'
  },
  lb: { borderRadius: 'var(--r-pill)', padding: '9px 13px', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' },
  noteRow: {
    width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: 8, flex: 'none', minHeight: 26
  },
  note: {
    borderRadius: 'var(--r-pill)', padding: '5px 11px', fontWeight: 700, fontSize: 11,
    letterSpacing: '.01em', textAlign: 'center'
  },
  playedElsewhere: {
    fontSize: 12, color: 'var(--text-3)', textAlign: 'center', maxWidth: 280,
    lineHeight: 1.45, flex: 'none'
  }
}
