'use client'

import { NOTIF_ICON_MAP } from '@/components/ui/Icons'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ContentItem = {
  id: string; workspace_id: string; product_id: string; pillar_id: string
  judul: string; format: string; platform: string[]; hook: string; body: string
  cta: string; hashtags: string[]; script: string; prompt_script: string
  status: string; scheduled_date: string; canva_url?: string; gdrive_url?: string
  preview_url?: string; studio_notes?: string; studio_done_at?: string; show_in_feed?: boolean
  sprint_id?: string | null; step_log?: Record<string, string> | null
}
type Product = { id: string; nama: string }
type Notification = { id: string; type: string; title: string; message: string | null; content_idea_id: string | null; is_read: boolean; created_at: string }
type Tab = 'antrian' | 'dikerjakan' | 'selesai'
type ViewMode = 'cards' | 'ig' | 'feed'
type IGTab = 'grid' | 'reels' | 'tagged'

const STATUS_STAGE: Record<string, Tab> = { 'Naskah Siap': 'antrian', 'Produksi': 'dikerjakan', 'Siap Tayang': 'selesai' }
const STATUS_COLOR: Record<string, string> = { Draft: '#5a6a85', 'Naskah Siap': '#f59e0b', Produksi: '#3b82f6', 'Siap Tayang': '#22c55e', Terjadwal: '#a855f7', Tayang: '#6b21a8' }
const STATUS_BG: Record<string, string> = { Draft: '#f1f5f9', 'Naskah Siap': 'rgba(245,158,11,0.12)', Produksi: 'rgba(59,130,246,0.12)', 'Siap Tayang': 'rgba(34,197,94,0.12)', Terjadwal: 'rgba(168,85,247,0.12)', Tayang: 'rgba(107,33,168,0.15)' }
const VIDEO_FORMATS = ['Reels', 'Video Pendek', 'Live']

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

function ThumbnailPlaceholder({ item }: { item: ContentItem }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5eaf2" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span style={{ fontSize: '0.58rem', color: '#e5eaf2', textAlign: 'center', lineHeight: 1.3 }}>{item.format || 'Preview'}</span>
    </div>
  )
}

