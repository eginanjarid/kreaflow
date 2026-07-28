'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  '/brand':         { title: 'Brand',        sub: 'Bangun identitas & strategi konten' },
  '/catalog':       { title: 'Catalog',       sub: 'Database produk affiliate kamu' },
  '/sprints':       { title: 'Sprints',       sub: 'Kelola produksi konten per sprint' },
  '/plan':          { title: 'Plan',          sub: 'Buat naskah & skrip dengan AI' },
  '/library':       { title: 'Library',       sub: 'Arsip semua konten kamu' },
  '/studio':        { title: 'Studio',        sub: 'Produksi visual & editing' },
  '/calendar':      { title: 'Calendar',      sub: 'Jadwal & antrian posting' },
  '/tracker':       { title: 'Tracker',       sub: 'Pantau performa harian' },
  '/insights':      { title: 'Insights',      sub: 'Analitik konten per platform' },
  '/budget':        { title: 'Budget',        sub: 'Tracking biaya produksi' },
  '/settings':      { title: 'Pengaturan',    sub: 'Kelola workspace & tim' },
  '/notifications': { title: 'Notifikasi',    sub: 'Semua update aktivitas' },
  '/admin':         { title: 'Super Admin',   sub: 'Panel manajemen internal' },
}

const NOTIF_TYPE: Record<string, { icon: string; color: string; href: string }> = {
  riset:    { icon: '🔍', color: '#3b82f6', href: '/sprints' },
  naskah:   { icon: '✍️', color: '#f59e0b', href: '/plan' },
  produksi: { icon: '🎨', color: '#f97316', href: '/studio' },
  schedule: { icon: '📅', color: '#8b5cf6', href: '/calendar' },
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

function relTime(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m}m lalu`
  if (m < 1440) return `${Math.floor(m / 60)}j lalu`
  return `${Math.floor(m / 1440)}h lalu`
}

type Props = {
  user: { email: string; nama: string }
}

export default function Topbar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const page = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? { title: 'KreaFlow', sub: '' }
  const initials = user.nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    const supabase = createClient()
    async function fetchCount() {
      const { count } = await supabase
        .from('kf_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

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
    <header style={{
      height: 72,
      background: '#fff',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      flexShrink: 0,
      gap: 0,
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Left: Hamburger + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginRight: 24 }}>
        <button style={{
          background: 'none', border: 'none', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#5a6a85',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button style={{
          background: 'none', border: 'none', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#5a6a85',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>

      {/* Middle: Quick Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
        {[
          { href: '/sprints', label: 'Sprints' },
          { href: '/plan', label: 'Plan' },
          { href: '/studio', label: 'Studio' },
          { href: '/calendar', label: 'Calendar' },
        ].map(link => {
          const active = pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} style={{
              fontSize: '0.9375rem', fontWeight: active ? 600 : 500,
              color: active ? '#1a73e8' : '#5a6a85',
              textDecoration: 'none', transition: 'color 0.15s',
            }}>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={openBell}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: bellOpen ? '#e8f0fe' : '#f5f7fb',
              border: `1px solid ${bellOpen ? '#c5d8fb' : '#e5eaf2'}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={bellOpen ? '#1a73e8' : '#5a6a85'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 17, height: 17,
                background: '#ef4444', borderRadius: 9,
                fontSize: '0.58rem', fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px', border: '2px solid #fff',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notif dropdown */}
          {bellOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 340, maxHeight: 460,
              background: '#fff', border: '1px solid #e5eaf2',
              borderRadius: 14, boxShadow: '0 8px 32px rgba(42,53,71,0.12)',
              zIndex: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#2a3547', fontSize: '0.88rem' }}>Notifikasi</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', background: '#1a73e8', borderRadius: 8, padding: '1px 6px' }}>{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                    Baca semua
                  </button>
                )}
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {notifLoading && (
                  <div style={{ padding: 36, textAlign: 'center', color: '#c8d1e0', fontSize: '0.82rem' }}>Memuat...</div>
                )}
                {!notifLoading && notifs.length === 0 && (
                  <div style={{ padding: 44, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
                    <div style={{ fontSize: '0.82rem', color: '#c8d1e0' }}>Belum ada notifikasi</div>
                  </div>
                )}
                {!notifLoading && notifs.map(n => {
                  const cfg = NOTIF_TYPE[n.type]
                  const href = cfg?.href || '/sprints'
                  return (
                    <div key={n.id} style={{
                      padding: '10px 16px', borderBottom: '1px solid #f8fafc',
                      background: n.is_read ? '#fff' : '#f0f7ff',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{cfg?.icon || '📌'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 400 : 600, color: n.is_read ? '#5a6a85' : '#2a3547', marginBottom: 2, lineHeight: 1.4 }}>{n.title}</div>
                        {n.message && (
                          <div style={{ fontSize: '0.7rem', color: '#9fa9ba', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, lineHeight: 1.4 }}>
                            {n.message}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: '#c8d1e0' }}>{relTime(n.created_at)}</span>
                          <Link
                            href={href}
                            onClick={() => { if (!n.is_read) markRead(n.id); setBellOpen(false) }}
                            style={{ fontSize: '0.68rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}
                          >
                            Buka →
                          </Link>
                          {!n.is_read && (
                            <button onClick={() => markRead(n.id)} style={{ fontSize: '0.65rem', color: '#9fa9ba', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                      {!n.is_read && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg?.color || '#1a73e8', flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              {notifs.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', flexShrink: 0 }}>
                  <Link href="/notifications" onClick={() => setBellOpen(false)} style={{ fontSize: '0.75rem', color: '#1a73e8', textDecoration: 'none', fontWeight: 500 }}>
                    Lihat semua notifikasi →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: '#e5eaf2', margin: '0 4px' }} />

        {/* User */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 6px 6px',
              background: userOpen ? '#f5f7fb' : 'transparent',
              border: 'none',
              borderRadius: 10, cursor: 'pointer',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a73e8, #42a5f5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
              border: '1px solid #f1f5f9',
            }}>
              {initials}
            </div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#5a6a85', whiteSpace: 'nowrap' }}>
              Hi, <strong style={{ fontWeight: 700, color: '#2a3547' }}>{user.nama.split(' ')[0]}</strong>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9fa9ba" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {userOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 210, background: '#fff',
              border: '1px solid #e5eaf2', borderRadius: 12,
              boxShadow: '0 4px 20px rgba(42,53,71,0.1)', zIndex: 400, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2a3547' }}>{user.nama}</div>
                <div style={{ fontSize: '0.68rem', color: '#9fa9ba', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <div style={{ padding: '6px' }}>
                <Link
                  href="/settings"
                  onClick={() => setUserOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, color: '#5a6a85', fontSize: '0.82rem', textDecoration: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                  Pengaturan
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, color: '#ef4444', fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
