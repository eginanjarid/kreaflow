import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data: rows } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (!rows?.length) return null

  const cookieStore = await cookies()
  const cookieWsId = cookieStore.get('selected_workspace_id')?.value
  if (cookieWsId && rows.some((r: { workspace_id: string }) => r.workspace_id === cookieWsId)) {
    return cookieWsId
  }

  if (rows.length === 1) return rows[0].workspace_id as string
  const wsIds = rows.map((r: { workspace_id: string }) => r.workspace_id)
  const { data: wsData } = await supabase.from('kf_workspaces').select('id, plan').in('id', wsIds)
  const lifetimeId = wsData?.find((w: { id: string; plan: string }) => w.plan === 'lifetime')?.id
  return lifetimeId || rows[0].workspace_id as string
}

export async function getWorkspace() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')

  return { supabase, user, wsId }
}

export async function getWorkspaceWithPlanGuard() {
  const { supabase, user, wsId } = await getWorkspace()

  const { data: ws } = await supabase
    .from('kf_workspaces')
    .select('plan')
    .eq('id', wsId)
    .maybeSingle()

  if (ws?.plan !== 'lifetime') redirect('/upgrade')

  return { supabase, user, wsId }
}

export async function getWorkspaceWithBrandGuard() {
  const { supabase, user, wsId } = await getWorkspaceWithPlanGuard()

  const { data: brand } = await supabase
    .from('kf_brand_profiles')
    .select('niche, affiliate_micro_niche')
    .eq('workspace_id', wsId)
    .maybeSingle()

  if (!brand?.niche && !brand?.affiliate_micro_niche) redirect('/brand?setup=1')

  return { supabase, user, wsId }
}
