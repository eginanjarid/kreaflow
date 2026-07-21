import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsModule from './SettingsModule'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id, kf_workspaces(id, name, plan)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) redirect('/login')

  const ws = (member.kf_workspaces as unknown) as { id: string; name: string; plan: string } | null

  return (
    <SettingsModule
      workspaceId={member.workspace_id}
      workspaceName={ws?.name || ''}
      userEmail={user.email!}
      userName={user.user_metadata?.nama || user.email!}
      plan={ws?.plan || 'Free'}
      modes={(ws as unknown as { modes: string[] } | null)?.modes || ['creator']}
    />
  )
}
