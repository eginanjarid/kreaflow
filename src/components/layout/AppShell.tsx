'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

type Props = {
  workspace: { id: string; name: string; plan: string } | null
  isSuperAdmin: boolean
  user: { email: string; nama: string }
  children: React.ReactNode
}

export default function AppShell({ workspace, isSuperAdmin, user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="kf-app-shell">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        workspace={workspace}
        isSuperAdmin={isSuperAdmin}
        className={`app-sidebar${sidebarOpen ? ' open' : ''}`}
        onClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar
          user={user}
          onMenuClick={() => setSidebarOpen(v => !v)}
        />
        <main className="kf-main-scroll" style={{ background: '#f5f7fb' }}>
          <div className="main-content-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }}>
            {children}
          </div>
          <footer style={{ borderTop: '1px solid #edf0f5', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1a73e8', letterSpacing: '-0.02em' }}>Krea<span style={{ color: '#111827' }}>Flow</span></span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d1d5db', display: 'inline-block' }} />
              <span style={{ fontSize: '0.72rem', color: '#9fa9ba' }}>by TUAS DIGITAL</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#c8d1e0' }}>© {new Date().getFullYear()}</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
