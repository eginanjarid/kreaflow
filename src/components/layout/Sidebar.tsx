'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

const NAV = [
  { href: '/brand', label: 'Brand', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
  { href: '/catalog', label: 'Catalog', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg> },
  { href: '/sprints', label: 'Sprints', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { href: '/plan', label: 'Plan', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { href: '/library', label: 'Library', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
  { href: '/studio', label: 'Studio', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5M2 7h5M17 7h5M2 17h5M17 17h5"/></svg> },
  { href: '/calendar', label: 'Calendar', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { href: '/notifications', label: 'Notifikasi', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
  { href: '/tasks', label: 'Tasks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { href: '/tracker', label: 'Tracker', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { href: '/insights', label: 'Insights', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { href: '/budget', label: 'Budget', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { href: '/settings', label: 'Settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
]

type Props = {
  user: { email: string; nama: string }
  workspace: { id: string; name: string; plan: string } | null
}

export default function Sidebar({ user, workspace }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [studioCount, setStudioCount] = useState(0)

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
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.3px', color: '#f1f5f9' }}>KreaFlow</span>
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
              {item.href === '/notifications' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, background: '#ef4444', borderRadius: 10, fontSize: '0.62rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
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
