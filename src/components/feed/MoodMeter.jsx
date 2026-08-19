import { useState } from 'react'
import { castVote } from '../../lib/supabase'
import { dayKey, readJSON, writeJSON } from '../../lib/format'
import { useToast } from '../../lib/toast'

/* Emojin selite. Kortin options tulee tietokannasta, joten tunnistamme
   emojin ja näytämme sille suomenkielisen sanan. */
const LABELS = {
  '😩': 'Rankka', '😪': 'Väsy', '😐': 'Ok', '😄': 'Hyvä', '🤩': 'Huippu',
  '🙂': 'Menee', '😕': 'Nihkeä', '😴': 'Väsy', '😊': 'Hyvä'
}

const storeKey = () => `ws.mood.${dayKey()}`

export default function MoodMeter({ card, onVoted }) {
  const toast = useToast()
  const saved = readJSON(storeKey())
  const [picked, setPicked] = useState(saved?.card === card.id ? saved.index : null)
  const [busy, setBusy] = useState(false)
  const voted = card.voted || picked !== null

  async function pick(index) {
    if (voted || busy) return
    setBusy(true)
    try {
      await castVote(card.id, index)
      setPicked(index)
      writeJSON(storeKey(), { card: card.id, index })
      onVoted?.()
    } catch (e) {
      // Tuplaääni tulee tänne jos vastaus on annettu toisella laitteella.
      if (String(e.message).includes('duplicate') || e.code === '23505') {
        setPicked(null)
        onVoted?.()
        toast('Olet jo vastannut tänään')
      } else {
        toast('Vastaus ei mennyt läpi')
      }
    } finally {
      setBusy(false)
    }
  }

  const options = Array.isArray(card.options) ? card.options : []

  return (
    <section style={S.card}>
      <div style={S.head}>
        <h2 style={S.title}>{voted ? 'Kiitos, merkitty!' : (card.question || 'Miten menee tänään?')}</h2>
        <div style={S.hint}>{voted ? 'ei vaihdettavissa' : '1 klikkaus'}</div>
      </div>
      <div style={{ ...S.grid, gridTemplateColumns: `repeat(${options.length || 5}, 1fr)` }}>
        {options.map((emoji, i) => {
          const selected = picked === i
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={voted || busy}
              aria-pressed={selected}
              aria-label={LABELS[emoji] ?? `Vaihtoehto ${i + 1}`}
              style={{ ...S.col, cursor: voted ? 'default' : 'pointer' }}
            >
              <div style={{
                ...S.tile,
                background: selected ? 'var(--brand)' : 'var(--white)',
                boxShadow: selected ? 'var(--shadow-brand)' : '0 1px 2px rgba(30,27,23,.04)',
                filter: voted && !selected ? 'grayscale(1) opacity(.45)' : 'none'
              }}>
                {emoji}
              </div>
              <div style={{
                ...S.label,
                fontWeight: selected ? 700 : 600,
                color: selected ? 'var(--brand-deep)' : 'var(--brand-on-light)'
              }}>
                {LABELS[emoji] ?? ''}
              </div>
            </button>
          )
        })}
      </div>
      <div style={S.foot}>Vastaus on anonyymi eikä tuloksia näytetä kenellekään.</div>
    </section>
  )
}

const S = {
  card: {
    background: 'var(--brand-bg)', borderRadius: 'var(--r-card)', padding: '18px 16px',
    display: 'flex', flexDirection: 'column', gap: 14, flex: 'none'
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { fontWeight: 700, fontSize: 19, color: 'var(--brand-deep)' },
  hint: { fontWeight: 600, fontSize: 11, color: 'var(--brand-on-light)', whiteSpace: 'nowrap' },
  grid: { display: 'grid', gap: 8 },
  col: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 0 },
  tile: {
    width: '100%', aspectRatio: '1', borderRadius: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, lineHeight: 1, transition: 'background .15s, filter .15s'
  },
  label: { fontSize: 10 },
  foot: { fontWeight: 500, fontSize: 10.5, color: 'var(--brand-on-light)', marginTop: -4 }
}
