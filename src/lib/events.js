import { supabase } from './supabase'

/* Tulevat tapahtumat aikajärjestyksessä. Menneet jätetään pois:
   tapahtumalista on suunnitelma, ei arkisto. Neljän tunnin armonaika
   pitää juuri alkaneen tapahtuman listalla — muuten afterwork katoaisi
   puoli tuntia sen alkamisen jälkeen. */
const GRACE_HOURS = 4

export async function loadEvents() {
  const since = new Date(Date.now() - GRACE_HOURS * 3600000).toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, location, starts_at, description, created_by, author:profiles!created_by(display_name)')
    .gte('starts_at', since)
    .order('starts_at', { ascending: true })
  if (error) throw error

  return (data ?? []).map(e => {
    const author = Array.isArray(e.author) ? e.author[0] : e.author
    return {
      id: e.id,
      title: e.title,
      location: e.location,
      startsAt: e.starts_at,
      description: e.description,
      createdBy: e.created_by,
      authorName: author?.display_name ?? 'Poistunut käyttäjä'
    }
  })
}

export async function createEvent({ title, location, startsAt, description }, meId) {
  const { error } = await supabase.from('events').insert({
    title,
    location: location || null,
    starts_at: startsAt,
    description: description || null,
    created_by: meId
  })
  if (error) throw error
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
