import { supabase, cardResults, hasVoted } from './supabase'
import { startOfToday } from './format'

/* --- Postaukset -------------------------------------------------------
   Yksi kysely postauksille, yksi reaktioille ja yksi kommenttimäärille.
   ~50 hengen toimistolla tämä on halvempaa kuin postauskohtaiset haut. */

/* Upotuksessa on pakko nimetä vierasavain: reactions(post_id, user_id)
   on PostgRESTin silmissä posts↔profiles-liitostaulu, joten pelkkä
   `profiles` on monitulkintainen ja vastaus on HTTP 300 (PGRST201).
   `!author_id` viittaa sarakkeeseen, joten se kestää myös rajoitteen
   uudelleennimeämisen. */
export async function loadPosts(me, limit = 40) {
  const { data: rows, error } = await supabase
    .from('posts')
    .select('id, body, created_at, author_id, author:profiles!author_id(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  if (!rows?.length) return []

  const ids = rows.map(p => p.id)
  const [reactions, comments] = await Promise.all([
    supabase.from('reactions').select('post_id, emoji, user_id').in('post_id', ids),
    supabase.from('comments').select('post_id').in('post_id', ids)
  ])

  /* Reaktiot ja kommenttimäärät ovat postausten lisuke. Jos vain ne
     kaatuvat, syöte näytetään silti — muuten yksi puuttuva taulu
     pimentää koko näkymän. */
  if (reactions.error) console.warn('Reaktioita ei saatu haettua:', reactions.error.message)
  if (comments.error) console.warn('Kommenttimääriä ei saatu haettua:', comments.error.message)
  const reactionRows = reactions.data ?? []
  const commentRows = comments.data ?? []

  return rows.map(p => {
    const mine = []
    const counts = {}
    for (const r of reactionRows) {
      if (r.post_id !== p.id) continue
      counts[r.emoji] = (counts[r.emoji] ?? 0) + 1
      if (r.user_id === me) mine.push(r.emoji)
    }
    return {
      id: p.id,
      body: p.body,
      createdAt: p.created_at,
      authorId: p.author_id,
      authorName: displayName(p.author),
      reactions: counts,
      mine,
      comments: commentRows.filter(c => c.post_id === p.id).length
    }
  })
}

/* PostgREST palauttaa upotuksen objektina, mutta suhteen tulkinnasta
   riippuen se voi tulla myös yhden alkion taulukkona. */
function displayName(author) {
  const row = Array.isArray(author) ? author[0] : author
  return row?.display_name ?? 'Poistunut käyttäjä'
}

export async function createPost(body, authorId) {
  const { error } = await supabase.from('posts').insert({ author_id: authorId, body })
  if (error) throw error
}

export async function addReaction(postId, emoji, userId) {
  const { error } = await supabase
    .from('reactions')
    .insert({ post_id: postId, user_id: userId, emoji })
  if (error) throw error
}

export async function removeReaction(postId, emoji, userId) {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .match({ post_id: postId, user_id: userId, emoji })
  if (error) throw error
}

/* --- Kommentit --------------------------------------------------------- */

export async function loadComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, author_id, author:profiles!author_id(display_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(c => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    authorId: c.author_id,
    authorName: displayName(c.author)
  }))
}

export async function createComment(postId, body, authorId) {
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: authorId, body })
  if (error) throw error
}

/* Poistopolitiikka sallii vain omat kommentit. */
export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

/* --- Fiilismittari ----------------------------------------------------
   Kortti on tietokannassa pakotettu anonyymiksi eikä tulosta näytetä
   missään. Haemme vain kortin ja tiedon siitä onko jo vastattu. */

export async function loadMoodCard() {
  const { data, error } = await supabase
    .from('cards')
    .select('id, question, options')
    .eq('type', 'mood')
    .gte('created_at', startOfToday())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { ...data, voted: await hasVoted(data.id) }
}

/* --- Kenen fakta ------------------------------------------------------
   Faktan teksti tulee todays_fact()-funktiolta ilman kirjoittajaa.
   Vaihtoehdot ovat kortin options-kentässä. Oikea vastaus haetaan
   vasta kun arvaus on lukittu — sitä ei pidetä sivulla etukäteen. */

export async function loadFactCard() {
  const { data, error } = await supabase.rpc('todays_fact')
  if (error) throw error
  const row = data?.[0]
  if (!row) return null

  const { data: card, error: cardErr } = await supabase
    .from('cards')
    .select('options')
    .eq('id', row.card_id)
    .single()
  if (cardErr) throw cardErr

  return {
    id: row.card_id,
    body: row.fact_body,
    options: Array.isArray(card?.options) ? card.options : [],
    voted: await hasVoted(row.card_id)
  }
}

export async function factAnswerIndex(cardId) {
  const { data, error } = await supabase
    .from('cards')
    .select('answer_index')
    .eq('id', cardId)
    .single()
  if (error) throw error
  return data?.answer_index ?? null
}

/* "N/M on jo arvannut". Jos tulos on vielä lukittu reveals_at:lla,
   näytetään pelkkä toimiston koko ilman arvaajamäärää. */
export async function guessTally(cardId) {
  const members = supabase.from('profiles').select('id', { count: 'exact', head: true })
  let voters = null
  try {
    const rows = await cardResults(cardId)
    voters = rows.reduce((n, r) => n + Number(r.vote_count), 0)
  } catch {
    voters = null
  }
  const { count } = await members
  return { voters, members: count ?? null }
}
