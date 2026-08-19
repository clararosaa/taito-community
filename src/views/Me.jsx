import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { supabase, initials } from '../lib/supabase'
import { shortDate } from '../lib/format'
import { loadFacts, createFact, deleteFact, updateDisplayName } from '../lib/profile'

const MAX = 300

export default function Me({ onClose }) {
  const { profile, session, setProfile } = useAuth()
  const toast = useToast()
  const meId = session?.user?.id

  const [facts, setFacts] = useState(null)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const factInput = useRef(null)

  const refresh = useCallback(async () => {
    if (!meId) return
    try {
      setFacts(await loadFacts(meId))
      setError('')
    } catch (e) {
      console.error('Faktojen lataus epäonnistui:', e)
      setFacts([])
      setError(e?.message ?? 'Tuntematon virhe')
    }
  }, [meId])

  useEffect(() => { refresh() }, [refresh])

  async function add() {
    const body = draft.trim()
    if (!body || busy) return
    setBusy(true)
    try {
      await createFact(body.slice(0, MAX), meId)
      setDraft('')
      await refresh()
      toast('Fakta lisätty')
    } catch {
      toast('Faktan lisäys ei onnistunut')
    } finally {
      setBusy(false)
    }
  }

  async function remove(fact) {
    const before = facts
    setFacts(list => list.filter(f => f.id !== fact.id))
    try {
      await deleteFact(fact.id)
      toast('Fakta poistettu')
    } catch {
      setFacts(before)
      toast('Poisto ei onnistunut')
    }
  }

  async function saveName() {
    const name = nameDraft.trim()
    if (!name) { setEditingName(false); return }
    try {
      setProfile(await updateDisplayName(meId, name))
      toast('Nimi päivitetty')
    } catch {
      toast('Nimen tallennus ei onnistunut')
    } finally {
      setEditingName(false)
    }
  }

  const waiting = facts?.filter(f => !f.used_on).length ?? 0

  return (
    <div className="view-scroll">
      <div style={S.stack}>
        <div style={S.head}>
          <div style={S.avatar}>{initials(profile?.display_name)}</div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {editingName ? (
              <input
                autoFocus
                style={S.nameInput}
                value={nameDraft}
                maxLength={60}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') setEditingName(false)
                }}
              />
            ) : (
              <button
                style={S.name}
                onClick={() => { setNameDraft(profile?.display_name ?? ''); setEditingName(true) }}
                title="Muokkaa nimeä"
              >
                {profile?.display_name ?? '—'}
              </button>
            )}
            <div style={S.mail}>{session?.user?.email}</div>
          </div>
          <button style={S.close} onClick={onClose} aria-label="Takaisin syötteeseen">✕</button>
        </div>

        <section style={S.card}>
          <div style={S.cardHead}>
            <h3 style={S.cardTitle}>Faktapankkini</h3>
            {facts?.length > 0 && (
              <div style={S.cardMeta}>
                {waiting > 0 ? `${waiting} odottaa vuoroaan` : 'kaikki ollut esillä'}
              </div>
            )}
          </div>

          <p style={S.lead}>
            Faktat päätyvät syötteen Kenen fakta -korttiin ilman nimeäsi. Muut arvaavat kuka
            on kyseessä — sinä näet omasi vain täällä.
          </p>

          {error && <div style={S.error}>Faktoja ei saatu ladattua.<div style={S.detail}>{error}</div></div>}

          {facts === null && <div style={S.info}>Ladataan faktoja…</div>}

          {facts?.length === 0 && !error && (
            <div style={S.empty}>
              <div style={{ fontSize: 28 }}>🎩</div>
              <div style={S.emptyTitle}>Yksikään fakta ei odota vuoroaan</div>
              <div style={S.emptyBody}>
                Kerro jotain mitä työkaverit eivät arvaisi. Yksi lause riittää.
              </div>
            </div>
          )}

          {facts?.map(fact => (
            <div key={fact.id} style={S.fact}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.factText}>{fact.body}</div>
                {fact.used_on && <div style={S.factUsed}>ollut esillä {shortDate(fact.used_on)}</div>}
              </div>
              <button
                style={S.remove}
                onClick={() => remove(fact)}
                aria-label="Poista fakta"
              >
                ✕
              </button>
            </div>
          ))}

          <div style={S.addRow}>
            <input
              ref={factInput}
              style={S.addInput}
              value={draft}
              maxLength={MAX}
              placeholder="+ Kerro yllättävä fakta itsestäsi"
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add() }}
            />
            <button
              style={{ ...S.addBtn, opacity: draft.trim() && !busy ? 1 : 0.5 }}
              disabled={!draft.trim() || busy}
              onClick={add}
            >
              Lisää
            </button>
          </div>
        </section>

        <button style={S.signout} onClick={() => supabase.auth.signOut()}>
          Kirjaudu ulos
        </button>
      </div>
    </div>
  )
}

