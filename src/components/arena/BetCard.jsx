import { initials } from '../../lib/supabase'
import { clockTime } from '../../lib/format'

/* Tulospalkin värit: A brändi, B keltainen. Skeema sallii 2–6
   vaihtoehtoa, joten lopuille on jatkosävyt. */
const BAR = ['var(--brand)', 'var(--yellow)', 'var(--accent)', 'var(--brand-on-light)', 'var(--red-text-2)', 'var(--yellow-text)']
const CHIP = [
  { label: 'var(--brand-dark)', bg: 'var(--brand-bg-2)', fg: 'var(--brand-deep)', avBg: 'var(--brand)', avFg: '#fff' },
  { label: 'var(--yellow-text)', bg: 'var(--yellow-bg)', fg: 'var(--yellow-dark)', avBg: 'var(--yellow)', avFg: 'var(--ink)' },
  { label: 'var(--red-text-2)', bg: 'var(--red-bg-2)', fg: 'var(--red-text)', avBg: 'var(--accent)', avFg: '#fff' },
  { label: 'var(--text-2)', bg: 'var(--sand-3)', fg: 'var(--text)', avBg: 'var(--text-3)', avFg: '#fff' }
]

function tag(bet) {
  if (bet.mine) return { text: 'OMA VETO', bg: 'var(--red-bg)', fg: 'var(--red-text-2)' }
  if (bet.closed) return { text: 'VETO · SULJETTU', bg: 'var(--sand-3)', fg: 'var(--text-2)' }
  if (bet.closesAt) return { text: `VETO · SULKEUTUU ${clockTime(bet.closesAt)}`, bg: 'var(--yellow-bg)', fg: 'var(--yellow-text)' }
  return { text: 'VETO · AVOINNA', bg: 'var(--brand-bg-2)', fg: 'var(--brand-dark)' }
}

export default function BetCard({ bet, myName, onVote, busy }) {
  const t = tag(bet)
  const locked = bet.voted || bet.closed
  const pct = i => (bet.total ? Math.round(((bet.counts[i] ?? 0) / bet.total) * 100) : 0)

  function optionStyle(i) {
    if (bet.myOption === i) return { background: 'var(--brand)', color: '#fff', borderColor: 'var(--brand)' }
    if (locked) return { background: 'var(--sand-3)', color: 'var(--text-4)', borderColor: 'var(--sand-3)' }
    return { background: '#FFFDF9', color: 'var(--text)', borderColor: '#DDD5C8' }
  }

  return (
    <article style={S.card}>
      <div style={S.head}>
        <div style={{ ...S.tag, background: t.bg, color: t.fg }}>{t.text}</div>
        <div style={{
          ...S.mode,
          background: bet.anonymous ? 'var(--sand-3)' : 'var(--brand-bg-2)',
          color: bet.anonymous ? 'var(--text-2)' : 'var(--brand-dark)'
        }}>
          {bet.anonymous ? '🕶 ANONYYMI' : '👀 JULKINEN'}
        </div>
      </div>

      <h3 style={S.question}>{bet.question}</h3>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {bet.options.map((label, i) => (
          <button
            key={i}
            style={{ ...S.option, ...optionStyle(i) }}
            disabled={locked || busy}
            onClick={() => onVote(bet, i)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={S.barTrack}>
        {bet.options.map((_, i) => (
          <div key={i} style={{ background: BAR[i % BAR.length], width: `${pct(i)}%` }} />
        ))}
      </div>

      <div style={S.barMeta}>
        <span>{bet.total ? `${pct(0)} % ${String(bet.options[0]).toLowerCase()}` : 'ei vielä ääniä'}</span>
        <span>{bet.total} {bet.total === 1 ? 'äänestäjä' : 'äänestäjää'}</span>
      </div>

      {bet.anonymous && (
        <Note icon="🕶" text="Anonyymi äänestys · vain kokonaistulos näkyy" />
      )}

      {!bet.anonymous && !bet.voted && (
        <Note icon="👀" text="Äänestä nähdäksesi kuka äänesti mitä" />
      )}

      {!bet.anonymous && bet.voted && bet.voters && (
        <div style={S.voters}>
          {bet.options.map((label, i) => {
            const c = CHIP[i % CHIP.length]
            // Oma ääni ensimmäisenä ja nimellä "Sinä".
            const names = [...(bet.voters[i] ?? [])].sort((a, b) =>
              (a === myName ? -1 : 0) - (b === myName ? -1 : 0))
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ ...S.sideLabel, color: c.label }}>{label}</div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {names.length === 0 && <div style={S.noVotes}>—</div>}
                  {names.map((name, k) => (
                    <div key={k} style={{ ...S.chip, background: c.bg }}>
                      {/* Avatarin väri seuraa vaihtoehtoa, ei henkilöä,
                          jotta puolet erottuvat toisistaan. */}
                      <div style={{ ...S.chipAvatar, background: c.avBg, color: c.avFg }}>
                        {initials(name)}
                      </div>
                      <span style={{ ...S.chipName, color: c.fg }}>
                        {name === myName ? 'Sinä' : name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}

function Note({ icon, text }) {
  return (
    <div style={S.note}>
      <div style={S.noteIcon}>{icon}</div>
      <div style={S.noteText}>{text}</div>
    </div>
  )
}

const S = {
  card: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  tag: {
    borderRadius: 'var(--r-pill)', padding: '6px 11px', fontWeight: 700, fontSize: 10,
    letterSpacing: '.06em', whiteSpace: 'nowrap'
  },
  mode: {
    borderRadius: 'var(--r-pill)', padding: '5px 10px', fontWeight: 700, fontSize: 10,
    letterSpacing: '.04em', whiteSpace: 'nowrap', flex: 'none'
  },
  question: { fontWeight: 700, fontSize: 20, lineHeight: 1.3, color: 'var(--ink)' },
  option: {
    flex: '1 1 120px', borderRadius: 'var(--r-box)', padding: 14, textAlign: 'center',
    fontWeight: 700, fontSize: 14, borderWidth: 1.5, borderStyle: 'solid'
  },
  barTrack: {
    height: 12, borderRadius: 'var(--r-pill)', background: 'var(--sand-3)',
    overflow: 'hidden', display: 'flex'
  },
  barMeta: {
    display: 'flex', justifyContent: 'space-between', gap: 8,
    fontWeight: 600, fontSize: 11, color: 'var(--text-2)'
  },
  note: {
    borderTop: '1px solid #EDE7DC', paddingTop: 11,
    display: 'flex', alignItems: 'center', gap: 8
  },
  noteIcon: {
    width: 26, height: 26, borderRadius: 13, background: 'var(--sand-3)', flex: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, lineHeight: 1
  },
  noteText: { fontWeight: 600, fontSize: 11.5, color: 'var(--text-4)' },
  voters: {
    borderTop: '1px solid #EDE7DC', paddingTop: 12,
    display: 'flex', flexDirection: 'column', gap: 10
  },
  sideLabel: { width: 74, flex: 'none', fontWeight: 700, fontSize: 11, paddingTop: 5 },
  noVotes: { fontWeight: 600, fontSize: 11, color: 'var(--text-4)', paddingTop: 5 },
  chip: {
    display: 'flex', alignItems: 'center', gap: 5,
    borderRadius: 'var(--r-pill)', padding: '4px 9px 4px 4px'
  },
  chipAvatar: {
    width: 22, height: 22, borderRadius: 11, flex: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 9
  },
  chipName: { fontWeight: 600, fontSize: 11 }
}
