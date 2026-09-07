'use client'

import { NOTIF_ICON_MAP } from '@/components/ui/Icons'

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
  riset:    { icon: 'riset', color: '#3b82f6', href: '/sprints' },
  naskah:   { icon: 'naskah', color: '#f59e0b', href: '/plan' },
  produksi: { icon: 'produksi', color: '#f97316', href: '/studio' },
  schedule: { icon: 'schedule', color: '#8b5cf6', href: '/calendar' },
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

const JABATAN_NOTIF_TYPES: Record<string, string[]> = {
  'Copywriter':   ['naskah', 'deadline'],
  'Videografer':  ['produksi', 'deadline'],
  'Editor':       ['produksi', 'deadline'],
  'Desainer':     ['produksi', 'deadline'],
  'Admin Sosmed': ['schedule', 'deadline'],
  'Social Media Specialist': ['schedule', 'deadline'],
  'Art Director': ['naskah', 'produksi', 'deadline'],
}

type Workspace = { id: string; name: string; plan: string; brand_type: string; myRole?: string }

const BRAND_TYPE_COLOR: Record<string, string> = {
  creator: '#1a73e8', affiliate: '#059669', business: '#7c3aed',
}
const BRAND_TYPE_LABEL: Record<string, string> = {
  creator: 'Creator', affiliate: 'Affiliate', business: 'Business',
}
const BRAND_TYPES = [
  { id: 'creator', label: 'Creator', desc: 'Konten kreator / personal brand' },
  { id: 'affiliate', label: 'Affiliate', desc: 'Affiliator produk & komisi' },
  { id: 'business', label: 'Business', desc: 'Brand toko / perusahaan' },
]

type Props = {
  user: { email: string; nama: string; avatar_url?: string }
  workspace?: Workspace | null
  workspaces?: Workspace[]
  role?: string
  jabatan?: string
}

