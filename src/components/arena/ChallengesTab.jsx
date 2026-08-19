import { useCallback, useEffect, useRef, useState } from 'react'
import EmptyState from '../EmptyState'
import { loadChallenges, completeChallenge, uncompleteChallenge } from '../../lib/arena'
import { useToast } from '../../lib/toast'

/* Erotus lasketaan kalenteripäivinä, ei tunteina: kahden päivän päässä
   oleva takaraja on "2 pv aikaa" vaikka kello olisi jo yli. */
function deadlineLabel(iso) {
  if (!iso) return 'ei takarajaa'
  const end = new Date(iso)
  if (end.getTime() < Date.now()) return 'takaraja mennyt'
  const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((midnight(end) - midnight(new Date())) / 86400000)
  if (days <= 0) return 'tänään'
  if (days === 1) return 'huomiseen'
  return `${days} pv aikaa`
}

export default function ChallengesTab({ me }) {
  const toast = useToast()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const seq = useRef(0)

  const refresh = useCallback(async () => {
    if (!me.id) return
    const run = ++seq.current
    try {
      const rows = await loadChallenges(me.id)
      if (run !== seq.current) return
      setItems(rows)
      setError('')
    } catch (e) {
      if (run !== seq.current) return
      console.error('Haasteiden lataus epäonnistui:', e)
      setItems([])
      setError(e?.message ?? 'Tuntematon virhe')
    }
  }, [me.id])

  useEffect(() => { refresh() }, [refresh])

  /* Kuittaus näkyy heti ja perutaan jos kirjoitus kaatuu. */
  async function toggle(item) {
    if (busy) return
    setBusy(item.id)
    const before = items
    setItems(list => list.map(c => (c.id === item.id ? { ...c, done: !c.done } : c)))
    try {
      if (item.done) await uncompleteChallenge(item.id, me.id)
      else await completeChallenge(item.id, me.id)
      toast(item.done ? 'Kuittaus peruttu' : 'Kuitattu tehdyksi')
    } catch {
      setItems(before)
      toast('Kuittaus ei tallentunut')
    } finally {
      setBusy(null)
    }
  }

  const doneCount = items?.filter(c => c.done).length ?? 0

  return (
    <div style={S.stack}>
      {items === null && <div style={S.info}>Ladataan haasteita…</div>}

      {error && <div style={S.error}>Haasteita ei saatu ladattua.<div style={S.detail}>{error}</div></div>}

      {items?.length > 0 && (
        <div style={S.heading}>
          Avoimet haasteet
          <span style={S.headingMeta}>{doneCount}/{items.length} kuitattu</span>
        </div>
      )}

      {items?.length === 0 && !error && (
        <EmptyState
          emoji="🎯"
          title="Ei haasteita juuri nyt"
          body="Kun tiimi keksii seuraavan haasteen, se ilmestyy tähän. Sillä välin: kehu joku syötteessä."
        />
      )}

      {items?.map(item => (
        <article
          key={item.id}
          style={{
            ...S.card,
            background: item.done ? 'var(--brand-bg-2)' : '#FFFDF9',
            borderColor: item.done ? 'var(--brand-bg-2)' : '#EDE7DC'
          }}
        >
          <div style={S.cardHead}>
            <div style={S.deadline}>{deadlineLabel(item.deadline)}</div>
          </div>
          <h3 style={{ ...S.title, color: item.done ? 'var(--brand-deep)' : 'var(--ink)' }}>
            {item.title}
          </h3>
          <button
            onClick={() => toggle(item)}
            disabled={busy === item.id}
            style={{
              ...S.button,
              background: item.done ? 'var(--white)' : 'var(--brand)',
              color: item.done ? 'var(--brand-dark)' : 'var(--white)'
            }}
          >
            {item.done ? '✓ Kuitattu · peru' : 'Kuittaa tehdyksi'}
          </button>
        </article>
      ))}
    </div>
  )
}

const S = {
  stack: { padding: '0 var(--content-pad) 14px', display: 'flex', flexDirection: 'column', gap: 14 },
  info: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '18px 0' },
  error: {
    background: 'var(--red-bg-2)', color: 'var(--red-text)', borderRadius: 18,
    padding: 14, fontSize: 13, fontWeight: 600, lineHeight: 1.45
  },
  detail: { fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11, color: 'var(--red-text-2)', marginTop: 4 },
  heading: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flex: 'none'
  },
  headingMeta: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: 'var(--text-4)' },
  card: {
    borderRadius: 22, padding: 16, borderWidth: 1, borderStyle: 'solid',
    display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  cardHead: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' },
  deadline: { fontWeight: 600, fontSize: 11, color: 'var(--text-4)' },
  title: { fontWeight: 700, fontSize: 19, lineHeight: 1.3 },
  button: { borderRadius: 'var(--r-box)', padding: 14, textAlign: 'center', fontWeight: 700, fontSize: 14 }
}
