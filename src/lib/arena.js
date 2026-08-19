import { supabase, cardResults, hasVoted, cardVoters } from './supabase'
import { readJSON, writeJSON } from './format'

/* Oma valinta ei tule kannasta takaisin: anonyymissä kortissa äänestäjää
   ei tallenneta lainkaan, eikä omalle äänelle ole rajapintaa. Muistetaan
   se paikallisesti ja täydennetään julkisissa korteissa nimilistasta. */
const voteKey = cardId => `ws.vote.${cardId}`
export const recallVote = cardId => readJSON(voteKey(cardId))?.index ?? null
export const rememberVote = (cardId, index) => writeJSON(voteKey(cardId), { index })

async function countsFor(cardId) {
  try {
    const rows = await cardResults(cardId)
    const counts = {}
    let total = 0
    for (const r of rows) {
      const n = Number(r.vote_count)
      counts[r.option_index] = n
      total += n
    }
    return { counts, total }
  } catch {
    // reveals_at voi vielä estää tuloksen. Näytetään kortti ilman lukuja.
    return { counts: {}, total: 0 }
  }
}

async function loadCards(type, limit) {
  const { data, error } = await supabase
    .from('cards')
    .select('id, question, options, anonymous, closes_at, created_by, created_at')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/* Yhdistää korttiin äänitilanteen. Yksi kortti = 2–3 rinnakkaista
   funktiokutsua, mikä riittää tämän kokoiselle porukalle. */
async function decorate(card, me) {
  const [voted, { counts, total }] = await Promise.all([
    hasVoted(card.id).catch(() => false),
    countsFor(card.id)
  ])

  const options = Array.isArray(card.options) ? card.options : []
  let myOption = recallVote(card.id)
  let voters = null

  if (!card.anonymous && voted) {
    try {
      const rows = await cardVoters(card.id)
      voters = options.map((_, i) =>
        rows.filter(r => r.option_index === i).map(r => r.voter_name)
      )
      if (myOption === null && me?.name) {
        const own = rows.find(r => r.voter_name === me.name)
        if (own) myOption = own.option_index
      }
    } catch {
      voters = null
    }
  }

  return {
    id: card.id,
    question: card.question,
    options,
    anonymous: card.anonymous,
    closesAt: card.closes_at,
    closed: card.closes_at ? new Date(card.closes_at) < new Date() : false,
    mine: card.created_by === me?.id,
    createdAt: card.created_at,
    voted,
    myOption: voted ? myOption : null,
    counts,
    total,
    voters
  }
}

async function loadDecorated(type, me, limit) {
  const cards = await loadCards(type, limit)
  return Promise.all(cards.map(c => decorate(c, me)))
}

/* --- Vedot ------------------------------------------------------------- */

export const loadBets = (me, limit = 20) => loadDecorated('bet', me, limit)

export async function createBet(question, anonymous, meId) {
  const { error } = await supabase.from('cards').insert({
    type: 'bet',
    question,
    options: ['Kyllä', 'Ei'],
    anonymous,
    created_by: meId
  })
  if (error) throw error
}

/* --- Hot takes ---------------------------------------------------------
   Tulos näkyy heti, joten reveals_at jätetään tyhjäksi. Äänet ovat
   anonyymejä: kanta ei tallenna äänestäjää lainkaan. */

export const loadTakes = (me, limit = 20) => loadDecorated('hot_take', me, limit)

export async function createTake(question, meId) {
  const { error } = await supabase.from('cards').insert({
    type: 'hot_take',
    question,
    options: ['Samaa mieltä', 'Eri mieltä'],
    anonymous: true,
    created_by: meId
  })
  if (error) throw error
}

/* --- Haasteet ----------------------------------------------------------
   Kuittaukset näkyvät vain itselle, joten omat rivit haetaan erikseen. */

export async function loadChallenges(meId) {
  const [challenges, done] = await Promise.all([
    supabase.from('challenges').select('id, title, deadline, created_at').order('created_at', { ascending: false }),
    supabase.from('challenge_completions').select('challenge_id').eq('user_id', meId)
  ])
  if (challenges.error) throw challenges.error
  if (done.error) console.warn('Kuittauksia ei saatu haettua:', done.error.message)

  const mine = new Set((done.data ?? []).map(r => r.challenge_id))
  return (challenges.data ?? []).map(c => ({
    id: c.id,
    title: c.title,
    deadline: c.deadline,
    done: mine.has(c.id)
  }))
}

export async function completeChallenge(id, meId) {
  const { error } = await supabase
    .from('challenge_completions')
    .insert({ challenge_id: id, user_id: meId })
  if (error) throw error
}

export async function uncompleteChallenge(id, meId) {
  const { error } = await supabase
    .from('challenge_completions')
    .delete()
    .match({ challenge_id: id, user_id: meId })
  if (error) throw error
}
