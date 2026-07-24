import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarModule from './CalendarModule'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const wsId = member.workspace_id

  const [{ data: entries }, { data: ideas }, { data: tasks }, { data: products }, { data: readyRaw }] = await Promise.all([
    supabase.from('kf_calendar_entries').select('id,workspace_id,content_id,task_id,label,platform,scheduled_at,posted_at,posted_url,status').eq('workspace_id', wsId).order('scheduled_at'),
    supabase.from('kf_content_ideas').select('id, judul, format, platform, product_id').eq('workspace_id', wsId),
    supabase.from('kf_tasks').select('id,nama,platform,due_date,percent_complete,priority,stage').eq('workspace_id', wsId).not('due_date', 'is', null),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_content_ideas').select('id, judul, format, platform, product_id, sprint_id').eq('workspace_id', wsId).eq('status', 'Siap Tayang'),
  ])

  const productMap = Object.fromEntries((products || []).map(p => [p.id as string, p.nama as string]))

  const ideasWithProduct = (ideas || []).map(i => ({
    id: i.id as string,
    judul: i.judul as string,
    format: (i.format as string | null) || '',
    platform: (i.platform as string[] | null) || [],
    product_id: (i.product_id as string | null) || null,
    product_nama: i.product_id ? (productMap[i.product_id as string] || null) : null,
  }))

  const readyQueue = (readyRaw || []).map(r => ({
    id: r.id as string,
    judul: r.judul as string,
    format: (r.format as string | null) || null,
    platform: (r.platform as string[] | null) || null,
    product_id: (r.product_id as string | null) || null,
    product_nama: r.product_id ? (productMap[r.product_id as string] || null) : null,
    sprint_id: (r.sprint_id as string | null) || null,
  }))

  return (
    <CalendarModule
      initialEntries={entries || []}
      workspaceId={wsId}
      ideas={ideasWithProduct}
      tasks={tasks || []}
      readyQueue={readyQueue}
    />
  )
}
