import { supabase } from './supabase'
import { readJSON, writeJSON } from './format'

/* Pelipäivä on Suomen kalenteripäivä — sama arvo kuin kannan
   game_day() (`(now() at time zone 'Europe/Helsinki')::date`).
   Samaa päivää käytetään localStorage-avaimessa, game_results-rivissä
   ja tulostaulun haussa, joten kaikki vaihtuvat yhtä aikaa.

   HUOM: vaatii schema-3-sanuli.sql:n ajetuksi. Ilman sitä kanta on
   yhä UTC:ssä ja klo 0–3 välillä selain ja palvelin olisivat eri
   päivässä. */
const GAME_TZ = 'Europe/Helsinki'

export function playDate(d = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: GAME_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d).reduce((o, x) => ((o[x.type] = x.value), o), {})
  return `${p.year}-${p.month}-${p.day}`
}

/* Sana vaihtuu Suomen keskiyöllä. */
export function wordChangesAt() {
  return '0.00'
}

const storeKey = () => `ws.sanuli.${playDate()}`
export const loadLocalGame = () => readJSON(storeKey()) ?? { guesses: [] }
export const saveLocalGame = guesses => writeJSON(storeKey(), { guesses })

/* --- Tulokset ---------------------------------------------------------- */

export async function loadMyResult(meId) {
  const { data, error } = await supabase
    .from('game_results')
    .select('attempts, solved, completed_at')
    .eq('play_date', playDate())
    .eq('user_id', meId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveResult(meId, attempts, solved) {
  const { error } = await supabase.from('game_results').insert({
    play_date: playDate(),
    user_id: meId,
    attempts,
    solved
  })
  // Sama päivä on jo pelattu toisella laitteella — ei virhe käyttäjälle.
  if (error && error.code !== '23505') throw error
}

/* Tulostaululle vain ratkaisseet, järjestys yritykset → aika. */
export async function loadLeaderboard() {
  const { data, error } = await supabase
    .from('game_results')
    .select('user_id, attempts, completed_at, player:profiles!user_id(display_name)')
    .eq('play_date', playDate())
    .eq('solved', true)
  if (error) throw error

  return (data ?? [])
    .map(r => ({
      userId: r.user_id,
      attempts: r.attempts,
      completedAt: r.completed_at,
      name: (Array.isArray(r.player) ? r.player[0] : r.player)?.display_name ?? 'Poistunut käyttäjä'
    }))
    .sort((a, b) => a.attempts - b.attempts || a.completedAt.localeCompare(b.completedAt))
}
