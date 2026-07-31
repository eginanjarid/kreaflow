import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getWorkspace() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()
  if (!member) redirect('/login')

  return { supabase, user, wsId: member.workspace_id as string }
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
    .select('niche')
    .eq('workspace_id', wsId)
    .maybeSingle()

  if (!brand?.niche) redirect('/brand?setup=1')

  return { supabase, user, wsId }
}
