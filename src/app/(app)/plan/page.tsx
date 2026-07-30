import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanModule from './PlanModule'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const wsId = member.workspace_id

  const { data: brandCheck } = await supabase.from('kf_brand_profiles').select('niche').eq('workspace_id', wsId).maybeSingle()
  if (!brandCheck?.niche) redirect('/brand?setup=1')

  const [{ data: platforms }, { data: campaigns }, { data: brandProfile }, { data: products }, { data: workspace }, { data: tasks }, { data: sprintDrafts }] = await Promise.all([
    supabase.from('kf_plan_platforms').select('*').eq('workspace_id', wsId),
    supabase.from('kf_campaigns').select('*').eq('workspace_id', wsId).order('tanggal_mulai', { ascending: false }),
    supabase.from('kf_brand_profiles').select('niche,micro_niche,premis,tone_of_voice,target_audiens,platform_utama,affiliate_tipe,affiliate_kategori_fokus,affiliate_positioning,affiliate_promo_style,affiliate_content_pillars').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_products').select('id,nama,kategori,tipe_produk,platform_affiliate,harga_normal,komisi_tipe,komisi_nilai,deskripsi').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_workspaces').select('modes').eq('id', wsId).single(),
    supabase.from('kf_tasks').select('id,nama,due_date,percent_complete,priority').eq('workspace_id', wsId).not('due_date', 'is', null),
    // Sprint content items awaiting naskah (for linkage detection)
    supabase.from('kf_content_ideas').select('id,judul,product_id,sprint_id').eq('workspace_id', wsId).eq('status', 'Draft').not('sprint_id', 'is', null),
  ])

  const modes = (workspace?.modes as string[] | null) ?? ['creator']

  return (
    <PlanModule
      initialPlatforms={platforms || []}
      initialCampaigns={campaigns || []}
      workspaceId={wsId}
      brandProfile={brandProfile}
      products={products || []}
      modes={modes}
      tasks={tasks || []}
      sprintDrafts={(sprintDrafts || []).map(d => ({ id: d.id as string, judul: d.judul as string, product_id: (d.product_id as string | null) || '', sprint_id: d.sprint_id as string }))}
    />
  )
}
