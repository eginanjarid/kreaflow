'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { canAccess, type Module } from '@/lib/jabatan-access'

const MAIN_ITEMS = [
  {
    href: '/sprints', label: 'Sprint',
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    href: '/plan', label: 'Plan',
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    href: '/studio', label: 'Studio',
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/>
      </svg>
    ),
  },
  {
    href: '/calendar', label: 'Kalender',
    icon: (c: string) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
]

const MORE_ITEMS = [
  { href: '/insights', label: 'Dashboard', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { href: '/brand', label: 'Brand', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
  { href: '/catalog', label: 'Catalog', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg> },
  { href: '/library', label: 'Library', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { href: '/tracker', label: 'Tracker', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href: '/budget', label: 'Budget', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { href: '/settings', label: 'Pengaturan', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
]

const ADMIN_ITEM = { href: '/admin', label: 'Admin', icon: (c: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }

export default function BottomNav({ isSuperAdmin, workspaceId, role = 'owner', jabatan = '' }: { isSuperAdmin: boolean; workspaceId?: string; role?: string; jabatan?: string }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [planCount, setPlanCount] = useState(0)
  const [studioCount, setStudioCount] = useState(0)

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    async function fetchCounts() {
      const [plan, studio] = await Promise.all([
        supabase.from('kf_content_ideas').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId!).in('status', ['Draft', 'Revisi']),
        supabase.from('kf_content_ideas').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId!).eq('status', 'Naskah Siap'),
      ])
      setPlanCount(plan.count || 0)
      setStudioCount(studio.count || 0)
    }
    fetchCounts()
    const t = setInterval(fetchCounts, 30000)
    return () => clearInterval(t)
  }, [workspaceId])

  const NAV_COUNTS: Record<string, number> = { '/plan': planCount, '/studio': studioCount }

  const HREF_TO_MODULE: Record<string, Module> = {
    '/sprints': 'sprints', '/plan': 'plan', '/library': 'library', '/studio': 'studio',
    '/calendar': 'calendar', '/tracker': 'tracker', '/budget': 'budget', '/brand': 'brand',
    '/catalog': 'catalog', '/settings': 'settings', '/insights': 'insights', '/notifications': 'notifications',
  }
  const visibleMain = MAIN_ITEMS.filter(item => {
    const mod = HREF_TO_MODULE[item.href]
    return !mod || canAccess(role, jabatan, mod)
  })
  const allMore = (isSuperAdmin ? [...MORE_ITEMS, ADMIN_ITEM] : MORE_ITEMS).filter(item => {
    const mod = HREF_TO_MODULE[item.href]
    return !mod || canAccess(role, jabatan, mod)
  })
  const moreActive = allMore.some(item => pathname.startsWith(item.href))

  return (
    <>
      {/* More sheet */}
      {moreOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            style={{ position: 'absolute', bottom: 60, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '12px 16px 20px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: '#e5eaf2', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {allMore.map(item => {
                const active = pathname.startsWith(item.href)
                const color = active ? '#1a73e8' : '#374151'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px 12px', borderRadius: 14, background: active ? 'rgba(26,115,232,0.08)' : '#f5f7fb', textDecoration: 'none', color, fontSize: '0.68rem', fontWeight: active ? 700 : 400 }}
                  >
                    {item.icon(color)}
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="kf-bottom-nav">
        {visibleMain.map(item => {
          const active = pathname.startsWith(item.href)
          const color = active ? '#1a73e8' : '#9ca3af'
          const count = NAV_COUNTS[item.href] || 0
          const dotColor = item.href === '/plan' ? '#1a73e8' : '#f59e0b'
          return (
            <Link key={item.href} href={item.href} className={`kf-bottom-nav-item${active ? ' active' : ''}`} style={{ position: 'relative' }}>
              {item.icon(color)}
              {count > 0 && (
                <span style={{ position: 'absolute', top: 4, right: '50%', transform: 'translateX(10px)', minWidth: 16, height: 16, background: dotColor, borderRadius: 8, fontSize: '0.55rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '1.5px solid #fff' }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
              <span>{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={`kf-bottom-nav-item${moreActive ? ' active' : ''}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={moreActive ? '#1a73e8' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
            <circle cx="5" cy="12" r="1.5" fill={moreActive ? '#1a73e8' : '#9ca3af'} stroke="none"/>
            <circle cx="12" cy="12" r="1.5" fill={moreActive ? '#1a73e8' : '#9ca3af'} stroke="none"/>
            <circle cx="19" cy="12" r="1.5" fill={moreActive ? '#1a73e8' : '#9ca3af'} stroke="none"/>
          </svg>
          <span>Lainnya</span>
        </button>
      </nav>
    </>
  )
}
