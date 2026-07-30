import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UpgradeModule from './UpgradeModule'

export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
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

  const { data: ws } = await supabase
    .from('kf_workspaces')
    .select('plan')
    .eq('id', member.workspace_id)
    .single()

  if (ws?.plan === 'lifetime') redirect('/sprints')

  const { failed } = await searchParams

  return <UpgradeModule failed={failed === '1'} />
}
