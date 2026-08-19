import { useEffect, useRef, useState } from 'react'
import Sheet from '../Sheet'
import Avatar from '../Avatar'
import { loadComments, createComment, deleteComment } from '../../lib/feed'
import { timeAgo } from '../../lib/format'
import { useToast } from '../../lib/toast'

const MAX = 1000

/* Kommenttinäkymä. Ei ole prototyypissä — rakennettu postauskortin
   tyylillä ja samoilla tokeneilla kuin muut drawerit. */
export default function CommentSheet({ post, me, onClose, onCountChange }) {
  const toast = useToast()
  const [comments, setComments] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const listEnd = useRef(null)

  useEffect(() => {
    let alive = true
    loadComments(post.id)
      .then(rows => alive && setComments(rows))
      .catch(() => alive && setComments([]))
    return () => { alive = false }
  }, [post.id])

  function report(rows) {
    setComments(rows)
    onCountChange(post.id, rows.length)
  }

  async function send() {
    const body = text.trim()
    if (!body || busy) return
    setBusy(true)
    try {
      await createComment(post.id, body.slice(0, MAX), me.id)
      const rows = await loadComments(post.id)
      report(rows)
      setText('')
      requestAnimationFrame(() => listEnd.current?.scrollIntoView({ behavior: 'smooth' }))
    } catch {
      toast('Kommentti ei mennyt läpi')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    try {
      await deleteComment(id)
      report(comments.filter(c => c.id !== id))
      toast('Kommentti poistettu')
    } catch {
      toast('Poisto ei onnistunut')
    }
  }

  const ready = text.trim().length > 0 && !busy

  return (
    <Sheet
      title="Kommentit"
      subtitle={comments ? `${comments.length} kpl` : 'ladataan…'}
      onClose={onClose}
      footer={
        <div style={S.inputRow}>
          <Avatar name={me.name} seed={me.id} size={32} />
          <input
            style={S.input}
            value={text}
            maxLength={MAX}
            placeholder="Kirjoita kommentti…"
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
          />
          <button
            onClick={send}
            disabled={!ready}
            style={{
              ...S.send,
              background: ready ? 'var(--brand)' : '#E7DFD2',
              color: ready ? 'var(--white)' : 'var(--text-4)'
            }}
          >
            Lähetä
          </button>
        </div>
      }
    >
      <div style={S.original}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={post.authorName} seed={post.authorId} size={30} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={S.origName}>{post.authorName}</div>
            <div style={S.time}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={S.origBody}>{post.body}</div>
      </div>

      {comments === null && <div style={S.info}>Ladataan kommentteja…</div>}

      {comments?.length === 0 && (
        <div style={S.empty}>
          <div style={{ fontSize: 30 }}>💬</div>
          <div style={S.emptyTitle}>Ei vielä kommentteja</div>
          <div style={S.emptyBody}>Ole ensimmäinen — lyhytkin kannustus riittää.</div>
        </div>
      )}

      {comments?.map(c => (
        <div key={c.id} style={S.comment}>
          <Avatar name={c.authorName} seed={c.authorId} size={30} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={S.name}>{c.authorName}</div>
              <div style={S.time}>{timeAgo(c.createdAt)}</div>
              {c.authorId === me.id && (
                <button style={S.delete} onClick={() => remove(c.id)}>Poista</button>
              )}
            </div>
            <div style={S.text}>{c.body}</div>
          </div>
        </div>
      ))}
      <div ref={listEnd} />
    </Sheet>
  )
}

const S = {
  original: {
    background: 'var(--sand-1)', border: '1px solid var(--border-card)', borderRadius: 18,
    padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14
  },
  origName: { fontWeight: 700, fontSize: 13, color: 'var(--ink)' },
  origBody: { fontWeight: 500, fontSize: 13.5, lineHeight: 1.45, color: 'var(--text)', whiteSpace: 'pre-wrap' },
  comment: { display: 'flex', gap: 10, padding: '10px 2px', alignItems: 'flex-start' },
  name: { fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' },
  time: { fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 10, color: 'var(--text-4)' },
  delete: { marginLeft: 'auto', fontWeight: 700, fontSize: 11, color: 'var(--red-text-2)', padding: 0 },
  text: { fontWeight: 500, fontSize: 13.5, lineHeight: 1.45, color: 'var(--text)', whiteSpace: 'pre-wrap' },
  info: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '18px 0' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '26px 20px', textAlign: 'center'
  },
  emptyTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' },
  emptyBody: { fontSize: 13, color: 'var(--text-2)', maxWidth: 240, lineHeight: 1.45 },
  inputRow: { display: 'flex', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 'var(--r-box)',
    border: '1px solid var(--border-2)', background: 'var(--sand-1)',
    fontSize: 14, outline: 'none'
  },
  send: {
    borderRadius: 'var(--r-pill)', padding: '11px 15px', fontWeight: 700, fontSize: 12.5,
    flex: 'none', whiteSpace: 'nowrap'
  }
}
