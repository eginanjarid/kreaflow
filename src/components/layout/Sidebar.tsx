'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  {
    href: '/insights', label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
]

const WORKSPACE_ITEMS = [
  {
    href: '/brand', label: 'Brand',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  },
  {
    href: '/catalog', label: 'Catalog',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
  },
  {
    href: '/sprints', label: 'Sprints',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
]

const WORKFLOW_ITEMS = [
  {
    href: '/plan', label: 'Plan',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  {
    href: '/library', label: 'Library',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  },
  {
    href: '/studio', label: 'Studio',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>,
    badge: true,
  },
  {
    href: '/calendar', label: 'Calendar',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
]

const ANALITIK_ITEMS = [
  {
    href: '/tracker', label: 'Tracker',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    href: '/budget', label: 'Budget',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
]

type Props = {
  workspace: { id: string; name: string; plan: string } | null
  isSuperAdmin: boolean
  className?: string
}

function Divider() {
  return <div style={{ height: 1, background: '#f1f5f9', margin: '6px 4px 8px' }} />
}

export default function Sidebar({ workspace, isSuperAdmin, className }: Props) {
  const pathname = usePathname()
  const [studioCount, setStudioCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    async function fetchStudio() {
      const { count } = await supabase
        .from('kf_content_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Naskah Siap')
      setStudioCount(count || 0)
    }
    fetchStudio()
    const interval = setInterval(fetchStudio, 30000)
    return () => clearInterval(interval)
  }, [])

  function itemStyle(active: boolean) {
    return {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: 10,
      padding: '8px 10px',
      borderRadius: 8,
      marginBottom: 2,
      background: active ? 'rgba(26,115,232,0.10)' : 'transparent',
      color: active ? '#1a73e8' : '#5a6a85',
      fontWeight: active ? 600 : 400,
      fontSize: '0.875rem',
      textDecoration: 'none' as const,
      transition: 'background 0.12s, color 0.12s',
      cursor: 'pointer' as const,
    }
  }

  const renderItem = (item: { href: string; label: string; icon: React.ReactNode; badge?: boolean }) => {
    const active = pathname.startsWith(item.href)
    return (
      <Link key={item.href} href={item.href} style={itemStyle(active)}>
        {item.icon}
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.badge && studioCount > 0 && (
          <span style={{
            minWidth: 18, height: 18,
            background: active ? '#1a73e8' : '#f59e0b',
            borderRadius: 9, fontSize: '0.6rem', fontWeight: 700,
            color: active ? '#fff' : '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
          }}>
            {studioCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className={className} style={{
      width: 240,
      background: '#fff',
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #1a73e8, #42a5f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#2a3547', letterSpacing: '-0.3px' }}>KreaFlow</span>
        </div>

        {workspace && (
          <div style={{ marginTop: 10, padding: '6px 10px', background: '#f5f7fb', borderRadius: 8, border: '1px solid #eef1f6' }}>
            <div style={{ fontSize: '0.6rem', color: '#9fa9ba', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2 }}>Workspace</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2a3547', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
            <div style={{ fontSize: '0.6rem', color: '#1a73e8', fontWeight: 700, textTransform: 'uppercase', marginTop: 1 }}>{workspace.plan}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(renderItem)}

        <Divider />

        {WORKSPACE_ITEMS.map(renderItem)}

        <Divider />

        {WORKFLOW_ITEMS.map(renderItem)}

        <Divider />

        {ANALITIK_ITEMS.map(renderItem)}

        <Divider />

        <Link href="/settings" style={itemStyle(pathname.startsWith('/settings'))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Pengaturan
        </Link>

        {isSuperAdmin && (
          <Link href="/admin" style={{
            ...itemStyle(pathname.startsWith('/admin')),
            color: pathname.startsWith('/admin') ? '#ef4444' : '#9ca3af',
            background: pathname.startsWith('/admin') ? 'rgba(239,68,68,0.08)' : 'transparent',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Admin
          </Link>
        )}
      </nav>
    </aside>
  )
}
