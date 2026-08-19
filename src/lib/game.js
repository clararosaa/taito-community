import { supabase } from './supabase'
import { readJSON, writeJSON } from './format'

/* Palvelin päättää päivän sanan `current_date`-arvolla, joka on
   Supabasessa UTC. Käytetään samaa päivää myös localStorage-avaimessa,
   jottei lauta nollaudu eri hetkellä kuin sana vaihtuu. */
export function playDate(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/* Mihin kellonaikaan sana vaihtuu käyttäjän omassa ajassa. */
export function wordChangesAt() {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return `${next.getHours()}.${String(next.getMinutes()).padStart(2, '0')}`
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
