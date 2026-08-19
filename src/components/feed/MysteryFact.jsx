import { useEffect, useState } from 'react'
import Avatar from '../Avatar'
import { castVote, cardVoters } from '../../lib/supabase'
import { factAnswerIndex, guessTally } from '../../lib/feed'
import { firstName, readJSON, writeJSON } from '../../lib/format'
import { useToast } from '../../lib/toast'

const storeKey = cardId => `ws.fact.${cardId}`

export default function MysteryFact({ card, myName }) {
  const toast = useToast()
  const saved = readJSON(storeKey(card.id))
  const [open, setOpen] = useState(false)
  const [guess, setGuess] = useState(saved?.index ?? null)
  const [answer, setAnswer] = useState(null)
  const [tally, setTally] = useState({ voters: null, members: null })
  const [busy, setBusy] = useState(false)

  const locked = card.voted || guess !== null

  useEffect(() => {
    guessTally(card.id).then(setTally).catch(() => {})
  }, [card.id])

  /* Oikea vastaus haetaan vasta lukituksen jälkeen. Jos arvaus on tehty
     toisella laitteella, oma valinta etsitään julkisen kortin
     äänestäjälistalta. */
  useEffect(() => {
    if (!locked) return
    let alive = true
    factAnswerIndex(card.id).then(i => alive && setAnswer(i)).catch(() => {})
    if (guess === null) {
      cardVoters(card.id)
        .then(rows => {
          const own = rows.find(r => r.voter_name === myName)
          if (alive && own) setGuess(own.option_index)
        })
        .catch(() => {})
    }
    return () => { alive = false }
  }, [locked, card.id, guess, myName])

  async function pick(index) {
    if (locked || busy) return
    setBusy(true)
    try {
      await castVote(card.id, index)
      setGuess(index)
      writeJSON(storeKey(card.id), { index })
      setTally(t => ({ ...t, voters: t.voters === null ? null : t.voters + 1 }))
    } catch {
      toast('Arvaus ei mennyt läpi')
    } finally {
      setBusy(false)
    }
  }

  const options = card.options
  const correctName = answer !== null ? options[answer] : null
  const correct = guess !== null && answer !== null && guess === answer

  return (
    <section style={S.card}>
      <div style={S.head}>
        <div style={S.badge}>KENEN FAKTA?</div>
        <div style={S.meta}>uusi fakta huomenna 9.00</div>
      </div>

      <div style={S.fact}>{`”${card.body.replace(/^[”"]|[”"]$/g, '')}”`}</div>

      {!locked && !open && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={S.pill} onClick={() => setOpen(true)}>Arvaa kuka</button>
          <div style={S.count}>
            {tally.voters !== null && tally.members
              ? `${tally.voters}/${tally.members} on jo arvannut`
              : 'arvaus lukittuu heti'}
          </div>
        </div>
      )}

      {!locked && open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={S.row}>
            <div style={S.rowLabel}>Valitse yksi · vastaus heti</div>
            <button style={S.later} onClick={() => setOpen(false)}>Myöhemmin</button>
          </div>
          <div style={S.grid}>
            {options.map((name, i) => (
              <button key={i} style={S.person} disabled={busy} onClick={() => pick(i)}>
                <Avatar name={name} size={30} />
                <span style={S.personName}>{firstName(name)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {locked && (
        <div style={{
          ...S.result,
          background: correct ? 'var(--brand-bg)' : 'var(--red-bg-2)'
        }}>
          <div style={{ fontSize: 20, lineHeight: 1 }}>{correct ? '🎉' : '🙈'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 14,
              color: correct ? 'var(--brand-deep)' : 'var(--red-text)'
            }}>
              {answer === null ? 'Arvaus lukittu' : correct ? 'Oikein!' : 'Ei osunut tällä kertaa'}
            </div>
            <div style={{
              fontWeight: 500, fontSize: 12, lineHeight: 1.4,
              color: correct ? 'var(--brand-deep)' : 'var(--red-text)'
            }}>
              {answer === null
                ? 'Oikea vastaus paljastuu hetken kuluttua.'
                : correct
                  ? `${correctName} on tämän faktan takana.`
                  : `Oikea vastaus oli ${correctName}.`}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

const S = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 18,
    display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  badge: {
    background: 'var(--accent)', color: 'var(--white)', borderRadius: 'var(--r-pill)',
    padding: '6px 12px', fontWeight: 700, fontSize: 10, letterSpacing: '.08em',
    whiteSpace: 'nowrap', flex: 'none'
  },
  meta: {
    fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 11, color: 'var(--text-4)',
    textAlign: 'right', lineHeight: 1.3
  },
  fact: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.32,
    color: 'var(--ink)', textWrap: 'pretty'
  },
  pill: {
    background: 'var(--ink)', color: '#FFFDF9', borderRadius: 'var(--r-pill)',
    padding: '12px 18px', fontWeight: 700, fontSize: 13, flex: 'none'
  },
  count: { fontWeight: 500, fontSize: 12, color: 'var(--text-4)' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  rowLabel: { fontWeight: 700, fontSize: 12, color: 'var(--text-2)' },
  later: { fontWeight: 700, fontSize: 12, color: 'var(--text-4)', padding: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 },
  person: {
    borderRadius: 'var(--r-box)', padding: '9px 10px', display: 'flex', alignItems: 'center',
    gap: 8, background: 'var(--sand-1)', border: '1.5px solid var(--border-1)', minWidth: 0
  },
  personName: {
    flex: 1, minWidth: 0, textAlign: 'left', fontWeight: 700, fontSize: 12.5,
    color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  result: { borderRadius: 18, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }
}
