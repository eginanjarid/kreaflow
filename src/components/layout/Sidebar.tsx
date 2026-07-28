'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const BrandIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)
const CatalogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
  </svg>
)
const SprintsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const PlanIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
)
const LibraryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
)
const StudioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/>
  </svg>
)
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const TrackerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const InsightsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const BudgetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
)
const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const NAV_GROUPS = [
  {
    label: 'WORKSPACE',
    items: [
      { href: '/brand', label: 'Brand', icon: <BrandIcon /> },
      { href: '/catalog', label: 'Catalog', icon: <CatalogIcon /> },
      { href: '/sprints', label: 'Sprints', icon: <SprintsIcon /> },
    ],
  },
  {
    label: 'WORKFLOW',
    items: [
      { href: '/plan', label: 'Plan', icon: <PlanIcon /> },
      { href: '/library', label: 'Library', icon: <LibraryIcon /> },
      { href: '/studio', label: 'Studio', icon: <StudioIcon /> },
      { href: '/calendar', label: 'Calendar', icon: <CalendarIcon /> },
    ],
  },
  {
    label: 'ANALITIK',
    items: [
      { href: '/tracker', label: 'Tracker', icon: <TrackerIcon /> },
      { href: '/insights', label: 'Insights', icon: <InsightsIcon /> },
      { href: '/budget', label: 'Budget', icon: <BudgetIcon /> },
    ],
  },
]

type Props = {
  workspace: { id: string; name: string; plan: string } | null
  isSuperAdmin: boolean
}

export default function Sidebar({ workspace, isSuperAdmin }: Props) {
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

  function navItemStyle(active: boolean) {
    return {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: 14,
      padding: '10px 12px',
      borderRadius: 8,
      marginBottom: 6,
      background: active ? '#1a73e8' : 'transparent',
      color: active ? '#fff' : '#374151',
      fontWeight: active ? 600 : 500,
      fontSize: '0.9375rem',
      textDecoration: 'none' as const,
      transition: 'background 0.15s, color 0.15s',
      boxShadow: active ? '0 2px 6px rgba(26,115,232,0.25)' : 'none',
    }
  }

  return (
    <aside style={{
      width: 260,
      background: '#fff',
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #1a73e8, #42a5f5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#2a3547', letterSpacing: '-0.3px' }}>KreaFlow</span>
        </div>

        {workspace && (
          <div style={{ marginTop: 12, padding: '8px 10px', background: '#f5f7fb', borderRadius: 8, border: '1px solid #eef1f6' }}>
            <div style={{ fontSize: '0.6rem', color: '#5a6a85', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 2 }}>Workspace</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2a3547', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
            <div style={{ fontSize: '0.62rem', color: '#1a73e8', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{workspace.plan}</div>
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 8 }}>
            <div style={{
              fontSize: '0.6875rem', fontWeight: 700, color: '#5a6a85',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '12px 10px 6px',
            }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const active = pathname.startsWith(item.href)
              const isStudio = item.href === '/studio'
              return (
                <Link key={item.href} href={item.href} style={navItemStyle(active)}>
                  {item.icon}
                  {item.label}
                  {isStudio && studioCount > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      minWidth: 18, height: 18,
                      background: active ? 'rgba(255,255,255,0.25)' : '#f59e0b',
                      borderRadius: 9, fontSize: '0.6rem', fontWeight: 700,
                      color: active ? '#fff' : '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                    }}>
                      {studioCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Settings + Admin */}
        <div style={{ height: 1, background: '#f1f5f9', margin: '6px 0 10px' }} />
        <Link href="/settings" style={navItemStyle(pathname.startsWith('/settings'))}>
          <SettingsIcon />
          Pengaturan
        </Link>

        {isSuperAdmin && (
          <Link href="/admin" style={{
            ...navItemStyle(pathname.startsWith('/admin')),
            background: pathname.startsWith('/admin') ? 'rgba(239,68,68,0.1)' : 'transparent',
            color: pathname.startsWith('/admin') ? '#ef4444' : '#5a6a85',
          }}>
            <AdminIcon />
            Super Admin
          </Link>
        )}
      </nav>
    </aside>
  )
}
