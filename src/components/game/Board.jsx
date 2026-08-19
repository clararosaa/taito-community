/* 6×5 lauta. Merkinnät tulevat palvelimelta: g = oikein,
   y = väärä paikka, x = ei sanassa. */
export const TILE = {
  g: { background: 'var(--brand)',  color: 'var(--white)', borderColor: 'var(--brand)' },
  y: { background: 'var(--yellow)', color: 'var(--ink)',   borderColor: 'var(--yellow)' },
  x: { background: 'var(--text-4)', color: 'var(--white)', borderColor: 'var(--text-4)' }
}
const EMPTY  = { background: '#F5F1EA', color: 'var(--ink)', borderColor: '#F5F1EA' }
const TYPING = { background: 'var(--white)', color: 'var(--ink)', borderColor: 'var(--brand)' }

export default function Board({ guesses, current, rows = 6, cols = 5 }) {
  return (
    <div style={S.board}>
      {Array.from({ length: rows }, (_, r) => {
        const guess = guesses[r]
        const active = !guess && r === guesses.length
        return (
          <div key={r} style={S.row}>
            {Array.from({ length: cols }, (_, c) => {
              const ch = guess ? guess.word[c] : active ? (current[c] ?? '') : ''
              const style = guess ? TILE[guess.marks[c]] ?? EMPTY : ch ? TYPING : EMPTY
              return <div key={c} style={{ ...S.tile, ...style }}>{ch}</div>
            })}
          </div>
        )
      })}
    </div>
  )
}

const S = {
  /* Suunniteltu korkeus on 322px, mutta lauta joustaa alaspäin matalilla
     ruuduilla. Muuten näppäimistön alarivi jää alanavigaation alle. */
  board: {
    display: 'grid', gridTemplateRows: 'repeat(6, minmax(0, 1fr))', gap: 7,
    width: '100%', maxWidth: 272, maxHeight: 322, minHeight: 0,
    flex: '0 1 322px', marginTop: 2
  },
  row: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 7, minHeight: 0 },
  tile: {
    borderRadius: 'var(--r-tile)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 23, letterSpacing: '.01em',
    borderWidth: 2, borderStyle: 'solid', minHeight: 0, overflow: 'hidden'
  }
}