const S = {
  stack: {
    padding: '2px var(--content-pad) 24px',
    display: 'flex', flexDirection: 'column', gap: 14
  },
  head: { display: 'flex', alignItems: 'center', gap: 14, padding: 4, flex: 'none' },
  avatar: {
    width: 66, height: 66, borderRadius: 33, flex: 'none',
    background: 'var(--brand-bg-2)', color: 'var(--brand-dark)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 22
  },
  name: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)',
    padding: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  nameInput: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)',
    background: 'var(--sand-1)', border: '1.5px solid var(--border-2)',
    borderRadius: 12, padding: '2px 8px', outline: 'none', minWidth: 0
  },
  mail: { fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 11, color: 'var(--text-3)' },
  close: {
    width: 38, height: 38, borderRadius: 19, flex: 'none', background: 'var(--sand-3)',
    color: 'var(--text-2)', fontWeight: 700, fontSize: 15
  },
  card: {
    background: 'var(--white)', border: '1px solid var(--border-card)', borderRadius: 24,
    boxShadow: 'var(--shadow-card)', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12, flex: 'none'
  },
  cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontWeight: 700, fontSize: 16, color: 'var(--ink)' },
  cardMeta: { fontWeight: 600, fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap' },
  lead: { margin: 0, fontWeight: 500, fontSize: 12, lineHeight: 1.45, color: 'var(--text-2)' },
  fact: {
    background: 'var(--sand-1)', borderRadius: 'var(--r-box)', padding: 13,
    display: 'flex', alignItems: 'flex-start', gap: 10
  },
  factText: { fontWeight: 500, fontSize: 13, lineHeight: 1.4, color: 'var(--text)' },
  factUsed: { marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' },
  remove: {
    width: 26, height: 26, borderRadius: 13, flex: 'none', background: 'var(--white)',
    color: 'var(--text-3)', fontWeight: 700, fontSize: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  addRow: {
    border: '1.5px dashed var(--border-2)', borderRadius: 'var(--r-box)',
    padding: '6px 6px 6px 10px', display: 'flex', alignItems: 'center', gap: 8
  },
  addInput: {
    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
    fontWeight: 600, fontSize: 13, color: 'var(--ink)'
  },
  addBtn: {
    background: 'var(--brand)', color: 'var(--white)', borderRadius: 'var(--r-pill)',
    padding: '8px 13px', fontWeight: 700, fontSize: 12, flex: 'none'
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    padding: '18px 10px', textAlign: 'center'
  },
  emptyTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' },
  emptyBody: { fontSize: 12.5, color: 'var(--text-2)', maxWidth: 240, lineHeight: 1.45 },
  info: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '10px 0' },
  error: {
    background: 'var(--red-bg-2)', color: 'var(--red-text)', borderRadius: 'var(--r-box)',
    padding: 12, fontSize: 12.5, fontWeight: 600, lineHeight: 1.45
  },
  detail: { fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 10.5, color: 'var(--red-text-2)', marginTop: 4 },
  signout: {
    padding: '14px 18px', borderRadius: 'var(--r-box)', background: 'var(--sand-2)',
    color: 'var(--text-2)', fontWeight: 600, fontSize: 13.5
  }
}