export default function Topbar({ user, workspace, workspaces = [], role = 'owner', jabatan = '' }: Props) {
  const workspaceId = workspace?.id
  const allowedTypes = (role === 'owner' || role === 'admin') ? null : (JABATAN_NOTIF_TYPES[jabatan] ?? null)
  const pathname = usePathname()
  const router = useRouter()

  const [avatarError, setAvatarError] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  // Mobile workspace switcher
  const [wsSheetOpen, setWsSheetOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', brand_type: 'creator' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const page = Object.entries(PAGE_TITLES).find(([key]) => pathname.startsWith(key))?.[1] ?? { title: 'KreaFlow', sub: '' }
  const initials = user.nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  useEffect(() => {
    if (!workspaceId) return
    const supabase = createClient()
    async function fetchCount() {
      let q = supabase
        .from('kf_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_read', false)
      if (allowedTypes) q = q.in('type', allowedTypes)
      const { count } = await q
      setUnreadCount(count || 0)
    }
    fetchCount()
    const channel = supabase
      .channel(`topbar-notif-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kf_notifications', filter: `workspace_id=eq.${workspaceId}` }, () => fetchCount())
      .subscribe()
    const interval = setInterval(fetchCount, 300000)
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [workspaceId])

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
    let q = supabase
      .from('kf_notifications')
      .select('id, type, title, message, is_read, created_at, content_idea_id, task_id')
      .order('created_at', { ascending: false })
      .limit(20)
    if (workspaceId) q = q.eq('workspace_id', workspaceId)
    if (allowedTypes) q = q.in('type', allowedTypes)
    const { data } = await q
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
    let q = supabase.from('kf_notifications').update({ is_read: true }).eq('is_read', false)
    if (workspaceId) q = q.eq('workspace_id', workspaceId)
    if (allowedTypes) q = q.in('type', allowedTypes)
    await q
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function switchWorkspace(wsId: string) {
    if (wsId === workspace?.id) { setWsSheetOpen(false); return }
    setSwitching(true)
    await fetch('/api/workspace/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: wsId }),
    })
    setSwitching(false)
    setWsSheetOpen(false)
    router.refresh()
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
      setWsSheetOpen(false)
      router.refresh()
    } else if (data.needUpgrade) {
      setCreateError('Akun belum aktif. Silakan upgrade terlebih dahulu.')
    } else if (data.limitReached) {
      setCreateError(`Batas workspace tercapai (${data.maxWorkspaces}). Upgrade paket untuk tambah lebih banyak.`)
    } else {
      setCreateError(data.error || 'Gagal membuat workspace')
    }
  }

  async function deleteWorkspace() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    const res = await fetch('/api/workspace/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: deleteTarget.id }),
    })
    const data = await res.json()
    setDeleting(false)
    if (res.ok) {
      setDeleteTarget(null)
      setWsSheetOpen(false)
      router.refresh()
    } else {
      setDeleteError(data.error || 'Gagal menghapus workspace')
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
    <header className="kf-topbar" style={{
      height: 64,
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
      {/* Mobile brand — tap to open workspace switcher */}
      <button
        className="kf-topbar-brand"
        type="button"
        onClick={() => { setWsSheetOpen(true); setCreateOpen(false) }}
        style={{ alignItems: 'center', gap: 8, marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt="KreaFlow" style={{ height: 28, maxWidth: 110, objectFit: 'contain', objectPosition: 'left', flexShrink: 0 }} />
        {workspace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, textAlign: 'left' }}>
            <span style={{ fontSize: '0.68rem', color: '#1a73e8', fontWeight: 600, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, display: 'flex', alignItems: 'center', gap: 3 }}>
              {workspace.name}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        )}
      </button>

      {/* Desktop spacer */}
      <div style={{ flex: 1 }} />

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
                  <div style={{ padding: 36, textAlign: 'center', color: '#374151', fontSize: '0.82rem' }}>Memuat...</div>
                )}
                {!notifLoading && notifs.length === 0 && (
                  <div style={{ padding: 44, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div>
                    <div style={{ fontSize: '0.82rem', color: '#374151' }}>Belum ada notifikasi</div>
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
                      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 1 }}>{NOTIF_ICON_MAP[n.type] || <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9fa9ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 400 : 600, color: n.is_read ? '#5a6a85' : '#2a3547', marginBottom: 2, lineHeight: 1.4 }}>{n.title}</div>
                        {n.message && (
                          <div style={{ fontSize: '0.7rem', color: '#5a6a85', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, lineHeight: 1.4 }}>
                            {n.message}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: '#374151' }}>{relTime(n.created_at)}</span>
                          <Link
                            href={href}
                            onClick={() => { if (!n.is_read) markRead(n.id); setBellOpen(false) }}
                            style={{ fontSize: '0.68rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}
                          >
                            Buka →
                          </Link>
                          {!n.is_read && (
                            <button onClick={() => markRead(n.id)} style={{ fontSize: '0.65rem', color: '#5a6a85', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
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
            {user.avatar_url && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="avatar" onError={() => setAvatarError(true)} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #f1f5f9', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a73e8, #42a5f5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                border: '1px solid #f1f5f9',
              }}>
                {initials}
              </div>
            )}
            <span className="topbar-username" style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#5a6a85', whiteSpace: 'nowrap' }}>
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
                <div style={{ fontSize: '0.68rem', color: '#5a6a85', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
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

    {/* Mobile Workspace Switcher Sheet */}
    {wsSheetOpen && (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.45)' }}
        onClick={() => { setWsSheetOpen(false); setCreateOpen(false) }}
      >
        <div
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', maxHeight: '80vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: '#e5eaf2', borderRadius: 2, margin: '12px auto 0' }} />

          {/* Header */}
          <div style={{ padding: '14px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2a3547' }}>Pilih Workspace</div>
            <button type="button" onClick={() => { setWsSheetOpen(false); setCreateOpen(false) }}
              style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#6b7280', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Workspace list */}
          <div style={{ padding: '0 12px' }}>
            {switching ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.82rem', color: '#9ca3af' }}>Berpindah workspace...</div>
            ) : (
              workspaces.map(ws => {
                const active = ws.id === workspace?.id
                const color = BRAND_TYPE_COLOR[ws.brand_type] || '#1a73e8'
                const btLabel = BRAND_TYPE_LABEL[ws.brand_type] || ws.brand_type
                const canDelete = (ws.myRole === 'owner' || ws.myRole === 'admin') && workspaces.length > 1
                return (
                  <div key={ws.id}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 12, background: active ? `${color}10` : 'transparent', border: `1.5px solid ${active ? color + '40' : 'transparent'}`, marginBottom: 6 }}>
                    <button type="button" onClick={() => switchWorkspace(ws.id)}
                      style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color }}>{ws.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500, color: active ? '#111827' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
                        <div style={{ fontSize: '0.68rem', color, fontWeight: 600, marginTop: 1 }}>{btLabel}</div>
                      </div>
                      {active && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                    {canDelete && (
                      <button type="button" onClick={() => { setDeleteError(''); setDeleteTarget(ws) }} title="Hapus workspace"
                        style={{ flexShrink: 0, width: 32, height: 32, marginRight: 8, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c1c9d6' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Buat workspace baru */}
          <div style={{ padding: '8px 12px 0' }}>
            {!createOpen ? (
              <button type="button" onClick={() => setCreateOpen(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 10px', borderRadius: 12, border: '1.5px dashed #d1d5db', background: 'transparent', color: '#6b7280', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                Buat Workspace Baru
              </button>
            ) : (
              <form onSubmit={createWorkspace} style={{ background: '#f9fafb', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Workspace Baru</div>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama workspace..."
                  style={{ width: '100%', background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {BRAND_TYPES.map(bt => (
                    <button key={bt.id} type="button" onClick={() => setCreateForm(f => ({ ...f, brand_type: bt.id }))}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1.5px solid ${createForm.brand_type === bt.id ? (BRAND_TYPE_COLOR[bt.id] || '#1a73e8') : '#e5eaf2'}`, background: createForm.brand_type === bt.id ? `${BRAND_TYPE_COLOR[bt.id] || '#1a73e8'}12` : '#fff', color: createForm.brand_type === bt.id ? (BRAND_TYPE_COLOR[bt.id] || '#1a73e8') : '#6b7280', fontSize: '0.72rem', fontWeight: createForm.brand_type === bt.id ? 700 : 400, cursor: 'pointer' }}>
                      {bt.label}
                    </button>
                  ))}
                </div>
                {createError && <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>{createError}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setCreateOpen(false); setCreateError('') }}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={creating || !createForm.name.trim()}
                    style={{ flex: 2, padding: '9px', borderRadius: 8, background: '#1a73e8', border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', opacity: !createForm.name.trim() ? 0.6 : 1 }}>
                    {creating ? 'Membuat...' : 'Buat'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Delete Workspace Confirm Modal */}
    {deleteTarget && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null) }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 380, margin: '0 16px', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2a3547', marginBottom: 4 }}>Hapus Workspace?</div>
          <div style={{ fontSize: '0.82rem', color: '#5a6a85', marginBottom: 16, lineHeight: 1.5 }}>
            Yakin mau hapus <strong style={{ color: '#2a3547' }}>&quot;{deleteTarget.name}&quot;</strong>? Semua brand, sprint, naskah, jadwal, dan data lain di dalamnya akan terhapus permanen dan <strong>tidak bisa dikembalikan</strong>.
          </div>
          {deleteError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 500, marginBottom: 16 }}>
              {deleteError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: '10px', border: '1.5px solid #e5eaf2', borderRadius: 9, background: '#fff', color: '#5a6a85', fontSize: '0.85rem', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              Batal
            </button>
            <button type="button" onClick={deleteWorkspace} disabled={deleting} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: deleting ? '#fca5a5' : '#dc2626', color: '#fff', fontSize: '0.85rem', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
