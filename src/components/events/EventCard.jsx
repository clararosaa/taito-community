import { dayBadge, eventTime } from '../../lib/format'

export default function EventCard({ event, isMine, onDelete, busy }) {
  const badge = dayBadge(event.startsAt)

  return (
    <article style={S.card}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={S.badge}>
          <div style={S.badgeDay}>{badge.day}</div>
          <div style={S.badgeMonth}>{badge.month}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h3 style={S.title}>{event.title}</h3>
          <div style={S.when}>{eventTime(event.startsAt)}</div>
          {event.location && <div style={S.where}>📍 {event.location}</div>}
        </div>
      </div>

      {event.description && <p style={S.description}>{event.description}</p>}

      <div style={S.foot}>
        <span style={S.author}>Lisäsi {event.authorName}</span>
        {isMine && (
          <button style={S.delete} disabled={busy} onClick={() => onDelete(event)}>
            Poista
          </button>
        )}
      </div>
    </article>
  )
}

const S = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  badge: {
    width: 54, flex: 'none', borderRadius: 18, padding: '8px 4px',
    background: 'var(--brand-bg)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 1
  },
  badgeDay: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--brand-deep)', lineHeight: 1 },
  badgeMonth: { fontWeight: 600, fontSize: 10, color: 'var(--brand-on-light)' },
  title: { fontWeight: 700, fontSize: 19, lineHeight: 1.25, color: 'var(--ink)' },
  when: { fontWeight: 600, fontSize: 12, color: 'var(--text-2)' },
  where: { fontWeight: 500, fontSize: 12, color: 'var(--text-3)' },
  description: {
    margin: 0, fontWeight: 500, fontSize: 13.5, lineHeight: 1.45,
    color: 'var(--text)', whiteSpace: 'pre-wrap'
  },
  foot: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, borderTop: '1px solid #EDE7DC', paddingTop: 10
  },
  author: { fontWeight: 500, fontSize: 11, color: 'var(--text-4)' },
  delete: { fontWeight: 700, fontSize: 11, color: 'var(--red-text-2)', padding: 0 }
}
