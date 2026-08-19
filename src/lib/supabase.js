import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Supabase-asetukset puuttuvat. Kopioi .env.example → .env ja täytä arvot.')
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

/* --- Äänestys ---------------------------------------------------------
   votes- ja vote_receipts-tauluihin ei ole suoraa pääsyä. Kaikki kulkee
   näiden funktioiden kautta. */

export async function castVote(cardId, optionIndex) {
  const { error } = await supabase.rpc('cast_vote', {
    p_card: cardId,
    p_option: optionIndex
  })
  if (error) throw error
}

export async function cardResults(cardId) {
  const { data, error } = await supabase.rpc('card_results', { p_card: cardId })
  if (error) throw error
  return data ?? []
}

export async function hasVoted(cardId) {
  const { data, error } = await supabase.rpc('has_voted', { p_card: cardId })
  if (error) throw error
  return data === true
}

/* Vain julkisille korteille, ja vasta oman äänen jälkeen. */
export async function cardVoters(cardId) {
  const { data, error } = await supabase.rpc('card_voters', { p_card: cardId })
  if (error) throw error
  return data ?? []
}

/* --- Sanuli -----------------------------------------------------------
   Päivän sanaa ei koskaan lähetetä selaimeen. */

export async function checkGuess(guess) {
  const { data, error } = await supabase.rpc('check_guess', { p_guess: guess })
  if (error) throw error
  return data // esim. "gyxxg"
}

export async function revealWord() {
  const { data, error } = await supabase.rpc('reveal_word')
  if (error) throw error
  return data
}

/* --- Apurit ----------------------------------------------------------- */

/* Magic link -kirjautumisessa display_name syntyy sähköpostin alusta
   ("etunimi.sukunimi"), joten pisteet ja väliviivat katkaisevat nimen
   siinä missä välilyöntikin. */
export function initials(name) {
  if (!name) return '?'
  return name.trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase()
}
