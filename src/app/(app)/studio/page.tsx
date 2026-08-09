import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import StudioModule from './StudioModule'

export default async function StudioPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'studio')) redirect(firstAccessibleRoute(role, jabatan))

  const admin = createAdmin(process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: wsData }, { data: brandCheck }, { data: contents }, { data: products }, { data: notifications }, { data: membersRaw }, { data: authUsersData }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, brand_type, name').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_content_ideas').select('*, kf_sprints!sprint_id(nama,step_config)').eq('workspace_id', wsId).in('status', ['Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_notifications').select('*').eq('workspace_id', wsId).eq('is_read', false).order('created_at', { ascending: false }),
    admin.from('kf_workspace_members').select('id, user_id, role, jabatan').eq('workspace_id', wsId),
    admin.auth.admin.listUsers(),
  ])
  const productCount = products?.length ?? 0

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brandCheck?.biz_nama_brand && !brandCheck?.biz_kategori) : (!brandCheck?.niche && !brandCheck?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')
  if (wsData?.brand_type === 'affiliate' && !productCount && canAccess(role, jabatan, 'catalog')) redirect('/catalog?setup=1')

  const userMap = Object.fromEntries(
    (authUsersData?.users || []).map(u => [u.id, { email: u.email || '', nama: (u.user_metadata?.nama as string) || u.email || '' }])
  )
  const workspaceMembers = (membersRaw || []).map((m: any) => ({
    id: m.id as string,
    user_id: m.user_id as string,
    role: m.role as string,
    jabatan: (m.jabatan as string | null) || '',
    email: userMap[m.user_id as string]?.email || '',
    nama: userMap[m.user_id as string]?.nama || userMap[m.user_id as string]?.email || '',
  }))

  const contentsWithSprint = (contents || []).map((c: any) => ({
    ...c,
    sprint_nama: c.kf_sprints?.nama || null,
    sprint_step_config: (c.kf_sprints?.step_config as { id: string; daysBefore: number }[] | null) || null,
  }))

  return (
    <StudioModule
      initialContents={contentsWithSprint}
      products={products || []}
      initialNotifications={notifications || []}
      workspaceId={wsId}
      workspaceName={wsData?.name || 'studio'}
      workspaceMembers={workspaceMembers}
    />
  )
}
