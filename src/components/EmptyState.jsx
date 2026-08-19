export default function EmptyState({ emoji, title, body, action, onAction }) {
  return (
    <div style={S.wrap}>
      <div style={{ fontSize: 38 }}>{emoji}</div>
      <h3 style={S.title}>{title}</h3>
      <p style={S.body}>{body}</p>
      {action && <button style={S.btn} onClick={onAction}>{action}</button>}
    </div>
  )
}

const S = {
  wrap: {
    margin: '0 var(--content-pad)', padding: '34px 24px',
    background: 'var(--white)', borderRadius: 'var(--r-card)',
    border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)',
    textAlign: 'center', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)' },
  body: { margin: 0, fontSize: 13.5, color: 'var(--text-2)', maxWidth: 260, lineHeight: 1.5 },
  btn: {
    marginTop: 8, padding: '12px 22px', borderRadius: 'var(--r-box)',
    background: 'var(--brand)', color: 'var(--white)', fontWeight: 700, fontSize: 13.5
  }
}
