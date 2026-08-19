import Sheet from '../Sheet'
import { TILE } from './Board'

const RULES = [
  { tiles: [{ ch: 'K', mark: 'g' }], text: 'Vihreä: kirjain on oikea ja oikealla paikalla.' },
  { tiles: [{ ch: 'A', mark: 'y' }], text: 'Keltainen: kirjain on sanassa, mutta väärässä paikassa.' },
  { tiles: [{ ch: 'L', mark: 'x' }], text: 'Harmaa: kirjain ei esiinny sanassa lainkaan.' },
  { tiles: [{ ch: '⏎', dark: true }], text: 'Enter vahvistaa arvauksen.' },
  { tiles: [{ ch: '⌫', pale: true }], text: 'Askelpalautin poistaa kirjaimen.' }
]

export default function HelpSheet({ onClose, changesAt }) {
  return (
    <Sheet
      title="Näin Sanulia pelataan"
      subtitle="Arvaa päivän 5-kirjaiminen sana kuudella yrityksellä"
      onClose={onClose}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
        {RULES.map(rule => (
          <div key={rule.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
              {rule.tiles.map((t, i) => (
                <div
                  key={i}
                  style={{
                    ...S.tile,
                    ...(t.mark ? TILE[t.mark] : t.dark
                      ? { background: 'var(--ink)', color: '#FFFDF9', borderColor: 'var(--ink)' }
                      : { background: '#DDD5C8', color: 'var(--text)', borderColor: '#DDD5C8' })
                  }}
                >
                  {t.ch}
                </div>
              ))}
            </div>
            <div style={S.text}>{rule.text}</div>
          </div>
        ))}
      </div>

      <div style={S.summary}>
        Uusi sana joka päivä klo {changesAt}. Arvaus tarkistetaan palvelimella, joten päivän
        sanaa ei voi kaivaa selaimesta. Ratkaisu tuo paikan päivän tulostaululle — mitä
        vähemmän yrityksiä, sitä korkeampi sija.
      </div>
    </Sheet>
  )
}

const S = {
  tile: {
    width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 13,
    borderWidth: 1.5, borderStyle: 'solid'
  },
  text: { flex: 1, fontWeight: 500, fontSize: 12.5, lineHeight: 1.4, color: 'var(--text)' },
  summary: {
    marginTop: 16, background: 'var(--sand-1)', borderRadius: 18, padding: 14,
    fontWeight: 500, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-2)'
  }
}
