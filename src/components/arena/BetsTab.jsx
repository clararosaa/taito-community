import { useCallback, useEffect, useRef, useState } from 'react'
import BetCard from './BetCard'
import NewBetCard from './NewBetCard'
import EmptyState from '../EmptyState'
import { castVote } from '../../lib/supabase'
import { loadBets, createBet, rememberVote } from '../../lib/arena'
import { useToast } from '../../lib/toast'

export default function BetsTab({ me }) {
  const toast = useToast()
  const [bets, setBets] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const newBetRef = useRef(null)
  const seq = useRef(0)

  const refresh = useCallback(async () => {
    if (!me.id) return
    const run = ++seq.current
    try {
      const rows = await loadBets(me)
      if (run !== seq.current) return
      setBets(rows)
      setError('')
    } catch (e) {
      if (run !== seq.current) return
      console.error('Vetojen lataus epäonnistui:', e)
      setBets([])
      setError(e?.message ?? 'Tuntematon virhe')
    }
  }, [me])

  useEffect(() => { refresh() }, [refresh])

  async function vote(bet, index) {
    if (bet.voted || bet.closed) return
    setBusy(bet.id)
    try {
      await castVote(bet.id, index)
      rememberVote(bet.id, index)
      await refresh()
      toast('Veto asetettu')
    } catch (e) {
      toast(String(e.message).includes('sulkeutunut') ? 'Äänestys on sulkeutunut' : 'Ääni ei mennyt läpi')
    } finally {
      setBusy(null)
    }
  }

  async function publish(question, anonymous) {
    try {
      await createBet(question, anonymous, me.id)
      await refresh()
      toast(anonymous ? 'Anonyymi veto julkaistu' : 'Julkinen veto julkaistu')
      return true
    } catch {
      toast('Julkaisu ei onnistunut')
      return false
    }
  }

  return (
    <div style={S.stack}>
      {bets === null && <div style={S.info}>Ladataan vetoja…</div>}

      {error && <div style={S.error}>Vetoja ei saatu ladattua.<div style={S.detail}>{error}</div></div>}

      {bets?.length === 0 && !error && (
        <EmptyState
          emoji="🎲"
          title="Ensimmäinen veto puuttuu"
          body="Mikä toimistolla ratkeaa tänään? Heitä kysymys, johon muut voivat ottaa kantaa."
          action="Luo veto"
          onAction={() => newBetRef.current?.focus()}
        />
      )}

      {bets?.map(bet => (
        <BetCard
          key={bet.id}
          bet={bet}
          myName={me.name}
          busy={busy === bet.id}
          onVote={vote}
        />
      ))}

      <NewBetCard ref={newBetRef} onPublish={publish} />
    </div>
  )
}

const S = {
  stack: { padding: '0 var(--content-pad) 14px', display: 'flex', flexDirection: 'column', gap: 12 },
  info: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '18px 0' },
  error: {
    background: 'var(--red-bg-2)', color: 'var(--red-text)', borderRadius: 18,
    padding: 14, fontSize: 13, fontWeight: 600, lineHeight: 1.45
  },
  detail: { fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, color: 'var(--red-text-2)', marginTop: 4 }
}
