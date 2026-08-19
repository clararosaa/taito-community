import { supabase } from './supabase'

/* Faktapankki. RLS näyttää vain omat faktat — muiden faktoja ei voi
   selata, muuten Kenen fakta -arvauksen ratkaisisi lukemalla taulun. */

export async function loadFacts(meId) {
  const { data, error } = await supabase
    .from('facts')
    .select('id, body, used_on, created_at')
    .eq('author_id', meId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createFact(body, meId) {
  const { error } = await supabase.from('facts').insert({ author_id: meId, body })
  if (error) throw error
}

export async function deleteFact(id) {
  const { error } = await supabase.from('facts').delete().eq('id', id)
  if (error) throw error
}

export async function updateDisplayName(meId, name) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', meId)
    .select('id, display_name')
    .single()
  if (error) throw error
  return data
}
