'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

const NAV = [
  { href: '/brand', label: 'Brand', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
  { href: '/catalog', label: 'Catalog', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg> },
  { href: '/sprints', label: 'Sprints', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { href: '/plan', label: 'Plan', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { href: '/library', label: 'Library', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { href: '/studio', label: 'Studio', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/></svg> },
  { href: '/calendar', label: 'Calendar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { href: '/tasks', label: 'Tasks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { href: '/tracker', label: 'Tracker', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href: '/insights', label: 'Insights', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { href: '/budget', label: 'Budget', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { href: '/settings', label: 'Settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
]

const NOTIF_TYPE: Record<string, { icon: string; color: string; labelNew: string; labelOld: string }> = {
  riset:    { icon: '🔍', color: '#60a5fa', labelNew: '/sprints',       labelOld: '/tasks?view=sprint' },
  naskah:   { icon: '✍️', color: '#fbbf24', labelNew: '/plan',          labelOld: '/plan' },
  produksi: { icon: '🎨', color: '#f97316', labelNew: '/studio',        labelOld: '/studio' },
  schedule: { icon: '📅', color: '#a78bfa', labelNew: '/calendar',      labelOld: '/calendar' },
}

type NotifItem = {
  id: string
  type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
  content_idea_id: string | null
  task_id: string | null
}

function notifHref(n: NotifItem): string {
  const cfg = NOTIF_TYPE[n.type]
  if (!cfg) return '/tasks'
  return n.content_idea_id ? cfg.labelNew : cfg.labelOld
}

function relTime(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}j`
  return `${Math.floor(m / 1440)}h`
}

type Props = {
  user: { email: string; nama: string }
  workspace: { id: string; name: string; plan: string } | null
}

export default function Sidebar({ user, workspace }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [studioCount, setStudioCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    async function fetchCounts() {
      const [{ count: notifCount }, { count: studioReady }] = await Promise.all([
        supabase.from('kf_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('kf_content_ideas').select('*', { count: 'exact', head: true }).eq('status', 'Naskah Siap'),
      ])
      setUnreadCount(notifCount || 0)
      setStudioCount(studioReady || 0)
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    if (bellOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [bellOpen])

  async function openBell() {
    if (bellOpen) { setBellOpen(false); return }
    setBellOpen(true)
    setNotifLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('kf_notifications')
      .select('id, type, title, message, is_read, created_at, content_idea_id, task_id')
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data || [])
    setNotifLoading(false)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('kf_notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('kf_notifications').update({ is_read: true }).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{ width: 220, background: '#111', borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1f1f1f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.3px', color: '#f1f5f9', flex: 1 }}>KreaFlow</span>
          {/* Bell icon */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button onClick={openBell}
              style={{ background: bellOpen ? 'rgba(124,58,237,0.15)' : 'transparent', border: `1px solid ${bellOpen ? 'rgba(124,58,237,0.3)' : 'transparent'}`, borderRadius: 7, padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={bellOpen ? '#A78BFA' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14, background: '#ef4444', borderRadius: 7, fontSize: '0.55rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #111' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            {bellOpen && (
              <div style={{ position: 'fixed', top: 0, left: 220, width: 320, height: '100vh', background: '#0d0d0d', borderLeft: '1px solid #1f1f1f', borderRight: '1px solid #1f1f1f', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '4px 0 20px rgba(0,0,0,0.5)' }}>
                {/* Panel header */}
                <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>Notifikasi</div>
                    {unreadCount > 0 && <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 1 }}>{unreadCount} belum dibaca</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}>
                        Baca semua
                      </button>
                    )}
                    <button onClick={() => setBellOpen(false)} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '1rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                </div>

                {/* Panel body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {notifLoading && (
                    <div style={{ padding: 32, textAlign: 'center', color: '#334155', fontSize: '0.8rem' }}>Memuat...</div>
                  )}
                  {!notifLoading && notifs.length === 0 && (
                    <div style={{ padding: 32, textAlign: 'center', color: '#334155', fontSize: '0.8rem' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔔</div>
                      Belum ada notifikasi
                    </div>
                  )}
                  {!notifLoading && notifs.map(n => {
                    const cfg = NOTIF_TYPE[n.type]
                    const href = notifHref(n)
                    return (
                      <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid #111', background: n.is_read ? 'transparent' : 'rgba(124,58,237,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.95rem', flexShrink: 0, marginTop: 1 }}>{cfg?.icon || '📌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: n.is_read ? 400 : 700, color: n.is_read ? '#64748b' : '#e2e8f0', lineHeight: 1.4, marginBottom: 2 }}>{n.title}</div>
                          {n.message && <div style={{ fontSize: '0.68rem', color: '#334155', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{n.message}</div>}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.62rem', color: '#1f2937' }}>{relTime(n.created_at)}</span>
                            <Link href={href} onClick={() => { if (!n.is_read) markRead(n.id); setBellOpen(false) }}
                              style={{ fontSize: '0.65rem', color: cfg?.color || '#A78BFA', fontWeight: 600, textDecoration: 'none' }}>
                              Buka →
                            </Link>
                            {!n.is_read && (
                              <button onClick={() => markRead(n.id)} style={{ fontSize: '0.62rem', color: '#1f2937', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                                ✓ dibaca
                              </button>
                            )}
                          </div>
                        </div>
                        {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg?.color || '#A78BFA', flexShrink: 0, marginTop: 5 }} />}
                      </div>
                    )
                  })}
                </div>

                {/* Panel footer */}
                {notifs.length > 0 && (
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #1f1f1f', flexShrink: 0 }}>
                    <Link href="/notifications" onClick={() => setBellOpen(false)} style={{ fontSize: '0.72rem', color: '#475569', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                      Lihat semua notifikasi →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {workspace && (
          <div style={{ marginTop: 10, background: '#1a1a1a', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 2 }}>Workspace</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
            <div style={{ fontSize: '0.65rem', color: '#7C3AED', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{workspace.plan}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          const isStudio = item.href === '/studio'
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              color: active ? '#A78BFA' : '#94a3b8',
              background: active ? 'rgba(124,58,237,0.12)' : 'transparent',
              fontWeight: active ? 600 : 400, fontSize: '0.875rem', textDecoration: 'none',
              transition: 'all 0.15s', position: 'relative',
            }}>
              {item.icon}
              {item.label}
              {isStudio && studioCount > 0 && (
                <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, background: '#f59e0b', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {studioCount}
                </span>
              )}
            </Link>
          )
        })}
        {SUPER_ADMINS.includes(user.email) && (
          <>
            <div style={{ height: 1, background: '#1f1f1f', margin: '8px 4px' }} />
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
              color: pathname.startsWith('/admin') ? '#f87171' : '#64748b',
              background: pathname.startsWith('/admin') ? 'rgba(248,113,113,0.08)' : 'transparent',
              fontWeight: pathname.startsWith('/admin') ? 600 : 400, fontSize: '0.875rem', textDecoration: 'none',
              border: pathname.startsWith('/admin') ? '1px solid rgba(248,113,113,0.2)' : '1px solid transparent',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Super Admin
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1f1f1f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#1a1a1a', marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
            {user.nama.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nama}</div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </div>
    </aside>
  )
}
