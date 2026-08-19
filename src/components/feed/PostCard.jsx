import { useState } from 'react'
import Avatar from '../Avatar'
import AddReaction from '../icons/AddReaction'
import { timeAgo } from '../../lib/format'

const EXTRA_EMOJI = ['❤️', '🎉', '👏', '🔥', '😂', '🙌', '☕', '💡', '🤯', '🫶']

export default function PostCard({ post, onToggleReaction, onOpenComments }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const emojis = Object.keys(post.reactions).filter(e => post.reactions[e] > 0)

  function react(emoji) {
    setPickerOpen(false)
    onToggleReaction(post, emoji)
  }

  return (
    <article style={S.card}>
      <button style={S.tapArea} onClick={() => onOpenComments(post)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={post.authorName} seed={post.authorId} size={38} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <div style={S.name}>{post.authorName}</div>
            <div style={S.meta}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        <div style={S.body}>{post.body}</div>
      </button>

      <div style={S.reactRow}>
        {emojis.map(emoji => {
          const on = post.mine.includes(emoji)
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              aria-pressed={on}
              style={{
                ...S.chip,
                background: on ? 'var(--brand-bg-2)' : '#FFFDF9',
                color: on ? 'var(--brand-dark)' : 'var(--text-2)',
                border: `1.5px solid ${on ? 'var(--brand)' : '#EDE7DC'}`
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{emoji}</span>
              {post.reactions[emoji]}
            </button>
          )
        })}
        <button
          style={{
            ...S.plain,
            display: 'flex', alignItems: 'center',
            background: pickerOpen ? 'var(--brand-bg-2)' : 'var(--sand-3)',
            color: pickerOpen ? 'var(--brand-dark)' : 'var(--text-2)'
          }}
          onClick={() => setPickerOpen(o => !o)}
          aria-label="Lisää reaktio"
          aria-expanded={pickerOpen}
        >
          <AddReaction />
        </button>
        <button
          style={{ ...S.plain, marginLeft: 'auto' }}
          onClick={() => onOpenComments(post)}
          aria-label="Kommentit"
        >
          💬 {post.comments}
        </button>
      </div>

      {pickerOpen && (
        <div style={S.picker}>
          {EXTRA_EMOJI.map(emoji => (
            <button key={emoji} style={S.pickerTile} onClick={() => react(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

const S = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 14,
    display: 'flex', flexDirection: 'column', gap: 10, flex: 'none'
  },
  tapArea: {
    display: 'flex', flexDirection: 'column', gap: 10, padding: 0, textAlign: 'left', width: '100%'
  },
  name: { fontWeight: 700, fontSize: 14, color: 'var(--ink)' },
  meta: { fontWeight: 500, fontSize: 11, color: 'var(--text-4)' },
  body: { fontWeight: 500, fontSize: 14.5, lineHeight: 1.5, color: 'var(--text)', whiteSpace: 'pre-wrap' },
  reactRow: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: {
    borderRadius: 'var(--r-pill)', padding: '8px 12px', fontWeight: 700, fontSize: 12,
    display: 'flex', alignItems: 'center', gap: 6
  },
  plain: {
    background: 'var(--sand-3)', color: 'var(--text-2)', borderRadius: 'var(--r-pill)',
    padding: '8px 12px', fontWeight: 700, fontSize: 12
  },
  picker: {
    background: '#F7F2E9', border: '1px solid var(--border-card)', borderRadius: 20,
    padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6
  },
  pickerTile: {
    width: 38, height: 38, borderRadius: 'var(--r-tile)', background: 'var(--white)',
    border: '1px solid #EDE7DC', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 19, lineHeight: 1
  }
}
