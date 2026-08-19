/* Suomalainen näppäimistö: Ö ja Ä mukana keskirivin lopussa. */
const ROWS = ['QWERTYUIOP', 'ASDFGHJKLÖÄ', 'ZXCVBNM']

const RANK = { g: 3, y: 2, x: 1 }
const STATE = {
  g: { background: 'var(--brand)',  color: 'var(--white)' },
  y: { background: 'var(--yellow)', color: 'var(--ink)' },
  x: { background: 'var(--text-4)', color: 'var(--white)' }
}
const IDLE = { background: 'var(--sand-3)', color: 'var(--ink)' }

/* Kirjaimen paras osumatila kaikista arvauksista. */
export function keyStates(guesses) {
  const best = {}
  for (const g of guesses) {
    for (let i = 0; i < g.word.length; i++) {
      const ch = g.word[i]
      const mark = g.marks[i]
      if (!best[ch] || RANK[mark] > RANK[best[ch]]) best[ch] = mark
    }
  }
  return best
}

export default function Keyboard({ guesses, disabled, onKey }) {
  const states = keyStates(guesses)

  const key = (ch, flex, style, label) => (
    <button
      key={ch}
      style={{ ...S.key, flex, ...style, opacity: disabled ? 0.55 : 1 }}
      disabled={disabled}
      onClick={() => onKey(ch)}
      aria-label={label ?? ch}
    >
      {ch}
    </button>
  )

  return (
    <div style={S.wrap}>
      {ROWS.slice(0, 2).map(row => (
        <div key={row} style={S.row}>
          {row.split('').map(ch => key(ch, 1, STATE[states[ch]] ?? IDLE))}
        </div>
      ))}
      <div style={S.row}>
        {key('⌫', 1.6, { background: '#DDD5C8', color: 'var(--text)' }, 'Poista kirjain')}
        {ROWS[2].split('').map(ch => key(ch, 1, STATE[states[ch]] ?? IDLE))}
        {key('⏎', 1.6, { background: 'var(--ink)', color: '#FFFDF9' }, 'Vahvista arvaus')}
      </div>
    </div>
  )
}

const S = {
  wrap: { width: '100%', display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto', flex: 'none' },
  row: { display: 'flex', gap: 4, justifyContent: 'center' },
  key: {
    minWidth: 0, borderRadius: 9, padding: '14px 0', textAlign: 'center',
    fontWeight: 700, fontSize: 15, userSelect: 'none',
    boxShadow: '0 1px 0 rgba(30,27,23,.08)'
  }
}
