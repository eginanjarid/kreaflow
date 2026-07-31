import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import PlanModule from './PlanModule'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')

  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const { data: brandCheck } = await supabase.from('kf_brand_profiles').select('niche').eq('workspace_id', wsId).maybeSingle()
  if (!brandCheck?.niche) redirect('/brand?setup=1')

  const [{ data: brandProfile }, { data: products }, { data: workspace }, { data: tasks }, { data: sprintDrafts }] = await Promise.all([
    supabase.from('kf_brand_profiles').select('niche,micro_niche,premis,tone_of_voice,target_audiens,platform_utama,affiliate_tipe,affiliate_kategori_fokus,affiliate_positioning,affiliate_promo_style,affiliate_content_pillars').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_products').select('id,nama,kategori,tipe_produk,platform_affiliate,harga_normal,komisi_tipe,komisi_nilai,deskripsi').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_workspaces').select('brand_type').eq('id', wsId).single(),
    supabase.from('kf_tasks').select('id,nama,due_date,percent_complete,priority').eq('workspace_id', wsId).not('due_date', 'is', null),
    supabase.from('kf_content_ideas').select('id,judul,product_id,sprint_id').eq('workspace_id', wsId).eq('status', 'Draft').not('sprint_id', 'is', null),
  ])

  const brandType = (workspace?.brand_type as string | null) ?? 'creator'
  const modes = brandType === 'affiliate' ? ['affiliate'] : ['creator']

  return (
    <PlanModule
      workspaceId={wsId}
      brandProfile={brandProfile}
      products={products || []}
      modes={modes}
      tasks={tasks || []}
      sprintDrafts={(sprintDrafts || []).map(d => ({ id: d.id as string, judul: d.judul as string, product_id: (d.product_id as string | null) || '', sprint_id: d.sprint_id as string }))}
    />
  )
}
