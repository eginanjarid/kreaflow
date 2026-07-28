import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        workspace={(workspace?.kf_workspaces as unknown) as { id: string; name: string; plan: string } | null}
        isSuperAdmin={isSuperAdmin}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar user={{ email: user.email!, nama: user.user_metadata?.nama || user.email! }} />
        <main style={{ flex: 1, overflowY: 'auto', background: '#eef2f7' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
