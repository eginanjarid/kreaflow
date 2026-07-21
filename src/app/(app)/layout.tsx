import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

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

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        user={{ email: user.email!, nama: user.user_metadata?.nama || user.email! }}
        workspace={(workspace?.kf_workspaces as unknown) as { id: string; name: string; plan: string } | null}
      />
      <main style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
