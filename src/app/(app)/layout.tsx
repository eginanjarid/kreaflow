import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspaceId } from '@/lib/workspace'
import AppShell from '@/components/layout/AppShell'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  const { data: ws } = wsId
    ? await supabase.from('kf_workspaces').select('id, name, plan').eq('id', wsId).single()
    : { data: null }

  const isSuperAdmin = SUPER_ADMINS.includes(user.email!)

  return (
    <AppShell
      workspace={ws as { id: string; name: string; plan: string } | null}
      isSuperAdmin={isSuperAdmin}
      user={{ email: user.email!, nama: user.user_metadata?.nama || user.email! }}
    >
      {children}
    </AppShell>
  )
}
