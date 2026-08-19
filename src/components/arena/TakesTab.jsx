import { useCallback, useEffect, useRef, useState } from 'react'
import EmptyState from '../EmptyState'
import { castVote } from '../../lib/supabase'
import { loadTakes, createTake, rememberVote } from '../../lib/arena'
import { useToast } from '../../lib/toast'

export default function TakesTab({ me }) {
  const toast = useToast()
  const [takes, setTakes] = useState(null)
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const newTakeRef = useRef(null)
  const seq = useRef(0)

  const refresh = useCallback(async (keepIndex = true) => {
    if (!me.id) return
    const run = ++seq.current
    try {
      // Vanhin ensin, jotta "VÄITE n/m" etenee luonnollisessa
      // järjestyksessä.
      const rows = (await loadTakes(me)).reverse()
      if (run !== seq.current) return
      setTakes(rows)
      setError('')
      if (!keepIndex) {
        const first = rows.findIndex(t => !t.voted)
        setIndex(first > -1 ? first : 0)
      }
    } catch (e) {
      if (run !== seq.current) return
      console.error('Väitteiden lataus epäonnistui:', e)
      setTakes([])
      setError(e?.message ?? 'Tuntematon virhe')
    }
  }, [me])

  useEffect(() => { refresh(false) }, [refresh])

  const current = takes?.[Math.min(index, (takes?.length ?? 1) - 1)] ?? null
  const votedCount = takes?.filter(t => t.voted).length ?? 0
  const allDone = !!takes?.length && votedCount === takes.length
  const nextUnvoted = takes?.findIndex((t, i) => !t.voted && i !== index) ?? -1

  async function vote(optionIndex) {
    if (!current || current.voted || busy) return
    setBusy(true)
    try {
      await castVote(current.id, optionIndex)
      rememberVote(current.id, optionIndex)
      await refresh()
    } catch {
      toast('Ääni ei mennyt läpi')
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    const q = text.trim()
    if (!q || busy) return
    setBusy(true)
    try {
      await createTake(q, me.id)
      setText('')
      await refresh(false)
      toast('Väite julkaistu')
    } catch {
      toast('Julkaisu ei onnistunut')
    } finally {
      setBusy(false)
    }
  }

  const total = current?.total ?? 0
  const agree = current?.counts?.[0] ?? 0
  const agreePct = total ? Math.round((agree / total) * 100) : 0
  const myTake = current?.myOption ?? null
  const voted = !!current?.voted

  return (
    <div style={S.stack}>
      {takes === null && <div style={S.info}>Ladataan väitteitä…</div>}

      {error && <div style={S.error}>Väitteitä ei saatu ladattua.<div style={S.detail}>{error}</div></div>}

      {allDone && (
        <section style={S.doneCard}>
          <div style={{ fontSize: 38, lineHeight: 1 }}>🎉</div>
          <h3 style={S.doneTitle}>Kaikki väitteet äänestetty!</h3>
          <p style={S.doneBody}>
            Äänestit {takes.length} {takes.length === 1 ? 'väitteen' : 'väitettä'}. Uudet väitteet
            tulevat huomenna — tai heitä oma nyt.
          </p>
        </section>
      )}

      {takes?.length === 0 && !error && (
        <EmptyState
          emoji="🌶"
          title="Yksikään väite ei ole vielä tulessa"
          body="Heitä ensimmäinen hot take. Äänet ovat anonyymejä, joten rehellisyys on turvallista."
          action="Kirjoita väite"
          onAction={() => newTakeRef.current?.focus()}
        />
      )}

      {current && !allDone && (
        <>
          <section style={S.takeCard}>
            <div style={S.takeHead}>
              <div style={S.counter}>VÄITE {index + 1}/{takes.length}</div>
              <div style={S.author}>{current.mine ? 'OMA VÄITTEESI' : 'ANONYYMI ÄÄNI'}</div>
            </div>
            <h3 style={S.takeText}>{current.question}</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {current.options.slice(0, 2).map((label, i) => {
                const picked = myTake === i
                return (
                  <button
                    key={i}
                    disabled={voted || busy}
                    onClick={() => vote(i)}
                    style={{
                      ...S.takeBtn,
                      background: picked ? 'var(--ink)' : voted ? 'rgba(255,255,255,.45)' : (i === 0 ? 'var(--ink)' : '#FFFDF9'),
                      color: picked ? 'var(--yellow)' : voted ? 'var(--yellow-dark)' : (i === 0 ? '#FFFDF9' : 'var(--text)')
                    }}
                  >
                    {i === 0 ? '👍' : '👎'} {label}
                  </button>
                )
              })}
            </div>
          </section>

          <section style={S.resultCard}>
            <div style={S.resultTitle}>
              {voted ? 'Reaaliaikainen tulos' : 'Äänestä nähdäksesi tuloksen'}
            </div>
            <div style={S.resultTrack}>
              <div style={{ background: 'var(--brand)', width: voted ? `${agreePct}%` : '0%' }} />
              <div style={{ background: 'var(--accent)', width: voted ? `${100 - agreePct}%` : '0%' }} />
            </div>
            <div style={S.resultMeta}>
              <span>{voted ? `${agreePct} % samaa mieltä` : '—'}</span>
              <span>{voted ? `${100 - agreePct} %` : '—'}</span>
            </div>
          </section>

          <button
            disabled={nextUnvoted < 0}
            onClick={() => setIndex(nextUnvoted)}
            style={{
              ...S.next,
              background: voted && nextUnvoted > -1 ? 'var(--ink)' : 'var(--sand-3)',
              color: voted && nextUnvoted > -1 ? '#FFFDF9' : 'var(--text-4)'
            }}
          >
            {nextUnvoted > -1 ? 'Seuraava väite →' : 'Äänestä tämä ensin'}
          </button>
        </>
      )}

      <section style={S.newCard}>
        <h3 style={S.newTitle}>Heitä oma hot take</h3>
        <input
          ref={newTakeRef}
          style={S.input}
          value={text}
          maxLength={300}
          placeholder="Väite, josta tiimi on eri mieltä…"
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') publish() }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            style={{ ...S.publish, opacity: text.trim() && !busy ? 1 : 0.5 }}
            disabled={!text.trim() || busy}
            onClick={publish}
          >
            Julkaise väite
          </button>
          <div style={S.newHint}>Äänestys on anonyymi · äänestäjiä ei tallenneta</div>
        </div>
      </section>
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

  doneCard: {
    background: 'var(--brand)', borderRadius: 28, padding: '24px 20px',
    display: 'flex', flexDirection: 'column', gap: 14, flex: 'none',
    boxShadow: '0 10px 26px rgba(0,154,72,.28)'
  },
  doneTitle: { fontWeight: 800, fontSize: 28, lineHeight: 1.15, color: 'var(--white)', textWrap: 'pretty' },
  doneBody: { margin: 0, fontWeight: 500, fontSize: 14, lineHeight: 1.5, color: '#DFF3E6' },

  takeCard: {
    background: 'var(--yellow)', borderRadius: 28, padding: '24px 20px',
    display: 'flex', flexDirection: 'column', gap: 18, flex: 'none',
    boxShadow: '0 10px 26px rgba(255,197,61,.32)'
  },
  takeHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  counter: {
    background: 'var(--ink)', color: 'var(--yellow)', borderRadius: 'var(--r-pill)',
    padding: '6px 12px', fontWeight: 700, fontSize: 10, letterSpacing: '.08em'
  },
  author: { fontWeight: 700, fontSize: 11, color: 'var(--yellow-dark)' },
  takeText: { fontWeight: 800, fontSize: 30, lineHeight: 1.2, color: 'var(--ink)', textWrap: 'pretty' },
  takeBtn: { flex: 1, borderRadius: 20, padding: 18, textAlign: 'center', fontWeight: 700, fontSize: 15 },

  resultCard: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 10, flex: 'none'
  },
  resultTitle: { fontWeight: 700, fontSize: 13, color: 'var(--text)' },
  resultTrack: {
    height: 16, borderRadius: 'var(--r-pill)', background: 'var(--sand-3)',
    overflow: 'hidden', display: 'flex'
  },
  resultMeta: { display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 12, color: 'var(--text-2)' },

  next: { borderRadius: 'var(--r-pill)', padding: 15, textAlign: 'center', fontWeight: 700, fontSize: 14, flex: 'none' },

  newCard: {
    background: 'var(--ink)', borderRadius: 22, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 10, flex: 'none'
  },
  newTitle: { fontWeight: 700, fontSize: 16, color: '#FFFDF9' },
  input: {
    background: 'var(--ink-2)', border: 'none', outline: 'none', borderRadius: 14,
    padding: 12, fontWeight: 500, fontSize: 13, color: '#FFFDF9'
  },
  publish: {
    background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 'var(--r-pill)',
    padding: '12px 18px', fontWeight: 700, fontSize: 13
  },
  newHint: { fontWeight: 500, fontSize: 11.5, color: 'var(--text-3)' }
}
