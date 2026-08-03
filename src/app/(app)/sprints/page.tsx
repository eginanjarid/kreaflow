import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import SprintsModule from './SprintsModule'

export default async function SprintsPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'sprints')) redirect(firstAccessibleRoute(role, jabatan))

  const admin = createAdmin(process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: wsData }, { data: brand }, { data: sprints }, { data: contents }, { data: products }, { data: membersRaw }, { data: tasks }, { data: authUsersData }, { data: accounts }, { data: pillars }, { count: productCount }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_sprints').select('*').eq('workspace_id', wsId).order('start_date', { ascending: false }),
    supabase.from('kf_content_ideas').select('*').eq('workspace_id', wsId).not('sprint_id', 'is', null).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id, nama, platform_affiliate').eq('workspace_id', wsId).eq('is_active', true),
    admin.from('kf_workspace_members').select('id, user_id, role, jabatan').eq('workspace_id', wsId),
    supabase.from('kf_tasks').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    admin.auth.admin.listUsers(),
    supabase.from('kf_accounts').select('id, platform, handle, nama').eq('workspace_id', wsId).order('created_at'),
    supabase.from('kf_content_pillars').select('id, nama').eq('workspace_id', wsId).order('urutan', { ascending: true }),
    supabase.from('kf_products').select('id', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('is_active', true),
  ])

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')
  if (!brand?.niche && !brand?.affiliate_micro_niche && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')
  if (wsData?.brand_type === 'affiliate' && !productCount && canAccess(role, jabatan, 'catalog')) redirect('/catalog?setup=1')

  const userMap = Object.fromEntries(
    (authUsersData?.users || []).map(u => [u.id, { email: u.email || '', nama: (u.user_metadata?.nama as string) || u.email || '' }])
  )

  const workspaceMembers = (membersRaw || []).map(m => ({
    id: m.id as string,
    user_id: m.user_id as string,
    role: m.role as string,
    jabatan: (m.jabatan as string | null) || '',
    email: userMap[m.user_id as string]?.email || '',
    nama: userMap[m.user_id as string]?.nama || userMap[m.user_id as string]?.email || '',
  }))

  return (
    <Suspense>
      <SprintsModule
        initialSprints={sprints || []}
        initialContents={contents || []}
        products={products || []}
        workspaceId={wsId}
        workspaceMembers={workspaceMembers}
        initialTasks={tasks || []}
        accounts={(accounts || []).map(a => ({ id: a.id as string, platform: a.platform as string, handle: a.handle as string, nama: a.nama as string }))}
        brandType={(wsData?.brand_type as string) || 'creator'}
        pillars={(pillars || []).map(p => ({ id: p.id as string, nama: p.nama as string }))}
      />
    </Suspense>
  )
}
