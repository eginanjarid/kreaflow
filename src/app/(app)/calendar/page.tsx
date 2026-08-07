import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import CalendarModule from './CalendarModule'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ content?: string }> }) {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'calendar')) redirect(firstAccessibleRoute(role, jabatan))

  const [{ data: wsData }, { data: brandCheck }, { data: entries }, { data: ideas }, { data: tasks }, { data: products }, { data: readyRaw }, { data: accounts }, { data: importantDatesRaw }, { count: productCount }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_calendar_entries').select('id,workspace_id,content_id,task_id,label,platform,scheduled_at,posted_at,posted_url,status').eq('workspace_id', wsId).order('scheduled_at'),
    supabase.from('kf_content_ideas').select('id, judul, format, platform, product_id, tanggal_tayang, jam_tayang').eq('workspace_id', wsId),
    supabase.from('kf_tasks').select('id,nama,platform,due_date,percent_complete,priority,stage,assigned_to').eq('workspace_id', wsId).not('due_date', 'is', null),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_content_ideas').select('id, judul, format, platform, product_id, sprint_id, tanggal_tayang, jam_tayang').eq('workspace_id', wsId).eq('status', 'Siap Tayang'),
    supabase.from('kf_accounts').select('id, platform, handle, nama').eq('workspace_id', wsId).order('platform'),
    supabase.from('kf_important_dates').select('id, workspace_id, nama, tanggal, tipe, warna, deskripsi, is_repeating').or(`workspace_id.eq.${wsId},workspace_id.is.null`).order('tanggal'),
    supabase.from('kf_products').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('is_active', true),
  ])

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brandCheck?.biz_nama_brand && !brandCheck?.biz_kategori) : (!brandCheck?.niche && !brandCheck?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')
  if (wsData?.brand_type === 'affiliate' && !productCount && canAccess(role, jabatan, 'catalog')) redirect('/catalog?setup=1')

  const productMap = Object.fromEntries((products || []).map(p => [p.id as string, p.nama as string]))
  const { content: autoContentId } = await searchParams

  const ideasWithProduct = (ideas || []).map(i => ({
    id: i.id as string,
    judul: i.judul as string,
    format: (i.format as string | null) || '',
    platform: (i.platform as string[] | null) || [],
    product_id: (i.product_id as string | null) || null,
    product_nama: i.product_id ? (productMap[i.product_id as string] || null) : null,
    tanggal_tayang: (i.tanggal_tayang as string | null) || null,
    jam_tayang: (i.jam_tayang as string | null) || null,
  }))

  const readyQueue = (readyRaw || []).map(r => ({
    id: r.id as string,
    judul: r.judul as string,
    format: (r.format as string | null) || null,
    platform: (r.platform as string[] | null) || null,
    product_id: (r.product_id as string | null) || null,
    product_nama: r.product_id ? (productMap[r.product_id as string] || null) : null,
    sprint_id: (r.sprint_id as string | null) || null,
    tanggal_tayang: (r.tanggal_tayang as string | null) || null,
    jam_tayang: (r.jam_tayang as string | null) || null,
  }))

  const accountList = (accounts || []).map(a => ({
    id: a.id as string,
    platform: a.platform as string,
    handle: a.handle as string,
    nama: a.nama as string,
  }))

  const importantDates = (importantDatesRaw || []).map(d => ({
    id: d.id as string,
    workspace_id: (d.workspace_id as string | null) || null,
    nama: d.nama as string,
    tanggal: d.tanggal as string,
    tipe: d.tipe as string,
    warna: (d.warna as string) || '#ef4444',
    deskripsi: (d.deskripsi as string | null) || null,
    is_repeating: (d.is_repeating as boolean) || false,
  }))

  return (
    <CalendarModule
      initialEntries={entries || []}
      workspaceId={wsId}
      ideas={ideasWithProduct}
      tasks={tasks || []}
      readyQueue={readyQueue}
      autoContentId={autoContentId}
      accounts={accountList}
      importantDates={importantDates}
    />
  )
}
