'use client'

import { NOTIF_ICON_MAP } from '@/components/ui/Icons'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type WorkspaceMember = { id: string; user_id: string; role: string; jabatan: string; email: string; nama: string }
type ContentItem = {
  id: string; workspace_id: string; product_id: string; pillar_id: string
  judul: string; format: string; platform: string[]; hook: string; body: string
  cta: string; hashtags: string[]; script: string; prompt_script: string
  status: string; scheduled_date: string; canva_url?: string; gdrive_url?: string
  preview_url?: string; studio_notes?: string; studio_done_at?: string; show_in_feed?: boolean
  carousel_slides?: string[] | null
  sprint_id?: string | null; step_log?: Record<string, string> | null
  tanggal_tayang?: string | null; jam_tayang?: string | null; sprint_nama?: string | null
  assigned_produksi?: string | null
  sprint_step_config?: { id: string; daysBefore: number }[] | null
  studio_started_at?: string | null
  studio_completed_at?: string | null
  revisi_notes?: string | null
}
type Product = { id: string; nama: string }
type Notification = { id: string; type: string; title: string; message: string | null; content_idea_id: string | null; is_read: boolean; created_at: string }
type Tab = 'antrian' | 'dikerjakan' | 'review' | 'selesai'
type ViewMode = 'cards' | 'platform'
type IGTab = 'grid' | 'reels' | 'tagged'
type PlatformTab = 'ig' | 'tiktok' | 'youtube'

const STATUS_STAGE: Record<string, Tab> = { 'Naskah Siap': 'antrian', 'Produksi': 'dikerjakan', 'Menunggu Review': 'review', 'Siap Tayang': 'selesai', 'Terjadwal': 'selesai', 'Tayang': 'selesai' }
const STATUS_COLOR: Record<string, string> = { Draft: '#6b7280', 'Naskah Siap': '#d97706', Produksi: '#1a73e8', 'Menunggu Review': '#8b5cf6', 'Siap Tayang': '#059669', Terjadwal: '#a855f7', Tayang: '#6b21a8' }
const STATUS_BG: Record<string, string> = { Draft: '#f3f4f6', 'Naskah Siap': 'rgba(245,158,11,0.12)', Produksi: 'rgba(59,130,246,0.12)', 'Menunggu Review': 'rgba(139,92,246,0.12)', 'Siap Tayang': 'rgba(34,197,94,0.12)', Terjadwal: 'rgba(168,85,247,0.12)', Tayang: 'rgba(107,33,168,0.15)' }
const VIDEO_FORMATS = ['Reels', 'Video Pendek', 'Video Panjang', 'Live']

// Format yang menjadi tanggung jawab masing-masing jabatan
const JABATAN_FORMATS: Record<string, string[]> = {
  'Desainer':   ['Single Post', 'Carousel'],
  'Editor':     ['Video Pendek', 'Video Panjang', 'Reels'],
  'Videografer':['Video Pendek', 'Video Panjang', 'Reels'],
}

function extractGdriveId(url: string): string | null {
  if (!url) return null
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}
function getThumbnail(item: ContentItem): string | null {
  // For carousel, first slide is the thumbnail
  const firstSlide = item.carousel_slides?.[0]
  const src = firstSlide || item.preview_url || item.gdrive_url
  if (!src) return null
  const id = extractGdriveId(src)
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`
  return src
}

function getSlideUrl(item: ContentItem, idx: number): string | null {
  if (item.carousel_slides && item.carousel_slides[idx]) {
    const src = item.carousel_slides[idx]
    const id = extractGdriveId(src)
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w800` : src
  }
  // Fallback for slide 0 only
  if (idx === 0) return getThumbnail(item)
  return null
}

