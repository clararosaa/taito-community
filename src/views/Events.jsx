import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import EmptyState from '../components/EmptyState'
import EventCard from '../components/events/EventCard'
import NewEventSheet from '../components/events/NewEventSheet'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { loadEvents, createEvent, deleteEvent } from '../lib/events'

export default function Events({ onProfile }) {
  const { profile, session } = useAuth()
  const toast = useToast()
  const meId = session?.user?.id

  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const seq = useRef(0)

  const refresh = useCallback(async () => {
    if (!meId) return
    const run = ++seq.current
    try {
      const rows = await loadEvents()
      if (run !== seq.current) return
      setEvents(rows)
      setError('')
    } catch (e) {
      if (run !== seq.current) return
      console.error('Tapahtumien lataus epäonnistui:', e)
      setEvents([])
      setError(e?.message ?? 'Tuntematon virhe')
    }
  }, [meId])

  useEffect(() => { refresh() }, [refresh])

  async function create(fields) {
    try {
      await createEvent(fields, meId)
      await refresh()
      toast('Tapahtuma luotu')
      return true
    } catch (e) {
      console.error('Tapahtuman luonti epäonnistui:', e)
      toast('Tapahtuman luonti ei onnistunut')
      return false
    }
  }

  async function remove(event) {
    setBusy(event.id)
    const before = events
    setEvents(list => list.filter(e => e.id !== event.id))
    try {
      await deleteEvent(event.id)
      toast('Tapahtuma poistettu')
    } catch {
      setEvents(before)
      toast('Poisto ei onnistunut')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Header
        title="Tapahtumat"
        name={profile?.display_name}
        onAvatar={onProfile}
        right={
          <button style={S.add} onClick={() => setSheetOpen(true)}>
            + Uusi
          </button>
        }
      />

      <div className="view-scroll">
        <div style={S.stack}>
          {events === null && <div style={S.info}>Ladataan tapahtumia…</div>}

          {error && (
            <div style={S.error}>
              Tapahtumia ei saatu ladattua.
              <div style={S.detail}>{error}</div>
            </div>
          )}

          {events?.length === 0 && !error && (
            <EmptyState
              emoji="📅"
              title="Ei tulevia tapahtumia"
              body="Afterwork, lounastreffit, lautapeli-ilta — kuka tahansa voi ehdottaa. Ensimmäinen saa muut liikkeelle."
              action="Luo tapahtuma"
              onAction={() => setSheetOpen(true)}
            />
          )}

          {events?.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isMine={event.createdBy === meId}
              busy={busy === event.id}
              onDelete={remove}
            />
          ))}
        </div>
      </div>

      {sheetOpen && (
        <NewEventSheet onClose={() => setSheetOpen(false)} onCreate={create} />
      )}
    </>
  )
}

const S = {
  stack: { padding: '0 var(--content-pad) 14px', display: 'flex', flexDirection: 'column', gap: 12 },
  add: {
    borderRadius: 'var(--r-pill)', padding: '9px 14px', background: 'var(--brand)',
    color: 'var(--white)', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap'
  },
  info: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '18px 0' },
  error: {
    background: 'var(--red-bg-2)', color: 'var(--red-text)', borderRadius: 18,
    padding: 14, fontSize: 13, fontWeight: 600, lineHeight: 1.45
  },
  detail: { fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, color: 'var(--red-text-2)', marginTop: 4 }
}
