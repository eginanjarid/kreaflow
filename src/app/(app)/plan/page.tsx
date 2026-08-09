import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import PlanModule from './PlanModule'

export default async function PlanPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'plan')) redirect(firstAccessibleRoute(role, jabatan))

  const [
    { data: wsData },
    { data: brandProfile },
    { data: products },
    { data: tasks },
    { data: sprintDrafts },
    { data: pillars },
    { count: productCount },
  ] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche,micro_niche,premis,tone_of_voice,target_audiens,platform_utama,affiliate_tipe,affiliate_kategori_fokus,affiliate_positioning,affiliate_promo_style,affiliate_content_pillars,affiliate_micro_niche,biz_nama_brand,biz_kategori').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_products').select('id,nama,kategori,tipe_produk,platform_affiliate,harga_normal,komisi_tipe,komisi_nilai,deskripsi').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_tasks').select('id,nama,due_date,percent_complete,priority').eq('workspace_id', wsId).not('due_date', 'is', null),
    supabase.from('kf_content_ideas').select('id,judul,status,product_id,sprint_id,format,platform,assigned_naskah,script,tanggal_tayang,jam_tayang,kf_sprints(nama,step_config)').eq('workspace_id', wsId).in('status', ['Draft', 'Revisi']),
    supabase.from('kf_content_pillars').select('id,nama').eq('workspace_id', wsId).order('urutan', { ascending: true }),
    supabase.from('kf_products').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('is_active', true),
  ])

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brandProfile?.biz_nama_brand && !brandProfile?.biz_kategori) : (!brandProfile?.niche && !brandProfile?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')
  if (wsData?.brand_type === 'affiliate' && !productCount && canAccess(role, jabatan, 'catalog')) redirect('/catalog?setup=1')

  const brandType = (wsData?.brand_type as string | null) ?? 'creator'
  const modes = brandType === 'affiliate' ? ['affiliate'] : ['creator']

  return (
    <PlanModule
      workspaceId={wsId}
      brandProfile={brandProfile}
      products={products || []}
      modes={modes}
      tasks={tasks || []}
      pillars={(pillars || []).map(p => ({ id: p.id as string, nama: p.nama as string }))}
      queue={(sprintDrafts || []).map(d => ({
        id: d.id as string,
        judul: d.judul as string,
        status: d.status as 'Draft' | 'Revisi',
        product_id: (d.product_id as string | null) || '',
        sprint_id: (d.sprint_id as string | null) || null,
        sprint_nama: (d.kf_sprints as unknown as { nama: string; step_config: { id: string; daysBefore: number }[] | null } | null)?.nama || null,
        naskah_days_before: (d.kf_sprints as unknown as { step_config: { id: string; daysBefore: number }[] | null } | null)?.step_config?.find((c: { id: string }) => c.id === 'naskah')?.daysBefore ?? null,
        format: (d.format as string | null) || null,
        platform: (d.platform as string[] | null) || [],
        assigned_naskah: (d.assigned_naskah as string | null) || null,
        script: (d.script as string | null) || null,
        tanggal_tayang: (d.tanggal_tayang as string | null) || null,
        jam_tayang: (d.jam_tayang as string | null) || null,
      }))}
    />
  )
}
