'use client'

import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import Toast from '@/components/ui/Toast'

type Workspace = { id: string; name: string; plan: string; brand_type: string }

type Props = {
  workspace: Workspace | null
  workspaces: Workspace[]
  isSuperAdmin: boolean
  user: { email: string; nama: string }
  role: string
  jabatan: string
  children: React.ReactNode
}

export default function AppShell({ workspace, workspaces, isSuperAdmin, user, role, jabatan, children }: Props) {
  return (
    <div className="kf-app-shell">
      <Sidebar
        workspace={workspace}
        workspaces={workspaces}
        isSuperAdmin={isSuperAdmin}
        role={role}
        jabatan={jabatan}
        className="app-sidebar"
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar user={user} workspaceId={workspace?.id} />
        <main className="kf-main-scroll" style={{ background: '#f5f7fb' }}>
          <div className="main-content-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }}>
            {children}
          </div>
          <footer className="kf-footer" style={{ borderTop: '1px solid #edf0f5', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1a73e8', letterSpacing: '-0.02em' }}>Krea<span style={{ color: '#111827' }}>Flow</span></span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }} />
              <span style={{ fontSize: '0.72rem', color: '#9fa9ba' }}>by TUAS DIGITAL</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#c8d1e0' }}>© {new Date().getFullYear()}</span>
          </footer>
        </main>
      </div>
      <BottomNav isSuperAdmin={isSuperAdmin} workspaceId={workspace?.id} role={role} jabatan={jabatan} />
      <Toast />
    </div>
  )
}
