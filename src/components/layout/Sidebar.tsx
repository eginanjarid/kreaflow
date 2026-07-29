'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  brand:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  catalog:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
  sprints:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  plan:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  library:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  studio:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>,
  calendar:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  tracker:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  budget:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  settings:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  admin:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

type NavEntry = { href: string; label: string; key: string; admin?: boolean; studio?: boolean } | null

const NAV: NavEntry[] = [
  { href: '/insights', label: 'Dashboard', key: 'dashboard' },
  null,
  { href: '/brand',   label: 'Brand',     key: 'brand' },
  { href: '/catalog', label: 'Catalog',   key: 'catalog' },
  { href: '/sprints', label: 'Sprints',   key: 'sprints' },
  null,
  { href: '/plan',     label: 'Plan',     key: 'plan' },
  { href: '/library',  label: 'Library',  key: 'library' },
  { href: '/studio',   label: 'Studio',   key: 'studio', studio: true },
  { href: '/calendar', label: 'Calendar', key: 'calendar' },
  null,
  { href: '/tracker', label: 'Tracker', key: 'tracker' },
  { href: '/budget',  label: 'Budget',  key: 'budget' },
  null,
  { href: '/settings', label: 'Pengaturan', key: 'settings' },
]

type Props = {
  workspace: { id: string; name: string; plan: string } | null
  isSuperAdmin: boolean
  className?: string
}

export default function Sidebar({ workspace, isSuperAdmin, className }: Props) {
  const pathname = usePathname()
  const [studioCount, setStudioCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('kf-sidebar')
    if (saved !== null) setCollapsed(saved === 'collapsed')
  }, [])

  function toggle() {
    setCollapsed(v => {
      const next = !v
      localStorage.setItem('kf-sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
    setTooltip(null)
  }

  useEffect(() => {
    const supabase = createClient()
    async function fetch() {
      const { count } = await supabase
        .from('kf_content_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Naskah Siap')
      setStudioCount(count || 0)
    }
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [])

  function onEnter(e: React.MouseEvent<HTMLElement>, label: string) {
    if (!collapsed) return
    const r = e.currentTarget.getBoundingClientRect()
    setTooltip({ label, top: r.top + r.height / 2 })
  }

  const items: NavEntry[] = isSuperAdmin
    ? [...NAV, { href: '/admin', label: 'Admin', key: 'admin', admin: true }]
    : NAV

  const W = collapsed ? 68 : 220

  return (
    <aside className={className} style={{
      width: W,
      background: '#fff',
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
    }}>

      {/* Logo / Brand */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9', flexShrink: 0, padding: collapsed ? '0' : '0 14px', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10, overflow: 'hidden', transition: 'padding 0.2s' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#2a3547', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>KreaFlow</div>
            {workspace && (
              <div style={{ fontSize: '0.6rem', color: '#1a73e8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{workspace.plan}</div>
            )}
          </div>
        )}
      </div>

      {/* Workspace pill (expanded only) */}
      {!collapsed && workspace && (
        <div style={{ margin: '10px 10px 2px', padding: '7px 10px', background: '#f5f7fb', borderRadius: 8, border: '1px solid #eef1f6' }}>
          <div style={{ fontSize: '0.58rem', color: '#9fa9ba', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Workspace</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2a3547', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 0' : '8px 8px' }}>
        {items.map((item, i) => {
          if (!item) {
            return <div key={`sep-${i}`} style={{ height: 1, background: '#f1f5f9', margin: collapsed ? '5px 10px' : '5px 4px' }} />
          }
          const active = pathname.startsWith(item.href)
          const color = active ? (item.admin ? '#ef4444' : '#1a73e8') : '#9ca3af'
          const bg    = active ? (item.admin ? 'rgba(239,68,68,0.10)' : 'rgba(26,115,232,0.10)') : 'transparent'
          const activeLabel = active ? (item.admin ? '#ef4444' : '#1a73e8') : '#5a6a85'
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: collapsed ? 44 : 'auto',
                height: 40,
                borderRadius: 9,
                margin: collapsed ? '2px auto' : '2px 0',
                padding: collapsed ? 0 : '0 10px',
                background: bg, color,
                textDecoration: 'none',
                position: 'relative',
                transition: 'background 0.12s, color 0.12s',
                flexShrink: 0,
              }}
              onMouseEnter={e => onEnter(e, item.label)}
              onMouseLeave={() => setTooltip(null)}
            >
              <span style={{ color, flexShrink: 0, display: 'flex' }}>{ICONS[item.key]}</span>
              {!collapsed && (
                <span style={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: activeLabel, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {item.label}
                </span>
              )}
              {item.studio && studioCount > 0 && (
                collapsed
                  ? <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', border: '1.5px solid #fff' }} />
                  : <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, background: '#f59e0b', borderRadius: 9, fontSize: '0.6rem', fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{studioCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Toggle button */}
      <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 0', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', paddingRight: collapsed ? 0 : 12, flexShrink: 0 }}>
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f7fb', border: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', flexShrink: 0, transition: 'background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e8f0fe'; (e.currentTarget as HTMLElement).style.color = '#1a73e8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f5f7fb'; (e.currentTarget as HTMLElement).style.color = '#9ca3af' }}
        >
          {collapsed
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          }
        </button>
      </div>

      {/* Tooltip (only in collapsed mode, position:fixed bypasses overflow) */}
      {tooltip && collapsed && (
        <div style={{ position: 'fixed', left: 76, top: tooltip.top, transform: 'translateY(-50%)', background: '#1e293b', color: '#fff', padding: '5px 11px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 500, pointerEvents: 'none', zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {tooltip.label}
        </div>
      )}
    </aside>
  )
}
