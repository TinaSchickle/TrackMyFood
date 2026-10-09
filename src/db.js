import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export async function saveEntries(rows) {
  check(await supabase.from('tmf_entries').insert(rows))
}

export async function loadEntries(person) {
  return check(
    await supabase
      .from('tmf_entries')
      .select('*')
      .eq('person', person)
      .order('entry_date', { ascending: false })
      .order('entry_time', { ascending: false })
      .limit(1000)
  )
}

export async function updateEntry(id, fields) {
  check(await supabase.from('tmf_entries').update(fields).eq('id', id))
}

export async function deleteEntry(id) {
  check(await supabase.from('tmf_entries').delete().eq('id', id))
}

export async function loadCycles() {
  return check(await supabase.from('tmf_cycles').select('*').order('start_date', { ascending: false }))
}

export async function addCycle(startDate) {
  check(await supabase.from('tmf_cycles').insert({ start_date: startDate }))
}

export async function deleteCycle(id) {
  check(await supabase.from('tmf_cycles').delete().eq('id', id))
}
