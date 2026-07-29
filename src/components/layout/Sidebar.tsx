'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const ICONS: Record<string, React.ReactNode> = {
  dashboard:   <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  brand:       <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  catalog:     <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>,
  sprints:     <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  plan:        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  library:     <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  studio:      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>,
  calendar:    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  tracker:     <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  budget:      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  settings:    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  admin:       <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

type NavEntry = { href: string; label: string; key: string; admin?: boolean; studio?: boolean } | null

const NAV: NavEntry[] = [
  { href: '/insights', label: 'Dashboard', key: 'dashboard' },
  null,
  { href: '/brand', label: 'Brand', key: 'brand' },
  { href: '/catalog', label: 'Catalog', key: 'catalog' },
  { href: '/sprints', label: 'Sprints', key: 'sprints' },
  null,
  { href: '/plan', label: 'Plan', key: 'plan' },
  { href: '/library', label: 'Library', key: 'library' },
  { href: '/studio', label: 'Studio', key: 'studio', studio: true },
  { href: '/calendar', label: 'Calendar', key: 'calendar' },
  null,
  { href: '/tracker', label: 'Tracker', key: 'tracker' },
  { href: '/budget', label: 'Budget', key: 'budget' },
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
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null)

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
    const r = e.currentTarget.getBoundingClientRect()
    setTooltip({ label, top: r.top + r.height / 2 })
  }

  const items: NavEntry[] = isSuperAdmin
    ? [...NAV, { href: '/admin', label: 'Admin', key: 'admin', admin: true }]
    : NAV

  return (
    <aside className={className} style={{
      width: 68,
      background: '#fff',
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
    }}>
      {/* Logo mark */}
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div
          style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}
          onMouseEnter={e => onEnter(e, workspace?.name ? `${workspace.name} · ${workspace.plan?.toUpperCase() || 'FREE'}` : 'KreaFlow')}
          onMouseLeave={() => setTooltip(null)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {items.map((item, i) => {
          if (!item) {
            return <div key={`sep-${i}`} style={{ height: 1, background: '#f1f5f9', margin: '5px 10px' }} />
          }
          const active = pathname.startsWith(item.href)
          const color = active ? (item.admin ? '#ef4444' : '#1a73e8') : '#9ca3af'
          const bg = active ? (item.admin ? 'rgba(239,68,68,0.10)' : 'rgba(26,115,232,0.10)') : 'transparent'
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, borderRadius: 10,
                margin: '2px auto',
                background: bg, color,
                textDecoration: 'none',
                position: 'relative',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => onEnter(e, item.label)}
              onMouseLeave={() => setTooltip(null)}
            >
              {ICONS[item.key]}
              {item.studio && studioCount > 0 && (
                <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', border: '1.5px solid #fff' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Tooltip (position:fixed — not clipped by overflow) */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: 76,
          top: tooltip.top,
          transform: 'translateY(-50%)',
          background: '#1e293b',
          color: '#fff',
          padding: '5px 11px',
          borderRadius: 8,
          fontSize: '0.78rem',
          fontWeight: 500,
          pointerEvents: 'none',
          zIndex: 999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          letterSpacing: '0.01em',
        }}>
          {tooltip.label}
        </div>
      )}
    </aside>
  )
}
