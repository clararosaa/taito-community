import Sheet from '../Sheet'
import { initials } from '../../lib/supabase'
import { clockTime } from '../../lib/format'

const shortName = name => {
  const [first, last] = name.trim().split(/\s+/)
  return last ? `${first} ${last[0]}.` : first
}

export default function LeaderboardSheet({ rows, meId, changesAt, onClose }) {
  const first = [...rows].sort((a, b) => a.completedAt.localeCompare(b.completedAt))[0]
  const fewest = rows[0] // rows on jo järjestetty yritykset → aika

  return (
    <Sheet
      title="Päivän tulostaulu"
      subtitle={`${rows.length} ${rows.length === 1 ? 'kollega ratkaissut' : 'kollegaa ratkaissut'} · sana vaihtuu klo ${changesAt}`}
      onClose={onClose}
    >
      {rows.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 30 }}>🏆</div>
          <div style={S.emptyTitle}>Kukaan ei ole vielä ratkaissut</div>
          <div style={S.emptyBody}>Ensimmäinen nimi tässä listassa voi olla sinun.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, paddingTop: 2 }}>
            <div style={{ ...S.highlight, background: 'var(--brand-bg-2)' }}>
              <div style={{ ...S.highlightLabel, color: 'var(--brand-on-light)' }}>ENSIMMÄINEN</div>
              <div style={{ ...S.highlightName, color: 'var(--brand-deep)' }}>{shortName(first.name)}</div>
              <div style={{ ...S.highlightMeta, color: 'var(--brand-on-light)' }}>klo {clockTime(first.completedAt)}</div>
            </div>
            <div style={{ ...S.highlight, background: 'var(--yellow-bg)' }}>
              <div style={{ ...S.highlightLabel, color: 'var(--yellow-text)' }}>VÄHIMMILLÄ YRITYKSILLÄ</div>
              <div style={{ ...S.highlightName, color: 'var(--yellow-dark)' }}>{shortName(fewest.name)}</div>
              <div style={{ ...S.highlightMeta, color: 'var(--yellow-text)' }}>{fewest.attempts} yritystä</div>
            </div>
          </div>

          <div style={S.list}>
            {rows.map((r, i) => {
              const me = r.userId === meId
              const good = r.attempts <= 3
              return (
                <div key={r.userId} style={{ ...S.row, background: me ? 'var(--brand-bg-2)' : '#FFFDF9' }}>
                  <div style={S.rank}>{i + 1}</div>
                  <div style={{
                    ...S.avatar,
                    background: me ? 'var(--brand)' : 'var(--sand-3)',
                    color: me ? 'var(--white)' : 'var(--text-2)'
                  }}>
                    {initials(r.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={S.name}>{me ? 'Sinä' : r.name}</div>
                    <div style={S.time}>klo {clockTime(r.completedAt)}</div>
                  </div>
                  <div style={{
                    ...S.pill,
                    background: good ? 'var(--brand-bg-2)' : 'var(--sand-3)',
                    color: good ? 'var(--brand-dark)' : 'var(--text-2)'
                  }}>
                    {r.attempts} / 6
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Sheet>
  )
}

const S = {
  highlight: { flex: 1, borderRadius: 18, padding: 13, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  highlightLabel: { fontWeight: 700, fontSize: 10, letterSpacing: '.07em' },
  highlightName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 },
  highlightMeta: { fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 },
  list: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 },
  row: { borderRadius: 'var(--r-box)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 },
  rank: { width: 20, flex: 'none', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--text-4)' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, flex: 'none', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11
  },
  name: { fontWeight: 700, fontSize: 14, color: 'var(--ink)' },
  time: { fontWeight: 500, fontSize: 11, color: 'var(--text-4)' },
  pill: { borderRadius: 'var(--r-pill)', padding: '6px 11px', fontWeight: 700, fontSize: 11, flex: 'none' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '26px 20px', textAlign: 'center' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--ink)' },
  emptyBody: { fontSize: 13, color: 'var(--text-2)', maxWidth: 240, lineHeight: 1.45 }
}