function ThumbnailPlaceholder({ item }: { item: ContentItem }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span style={{ fontSize: '0.58rem', color: '#d1d5db', textAlign: 'center', lineHeight: 1.3 }}>{item.format || 'Preview'}</span>
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
  const isCarousel = (item.format || '').toLowerCase().includes('carousel')
  const SLIDE_COUNT = isCarousel ? Math.max(1, item.carousel_slides?.length || 1) : 1
  const [slideIdx, setSlideIdx] = useState(0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="kf-ig-modal" style={{ maxWidth: 390, width: '100%', maxHeight: '92vh', overflowY: 'auto', background: '#000', borderRadius: 20, border: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9' }}>{handle}</div>
            <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Original audio</div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}>Ikuti</span>
          <span style={{ color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer' }}>···</span>
        </div>
        {/* Image / Carousel */}
        <div style={{ width: '100%', aspectRatio: '4/5', background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
          {(() => {
            const slideUrl = getSlideUrl(item, slideIdx)
            return slideUrl
              ? <img src={slideUrl} alt={`Slide ${slideIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#2a2a2a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Slide {slideIdx + 1}</span>
                </div>
          })()}
          {/* Slide counter */}
          {isCarousel && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '2px 8px', fontSize: '0.68rem', color: '#fff', fontWeight: 600 }}>
              {slideIdx + 1} / {SLIDE_COUNT}
            </div>
          )}
          {/* Prev arrow */}
          {isCarousel && slideIdx > 0 && (
            <button onClick={e => { e.stopPropagation(); setSlideIdx(i => i - 1) }}
              style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {/* Next arrow */}
          {isCarousel && slideIdx < SLIDE_COUNT - 1 && (
            <button onClick={e => { e.stopPropagation(); setSlideIdx(i => i + 1) }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setSlideIdx(i) }}
                style={{ width: isCarousel ? 5 : 6, height: isCarousel ? 5 : 6, borderRadius: '50%', background: i === slideIdx ? '#fff' : 'rgba(255,255,255,0.4)', cursor: isCarousel ? 'pointer' : 'default', transition: 'background 0.15s' }} />
            ))}
          </div>
        </div>
        <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <div style={{ flex: 1 }} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" style={{ cursor: 'pointer' }}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div style={{ paddingInline: 14, fontSize: '0.82rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>{fakeLikes.toLocaleString()} suka</div>
        {caption && <div style={{ paddingInline: 14, fontSize: '0.82rem', color: '#111827', lineHeight: 1.5, marginBottom: 4 }}><span style={{ fontWeight: 700, marginRight: 6 }}>{handle}</span><span style={{ whiteSpace: 'pre-wrap' }}>{caption.length > 150 ? caption.slice(0, 150) + '...' : caption}</span></div>}
        {hashtags && <div style={{ paddingInline: 14, fontSize: '0.8rem', color: '#1a73e8', marginBottom: 4 }}>{hashtags}</div>}
        <div style={{ paddingInline: 14, marginBottom: 6 }}>
          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[item.status] || '#6b7280', background: STATUS_BG[item.status] || '#f1f5f9', fontWeight: 600 }}>{item.status}</span>
          {item.format && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#6b7280' }}>{item.format}</span>}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', paddingInline: 14, marginBottom: 10 }}>{item.scheduled_date ? `Dijadwalkan: ${item.scheduled_date}` : 'Belum dijadwalkan'}</div>
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 16px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onEdit} style={{ flex: 1, background: '#1a73e8', border: 'none', borderRadius: 8, padding: 9, color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Input Hasil</button>
          {item.canva_url && <a href={item.canva_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: 9, color: '#93c5fd', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Canva ↗</a>}
          {item.gdrive_url && <a href={item.gdrive_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: 9, color: '#7dd3fc', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Drive ↗</a>}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '9px 12px', color: '#e5e7eb', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
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
      <div onClick={e => e.stopPropagation()} className="kf-ig-modal" style={{ position: 'relative', maxWidth: 340, width: '100%', height: 'min(604px, 85vh)', borderRadius: 18, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
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
          {hashtags && <div style={{ color: '#1a73e8', fontSize: '0.73rem', marginBottom: 8 }}>{hashtags.length > 60 ? hashtags.slice(0, 60) + '…' : hashtags}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <span style={{ color: '#111827', fontSize: '0.7rem' }}>Audio original · {handle}</span>
          </div>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(30,30,30,0.9)', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', color: STATUS_COLOR[item.status] || '#6b7280', fontWeight: 600 }}>{item.status}</span>
          {item.scheduled_date && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>· {item.scheduled_date}</span>}
        </div>
        <button onClick={onEdit} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Input Hasil</button>
        {item.canva_url && <a href={item.canva_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 14px', color: '#93c5fd', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>Canva ↗</a>}
        {item.gdrive_url && <a href={item.gdrive_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 14px', color: '#7dd3fc', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>Drive ↗</a>}
        <button onClick={onClose} style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', color: '#e5e7eb', fontSize: '0.78rem', cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  )
}

function NaskahModal({ item, products, workspaceMembers, onClose, onUpdate, isApprover }: { item: ContentItem; products: Product[]; workspaceMembers: WorkspaceMember[]; onClose: () => void; onUpdate: (updated: ContentItem) => void; isApprover?: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [canvaUrl, setCanvaUrl] = useState(item.canva_url || '')
  const [gdriveUrl, setGdriveUrl] = useState(item.gdrive_url || '')
  const [previewUrl, setPreviewUrl] = useState(item.preview_url || '')
  const isCarouselModal = (item.format || '').toLowerCase().includes('carousel')
  const [carouselSlides, setCarouselSlides] = useState<string[]>(
    item.carousel_slides?.filter(s => s && !s.includes('/folders/')) || []
  )
  const [folderUrl, setFolderUrl] = useState('')
  const [fetchingFolder, setFetchingFolder] = useState(false)
  const [folderError, setFolderError] = useState('')
  const [manualSlideInput, setManualSlideInput] = useState('')
  const [notes, setNotes] = useState(item.studio_notes || '')
  const [saving, setSaving] = useState(false)
  const [marking, setMarking] = useState(false)
  const [talentName, setTalentName] = useState(item.step_log?.talent_name || '')
  const [linkMentahan, setLinkMentahan] = useState(item.step_log?.link_mentahan || '')
  const [talentBriefed, setTalentBriefed] = useState(!!item.step_log?.talent_briefed_at)
  const [shootDone, setShootDone] = useState(!!item.step_log?.shoot_done_at)
  const [assignedProduksi, setAssignedProduksi] = useState(item.assigned_produksi || '')
  const [naskahFullscreen, setNaskahFullscreen] = useState(false)
  const [tpFontSize, setTpFontSize] = useState(22)
  const [revisiInput, setRevisiInput] = useState('')
  const [showRevisiInput, setShowRevisiInput] = useState(false)
  const product = products.find(p => p.id === item.product_id)
  const isVideo = VIDEO_FORMATS.includes(item.format)
  const produksiMembers = workspaceMembers.filter(m => PRODUKSI_JABATAN.includes(m.jabatan))
  const otherMembers = workspaceMembers.filter(m => !PRODUKSI_JABATAN.includes(m.jabatan))

  async function fetchFolderSlides() {
    const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    if (!match) { setFolderError('URL folder tidak valid'); return }
    const folderId = match[1]
    setFetchingFolder(true)
    setFolderError('')
    const res = await fetch(`/api/gdrive?folder=${folderId}`)
    const data = await res.json()
    setFetchingFolder(false)
    if (!res.ok || data.error) { setFolderError(data.error || 'Gagal ambil folder'); return }
    if (!data.files?.length) { setFolderError('Folder kosong atau tidak ada gambar'); return }
    setCarouselSlides(data.files.map((f: { url: string }) => f.url))
    setFolderUrl('')
  }

  function buildStepLog(): Record<string, string> {
    const log: Record<string, string> = { ...(item.step_log || {}) }
    if (talentName) log.talent_name = talentName; else delete log.talent_name
    if (linkMentahan) log.link_mentahan = linkMentahan; else delete log.link_mentahan
    if (talentBriefed) { if (!log.talent_briefed_at) log.talent_briefed_at = new Date().toISOString() } else delete log.talent_briefed_at
    if (shootDone) { if (!log.shoot_done_at) log.shoot_done_at = new Date().toISOString() } else delete log.shoot_done_at
    return log
  }

  async function handleSave() {
    setSaving(true)
    const cleanSlides = isCarouselModal ? carouselSlides.filter(s => s.trim()) : null
    const payload = { canva_url: canvaUrl || undefined, gdrive_url: gdriveUrl || undefined, preview_url: previewUrl || undefined, studio_notes: notes || undefined, status: 'Produksi', step_log: buildStepLog(), assigned_produksi: assignedProduksi || null, carousel_slides: cleanSlides?.length ? cleanSlides : null }
    await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
    await supabase.from('kf_notifications').update({ is_read: true }).eq('content_idea_id', item.id).eq('type', 'produksi')
    setSaving(false)
    onUpdate({ ...item, ...payload })
    router.refresh()
  }

  async function handleSelesai() {
    setMarking(true)
    const now = new Date().toISOString()
    const cleanSlides = isCarouselModal ? carouselSlides.filter(s => s.trim()) : null
    if (isApprover) {
      const payload = { canva_url: canvaUrl || undefined, gdrive_url: gdriveUrl || undefined, preview_url: previewUrl || undefined, studio_notes: notes || undefined, status: 'Siap Tayang', studio_done_at: now, studio_completed_at: now, step_log: { ...buildStepLog(), editing_done_at: now }, assigned_produksi: assignedProduksi || null, carousel_slides: cleanSlides?.length ? cleanSlides : null }
      await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
      await supabase.from('kf_notifications').insert({ workspace_id: item.workspace_id, type: 'schedule', title: `Siap Schedule — ${item.judul}`, message: item.scheduled_date ? `Jadwal tayang: ${item.scheduled_date}` : 'Belum ada jadwal tayang', content_idea_id: item.id })
      await supabase.from('kf_notifications').update({ is_read: true }).eq('content_idea_id', item.id).eq('type', 'produksi')
      setMarking(false)
      onUpdate({ ...item, ...payload })
      onClose()
    } else {
      const payload = { canva_url: canvaUrl || undefined, gdrive_url: gdriveUrl || undefined, preview_url: previewUrl || undefined, studio_notes: notes || undefined, status: 'Menunggu Review', step_log: buildStepLog(), assigned_produksi: assignedProduksi || null, carousel_slides: cleanSlides?.length ? cleanSlides : null }
      await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
      await supabase.from('kf_notifications').insert({ workspace_id: item.workspace_id, type: 'review', title: `Perlu Review — ${item.judul}`, message: 'Desainer telah submit hasil, mohon lakukan review.', content_idea_id: item.id })
      await supabase.from('kf_notifications').update({ is_read: true }).eq('content_idea_id', item.id).eq('type', 'produksi')
      setMarking(false)
      onUpdate({ ...item, ...payload })
      onClose()
    }
    router.refresh()
  }

  async function handleApprove() {
    setMarking(true)
    const now = new Date().toISOString()
    const payload = { status: 'Siap Tayang', studio_done_at: now, studio_completed_at: now }
    await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
    await supabase.from('kf_notifications').insert({ workspace_id: item.workspace_id, type: 'schedule', title: `Diapprove — ${item.judul}`, message: 'Konten telah diapprove, siap dijadwalkan.', content_idea_id: item.id })
    setMarking(false)
    onUpdate({ ...item, ...payload })
    onClose()
    router.refresh()
  }

  async function handleRevisiSubmit() {
    if (!revisiInput.trim()) return
    setSaving(true)
    const payload = { status: 'Produksi', revisi_notes: revisiInput.trim() }
    await supabase.from('kf_content_ideas').update(payload).eq('id', item.id)
    await supabase.from('kf_notifications').insert({ workspace_id: item.workspace_id, type: 'produksi', title: `Revisi diperlukan — ${item.judul}`, message: revisiInput.trim(), content_idea_id: item.id })
    setSaving(false)
    onUpdate({ ...item, ...payload })
    onClose()
    router.refresh()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 820, maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>{item.judul}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product && <span style={{ fontSize: '0.72rem', background: 'rgba(26,115,232,0.10)', color: '#1a73e8', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{product.nama}</span>}
              {item.format && <span style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 4 }}>{item.format}</span>}
              {(item.platform || []).map(p => <span key={p} style={{ fontSize: '0.72rem', background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 4 }}>{p}</span>)}
              {item.scheduled_date && <span style={{ fontSize: '0.72rem', background: 'rgba(251,146,60,0.1)', color: '#fb923c', padding: '2px 8px', borderRadius: 4 }}>{item.scheduled_date}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer', padding: 4, flexShrink: 0 }}>✕</button>
        </div>
        <div className="kf-studio-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          <div style={{ padding: '20px 24px', borderRight: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Naskah Copywriter</div>
              <button onClick={() => setNaskahFullscreen(true)} title="Fullscreen — baca saat take video" style={{ background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 7, padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#1a73e8' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Fullscreen</span>
              </button>
            </div>
            {item.hook && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Hook</div><div style={{ fontSize: '0.85rem', color: '#111827', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid #1a73e8' }}>{item.hook}</div></div>}
            {item.body && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Body</div><div style={{ fontSize: '0.85rem', color: '#111827', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{item.body}</div></div>}
            {item.cta && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>CTA</div><div style={{ fontSize: '0.85rem', color: '#111827', lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: 8 }}>{item.cta}</div></div>}
            {item.script && <div style={{ marginBottom: 12 }}><div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Script Lengkap</div><div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.7, background: '#fff', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{item.script}</div></div>}
            {(item.hashtags || []).length > 0 && <div><div style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Hashtag</div><div style={{ fontSize: '0.78rem', color: '#1a73e8', lineHeight: 1.6 }}>{item.hashtags.join(' ')}</div></div>}
            {item.revisi_notes && (
              <div style={{ marginTop: 12, background: 'rgba(251,146,60,0.08)', border: '1.5px solid rgba(251,146,60,0.3)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>⚠ Catatan Revisi dari Manager</div>
                <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.revisi_notes}</div>
              </div>
            )}
          </div>

          {/* Teleprompter fullscreen overlay */}
          {naskahFullscreen && (
            <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 500, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={() => setNaskahFullscreen(false)}>
              <div onClick={e => e.stopPropagation()} style={{ flex: 1, padding: '32px 10vw', maxWidth: 900, margin: '0 auto', width: '100%' }}>
                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Naskah — {item.format || 'Konten'}</div>
                    <div style={{ fontSize: '1rem', color: '#e5e7eb', fontWeight: 700 }}>{item.judul}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setTpFontSize(s => Math.max(14, s - 2))} style={{ width: 34, height: 34, borderRadius: 8, background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem', minWidth: 36, textAlign: 'center' }}>{tpFontSize}px</span>
                    <button onClick={() => setTpFontSize(s => Math.min(48, s + 2))} style={{ width: 34, height: 34, borderRadius: 8, background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    <button onClick={() => setNaskahFullscreen(false)} style={{ marginLeft: 8, width: 34, height: 34, borderRadius: 8, background: '#1f2937', border: '1px solid #374151', color: '#ef4444', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                </div>

                {/* Script content */}
                {item.script ? (
                  <div style={{ fontSize: tpFontSize, color: '#f9fafb', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', letterSpacing: '0.01em' }}>{item.script}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {item.hook && (
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Hook</div>
                        <div style={{ fontSize: tpFontSize, color: '#60a5fa', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>{item.hook}</div>
                      </div>
                    )}
                    {item.body && (
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Body</div>
                        <div style={{ fontSize: tpFontSize, color: '#f9fafb', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}>{item.body}</div>
                      </div>
                    )}
                    {item.cta && (
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>CTA</div>
                        <div style={{ fontSize: tpFontSize, color: '#34d399', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>{item.cta}</div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ height: 80 }} />
              </div>
            </div>
          )}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Input Hasil Produksi</div>
            {getThumbnail(item) && <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9', background: '#fff' }}><img src={getThumbnail(item)!} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}

            {/* Talent section — video only */}
            {isVideo && (
              <div style={{ marginBottom: 16, background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Talent & Produksi</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>Nama Talent / Pemeran</label>
                  <input value={talentName} onChange={e => setTalentName(e.target.value)} placeholder="Nama talent atau pemeran konten ini..." style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 11px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={talentBriefed} onChange={e => setTalentBriefed(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: talentBriefed ? '#059669' : '#374151', fontWeight: talentBriefed ? 600 : 400, flex: 1 }}>Brief ke talent selesai</span>
                    {item.step_log?.talent_briefed_at && <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{new Date(item.step_log.talent_briefed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={shootDone} onChange={e => setShootDone(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: shootDone ? '#059669' : '#374151', fontWeight: shootDone ? 600 : 400, flex: 1 }}>Shoot / Take selesai</span>
                    {item.step_log?.shoot_done_at && <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{new Date(item.step_log.shoot_done_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase' }}>Link Mentahan Video</label>
                  <input value={linkMentahan} onChange={e => setLinkMentahan(e.target.value)} placeholder="GDrive / Dropbox link raw footage..." style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 11px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* Editor section */}
            <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Canva Link</label><input value={canvaUrl} onChange={e => setCanvaUrl(e.target.value)} placeholder="https://www.canva.com/design/..." style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '9px 12px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} /></div>
            {isCarouselModal ? (
              <div style={{ marginBottom: 12 }}>
                {/* Folder import — primary */}
                <div style={{ marginBottom: 10, background: 'rgba(26,115,232,0.05)', border: '1px solid rgba(26,115,232,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                  <label style={{ display: 'block', fontSize: '0.68rem', color: '#1a73e8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Import Slides dari Google Drive</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={folderUrl}
                      onChange={e => { setFolderUrl(e.target.value); setFolderError('') }}
                      placeholder="https://drive.google.com/drive/folders/..."
                      style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', color: '#111827', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' as const }}
                    />
                    <button type="button" onClick={fetchFolderSlides} disabled={!folderUrl || fetchingFolder}
                      style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: (!folderUrl || fetchingFolder) ? 'not-allowed' : 'pointer', opacity: (!folderUrl || fetchingFolder) ? 0.6 : 1, whiteSpace: 'nowrap' as const }}>
                      {fetchingFolder ? 'Memuat...' : 'Ambil Slides'}
                    </button>
                  </div>
                  {folderError && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 5 }}>{folderError}</div>}
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 5 }}>API key otomatis dari Settings → Integrasi · Folder harus publik (Anyone with link)</div>
                </div>

                {/* Slides — thumbnail grid */}
                {carouselSlides.filter(s => s.trim()).length > 0 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 600 }}>{carouselSlides.filter(s => s.trim()).length} Slide Siap</span>
                      <button type="button" onClick={() => setCarouselSlides([])} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Hapus semua</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                      {carouselSlides.map((url, idx) => {
                        if (!url.trim()) return null
                        const gid = extractGdriveId(url)
                        const thumbSrc = gid ? `https://drive.google.com/thumbnail?id=${gid}&sz=w200` : url
                        return (
                          <div key={idx} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 7, overflow: 'hidden', background: '#f3f4f6' }}>
                            <img src={thumbSrc} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: 3, left: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '1px 5px', fontSize: '0.58rem', color: '#fff', fontWeight: 700 }}>{idx + 1}</div>
                            <button type="button" onClick={() => setCarouselSlides(prev => prev.filter((_, i) => i !== idx))}
                              style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 4, width: 18, height: 18, color: '#fff', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' as const, padding: '14px 0', color: '#9ca3af', fontSize: '0.78rem', background: '#f9fafb', borderRadius: 8, marginBottom: 8 }}>
                    Belum ada slide — import dari folder di atas
                  </div>
                )}

                {/* Manual add (secondary) */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={manualSlideInput}
                    onChange={e => setManualSlideInput(e.target.value)}
                    placeholder="+ Tambah link GDrive slide manual..."
                    style={{ flex: 1, background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 8, padding: '7px 10px', color: '#374151', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' as const }}
                  />
                  <button type="button"
                    onClick={() => { if (manualSlideInput.trim()) { setCarouselSlides(prev => [...prev, manualSlideInput.trim()]); setManualSlideInput('') } }}
                    disabled={!manualSlideInput.trim()}
                    style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#374151', fontSize: '0.75rem', fontWeight: 600, cursor: manualSlideInput.trim() ? 'pointer' : 'not-allowed', opacity: manualSlideInput.trim() ? 1 : 0.5 }}>
                    Tambah
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Google Drive Link</label><input value={gdriveUrl} onChange={e => setGdriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '9px 12px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Preview URL (thumbnail)</label><input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} placeholder="Link GDrive thumbnail..." style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '9px 12px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} /></div>
              </>
            )}
            <div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Catatan Studio</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Revisi, catatan untuk scheduler..." rows={3} style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '9px 12px', color: '#111827', fontSize: '0.82rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {item.status === 'Menunggu Review' ? (
                isApprover ? (
                  <>
                    <div style={{ padding: '8px 12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600, textAlign: 'center' }}>Konten menunggu review Anda</div>
                    <button onClick={handleApprove} disabled={marking} style={{ padding: 10, background: '#059669', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>{marking ? 'Memproses...' : '✓ Approve — Siap Tayang'}</button>
                    {!showRevisiInput ? (
                      <button onClick={() => setShowRevisiInput(true)} style={{ padding: 10, background: '#fff', border: '1px solid #f87171', borderRadius: 8, color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>✎ Kirim Revisi</button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <textarea value={revisiInput} onChange={e => setRevisiInput(e.target.value)} placeholder="Catatan revisi untuk desainer..." rows={3} style={{ width: '100%', background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 10px', fontSize: '0.82rem', color: '#111827', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setShowRevisiInput(false)} style={{ flex: 1, padding: 8, background: '#f3f4f6', border: 'none', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', color: '#6b7280' }}>Batal</button>
                          <button onClick={handleRevisiSubmit} disabled={saving || !revisiInput.trim()} style={{ flex: 2, padding: 8, background: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: saving || !revisiInput.trim() ? 'not-allowed' : 'pointer', opacity: saving || !revisiInput.trim() ? 0.6 : 1 }}>{saving ? 'Mengirim...' : 'Kirim Revisi'}</button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>Sedang direview manager</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>Tunggu hasil review sebelum melanjutkan</div>
                  </div>
                )
              ) : (
                <>
                  <button onClick={handleSave} disabled={saving} style={{ padding: 10, background: '#f3f4f6', border: 'none', borderRadius: 8, color: '#111827', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Menyimpan...' : 'Simpan Progress'}</button>
                  <button onClick={handleSelesai} disabled={marking} style={{ padding: 10, background: isApprover ? '#059669' : '#8b5cf6', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>{marking ? 'Memproses...' : isApprover ? 'Tandai Selesai' : 'Submit untuk Review'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentCard({ item, products, onClick, onMulai, onRename, bulkMode, selected, onToggleSelect }: { item: ContentItem; products: Product[]; onClick: () => void; onMulai?: () => void; onRename?: (id: string, newJudul: string) => void; bulkMode?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(item.judul || '')
  const thumb = getThumbnail(item)
  const product = products.find(p => p.id === item.product_id)
  const stage = STATUS_STAGE[item.status]
  const stageColor: Record<Tab, string> = { antrian: '#d97706', dikerjakan: '#1a73e8', review: '#8b5cf6', selesai: '#059669' }
  const stageLabel: Record<Tab, string> = { antrian: 'Antrian', dikerjakan: 'Dikerjakan', review: 'Review', selesai: 'Selesai' }
  // Step deadline: Antrian → step desain/produksi/talent, Dikerjakan → step editing
  const STEP_FOR_STAGE: Record<string, string[]> = {
    antrian: ['desain', 'produksi', 'talent'],
    dikerjakan: ['editing', 'schedule'],
  }
  const relevantStep = item.sprint_step_config && stage !== 'selesai'
    ? item.sprint_step_config.find(s => (STEP_FOR_STAGE[stage] || []).includes(s.id)) ?? null
    : null
  const stepDeadline = relevantStep && item.tanggal_tayang
    ? (() => { const d = new Date(item.tanggal_tayang + 'T00:00:00'); d.setDate(d.getDate() - relevantStep.daysBefore); return d })()
    : null
  const stepDiff = stepDeadline
    ? Math.round((stepDeadline.getTime() - new Date().setHours(0,0,0,0)) / 86400000)
    : null
  const uploadDiff = item.tanggal_tayang && stage !== 'selesai' && !stepDeadline
    ? Math.round((new Date(item.tanggal_tayang + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000)
    : null
  const STEP_LABEL: Record<string, string> = { desain: 'Desain', produksi: 'Produksi', talent: 'Talent', editing: 'Editing', schedule: 'Schedule' }

  const isVideo = VIDEO_FORMATS.includes(item.format)
  const stepLog = item.step_log || {}
  const steps = isVideo
    ? [{ key: 'talent_briefed_at', label: 'Brief' }, { key: 'shoot_done_at', label: 'Shoot' }, { key: 'editing_done_at', label: 'Edit' }]
    : [{ key: 'editing_done_at', label: 'Desain' }]

  return (
    <div onClick={bulkMode ? onToggleSelect : onClick}
      style={{ background: selected ? 'rgba(26,115,232,0.06)' : '#fff', boxShadow: selected ? '0 0 0 2px #1a73e8' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column', borderTop: thumb ? 'none' : `3px solid ${stageColor[stage]}`, position: 'relative' as const }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,115,232,0.14)' }} onMouseLeave={e => { if (!selected) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)' }}>
      {bulkMode && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? '#1a73e8' : '#d1d5db'}`, background: selected ? '#1a73e8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      )}
      {thumb && (
        <div style={{ height: 96, position: 'relative', overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
          <img src={thumb} alt={item.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).closest('div')!.style.display = 'none' }} />
          <div style={{ position: 'absolute', top: 6, right: 6, fontSize: '0.62rem', fontWeight: 700, color: '#fff', background: stageColor[stage], padding: '2px 7px', borderRadius: 4 }}>{stageLabel[stage]}</div>
        </div>
      )}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {!thumb && (
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: stageColor[stage], background: stageColor[stage] + '18', padding: '2px 7px', borderRadius: 4, alignSelf: 'flex-start' }}>{stageLabel[stage]}</span>
        )}
        {renaming ? (
          <input
            autoFocus
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={() => { setRenaming(false); if (renameVal.trim() && renameVal !== item.judul) onRename?.(item.id, renameVal.trim()) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur() } if (e.key === 'Escape') { setRenameVal(item.judul || ''); setRenaming(false) } }}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111827', lineHeight: 1.3, border: '1.5px solid #1a73e8', borderRadius: 6, padding: '3px 7px', width: '100%', outline: 'none', background: '#f0f7ff' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111827', lineHeight: 1.3, flex: 1 }}>{item.judul || '(Tanpa judul)'}</div>
            <button onClick={e => { e.stopPropagation(); setRenameVal(item.judul || ''); setRenaming(true) }}
              title="Ganti nama"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: '0 1px', flexShrink: 0, lineHeight: 1, fontSize: '0.7rem', marginTop: 1 }}>✎</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {product && <span style={{ fontSize: '0.64rem', color: '#1a73e8', background: 'rgba(26,115,232,0.10)', padding: '1px 5px', borderRadius: 3 }}>{product.nama}</span>}
          {item.format && <span style={{ fontSize: '0.64rem', color: '#6b7280', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>{item.format}</span>}
          {(item.platform || []).slice(0, 2).map(p => <span key={p} style={{ fontSize: '0.64rem', color: '#6b7280', background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>{p}</span>)}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {item.tanggal_tayang ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={{ fontSize: '0.67rem', color: '#6b7280', fontWeight: 500 }}>
                  Upload: {new Date(item.tanggal_tayang + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{item.jam_tayang ? ` ${item.jam_tayang}` : ''}
                </span>
              </div>
              {stepDiff != null && relevantStep && (
                <span style={{
                  fontSize: '0.63rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5, alignSelf: 'flex-start',
                  color: stepDiff < 0 ? '#dc2626' : stepDiff <= 1 ? '#d97706' : '#059669',
                  background: stepDiff < 0 ? '#fef2f2' : stepDiff <= 1 ? '#fffbeb' : '#f0fdf4',
                }}>
                  {stepDiff < 0
                    ? `⚠️ Deadline ${STEP_LABEL[relevantStep.id] || relevantStep.id} telat ${Math.abs(stepDiff)} hr`
                    : stepDiff === 0
                    ? `⏰ Deadline ${STEP_LABEL[relevantStep.id] || relevantStep.id}: hari ini!`
                    : `⏰ Deadline ${STEP_LABEL[relevantStep.id] || relevantStep.id}: ${stepDiff} hr lagi`}
                </span>
              )}
              {uploadDiff != null && (
                <span style={{
                  fontSize: '0.63rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5, alignSelf: 'flex-start',
                  color: uploadDiff < 0 ? '#dc2626' : uploadDiff <= 1 ? '#d97706' : '#059669',
                  background: uploadDiff < 0 ? '#fef2f2' : uploadDiff <= 1 ? '#fffbeb' : '#f0fdf4',
                }}>
                  {uploadDiff < 0 ? `⚠️ Terlambat ${Math.abs(uploadDiff)}hr` : uploadDiff === 0 ? '⏰ Upload hari ini!' : `⏰ ${uploadDiff} hari lagi`}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.67rem', color: '#d1d5db' }}>Belum dijadwalkan</span>
          )}
          {item.sprint_nama && <span style={{ fontSize: '0.62rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sprint_nama}</span>}
          {/* Step checklist dots */}
          {stage !== 'antrian' && steps.length > 0 && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2 }}>
              {steps.map(s => {
                const done = !!stepLog[s.key]
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: done ? '#059669' : '#e5e7eb', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.57rem', color: done ? '#059669' : '#9ca3af', fontWeight: done ? 700 : 400 }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}
          {item.revisi_notes && (
            <div style={{ fontSize: '0.6rem', color: '#d97706', fontWeight: 700, background: 'rgba(251,146,60,0.1)', padding: '2px 6px', borderRadius: 4, alignSelf: 'flex-start' as const }}>⚠ Ada catatan revisi</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            {stage === 'antrian' && onMulai ? (
              <button
                onClick={e => { e.stopPropagation(); onMulai() }}
                style={{ fontSize: '0.67rem', fontWeight: 700, color: '#fff', background: '#1a73e8', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                ▶ Mulai
              </button>
            ) : <span />}
            {!bulkMode && <span style={{ fontSize: '0.67rem', color: '#1a73e8', fontWeight: 600 }}>Buka →</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function NotifPanel({ notifications, onClose, onMarkRead }: { notifications: Notification[]; onClose: () => void; onMarkRead: (id: string) => void }) {
  
  return (
    <div className="kf-drawer" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 340, background: '#fff', borderLeft: 'none', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Notifikasi</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {notifications.length === 0
          ? <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.82rem', marginTop: 40 }}>Tidak ada notifikasi</div>
          : notifications.map(n => (
            <div key={n.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{NOTIF_ICON_MAP[n.type] || <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fa9ba" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', marginBottom: 2 }}>{n.title}</div>
                {n.message && <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.4 }}>{n.message}</div>}
                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button onClick={() => onMarkRead(n.id)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}>✓</button>
            </div>
          ))
        }
      </div>
    </div>
  )
}

const PRODUKSI_JABATAN = ['Videografer', 'Editor', 'Desainer', 'Art Director', 'Content Creator']

export default function StudioModule({ initialContents, products, initialNotifications, workspaceId, workspaceName = 'studio', workspaceMembers = [], role = '', jabatan = '', userId = '' }: {
  initialContents: ContentItem[]; products: Product[]; initialNotifications: Notification[]; workspaceId: string; workspaceName?: string; workspaceMembers?: WorkspaceMember[]; role?: string; jabatan?: string; userId?: string
}) {
  const isApprover = role === 'owner' || role === 'admin' || jabatan === 'Manager'
  const isProduksiRole = PRODUKSI_JABATAN.includes(jabatan)
  const jabatanFormats: string[] | null = JABATAN_FORMATS[jabatan] ?? null
  const supabase = createClient()
  const [contents, setContents] = useState<ContentItem[]>(initialContents)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  useEffect(() => { setContents(initialContents) }, [initialContents])
  useEffect(() => { setNotifications(initialNotifications) }, [initialNotifications])
  const [tab, setTab] = useState<Tab>('antrian')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [igTab, setIgTab] = useState<IGTab>('grid')
  const [platformTab, setPlatformTab] = useState<PlatformTab>('ig')
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [previewPost, setPreviewPost] = useState<ContentItem | null>(null)
  const [previewReels, setPreviewReels] = useState<ContentItem | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showNotif, setShowNotif] = useState(false)
  // Search + filter
  const [searchQ, setSearchQ] = useState('')
  const [filterFormat, setFilterFormat] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [myWorkOnly, setMyWorkOnly] = useState(false)
  // Bulk select
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  async function handleRename(id: string, newJudul: string) {
    await supabase.from('kf_content_ideas').update({ judul: newJudul }).eq('id', id)
    setContents(prev => prev.map(c => c.id === id ? { ...c, judul: newJudul } : c))
  }

  useEffect(() => {
    const channel = supabase.channel('studio-content-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kf_content_ideas', filter: `workspace_id=eq.${workspaceId}` }, payload => {
        const updated = payload.new as ContentItem
        const studioStatuses = ['Naskah Siap', 'Produksi', 'Menunggu Review', 'Siap Tayang', 'Terjadwal', 'Tayang']
        setContents(prev => {
          const exists = prev.some(c => c.id === updated.id)
          if (exists) {
            if (studioStatuses.includes(updated.status)) {
              return prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
            }
            return prev.filter(c => c.id !== updated.id)
          }
          // Item baru masuk Studio (baru di-approve dari Plan)
          if (studioStatuses.includes(updated.status)) {
            return [...prev, updated]
          }
          return prev
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [workspaceId])

  const filtered = contents.filter(c => STATUS_STAGE[c.status] === tab)
  const unread = notifications.filter(n => !n.is_read).length

  // Search + filter derived
  const allFormats = [...new Set(contents.map(c => c.format).filter(Boolean))].filter(f => !jabatanFormats || jabatanFormats.includes(f))
  const allPlatforms = [...new Set(contents.flatMap(c => c.platform || []))]
  const displayItems = filtered.filter(c => {
    if (jabatanFormats && !jabatanFormats.includes(c.format)) return false
    if (myWorkOnly && userId && c.assigned_produksi && c.assigned_produksi !== userId) return false
    if (searchQ && !(c.judul || '').toLowerCase().includes(searchQ.toLowerCase())) return false
    if (filterFormat && c.format !== filterFormat) return false
    if (filterPlatform && !(c.platform || []).includes(filterPlatform)) return false
    return true
  })

  async function handleBulkSelesai() {
    if (!selectedIds.size) return
    const now = new Date().toISOString()
    const ids = [...selectedIds]
    if (isApprover) {
      await Promise.all(ids.map(id =>
        supabase.from('kf_content_ideas').update({ status: 'Siap Tayang', studio_done_at: now, studio_completed_at: now }).eq('id', id)
      ))
      setContents(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'Siap Tayang', studio_done_at: now, studio_completed_at: now } : c))
    } else {
      await Promise.all(ids.map(id =>
        supabase.from('kf_content_ideas').update({ status: 'Menunggu Review' }).eq('id', id)
      ))
      setContents(prev => prev.map(c => ids.includes(c.id) ? { ...c, status: 'Menunggu Review' } : c))
    }
    setSelectedIds(new Set())
    setBulkMode(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

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

  async function handleMulai(item: ContentItem) {
    const startedAt = item.studio_started_at || new Date().toISOString()
    await supabase.from('kf_content_ideas').update({ status: 'Produksi', studio_started_at: startedAt }).eq('id', item.id)
    setContents(prev => prev.map(c => c.id === item.id ? { ...c, status: 'Produksi', studio_started_at: startedAt } : c))
    setTab('dikerjakan')
  }

  const TAB_CONFIG = [
    { key: 'antrian' as Tab, label: 'Antrian', color: '#d97706' },
    { key: 'dikerjakan' as Tab, label: 'Sedang Dikerjakan', color: '#1a73e8' },
    { key: 'review' as Tab, label: 'Review', color: '#8b5cf6' },
    { key: 'selesai' as Tab, label: 'Selesai', color: '#059669' },
  ]

  const myWorkFilter = (c: ContentItem) => !myWorkOnly || !userId || !c.assigned_produksi || c.assigned_produksi === userId
  const jabatanFilter = (c: ContentItem) => !jabatanFormats || jabatanFormats.includes(c.format)
  const antriCount = contents.filter(c => STATUS_STAGE[c.status] === 'antrian' && myWorkFilter(c) && jabatanFilter(c)).length
  const dikerjakanCount = contents.filter(c => STATUS_STAGE[c.status] === 'dikerjakan' && myWorkFilter(c) && jabatanFilter(c)).length
  const reviewCount = contents.filter(c => STATUS_STAGE[c.status] === 'review' && myWorkFilter(c) && jabatanFilter(c)).length

  const handle = workspaceName.toLowerCase().replace(/\s+/g, '')
  const initial = workspaceName.charAt(0).toUpperCase()
  const youtubeShorts = filtered.filter(c => c.format === 'Reels' || c.format === 'Video Pendek')

  return (
    <div>
      {/* Header */}
      <div className="kf-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Studio</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ruang kerja desainer & editor — lihat naskah, input hasil, preview visual</p>
        </div>
        <button onClick={() => setShowNotif(v => !v)}
          style={{ position: 'relative', background: unread > 0 ? 'rgba(26,115,232,0.12)' : '#f3f4f6', border: `1px solid ${unread > 0 ? '#1a73e8' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#111827' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Notifikasi</span>
          {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, background: '#ef4444', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{unread}</span>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', marginBottom: 20, flexWrap: 'wrap', gap: '4px 0' }}>
        <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 0 }}>
          {TAB_CONFIG.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ background: 'transparent', border: 'none', padding: '10px 16px', cursor: 'pointer', color: tab === t.key ? t.color : '#6b7280', fontWeight: tab === t.key ? 700 : 400, fontSize: '0.875rem', borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
              {t.label}
              {t.key === 'antrian' && antriCount > 0 && <span style={{ marginLeft: 6, background: '#d97706', color: '#000', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{antriCount}</span>}
              {t.key === 'dikerjakan' && dikerjakanCount > 0 && <span style={{ marginLeft: 6, background: '#1a73e8', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{dikerjakanCount}</span>}
              {t.key === 'review' && reviewCount > 0 && <span style={{ marginLeft: 6, background: '#8b5cf6', color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{reviewCount}</span>}
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, paddingBottom: 2 }}>
          {([
            { mode: 'cards' as ViewMode, label: 'Daftar' },
            { mode: 'platform' as ViewMode, label: 'Preview Platform' },
          ]).map(v => (
            <button key={v.mode} onClick={() => setViewMode(v.mode)}
              style={{ padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', border: viewMode === v.mode ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: viewMode === v.mode ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: viewMode === v.mode ? '#1a73e8' : '#6b7280', cursor: 'pointer', fontWeight: 600 }}>
              {v.label}
            </button>
          ))}
          {viewMode === 'cards' && (
            <button onClick={() => { setBulkMode(v => !v); setSelectedIds(new Set()) }}
              style={{ padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', border: bulkMode ? '1px solid #7c3aed' : '1px solid #e5e7eb', background: bulkMode ? 'rgba(124,58,237,0.10)' : '#f3f4f6', color: bulkMode ? '#7c3aed' : '#6b7280', cursor: 'pointer', fontWeight: 600 }}>
              {bulkMode ? `Batal (${selectedIds.size})` : 'Pilih'}
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter bar — cards view only */}
      {viewMode === 'cards' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Cari judul..."
              style={{ display: 'block', width: '100%', paddingLeft: 30, paddingRight: 8, paddingTop: 7, paddingBottom: 7, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>
          <select value={filterFormat} onChange={e => setFilterFormat(e.target.value)}
            style={{ width: 120, padding: '7px 6px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.78rem', color: '#374151', background: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Semua Format</option>
            {allFormats.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
            style={{ width: 130, padding: '7px 6px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.78rem', color: '#374151', background: '#fff', cursor: 'pointer', flexShrink: 0 }}>
            <option value="">Semua Platform</option>
            {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {isProduksiRole && !jabatanFormats && (
            <button onClick={() => setMyWorkOnly(v => !v)}
              style={{ padding: '7px 12px', border: `1px solid ${myWorkOnly ? '#1a73e8' : '#e5e7eb'}`, borderRadius: 8, fontSize: '0.75rem', color: myWorkOnly ? '#1a73e8' : '#6b7280', background: myWorkOnly ? 'rgba(26,115,232,0.08)' : '#f3f4f6', cursor: 'pointer', flexShrink: 0, fontWeight: myWorkOnly ? 700 : 400 }}>
              {myWorkOnly ? 'Tugasku' : 'Semua'}
            </button>
          )}
          {(searchQ || filterFormat || filterPlatform) && (
            <button onClick={() => { setSearchQ(''); setFilterFormat(''); setFilterPlatform('') }}
              style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', cursor: 'pointer', flexShrink: 0 }}>
              Reset
            </button>
          )}
        </div>
      )}

      {/* Content area */}
      {displayItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ marginBottom: 12, color: '#6b7280' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg></div>
          {(searchQ || filterFormat || filterPlatform) ? (
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>Tidak ada konten yang cocok</div>
          ) : myWorkOnly ? (
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>Belum ada konten yang di-assign ke kamu</div>
          ) : (
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{tab === 'antrian' ? 'Belum ada naskah siap diproduksi' : tab === 'dikerjakan' ? 'Belum ada konten sedang dikerjakan' : tab === 'review' ? 'Tidak ada konten menunggu review' : 'Belum ada konten selesai'}</div>
          )}
          <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            {(searchQ || filterFormat || filterPlatform) && 'Coba ubah filter atau kata kunci pencarian'}
            {!searchQ && !filterFormat && !filterPlatform && tab === 'antrian' && 'Setelah copywriter simpan naskah di Plan, konten akan muncul di sini'}
            {!searchQ && !filterFormat && !filterPlatform && tab === 'dikerjakan' && 'Buka konten di Antrian → klik "Simpan Progress" untuk memindahkannya ke sini'}
            {!searchQ && !filterFormat && !filterPlatform && tab === 'review' && (isApprover ? 'Belum ada konten yang menunggu review Anda' : 'Konten yang kamu submit akan muncul di sini')}
            {!searchQ && !filterFormat && !filterPlatform && tab === 'selesai' && 'Konten yang sudah diapprove dan siap dijadwalkan muncul di sini'}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        tab === 'antrian' ? (() => {
          const DAY_COLORS = ['#1a73e8', '#7c3aed', '#059669', '#d97706', '#0891b2', '#db2777', '#dc2626']
          const sorted = [...displayItems].sort((a, b) => {
            const da = a.tanggal_tayang || '9999', db = b.tanggal_tayang || '9999'
            return da !== db ? da.localeCompare(db) : (a.jam_tayang || '').localeCompare(b.jam_tayang || '')
          })
          const uniqueDates = [...new Set(sorted.map(i => i.tanggal_tayang || '__no_date__'))]
          const dateColorMap = new Map(uniqueDates.map((d, idx) => [d, DAY_COLORS[idx % DAY_COLORS.length]]))
          const groups = uniqueDates.map(d => ({ dateKey: d, items: sorted.filter(i => (i.tanggal_tayang || '__no_date__') === d) }))
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {groups.map(group => {
                const color = dateColorMap.get(group.dateKey) || '#1a73e8'
                const d = group.dateKey === '__no_date__' ? null : new Date(group.dateKey + 'T00:00:00')
                return (
                  <div key={group.dateKey}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ flexShrink: 0, width: 56, borderRadius: 10, background: color + '12', border: `1.5px solid ${color}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', gap: 2 }}>
                        <div style={{ fontSize: '0.55rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {d ? d.toLocaleDateString('id-ID', { weekday: 'short' }) : '—'}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color, lineHeight: 1 }}>
                          {d ? d.getDate() : '?'}
                        </div>
                        <div style={{ fontSize: '0.55rem', fontWeight: 600, color: color + 'cc' }}>
                          {d ? d.toLocaleDateString('id-ID', { month: 'short' }) : ''}
                        </div>
                      </div>
                      <div style={{ flex: 1, height: 1.5, background: `linear-gradient(90deg, ${color}30, transparent)`, borderRadius: 1 }} />
                      <span style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{group.items.length} konten</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                      {group.items.map(item => <ContentCard key={item.id} item={item} products={products} onClick={() => setSelectedItem(item)} onMulai={() => handleMulai(item)} onRename={handleRename} bulkMode={bulkMode} selected={selectedIds.has(item.id)} onToggleSelect={() => toggleSelect(item.id)} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })() : (
          <>
            {tab === 'review' && isApprover && displayItems.length > 0 && (
              <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>{displayItems.length} konten menunggu review. Klik konten untuk Approve atau Kirim Revisi.</span>
              </div>
            )}
            {tab === 'review' && !isApprover && displayItems.length > 0 && (
              <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: '0.82rem', color: '#7c3aed' }}>Kontenmu sedang menunggu review manager. Kamu akan mendapat notifikasi setelah direview.</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {displayItems.map(item => <ContentCard key={item.id} item={item} products={products} onClick={() => setSelectedItem(item)} onMulai={() => handleMulai(item)} onRename={handleRename} bulkMode={bulkMode} selected={selectedIds.has(item.id)} onToggleSelect={() => toggleSelect(item.id)} />)}
            </div>
          </>
        )
      ) : viewMode === 'platform' ? (
        /* Platform Preview */
        <div>
          {/* Platform tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {([
              { key: 'ig' as PlatformTab, label: 'Instagram', color: '#e1306c' },
              { key: 'tiktok' as PlatformTab, label: 'TikTok', color: '#010101' },
              { key: 'youtube' as PlatformTab, label: 'YouTube', color: '#ff0000' },
            ] as { key: PlatformTab; label: string; color: string }[]).map(p => (
              <button key={p.key} onClick={() => setPlatformTab(p.key)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: platformTab === p.key ? `1.5px solid ${p.color}` : '1px solid #e5e7eb', background: platformTab === p.key ? `${p.color}12` : '#f8fafc', color: platformTab === p.key ? p.color : '#6b7280', cursor: 'pointer', transition: 'all 0.15s' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* ─── INSTAGRAM ─── */}
          {platformTab === 'ig' && (
        <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{handle}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          {/* Profile info */}
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.8rem', color: '#fff', flexShrink: 0, border: '3px solid #fff', outline: '2px solid #f3f4f6' }}>{initial}</div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
                {[['Postingan', filtered.length], ['Pengikut', '1,234'], ['Mengikuti', '567']].map(([label, val]) => (
                  <div key={label as string} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{val}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', marginBottom: 2 }}>{workspaceName}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 12 }}>Content preview — KreaFlow Studio</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px', color: '#111827', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Edit profil</button>
              <button style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px', color: '#111827', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Bagikan profil</button>
            </div>
          </div>
          {/* Highlights */}
          <div style={{ display: 'flex', gap: 14, padding: '0 16px 16px', overflowX: 'auto' }}>
            {['Baru', 'Tips', 'Promo', 'Behind'].map((h, i) => (
              <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', border: i === 0 ? '2px dashed #9ca3af' : '2px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === 0 ? '1.5rem' : '0.8rem', color: '#6b7280' }}>{i === 0 ? '+' : ''}</div>
                <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{h}</span>
              </div>
            ))}
          </div>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
            {([
              { key: 'grid' as IGTab, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill={igTab==='grid'?'#111827':'none'} stroke={igTab==='grid'?'none':'#9ca3af'} strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="0.5"/><rect x="14" y="3" width="7" height="7" rx="0.5"/><rect x="3" y="14" width="7" height="7" rx="0.5"/><rect x="14" y="14" width="7" height="7" rx="0.5"/></svg> },
              { key: 'reels' as IGTab, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={igTab==='reels'?'#111827':'#9ca3af'} strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> },
              { key: 'tagged' as IGTab, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={igTab==='tagged'?'#111827':'#9ca3af'} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
            ]).map(t => (
              <button key={t.key} onClick={() => setIgTab(t.key)} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: igTab === t.key ? '1px solid #111827' : '1px solid transparent', cursor: 'pointer' }}>{t.icon}</button>
            ))}
          </div>
          {/* Grid */}
          {(() => {
            if (igTab === 'tagged') return (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280', fontSize: '0.82rem' }}>Tidak ada foto yang menandai kamu</div>
            )
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, background: '#e5e7eb' }}>
                {igFiltered.map(c => {
                  const thumb = getThumbnail(c)
                  const isVideo = VIDEO_FORMATS.includes(c.format)
                  return (
                    <div key={c.id}
                      style={{ position: 'relative', aspectRatio: igTab === 'reels' ? '9/16' : '1/1', overflow: 'hidden', cursor: 'pointer', background: '#f3f4f6' }}
                      onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                      onClick={() => igTab === 'reels' ? setPreviewReels(c) : setPreviewPost(c)}>
                      {thumb ? <img src={thumb} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={c} />}
                      {c.format && <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '0.52rem', fontWeight: 600, color: '#fff', background: isVideo ? 'rgba(220,39,39,0.85)' : 'rgba(30,64,175,0.85)', padding: '2px 4px', borderRadius: 3 }}>{c.format}</div>}
                      <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[c.status] || '#6b7280', boxShadow: '0 0 4px rgba(0,0,0,0.4)' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: hoveredId === c.id ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <span style={{ fontSize: '0.58rem', fontWeight: 600, color: '#fff', textAlign: 'center', padding: '0 4px', lineHeight: 1.3 }}>{(c.judul || '').slice(0, 22)}{(c.judul || '').length > 22 ? '…' : ''}</span>
                      </div>
                    </div>
                  )
                })}
                {Array.from({ length: Math.max(0, 9 - igFiltered.length) }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ aspectRatio: igTab === 'reels' ? '9/16' : '1/1', background: '#f9fafb', border: '1px dashed #d1d5db' }}>
                    {i === 0 && igFiltered.length === 0 && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'center', padding: 4 }}>{igTab === 'reels' ? 'Belum ada Reels' : 'Belum ada konten'}</span></div>}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
          )}

          {/* ─── TIKTOK ─── */}
          {platformTab === 'tiktok' && (
            <div style={{ maxWidth: 340, margin: '0 auto', background: '#000', borderRadius: 36, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '8px solid #111' }}>
              {/* Status bar */}
              <div style={{ background: '#000', padding: '10px 20px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>9:41</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="15" height="11" viewBox="0 0 15 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="white"/><rect x="4" y="4.5" width="3" height="6.5" rx="0.5" fill="white"/><rect x="8" y="2" width="3" height="9" rx="0.5" fill="white"/><rect x="12" y="0" width="3" height="11" rx="0.5" fill="white"/></svg>
                  <svg width="15" height="11" viewBox="0 0 22 16"><path d="M11 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="white"/><path d="M5 9a9 9 0 0112 0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M1 5a15 15 0 0120 0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                  <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0" y="0.5" width="18" height="10" rx="2" stroke="white" strokeWidth="1.2" fill="none"/><rect x="1.5" y="2" width="14" height="7" rx="1" fill="white"/><path d="M19.5 3.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              </div>
              {/* For You / Following tabs */}
              <div style={{ background: '#000', padding: '6px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 600 }}>Following</span>
                  <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 800, borderBottom: '2.5px solid #fff', paddingBottom: 2 }}>For You</span>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 600 }}>LIVE</span>
                </div>
                <svg style={{ position: 'absolute', right: 16, top: 8 }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </div>
              {/* Profile */}
              <div style={{ background: '#000', padding: '12px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#1a1a1a', border: '3px solid #fe2c55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem', color: '#fff' }}>{initial}</div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>@{handle}</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  {[['124', 'Following'], ['12.3K', 'Followers'], [String(filtered.length), 'Video']].map(([v, k]) => (
                    <div key={k} style={{ textAlign: 'center' as const }}>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{v}</div>
                      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.6rem', marginTop: 1 }}>{k}</div>
                    </div>
                  ))}
                </div>
                <button style={{ background: '#fe2c55', border: 'none', borderRadius: 4, padding: '7px 48px', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Follow</button>
                {/* Profile nav tabs */}
                <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid #1f1f1f', marginTop: 4 }}>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '8px 0', borderBottom: '2px solid #fff' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  </div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  </div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                </div>
              </div>
              {/* 3-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#1a1a1a' }}>
                {filtered.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center' as const, color: '#4b5563', fontSize: '0.75rem', background: '#000' }}>Belum ada konten</div>
                ) : filtered.map(c => {
                  const t = getThumbnail(c)
                  const isVid = VIDEO_FORMATS.includes(c.format)
                  const code = c.id.charCodeAt(0) + c.id.charCodeAt(c.id.length - 1)
                  const fakeLikes = `${(code % 90 + 10)}.${code % 10}K`
                  return (
                    <div key={c.id} style={{ position: 'relative', aspectRatio: '4 / 5', background: '#111', cursor: 'pointer', overflow: 'hidden' }}
                      onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                      onClick={() => isVid ? setPreviewReels(c) : setPreviewPost(c)}>
                      {t ? <img src={t} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={c} />}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 5px 5px', background: 'linear-gradient(to top, rgba(0,0,0,0.82), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                          <span style={{ fontSize: '0.5rem', color: '#fff', fontWeight: 600 }}>{fakeLikes}</span>
                        </div>
                      </div>
                      {hoveredId === c.id && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(254,44,85,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.52rem', color: '#fff', fontWeight: 700, background: 'rgba(0,0,0,0.65)', padding: '3px 7px', borderRadius: 4 }}>{c.status}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Bottom navigation */}
              <div style={{ background: '#000', borderTop: '1px solid #1a1a1a', padding: '10px 0 20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                  <span style={{ color: '#fff', fontSize: '0.5rem', fontWeight: 700 }}>Home</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem' }}>Friends</span>
                </div>
                {/* Create */}
                <div style={{ background: 'linear-gradient(to right, #69C9D0, #fff, #EE1D52)', borderRadius: 10, padding: 2 }}>
                  <div style={{ background: '#000', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem' }}>Inbox</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{initial}</div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.5rem' }}>Me</span>
                </div>
              </div>
            </div>
          )}

          {/* ─── YOUTUBE ─── */}
          {platformTab === 'youtube' && (
            <div style={{ maxWidth: 390, margin: '0 auto', background: '#f9f9f9', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              {/* YouTube header */}
              <div style={{ background: '#fff', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <svg width="26" height="18" viewBox="0 0 26 18"><rect width="26" height="18" rx="5" fill="#FF0000"/><polygon points="10,5 10,13 18,9" fill="white"/></svg>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f0f0f', letterSpacing: '-0.3px' }}>YouTube</span>
                </div>
                <div style={{ flex: 1, background: '#f2f2f2', borderRadius: 20, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #e0e0e0' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <span style={{ color: '#aaa', fontSize: '0.7rem' }}>Search</span>
                </div>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.65rem', color: '#fff', flexShrink: 0 }}>{initial}</div>
              </div>
              {/* Filter chips */}
              <div style={{ background: '#fff', padding: '7px 0 7px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 7, overflowX: 'auto' as const }}>
                {['All', 'Music', 'Gaming', 'Fashion', 'Live', 'Podcasts'].map((chip, i) => (
                  <span key={chip} style={{ padding: '4px 11px', borderRadius: 20, background: i === 0 ? '#0f0f0f' : '#f2f2f2', color: i === 0 ? '#fff' : '#0f0f0f', fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' as const, flexShrink: 0, cursor: 'pointer' }}>{chip}</span>
                ))}
              </div>
              {/* Shorts section */}
              {youtubeShorts.length > 0 && (
                <div style={{ background: '#fff', paddingTop: 12, marginBottom: 6, borderBottom: '6px solid #f9f9f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 14, marginBottom: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4zm1 3H9v4H5v2h4v4h2v-4h4v-2h-4V7z"/></svg>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f0f0f' }}>Shorts</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#606060" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingLeft: 14, paddingRight: 14, overflowX: 'auto' as const, paddingBottom: 12 }}>
                    {youtubeShorts.map(c => {
                      const t = getThumbnail(c)
                      const code = c.id.charCodeAt(0) + c.id.charCodeAt(c.id.length - 1)
                      const fakeViews = `${(code % 900 + 100)}K`
                      return (
                        <div key={c.id} style={{ width: 96, flexShrink: 0, cursor: 'pointer' }} onClick={() => setPreviewReels(c)}>
                          <div style={{ aspectRatio: '9 / 16', background: '#e5e5e5', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                            {t ? <img src={t} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={c} />}
                            <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                              <span style={{ color: '#fff', fontSize: '0.48rem', fontWeight: 700 }}>{fakeViews}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#0f0f0f', marginTop: 5, lineHeight: 1.3 }}>{(c.judul || '').slice(0, 24)}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {/* Regular video feed */}
              <div style={{ display: 'flex', flexDirection: 'column' as const }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' as const, color: '#606060', fontSize: '0.82rem' }}>Belum ada konten</div>
                ) : filtered.map(c => {
                  const t = getThumbnail(c)
                  const code = c.id.charCodeAt(0) + c.id.charCodeAt(c.id.length - 1)
                  const fakeViews = `${(code % 900 + 100)}K views`
                  const fakeMin = (code % 8) + 1
                  const fakeSec = String(code % 60).padStart(2, '0')
                  const isVid = VIDEO_FORMATS.includes(c.format)
                  return (
                    <div key={c.id} style={{ background: '#fff', cursor: 'pointer', borderBottom: '6px solid #f9f9f9' }} onClick={() => setSelectedItem(c)}>
                      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#e5e5e5', overflow: 'hidden' }}>
                        {t ? <img src={t} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <ThumbnailPlaceholder item={c} />}
                        {isVid && <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.85)', borderRadius: 3, padding: '1px 5px', fontSize: '0.58rem', color: '#fff', fontWeight: 700 }}>{fakeMin}:{fakeSec}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 10, padding: '10px 14px 12px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: '#fff', flexShrink: 0 }}>{initial}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f0f0f', lineHeight: 1.35, marginBottom: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{c.judul || '(Tanpa judul)'}</div>
                          <div style={{ fontSize: '0.62rem', color: '#606060' }}>{workspaceName} · {fakeViews} · 2 hari lalu</div>
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: '0.57rem', padding: '1px 6px', borderRadius: 3, color: STATUS_COLOR[c.status] || '#6b7280', background: STATUS_BG[c.status] || '#f3f4f6', fontWeight: 600 }}>{c.status}</span>
                          </div>
                        </div>
                        <div style={{ color: '#606060', fontSize: '1.1rem', flexShrink: 0, lineHeight: 1, alignSelf: 'flex-start', marginTop: 2 }}>⋮</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Bottom navigation */}
              <div style={{ background: '#fff', borderTop: '1px solid #e5e5e5', padding: '10px 0 16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#0f0f0f"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="#fff" stroke="#0f0f0f" strokeWidth="1"/></svg>
                  <span style={{ color: '#0f0f0f', fontSize: '0.5rem', fontWeight: 700 }}>Home</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ff0000"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm1 3v4h4v2h-4v4H9v-4H5v-2h4V5h2z"/></svg>
                  <span style={{ color: '#606060', fontSize: '0.5rem' }}>Shorts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#606060" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#606060" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
                  <span style={{ color: '#606060', fontSize: '0.5rem' }}>Subscriptions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.58rem', color: '#fff' }}>{initial}</div>
                  <span style={{ color: '#606060', fontSize: '0.5rem' }}>You</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Floating bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 400, background: '#1e1b4b', color: '#fff', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedIds.size} konten dipilih</span>
          <button onClick={handleBulkSelesai}
            style={{ padding: '8px 18px', borderRadius: 8, background: isApprover ? '#059669' : '#8b5cf6', border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
            {isApprover ? 'Approve Selesai' : 'Submit untuk Review'}
          </button>
          <button onClick={() => { setSelectedIds(new Set()); setBulkMode(false) }}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: '0.82rem', cursor: 'pointer' }}>
            Batal
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedItem && <NaskahModal item={selectedItem} products={products} workspaceMembers={workspaceMembers} onClose={() => setSelectedItem(null)} onUpdate={handleUpdate} isApprover={isApprover} />}
      {previewPost && <IGPostPreview item={previewPost} workspaceName={workspaceName} onEdit={() => { setPreviewPost(null); setSelectedItem(previewPost) }} onClose={() => setPreviewPost(null)} />}
      {previewReels && <IGReelsPreview item={previewReels} workspaceName={workspaceName} onEdit={() => { setPreviewReels(null); setSelectedItem(previewReels) }} onClose={() => setPreviewReels(null)} />}
      {showNotif && (<><div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowNotif(false)} /><NotifPanel notifications={notifications} onClose={() => setShowNotif(false)} onMarkRead={markRead} /></>)}
    </div>
  )
}
