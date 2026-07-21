import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import SettingsModule from './SettingsModule'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id, role, kf_workspaces(id, name, plan, modes)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) redirect('/login')

  const ws = (member.kf_workspaces as unknown) as { id: string; name: string; plan: string; modes: string[] } | null
  const wsId = member.workspace_id

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [{ data: membersRaw }, { data: pendingInvites }] = await Promise.all([
    admin.from('kf_workspace_members').select('id, role, created_at, user_id').eq('workspace_id', wsId),
    admin.from('kf_invites').select('id, email, role, created_at, expires_at').eq('workspace_id', wsId).is('accepted_at', null).gt('expires_at', new Date().toISOString()),
  ])

  const { data: authUsers } = await admin.auth.admin.listUsers()
  const userMap = Object.fromEntries((authUsers?.users || []).map(u => [u.id, { email: u.email, nama: u.user_metadata?.nama }]))

  const members = (membersRaw || []).map(m => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as string,
    created_at: m.created_at as string,
    email: userMap[m.user_id]?.email || '',
    nama: userMap[m.user_id]?.nama || '',
  }))

  return (
    <SettingsModule
      workspaceId={wsId}
      workspaceName={ws?.name || ''}
      userEmail={user.email!}
      userName={user.user_metadata?.nama || user.email!}
      plan={ws?.plan || 'Free'}
      modes={ws?.modes || ['creator']}
      myRole={member.role as string}
      members={members}
      pendingInvites={(pendingInvites || []).map(i => ({ id: i.id, email: i.email, role: i.role as string, expires_at: i.expires_at as string }))}
      appUrl={process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'}
    />
  )
}
