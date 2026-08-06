'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef, useTransition } from 'react'
import { canAccess, type Module } from '@/lib/jabatan-access'

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

const BRAND_TYPE_LABEL: Record<string, string> = {
  creator: 'Creator',
  affiliate: 'Affiliate',
  business: 'Business',
}

const BRAND_TYPE_COLOR: Record<string, string> = {
  creator: '#1a73e8',
  affiliate: '#059669',
  business: '#7c3aed',
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

type Workspace = { id: string; name: string; plan: string; brand_type: string }

type Props = {
  workspace: Workspace | null
  workspaces: Workspace[]
  isSuperAdmin: boolean
  role: string
  jabatan: string
  className?: string
}

const BRAND_TYPES = [
  { id: 'creator', label: 'Creator', desc: 'Konten kreator / personal brand', color: '#1a73e8' },
  { id: 'affiliate', label: 'Affiliate', desc: 'Affiliator produk & komisi', color: '#059669' },
  { id: 'business', label: 'Business', desc: 'Brand toko / perusahaan', color: '#7c3aed' },
]

export default function Sidebar({ workspace, workspaces, isSuperAdmin, role, jabatan, className }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [planCount, setPlanCount] = useState(0)
  const [studioCount, setStudioCount] = useState(0)
  const [calendarCount, setCalendarCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const [tooltip, setTooltip] = useState<{ label: string; top: number } | null>(null)
  const [wsOpen, setWsOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', brand_type: 'creator' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()
  const wsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('kf-sidebar')
    if (saved !== null) setCollapsed(saved === 'collapsed')
  }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
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
    if (!workspace?.id) return
    const wsId = workspace.id
    const supabase = createClient()
    async function fetchCounts() {
      const [plan, studio, calendar] = await Promise.all([
        supabase.from('kf_content_ideas').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId).in('status', ['Draft', 'Revisi']),
        supabase.from('kf_content_ideas').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'Naskah Siap'),
        supabase.from('kf_content_ideas').select('*', { count: 'exact', head: true }).eq('workspace_id', wsId).eq('status', 'Siap Tayang'),
      ])
      setPlanCount(plan.count || 0)
      setStudioCount(studio.count || 0)
      setCalendarCount(calendar.count || 0)
    }
    fetchCounts()
    const channel = supabase
      .channel(`sidebar-counts-${wsId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kf_content_ideas', filter: `workspace_id=eq.${wsId}` }, () => fetchCounts())
      .subscribe()
    const t = setInterval(fetchCounts, 300000)
    return () => { clearInterval(t); supabase.removeChannel(channel) }
  }, [workspace?.id])

  function onEnter(e: React.MouseEvent<HTMLElement>, label: string) {
    if (!collapsed) return
    const r = e.currentTarget.getBoundingClientRect()
    setTooltip({ label, top: r.top + r.height / 2 })
  }

  async function switchWorkspace(wsId: string) {
    if (wsId === workspace?.id) { setWsOpen(false); return }
    setSwitching(true)
    await fetch('/api/workspace/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: wsId }),
    })
    setWsOpen(false)
    setSwitching(false)
    startRefresh(() => { router.refresh() })
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.name.trim()) return
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/workspace/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setCreateOpen(false)
      setCreateForm({ name: '', brand_type: 'creator' })
      setCreateError('')
      router.refresh()
    } else if (data.needUpgrade) {
      setCreateError('Akun belum aktif. Silakan upgrade terlebih dahulu.')
    } else if (data.limitReached) {
      setCreateError(`Batas workspace tercapai (${data.maxWorkspaces}). Upgrade paket untuk tambah lebih banyak.`)
    } else {
      setCreateError(data.error || 'Gagal membuat workspace')
    }
  }

  const allNav: NavEntry[] = isSuperAdmin
    ? [...NAV, { href: '/admin', label: 'Admin', key: 'admin', admin: true }]
    : NAV

  // Filter nav items based on jabatan access; null separators are kept/cleaned up after
  const filteredNav = allNav.filter(item => {
    if (item === null) return true
    const moduleKey = item.key as Module
    return canAccess(role, jabatan, moduleKey)
  })
  // Remove consecutive/trailing null separators
  const items: NavEntry[] = filteredNav.reduce<NavEntry[]>((acc, item, i) => {
    if (item === null && (acc.length === 0 || acc[acc.length - 1] === null)) return acc
    return [...acc, item]
  }, []).filter((item, i, arr) => !(item === null && i === arr.length - 1))

  const W = collapsed ? 68 : 220
  const bt = workspace?.brand_type || 'creator'

  return (
    <>
      {isRefreshing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Memuat workspace...</span>
          </div>
        </div>
      )}
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

        {/* Workspace switcher (expanded only) */}
        {!collapsed && workspace && (
          <div ref={wsRef} style={{ margin: '10px 10px 2px', position: 'relative' }}>
            <button
              onClick={() => setWsOpen(v => !v)}
              style={{
                width: '100%', padding: '7px 10px', background: '#f5f7fb', borderRadius: 8,
                border: `1px solid ${wsOpen ? '#c5d8fb' : '#eef1f6'}`, cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.58rem', color: '#9fa9ba', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Workspace</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2a3547', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <span style={{ fontSize: '0.55rem', fontWeight: 700, color: BRAND_TYPE_COLOR[bt] || '#1a73e8', background: `${BRAND_TYPE_COLOR[bt] || '#1a73e8'}18`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {BRAND_TYPE_LABEL[bt] || bt}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9fa9ba" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={wsOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
                </svg>
              </div>
            </button>

            {wsOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10,
                boxShadow: '0 6px 24px rgba(42,53,71,0.12)', zIndex: 300, overflow: 'hidden',
              }}>
                {switching && (
                  <div style={{ padding: '10px 12px', fontSize: '0.75rem', color: '#9fa9ba', textAlign: 'center' }}>Switching...</div>
                )}
                {!switching && workspaces.map(ws => {
                  const active = ws.id === workspace.id
                  const color = BRAND_TYPE_COLOR[ws.brand_type] || '#1a73e8'
                  return (
                    <button
                      key={ws.id}
                      onClick={() => switchWorkspace(ws.id)}
                      style={{
                        width: '100%', padding: '8px 12px', background: active ? '#f0f7ff' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8,
                        borderBottom: '1px solid #f8fafc',
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? color : '#d1d5db', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: active ? 600 : 400, color: active ? '#2a3547' : '#5a6a85', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ws.name}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          {BRAND_TYPE_LABEL[ws.brand_type] || ws.brand_type}
                        </div>
                      </div>
                      {active && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
                <button
                  onClick={() => { setWsOpen(false); setCreateOpen(true); setCreateError('') }}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8, color: '#1a73e8',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Buat Workspace Baru</span>
                </button>
              </div>
            )}
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
                {(() => {
                  const count = item.key === 'plan' ? planCount : item.key === 'studio' ? studioCount : item.key === 'calendar' ? calendarCount : 0
                  const dotColor = item.key === 'plan' ? '#1a73e8' : item.key === 'studio' ? '#f59e0b' : '#a78bfa'
                  if (!count) return null
                  return collapsed
                    ? <span style={{ position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: '50%', background: dotColor, border: '1.5px solid #fff' }} />
                    : <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, background: dotColor, borderRadius: 9, fontSize: '0.6rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>{count > 99 ? '99+' : count}</span>
                })()}
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

        {/* Tooltip */}
        {tooltip && collapsed && (
          <div style={{ position: 'fixed', left: 76, top: tooltip.top, transform: 'translateY(-50%)', background: '#1e293b', color: '#fff', padding: '5px 11px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 500, pointerEvents: 'none', zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {tooltip.label}
          </div>
        )}
      </aside>

      {/* Create Workspace Modal */}
      {createOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420, boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2a3547', marginBottom: 4 }}>Buat Workspace Baru</div>
            <div style={{ fontSize: '0.8rem', color: '#9fa9ba', marginBottom: 20 }}>Setiap workspace punya brand & sprint sendiri.</div>
            {createError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', color: '#dc2626', fontSize: '0.82rem', fontWeight: 500, marginBottom: 4 }}>
                {createError}
                {(createError.includes('Batas') || createError.includes('belum aktif')) && (
                  <a href="/upgrade" style={{ display: 'block', marginTop: 6, color: '#1a73e8', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>Lihat pilihan upgrade →</a>
                )}
              </div>
            )}
            <form onSubmit={createWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nama Workspace / Brand</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Toko Herbal Ibu Sari"
                  required
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5eaf2', borderRadius: 9, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, color: '#111827', background: '#f9fafb' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Tipe Brand</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {BRAND_TYPES.map(bt => (
                    <label key={bt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1.5px solid ${createForm.brand_type === bt.id ? bt.color : '#e5eaf2'}`, borderRadius: 9, cursor: 'pointer', background: createForm.brand_type === bt.id ? `${bt.color}0d` : '#fff', transition: 'all 0.12s' }}>
                      <input type="radio" name="brand_type" value={bt.id} checked={createForm.brand_type === bt.id} onChange={() => setCreateForm(f => ({ ...f, brand_type: bt.id }))} style={{ accentColor: bt.color, width: 15, height: 15, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: createForm.brand_type === bt.id ? bt.color : '#2a3547' }}>{bt.label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9fa9ba' }}>{bt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setCreateOpen(false)} style={{ flex: 1, padding: '10px', border: '1.5px solid #e5eaf2', borderRadius: 9, background: '#fff', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>
                  Batal
                </button>
                <button type="submit" disabled={creating || !createForm.name.trim()} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: creating ? '#93c5fd' : '#1a73e8', color: '#fff', fontSize: '0.875rem', cursor: creating ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                  {creating ? 'Membuat...' : 'Buat Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
