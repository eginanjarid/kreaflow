'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ContentItem = {
  id: string
  workspace_id: string
  product_id: string
  pillar_id: string
  judul: string
  format: string
  platform: string[]
  hook: string
  body: string
  cta: string
  hashtags: string[]
  script: string
  prompt_script: string
  status: string
  scheduled_date: string
  canva_url?: string
  gdrive_url?: string
  preview_url?: string
  studio_notes?: string
  studio_done_at?: string
  show_in_feed?: boolean
}

type Product = { id: string; nama: string }

type Notification = {
  id: string
  type: string
  title: string
  message: string | null
  content_idea_id: string | null
  is_read: boolean
  created_at: string
}

type Tab = 'antrian' | 'dikerjakan' | 'selesai'

const STATUS_STAGE: Record<string, Tab> = {
  'Naskah Siap': 'antrian',
  'Produksi': 'dikerjakan',
  'Siap Tayang': 'selesai',
}

function extractGdriveId(url: string): string | null {
  if (!url) return null
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function getThumbnail(item: ContentItem): string | null {
  if (item.preview_url) {
    const id = extractGdriveId(item.preview_url)
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`
    return item.preview_url
  }
  if (item.gdrive_url) {
    const id = extractGdriveId(item.gdrive_url)
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`
  }
  return null
}

function NaskahModal({ item, products, onClose, onUpdate }: {
  item: ContentItem; products: Product[]; onClose: () => void; onUpdate: (updated: ContentItem) => void
}) {
  const supabase = createClient()
  const router = useRouter()
  const [canvaUrl, setCanvaUrl] = useState(item.canva_url || '')
  const [gdriveUrl, setGdriveUrl] = useState(item.gdrive_url || '')
  const [previewUrl, setPreviewUrl] = useState(item.preview_url || '')
  const [notes, setNotes] = useState(item.studio_notes || '')
  const [saving, setSaving] = useState(false)
  const [marking, setMarking] = useState(false)

  const product = products.find(p => p.id === item.product_id)

  async function handleSave() {
    setSaving(true)
    const payload: Partial<ContentItem> = {
      canva_url: canvaUrl || undefined,
      gdrive_url: gdriveUrl || undefined,
      preview_url: previewUrl || undefined,
      studio_notes: notes || undefined,
      status: 'Produksi',
    }
    await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
    await supabase.from('kf_notifications').update({ is_read: true })
      .eq('content_idea_id', item.id).eq('type', 'produksi')
    setSaving(false)
    onUpdate({ ...item, ...payload })
    router.refresh()
  }

  async function handleSelesai() {
    setMarking(true)
    await supabase.from('kf_content_ideas').update({
      canva_url: canvaUrl || undefined,
      gdrive_url: gdriveUrl || undefined,
      preview_url: previewUrl || undefined,
      studio_notes: notes || undefined,
      status: 'Siap Tayang',
      studio_done_at: new Date().toISOString(),
    }).eq('id', item.id)

    await supabase.from('kf_notifications').insert({
      workspace_id: item.workspace_id,
      type: 'schedule',
      title: `Siap Schedule — ${item.judul}`,
      message: item.scheduled_date ? `Jadwal tayang: ${item.scheduled_date}` : 'Belum ada jadwal tayang',
      content_idea_id: item.id,
    })
    await supabase.from('kf_notifications').update({ is_read: true })
      .eq('content_idea_id', item.id).eq('type', 'produksi')

    setMarking(false)
    onClose()
    router.refresh()
  }

  const caption = [item.hook, item.body, item.cta].filter(Boolean).join('\n\n')

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 820, maxHeight: '92vh', overflowY: 'auto', background: '#111', borderRadius: 16, border: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #1f1f1f' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{item.judul}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product && <span style={{ fontSize: '0.72rem', background: 'rgba(124,58,237,0.15)', color: '#A78BFA', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{product.nama}</span>}
              {item.format && <span style={{ fontSize: '0.72rem', background: '#1a1a1a', color: '#64748b', padding: '2px 8px', borderRadius: 4 }}>{item.format}</span>}
              {(item.platform || []).map(p => (
                <span key={p} style={{ fontSize: '0.72rem', background: '#1a1a1a', color: '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>{p}</span>
              ))}
              {item.scheduled_date && <span style={{ fontSize: '0.72rem', background: 'rgba(251,146,60,0.1)', color: '#fb923c', padding: '2px 8px', borderRadius: 4 }}>📅 {item.scheduled_date}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', padding: 4, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Kiri: Naskah */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid #1f1f1f' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Naskah dari Copywriter</div>

            {item.hook && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Hook</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, background: '#0d0d0d', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid #7C3AED' }}>{item.hook}</div>
              </div>
            )}
            {item.body && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Body</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, background: '#0d0d0d', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{item.body}</div>
              </div>
            )}
            {item.cta && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>CTA</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, background: '#0d0d0d', padding: '10px 12px', borderRadius: 8 }}>{item.cta}</div>
              </div>
            )}
            {item.script && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Script / Naskah Lengkap</div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.7, background: '#0d0d0d', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{item.script}</div>
              </div>
            )}
            {(item.hashtags || []).length > 0 && (
              <div>
                <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Hashtag</div>
                <div style={{ fontSize: '0.78rem', color: '#3b82f6', lineHeight: 1.6 }}>{item.hashtags.join(' ')}</div>
              </div>
            )}
          </div>

          {/* Kanan: Input Hasil */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Input Hasil Produksi</div>

            {getThumbnail(item) && (
              <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: '#0d0d0d' }}>
                <img src={getThumbnail(item)!} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Canva Link</label>
              <input value={canvaUrl} onChange={e => setCanvaUrl(e.target.value)}
                placeholder="https://www.canva.com/design/..."
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Google Drive Link</label>
              <input value={gdriveUrl} onChange={e => setGdriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Preview URL (thumbnail)</label>
              <input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)}
                placeholder="Link gambar/thumbnail untuk preview..."
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Catatan Studio</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Revisi, catatan untuk scheduler, dll..."
                rows={3}
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#f1f5f9', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Menyimpan...' : '💾 Simpan Progress'}
              </button>
              <button onClick={handleSelesai} disabled={marking}
                style={{ padding: '10px', background: 'linear-gradient(135deg, #059669, #34d399)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>
                {marking ? 'Memproses...' : '✅ Tandai Selesai → Notif Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentCard({ item, products, onClick }: { item: ContentItem; products: Product[]; onClick: () => void }) {
  const thumb = getThumbnail(item)
  const product = products.find(p => p.id === item.product_id)
  const stage = STATUS_STAGE[item.status]

  const stageColor: Record<Tab, string> = {
    antrian: '#f59e0b',
    dikerjakan: '#3b82f6',
    selesai: '#22c55e',
  }
  const stageLabel: Record<Tab, string> = {
    antrian: 'Antrian',
    dikerjakan: 'Dikerjakan',
    selesai: 'Selesai',
  }

  return (
    <div onClick={onClick}
      style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C3AED')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f1f1f')}>

      {/* Thumbnail */}
      <div style={{ aspectRatio: '16/9', background: '#0d0d0d', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {thumb
          ? <img src={thumb} alt={item.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span style={{ fontSize: '0.65rem', color: '#2a2a2a' }}>Belum ada preview</span>
            </div>
          )
        }
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.65rem', fontWeight: 700, color: '#fff', background: stageColor[stage], padding: '2px 8px', borderRadius: 4 }}>
          {stageLabel[stage]}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>
          {item.judul || '(Tanpa judul)'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {product && <span style={{ fontSize: '0.68rem', color: '#A78BFA', background: 'rgba(124,58,237,0.12)', padding: '2px 6px', borderRadius: 3 }}>{product.nama}</span>}
          {item.format && <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#1a1a1a', padding: '2px 6px', borderRadius: 3 }}>{item.format}</span>}
          {(item.platform || []).slice(0, 2).map(p => (
            <span key={p} style={{ fontSize: '0.68rem', color: '#64748b', background: '#1a1a1a', padding: '2px 6px', borderRadius: 3 }}>{p}</span>
          ))}
        </div>
        {item.hook && (
          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.hook}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          {item.scheduled_date
            ? <span style={{ fontSize: '0.68rem', color: '#fb923c' }}>📅 {item.scheduled_date}</span>
            : <span style={{ fontSize: '0.68rem', color: '#334155' }}>Belum dijadwalkan</span>
          }
          <span style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 600 }}>Buka →</span>
        </div>
      </div>
    </div>
  )
}

function NotifPanel({ notifications, onClose, onMarkRead }: {
  notifications: Notification[]; onClose: () => void; onMarkRead: (id: string) => void
}) {
  const NOTIF_ICON: Record<string, string> = {
    riset: '🔍', naskah: '✍️', produksi: '🎨', schedule: '📅'
  }
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, background: '#111', borderLeft: '1px solid #1f1f1f', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #1f1f1f' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Notifikasi</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {notifications.length === 0
          ? <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.82rem', marginTop: 40 }}>Tidak ada notifikasi</div>
          : notifications.map(n => (
            <div key={n.id}
              style={{ background: '#0d0d0d', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #1f1f1f', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>{NOTIF_ICON[n.type] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{n.title}</div>
                {n.message && <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{n.message}</div>}
                <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button onClick={() => onMarkRead(n.id)}
                style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0, padding: '2px 4px' }}>
                ✓
              </button>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default function StudioModule({ initialContents, products, initialNotifications, workspaceId }: {
  initialContents: ContentItem[]
  products: Product[]
  initialNotifications: Notification[]
  workspaceId: string
}) {
  const supabase = createClient()
  const [contents, setContents] = useState<ContentItem[]>(initialContents)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [tab, setTab] = useState<Tab>('antrian')
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [showNotif, setShowNotif] = useState(false)

  const filtered = contents.filter(c => STATUS_STAGE[c.status] === tab)
  const unread = notifications.filter(n => !n.is_read).length

  async function markRead(id: string) {
    await supabase.from('kf_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  function handleUpdate(updated: ContentItem) {
    setContents(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedItem(updated)
  }

  const TAB_CONFIG: { key: Tab; label: string; color: string }[] = [
    { key: 'antrian', label: 'Antrian', color: '#f59e0b' },
    { key: 'dikerjakan', label: 'Sedang Dikerjakan', color: '#3b82f6' },
    { key: 'selesai', label: 'Selesai', color: '#22c55e' },
  ]

  const antriCount = contents.filter(c => STATUS_STAGE[c.status] === 'antrian').length
  const dikerjakanCount = contents.filter(c => STATUS_STAGE[c.status] === 'dikerjakan').length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Studio</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Ruang kerja desainer & editor — lihat naskah, input hasil produksi, tandai selesai</p>
        </div>
        <button onClick={() => setShowNotif(v => !v)}
          style={{ position: 'relative', background: unread > 0 ? 'rgba(124,58,237,0.12)' : '#1a1a1a', border: `1px solid ${unread > 0 ? '#7C3AED' : '#2a2a2a'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Notifikasi</span>
          {unread > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, background: '#ef4444', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #1f1f1f', paddingBottom: 0 }}>
        {TAB_CONFIG.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer',
              color: tab === t.key ? t.color : '#475569',
              fontWeight: tab === t.key ? 700 : 400, fontSize: '0.875rem',
              borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}>
            {t.label}
            {t.key === 'antrian' && antriCount > 0 && (
              <span style={{ marginLeft: 6, background: '#f59e0b', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{antriCount}</span>
            )}
            {t.key === 'dikerjakan' && dikerjakanCount > 0 && (
              <span style={{ marginLeft: 6, background: '#3b82f6', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{dikerjakanCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>
              {tab === 'antrian' ? '✍️' : tab === 'dikerjakan' ? '🎨' : '✅'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>
              {tab === 'antrian' ? 'Belum ada naskah yang siap diproduksi' : tab === 'dikerjakan' ? 'Tidak ada konten sedang dikerjakan' : 'Belum ada konten selesai'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#1e293b' }}>
              {tab === 'antrian' ? 'Setelah copywriter simpan naskah di Plan, konten akan muncul di sini' : ''}
            </div>
          </div>
        )
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(item => (
              <ContentCard key={item.id} item={item} products={products} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
        )
      }

      {/* Naskah modal */}
      {selectedItem && (
        <NaskahModal
          item={selectedItem}
          products={products}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Notif panel */}
      {showNotif && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowNotif(false)} />
          <NotifPanel
            notifications={notifications}
            onClose={() => setShowNotif(false)}
            onMarkRead={markRead}
          />
        </>
      )}
    </div>
  )
}
