import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id, role, kf_workspaces(id, name, plan)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  const isSuperAdmin = SUPER_ADMINS.includes(user.email!)

  return (
    <AppShell
      workspace={(workspace?.kf_workspaces as unknown) as { id: string; name: string; plan: string } | null}
      isSuperAdmin={isSuperAdmin}
      user={{ email: user.email!, nama: user.user_metadata?.nama || user.email! }}
    >
      {children}
    </AppShell>
  )
}