function IGPostPreview({ item, workspaceName, onEdit, onClose }: { item: ContentItem; workspaceName: string; onEdit: () => void; onClose: () => void }) {
  const thumb = getThumbnail(item)
  const handle = workspaceName.toLowerCase().replace(/\s+/g, '')
  const initial = workspaceName.charAt(0).toUpperCase()
  const caption = [item.hook, item.body, item.cta].filter(Boolean).join('\n\n') || item.judul
  const hashtags = (item.hashtags || []).join(' ')
  const fakeLikes = Math.floor(Math.random() * 900) + 100

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 390, maxHeight: '92vh', overflowY: 'auto', background: '#000', borderRadius: 20, border: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2a3547' }}>{handle}</div>
            <div style={{ fontSize: '0.68rem', color: '#5a6a85' }}>Original audio</div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>Ikuti</span>
          <span style={{ color: '#5a6a85', fontSize: '1.1rem', cursor: 'pointer' }}>···</span>
        </div>
        <div style={{ width: '100%', aspectRatio: '4/5', background: '#fff', position: 'relative', overflow: 'hidden' }}>
          {thumb ? <img src={thumb} alt={item.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ThumbnailPlaceholder item={item} />}
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>
        <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <div style={{ flex: 1 }} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div style={{ paddingInline: 14, fontSize: '0.82rem', fontWeight: 700, color: '#2a3547', marginBottom: 4 }}>{fakeLikes.toLocaleString()} suka</div>
        {caption && <div style={{ paddingInline: 14, fontSize: '0.82rem', color: '#2a3547', lineHeight: 1.5, marginBottom: 4 }}><span style={{ fontWeight: 700, marginRight: 6 }}>{handle}</span><span style={{ whiteSpace: 'pre-wrap' }}>{caption.length > 150 ? caption.slice(0, 150) + '...' : caption}</span></div>}
        {hashtags && <div style={{ paddingInline: 14, fontSize: '0.8rem', color: '#3b82f6', marginBottom: 4 }}>{hashtags}</div>}
        <div style={{ paddingInline: 14, marginBottom: 6 }}>
          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[item.status] || '#5a6a85', background: STATUS_BG[item.status] || '#f1f5f9', fontWeight: 600 }}>{item.status}</span>
          {item.format && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#5a6a85' }}>{item.format}</span>}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#5a6a85', paddingInline: 14, marginBottom: 10 }}>{item.scheduled_date ? `Dijadwalkan: ${item.scheduled_date}` : 'Belum dijadwalkan'}</div>
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 16px', borderTop: '1px solid #1a1a1a' }}>
          <button onClick={onEdit} style={{ flex: 1, background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: 9, color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Input Hasil</button>
          {item.canva_url && <a href={item.canva_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: 9, color: '#42a5f5', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Canva ↗</a>}
          {item.gdrive_url && <a href={item.gdrive_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: 9, color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Drive ↗</a>}
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#5a6a85', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
        </div>
      </div>
    </div>
  )
}

function IGReelsPreview({ item, workspaceName, onEdit, onClose }: { item: ContentItem; workspaceName: string; onEdit: () => void; onClose: () => void }) {
  const thumb = getThumbnail(item)
  const handle = workspaceName.toLowerCase().replace(/\s+/g, '')
  const initial = workspaceName.charAt(0).toUpperCase()
  const caption = [item.hook, item.body, item.cta].filter(Boolean).join(' ') || item.judul
  const hashtags = (item.hashtags || []).join(' ')
  const fakeLikes = Math.floor(Math.random() * 9000) + 1000
  const fakeComments = Math.floor(Math.random() * 500) + 50

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, flexDirection: 'column', gap: 12 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 340, height: 604, borderRadius: 18, overflow: 'hidden', background: '#000', border: '1px solid #e5eaf2', flexShrink: 0 }}>
        {thumb ? <img src={thumb} alt={item.judul} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ position: 'absolute', inset: 0 }}><ThumbnailPlaceholder item={item} /></div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.15) 45%,rgba(0,0,0,0.35) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '14px 14px 0' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></button>
          <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Reels</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ cursor: 'pointer' }}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 10, bottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>{fakeLikes.toLocaleString()}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>{fakeComments}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg><span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>Kirim</span></div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 48, padding: '0 14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>{initial}</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{handle}</span>
            <span style={{ color: '#fff', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Ikuti</span>
          </div>
          {caption && <div style={{ color: '#fff', fontSize: '0.78rem', lineHeight: 1.4, marginBottom: 6 }}>{caption.length > 100 ? caption.slice(0, 100) + '…' : caption}</div>}
          {hashtags && <div style={{ color: '#93c5fd', fontSize: '0.73rem', marginBottom: 8 }}>{hashtags.length > 60 ? hashtags.slice(0, 60) + '…' : hashtags}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <span style={{ color: '#2a3547', fontSize: '0.7rem' }}>Audio original · {handle}</span>
          </div>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(30,30,30,0.9)', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', color: STATUS_COLOR[item.status] || '#5a6a85', fontWeight: 600 }}>{item.status}</span>
          {item.scheduled_date && <span style={{ fontSize: '0.65rem', color: '#5a6a85' }}>· {item.scheduled_date}</span>}
        </div>
        <button onClick={onEdit} style={{ background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Input Hasil</button>
        {item.canva_url && <a href={item.canva_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 14px', color: '#42a5f5', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>Canva ↗</a>}
        {item.gdrive_url && <a href={item.gdrive_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 14px', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>Drive ↗</a>}
        <button onClick={onClose} style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 12px', color: '#5a6a85', fontSize: '0.78rem', cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  )
}

function NaskahModal({ item, products, onClose, onUpdate }: { item: ContentItem; products: Product[]; onClose: () => void; onUpdate: (updated: ContentItem) => void }) {
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
    const payload = { canva_url: canvaUrl || undefined, gdrive_url: gdriveUrl || undefined, preview_url: previewUrl || undefined, studio_notes: notes || undefined, status: 'Produksi' }
    await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
    await supabase.from('kf_notifications').update({ is_read: true }).eq('content_idea_id', item.id).eq('type', 'produksi')
    setSaving(false)
    onUpdate({ ...item, ...payload })
    router.refresh()
  }

  async function handleSelesai() {
    setMarking(true)
    const now = new Date().toISOString()
    const stepLogUpdate = item.sprint_id
      ? { step_log: { ...(item.step_log || {}), editing_done_at: now } }
      : {}
    await supabase.from('kf_content_ideas').update({ canva_url: canvaUrl || undefined, gdrive_url: gdriveUrl || undefined, preview_url: previewUrl || undefined, studio_notes: notes || undefined, status: 'Siap Tayang', studio_done_at: now, ...stepLogUpdate }).eq('id', item.id)
    await supabase.from('kf_notifications').insert({ workspace_id: item.workspace_id, type: 'schedule', title: `Siap Schedule — ${item.judul}`, message: item.scheduled_date ? `Jadwal tayang: ${item.scheduled_date}` : 'Belum ada jadwal tayang', content_idea_id: item.id })
    await supabase.from('kf_notifications').update({ is_read: true }).eq('content_idea_id', item.id).eq('type', 'produksi')
    setMarking(false)
    onClose()
    router.refresh()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 820, maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 6px 30px rgba(42,53,71,0.10)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #e5eaf2' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2a3547', marginBottom: 4 }}>{item.judul}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product && <span style={{ fontSize: '0.72rem', background: 'rgba(26,115,232,0.15)', color: '#42a5f5', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{product.nama}</span>}
              {item.format && <span style={{ fontSize: '0.72rem', background: '#f8fafc', color: '#5a6a85', padding: '2px 8px', borderRadius: 4 }}>{item.format}</span>}
              {(item.platform || []).map(p => <span key={p} style={{ fontSize: '0.72rem', background: '#f8fafc', color: '#5a6a85', padding: '2px 8px', borderRadius: 4 }}>{p}</span>)}
              {item.scheduled_date && <span style={{ fontSize: '0.72rem', background: 'rgba(251,146,60,0.1)', color: '#fb923c', padding: '2px 8px', borderRadius: 4 }}>{item.scheduled_date}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer', padding: 4, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div style={{ padding: '20px 24px', borderRight: '1px solid #e5eaf2' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Naskah Copywriter</div>
            {item.hook && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Hook</div><div style={{ fontSize: '0.85rem', color: '#2a3547', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid #1a73e8' }}>{item.hook}</div></div>}
            {item.body && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Body</div><div style={{ fontSize: '0.85rem', color: '#2a3547', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{item.body}</div></div>}
            {item.cta && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>CTA</div><div style={{ fontSize: '0.85rem', color: '#2a3547', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8 }}>{item.cta}</div></div>}
            {item.script && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Script Lengkap</div><div style={{ fontSize: '0.82rem', color: '#5a6a85', lineHeight: 1.7, background: '#fff', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{item.script}</div></div>}
            {(item.hashtags || []).length > 0 && <div><div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Hashtag</div><div style={{ fontSize: '0.78rem', color: '#3b82f6', lineHeight: 1.6 }}>{item.hashtags.join(' ')}</div></div>}
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Input Hasil Produksi</div>
            {getThumbnail(item) && <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: '#fff' }}><img src={getThumbnail(item)!} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#5a6a85', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Canva Link</label><input value={canvaUrl} onChange={e => setCanvaUrl(e.target.value)} placeholder="https://www.canva.com/design/..." style={{ width: '100%', background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#2a3547', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#5a6a85', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Google Drive Link</label><input value={gdriveUrl} onChange={e => setGdriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." style={{ width: '100%', background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#2a3547', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#5a6a85', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Preview URL (thumbnail)</label><input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} placeholder="Link GDrive thumbnail..." style={{ width: '100%', background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#2a3547', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} /></div>
            <div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#5a6a85', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Catatan Studio</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Revisi, catatan untuk scheduler..." rows={3} style={{ width: '100%', background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#2a3547', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{ padding: 10, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, color: '#2a3547', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Menyimpan...' : 'Simpan Progress'}</button>
              <button onClick={handleSelesai} disabled={marking} style={{ padding: 10, background: 'linear-gradient(135deg,#059669,#34d399)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>{marking ? 'Memproses...' : 'Tandai Selesai'}</button>
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
  const stageColor: Record<Tab, string> = { antrian: '#f59e0b', dikerjakan: '#3b82f6', selesai: '#22c55e' }
  const stageLabel: Record<Tab, string> = { antrian: 'Antrian', dikerjakan: 'Dikerjakan', selesai: 'Selesai' }

  return (
    <div onClick={onClick} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a73e8')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5eaf2')}>
      <div style={{ aspectRatio: '16/9', background: '#fff', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {thumb ? <img src={thumb} alt={item.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={item} />}
        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.65rem', fontWeight: 700, color: '#fff', background: stageColor[stage], padding: '2px 8px', borderRadius: 4 }}>{stageLabel[stage]}</div>
      </div>
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2a3547', lineHeight: 1.3 }}>{item.judul || '(Tanpa judul)'}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {product && <span style={{ fontSize: '0.68rem', color: '#42a5f5', background: 'rgba(26,115,232,0.12)', padding: '2px 6px', borderRadius: 3 }}>{product.nama}</span>}
          {item.format && <span style={{ fontSize: '0.68rem', color: '#5a6a85', background: '#f8fafc', padding: '2px 6px', borderRadius: 3 }}>{item.format}</span>}
          {(item.platform || []).slice(0, 2).map(p => <span key={p} style={{ fontSize: '0.68rem', color: '#5a6a85', background: '#f8fafc', padding: '2px 6px', borderRadius: 3 }}>{p}</span>)}
        </div>
        {item.hook && <div style={{ fontSize: '0.78rem', color: '#5a6a85', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.hook}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          {item.scheduled_date ? <span style={{ fontSize: '0.68rem', color: '#fb923c' }}>{item.scheduled_date}</span> : <span style={{ fontSize: '0.68rem', color: '#5a6a85' }}>Belum dijadwalkan</span>}
          <span style={{ fontSize: '0.7rem', color: '#1a73e8', fontWeight: 600 }}>Buka →</span>
        </div>
      </div>
    </div>
  )
}

function NotifPanel({ notifications, onClose, onMarkRead }: { notifications: Notification[]; onClose: () => void; onMarkRead: (id: string) => void }) {
  
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, background: '#fff', borderLeft: '1px solid #e5eaf2', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #e5eaf2' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2a3547' }}>Notifikasi</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {notifications.length === 0
          ? <div style={{ textAlign: 'center', color: '#5a6a85', fontSize: '0.82rem', marginTop: 40 }}>Tidak ada notifikasi</div>
          : notifications.map(n => (
            <div key={n.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid #e5eaf2', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{NOTIF_ICON_MAP[n.type] || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fa9ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2a3547', marginBottom: 2 }}>{n.title}</div>
                {n.message && <div style={{ fontSize: '0.75rem', color: '#5a6a85', lineHeight: 1.4 }}>{n.message}</div>}
                <div style={{ fontSize: '0.65rem', color: '#5a6a85', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button onClick={() => onMarkRead(n.id)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}>✓</button>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default function StudioModule({ initialContents, products, initialNotifications, workspaceId, workspaceName = 'studio' }: {
  initialContents: ContentItem[]; products: Product[]; initialNotifications: Notification[]; workspaceId: string; workspaceName?: string
}) {
  const supabase = createClient()
  const [contents, setContents] = useState<ContentItem[]>(initialContents)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [tab, setTab] = useState<Tab>('antrian')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [igTab, setIgTab] = useState<IGTab>('grid')
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [previewPost, setPreviewPost] = useState<ContentItem | null>(null)
  const [previewReels, setPreviewReels] = useState<ContentItem | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showNotif, setShowNotif] = useState(false)

  const filtered = contents.filter(c => STATUS_STAGE[c.status] === tab)
  const unread = notifications.filter(n => !n.is_read).length

  // IG view filtering
  const igFiltered = igTab === 'reels'
    ? filtered.filter(c => VIDEO_FORMATS.includes(c.format))
    : igTab === 'tagged' ? []
    : filtered.filter(c => !VIDEO_FORMATS.includes(c.format) || c.show_in_feed !== false)

  async function markRead(id: string) {
    await supabase.from('kf_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  function handleUpdate(updated: ContentItem) {
    setContents(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedItem(updated)
  }

  const TAB_CONFIG = [
    { key: 'antrian' as Tab, label: 'Antrian', color: '#f59e0b' },
    { key: 'dikerjakan' as Tab, label: 'Sedang Dikerjakan', color: '#3b82f6' },
    { key: 'selesai' as Tab, label: 'Selesai', color: '#22c55e' },
  ]

  const antriCount = contents.filter(c => STATUS_STAGE[c.status] === 'antrian').length
  const dikerjakanCount = contents.filter(c => STATUS_STAGE[c.status] === 'dikerjakan').length

  const handle = workspaceName.toLowerCase().replace(/\s+/g, '')
  const initial = workspaceName.charAt(0).toUpperCase()

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2a3547', letterSpacing: '-0.5px', marginBottom: 4 }}>Studio</h1>
          <p style={{ fontSize: '0.875rem', color: '#5a6a85' }}>Ruang kerja desainer & editor — lihat naskah, input hasil, preview visual</p>
        </div>
        <button onClick={() => setShowNotif(v => !v)}
          style={{ position: 'relative', background: unread > 0 ? 'rgba(26,115,232,0.12)' : '#f1f5f9', border: `1px solid ${unread > 0 ? '#1a73e8' : '#e5eaf2'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#2a3547' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Notifikasi</span>
          {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, background: '#ef4444', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread}</span>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5eaf2', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TAB_CONFIG.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer', color: tab === t.key ? t.color : '#5a6a85', fontWeight: tab === t.key ? 700 : 400, fontSize: '0.875rem', borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
              {t.label}
              {t.key === 'antrian' && antriCount > 0 && <span style={{ marginLeft: 6, background: '#f59e0b', color: '#000', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{antriCount}</span>}
              {t.key === 'dikerjakan' && dikerjakanCount > 0 && <span style={{ marginLeft: 6, background: '#3b82f6', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{dikerjakanCount}</span>}
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, paddingBottom: 2 }}>
          {([
            { mode: 'cards' as ViewMode, label: 'Daftar' },
            { mode: 'ig' as ViewMode, label: 'IG Grid' },
            { mode: 'feed' as ViewMode, label: 'Feed' },
          ]).map(v => (
            <button key={v.mode} onClick={() => setViewMode(v.mode)}
              style={{ padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', border: viewMode === v.mode ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: viewMode === v.mode ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: viewMode === v.mode ? '#42a5f5' : '#64748b', cursor: 'pointer', fontWeight: 600 }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5a6a85' }}>
          <div style={{ marginBottom: 12, color: '#5a6a85' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg></div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{tab === 'antrian' ? 'Belum ada naskah siap diproduksi' : tab === 'dikerjakan' ? 'Tidak ada konten sedang dikerjakan' : 'Belum ada konten selesai'}</div>
          {tab === 'antrian' && <div style={{ fontSize: '0.82rem', color: '#5a6a85' }}>Setelah copywriter simpan naskah di Plan, konten akan muncul di sini</div>}
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(item => <ContentCard key={item.id} item={item} products={products} onClick={() => setSelectedItem(item)} />)}
        </div>
      ) : viewMode === 'ig' ? (
        /* IG Profile Mockup */
        <div style={{ maxWidth: 480, margin: '0 auto', background: '#000', borderRadius: 20, border: '1px solid #1a1a1a', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2a3547' }}>{handle}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          {/* Profile info */}
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.8rem', color: '#fff', flexShrink: 0, border: '3px solid #000', outline: '2px solid #444' }}>{initial}</div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
                {[['Postingan', filtered.length], ['Pengikut', '1,234'], ['Mengikuti', '567']].map(([label, val]) => (
                  <div key={label as string} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2a3547' }}>{val}</div>
                    <div style={{ fontSize: '0.7rem', color: '#5a6a85' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2a3547', marginBottom: 2 }}>{workspaceName}</div>
            <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginBottom: 12 }}>Content preview — KreaFlow Studio</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '7px', color: '#2a3547', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Edit profil</button>
              <button style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '7px', color: '#2a3547', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Bagikan profil</button>
            </div>
          </div>
          {/* Highlights */}
          <div style={{ display: 'flex', gap: 14, padding: '0 16px 16px', overflowX: 'auto' }}>
            {['Baru', 'Tips', 'Promo', 'Behind'].map((h, i) => (
              <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', border: i === 0 ? '2px dashed #475569' : '2px solid #e5eaf2', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === 0 ? '1.5rem' : '0.8rem', color: '#5a6a85' }}>{i === 0 ? '+' : ''}</div>
                <span style={{ fontSize: '0.65rem', color: '#5a6a85' }}>{h}</span>
              </div>
            ))}
          </div>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
            {([
              { key: 'grid' as IGTab, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill={igTab==='grid'?'#f1f5f9':'none'} stroke={igTab==='grid'?'none':'#555'} strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="7" height="7" rx="0.5"/></svg> },
              { key: 'reels' as IGTab, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={igTab==='reels'?'#f1f5f9':'#555'} strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> },
              { key: 'tagged' as IGTab, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={igTab==='tagged'?'#f1f5f9':'#555'} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            ]).map(t => (
              <button key={t.key} onClick={() => setIgTab(t.key)} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: igTab === t.key ? '1px solid #f1f5f9' : '1px solid transparent', cursor: 'pointer' }}>{t.icon}</button>
            ))}
          </div>
          {/* Grid */}
          {(() => {
            if (igTab === 'tagged') return (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5a6a85', fontSize: '0.82rem' }}>Tidak ada foto yang menandai kamu</div>
            )
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, background: '#f8fafc' }}>
                {igFiltered.map(c => {
                  const thumb = getThumbnail(c)
                  const isVideo = VIDEO_FORMATS.includes(c.format)
                  return (
                    <div key={c.id}
                      style={{ position: 'relative', aspectRatio: igTab === 'reels' ? '9/16' : '1/1', overflow: 'hidden', cursor: 'pointer', background: '#fff' }}
                      onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                      onClick={() => igTab === 'reels' ? setPreviewReels(c) : setPreviewPost(c)}>
                      {thumb ? <img src={thumb} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={c} />}
                      {c.format && <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '0.52rem', fontWeight: 600, color: '#fff', background: isVideo ? 'rgba(220,39,39,0.85)' : 'rgba(30,64,175,0.85)', padding: '2px 4px', borderRadius: 3 }}>{c.format}</div>}
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[c.status] || '#5a6a85', boxShadow: '0 0 4px rgba(0,0,0,0.7)' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: hoveredId === c.id ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <span style={{ fontSize: '0.58rem', fontWeight: 600, color: '#fff', textAlign: 'center', padding: '0 4px', lineHeight: 1.3 }}>{(c.judul || '').slice(0, 22)}{(c.judul || '').length > 22 ? '…' : ''}</span>
                      </div>
                    </div>
                  )
                })}
                {Array.from({ length: Math.max(0, 9 - igFiltered.length) }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ aspectRatio: igTab === 'reels' ? '9/16' : '1/1', background: '#fff', border: '1px dashed #e5eaf2' }}>
                    {i === 0 && igFiltered.length === 0 && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '0.6rem', color: '#e5eaf2', textAlign: 'center', padding: 4 }}>{igTab === 'reels' ? 'Belum ada Reels' : 'Belum ada konten'}</span></div>}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      ) : (
        /* Feed 4:5 portrait */
        <div>
          <div style={{ fontSize: '0.75rem', color: '#5a6a85', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#69C9D0', display: 'inline-block' }} />
            Feed Preview 4:5 — IG portrait / TikTok foto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, maxWidth: 440, background: '#f0f5f9', padding: 3, borderRadius: 4 }}>
            {filtered.map(c => {
              const thumb = getThumbnail(c)
              return (
                <div key={c.id} style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', cursor: 'pointer', background: '#fff' }}
                  onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setPreviewPost(c)}>
                  {thumb ? <img src={thumb} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={c} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6, opacity: hoveredId === c.id ? 1 : 0, transition: 'opacity 0.2s' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2a3547', textAlign: 'center', lineHeight: 1.3 }}>{(c.judul || '(Tanpa judul)').slice(0, 40)}</div>
                    <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: 3, color: STATUS_COLOR[c.status] || '#5a6a85', background: STATUS_BG[c.status] || '#f1f5f9', fontWeight: 600 }}>{c.status}</span>
                    {c.canva_url && <a href={c.canva_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.62rem', color: '#42a5f5', textDecoration: 'underline' }}>Canva ↗</a>}
                  </div>
                  {hoveredId !== c.id && <div style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[c.status] || '#5a6a85', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedItem && <NaskahModal item={selectedItem} products={products} onClose={() => setSelectedItem(null)} onUpdate={handleUpdate} />}
      {previewPost && <IGPostPreview item={previewPost} workspaceName={workspaceName} onEdit={() => { setPreviewPost(null); setSelectedItem(previewPost) }} onClose={() => setPreviewPost(null)} />}
      {previewReels && <IGReelsPreview item={previewReels} workspaceName={workspaceName} onEdit={() => { setPreviewReels(null); setSelectedItem(previewReels) }} onClose={() => setPreviewReels(null)} />}
      {showNotif && (<><div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowNotif(false)} /><NotifPanel notifications={notifications} onClose={() => setShowNotif(false)} onMarkRead={markRead} /></>)}
    </div>
  )
}
