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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
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
        <main style={{ flex: 1, overflowY: 'auto', background: '#f5f7fb' }}>
          <div className="main-content-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
