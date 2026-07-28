'use client'

import { NOTIF_ICON_MAP } from '@/components/ui/Icons'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Notif = {
  id: string
  workspace_id: string
  type: string
  title: string
  message: string | null
  content_idea_id: string | null
  task_id: string | null
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string; href: string }> = {
  riset:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  label: 'Riset',    icon: 'search', href: '/sprints' },
  naskah:   { color: '#d97706', bg: 'rgba(251,191,36,0.1)',  label: 'Naskah',   icon: 'pen', href: '/plan' },
  produksi: { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: 'Produksi', icon: 'palette', href: '/studio' },
  schedule: { color: '#a78bfa', bg: 'rgba(66,165,245,0.1)', label: 'Schedule', icon: 'calendar', href: '/calendar' },
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByDay(notifs: Notif[]) {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()
  const groups: Record<string, Notif[]> = {}
  for (const n of notifs) {
    const d = new Date(n.created_at).toDateString()
    const label = d === today ? 'Hari Ini' : d === yesterday ? 'Kemarin' : new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }
  return groups
}

export default function NotificationsModule({ initialNotifs, workspaceId }: {
  initialNotifs: Notif[]
  workspaceId: string
}) {
  const supabase = createClient()
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs)
  const [filter, setFilter] = useState<string>('all')
  const [marking, setMarking] = useState(false)

  const unread = notifs.filter(n => !n.is_read).length

  async function markRead(id: string) {
    await supabase.from('kf_notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    if (!unread) return
    setMarking(true)
    await supabase.from('kf_notifications').update({ is_read: true }).eq('workspace_id', workspaceId).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarking(false)
  }

  async function deleteNotif(id: string) {
    await supabase.from('kf_notifications').delete().eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const filtered = filter === 'all' ? notifs : filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs.filter(n => n.type === filter)
  const groups = groupByDay(filtered)
  const dayOrder = Object.keys(groups)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#2a3547', margin: 0 }}>Notifikasi</h1>
          {unread > 0 && <div style={{ fontSize: '0.75rem', color: '#5a6a85', marginTop: 2 }}>{unread} belum dibaca</div>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} disabled={marking}
            style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '7px 14px', color: '#5a6a85', fontSize: '0.78rem', cursor: 'pointer' }}>
            {marking ? 'Menandai...' : 'Tandai Semua Dibaca'}
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Semua' },
          { key: 'unread', label: `Belum Dibaca ${unread > 0 ? `(${unread})` : ''}` },
          { key: 'riset', label: 'Riset' },
          { key: 'naskah', label: 'Naskah' },
          { key: 'produksi', label: 'Produksi' },
          { key: 'schedule', label: 'Schedule' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f.key ? '#1a73e8' : '#e5eaf2'}`, background: filter === f.key ? 'rgba(26,115,232,0.15)' : 'transparent', color: filter === f.key ? '#1a73e8' : '#64748b', fontSize: '0.78rem', cursor: 'pointer', fontWeight: filter === f.key ? 700 : 400, transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5a6a85' }}>
          <div style={{ marginBottom: 12, color: '#5a6a85' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div>
          <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>Tidak ada notifikasi</div>
          <div style={{ fontSize: '0.8rem' }}>Notifikasi akan muncul saat ada aktivitas konten di sprint.</div>
        </div>
      )}

      {/* Groups */}
      {dayOrder.map(day => (
        <div key={day} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5a6a85', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{day}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groups[day].map(n => {
              const cfg = TYPE_CONFIG[n.type] || { color: '#5a6a85', bg: 'rgba(148,163,184,0.1)', label: n.type, icon: 'pin', href: '/sprints' }
              return (
                <div key={n.id}
                  style={{ background: n.is_read ? '#f8fafc' : '#fff', border: `1px solid ${n.is_read ? '#f1f5f9' : cfg.color + '30'}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'border-color 0.2s' }}>
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    {(()=>{const k=cfg.icon as string;return k==='search'?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>:k==='pen'?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>:k==='palette'?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>:k==='calendar'?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>})()}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: n.is_read ? 500 : 700, color: n.is_read ? '#374151' : '#f1f5f9', fontSize: '0.875rem', flex: 1 }}>{n.title}</span>
                      {!n.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                    {n.message && <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, lineHeight: 1.5 }}>{n.message}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', color: '#5a6a85' }}>{relativeTime(n.created_at)}</span>
                      <Link href={cfg.href}
                        onClick={() => { if (!n.is_read) markRead(n.id) }}
                        style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 600, textDecoration: 'none', padding: '2px 8px', borderRadius: 5, background: cfg.bg, border: `1px solid ${cfg.color}20` }}>
                        Buka {cfg.label} →
                      </Link>
                      {!n.is_read && (
                        <button onClick={() => markRead(n.id)}
                          style={{ fontSize: '0.68rem', color: '#5a6a85', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Tandai dibaca
                        </button>
                      )}
                      <button onClick={() => deleteNotif(n.id)}
                        style={{ fontSize: '0.68rem', color: '#5a6a85', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
