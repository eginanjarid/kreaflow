'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContentIdea = {
  id?: string
  workspace_id: string
  pillar_id: string
  product_id: string
  judul: string
  format: string
  formula: string
  usp: string[]
  hook: string
  body: string
  cta: string
  hashtags: string[]
  prompt_script: string
  script: string
  status: string
  platform: string[]
  scheduled_date: string
  canva_url?: string
  gdrive_url?: string
  preview_url?: string
  show_in_feed?: boolean
}

type Product = { id: string; nama: string }
type Pillar = { id: string; nama: string }
type TaskSnap = { id: string; nama: string; due_date: string; percent_complete: number; priority: string }

const FORMATS = ['Video Pendek', 'Reels', 'Story', 'Carousel', 'Single Post', 'Thread', 'Live', 'Podcast', 'Blog']
const FORMULAS = ['AIDA', 'PAS', 'BAB', 'Hook-Story-Offer', 'FAB', '4C', 'Before-After', 'Story Telling', 'Tutorial']
const STATUSES = ['Draft', 'Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const STATUS_COLOR: Record<string, string> = {
  Draft: '#475569',
  'Naskah Siap': '#f59e0b',
  Produksi: '#3b82f6',
  'Siap Tayang': '#22c55e',
  Terjadwal: '#a855f7',
  Tayang: '#6b21a8',
  Ready: '#166534', Scheduled: '#1e40af', Posted: '#6b21a8',
}
const STATUS_BG: Record<string, string> = {
  Draft: '#f1f5f9',
  'Naskah Siap': 'rgba(245,158,11,0.12)',
  Produksi: 'rgba(59,130,246,0.12)',
  'Siap Tayang': 'rgba(34,197,94,0.12)',
  Terjadwal: 'rgba(168,85,247,0.12)',
  Tayang: 'rgba(107,33,168,0.15)',
  Ready: 'rgba(22,101,52,0.15)', Scheduled: 'rgba(30,64,175,0.15)', Posted: 'rgba(107,33,168,0.15)',
}

function emptyIdea(workspaceId: string): ContentIdea {
  return {
    workspace_id: workspaceId, pillar_id: '', product_id: '', judul: '',
    format: '', formula: '', usp: [], hook: '', body: '', cta: '',
    hashtags: [], prompt_script: '', script: '', status: 'Draft', platform: [],
    scheduled_date: '', canva_url: '', gdrive_url: '', preview_url: '', show_in_feed: true,
  }
}

function fieldStyle(extra?: object) {
  return {
    width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2',
    borderRadius: 8, padding: '10px 12px', color: '#2a3547',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const,
    ...extra,
  }
}
function selectStyle() {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }
}

function extractGdriveId(url: string): string | null {
  if (!url) return null
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function getThumbnail(idea: ContentIdea): string | null {
  if (idea.preview_url) {
    const gdriveId = extractGdriveId(idea.preview_url)
    if (gdriveId) return `https://drive.google.com/thumbnail?id=${gdriveId}&sz=w400`
    return idea.preview_url
  }
  if (idea.gdrive_url) {
    const id = extractGdriveId(idea.gdrive_url)
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w400`
  }
  return null
}

function IGPostPreview({ idea, workspaceName, onEdit, onClose }: {
  idea: ContentIdea; workspaceName: string; onEdit: () => void; onClose: () => void
}) {
  const thumb = getThumbnail(idea)
  const handle = workspaceName.toLowerCase().replace(/\s+/g, '')
  const initial = workspaceName.charAt(0).toUpperCase()
  const caption = [idea.hook, idea.body, idea.cta].filter(Boolean).join('\n\n') || idea.judul
  const hashtags = (idea.hashtags || []).join(' ')
  const fakeLikes = Math.floor(Math.random() * 900) + 100

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 390, maxHeight: '92vh', overflowY: 'auto', background: '#000', borderRadius: 20, border: '1px solid #222', display: 'flex', flexDirection: 'column' }}>

        {/* IG Post Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2a3547', lineHeight: 1 }}>{handle}</div>
            <div style={{ fontSize: '0.68rem', color: '#5a6a85', marginTop: 2 }}>Original audio</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>Ikuti</span>
            <span style={{ color: '#5a6a85', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>···</span>
          </div>
        </div>

        {/* Image */}
        <div style={{ width: '100%', aspectRatio: '4 / 5', background: '#fff', position: 'relative', overflow: 'hidden' }}>
          {thumb
            ? <img src={thumb} alt={idea.judul} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            : <ThumbnailPlaceholder idea={idea} />
          }
          {/* dot indicator */}
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>

        {/* Action bar */}
        <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <div style={{ flex: 1 }} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {/* Likes */}
        <div style={{ paddingInline: 14, fontSize: '0.82rem', fontWeight: 700, color: '#2a3547', marginBottom: 4 }}>
          {fakeLikes.toLocaleString()} suka
        </div>

        {/* Caption */}
        {caption && (
          <div style={{ paddingInline: 14, fontSize: '0.82rem', color: '#2a3547', lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, marginRight: 6 }}>{handle}</span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{caption.length > 150 ? caption.slice(0, 150) + '...' : caption}</span>
          </div>
        )}

        {/* Hashtags */}
        {hashtags && (
          <div style={{ paddingInline: 14, fontSize: '0.8rem', color: '#3b82f6', marginBottom: 4, lineHeight: 1.5 }}>
            {hashtags}
          </div>
        )}

        {/* Status badge */}
        <div style={{ paddingInline: 14, marginBottom: 6 }}>
          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[idea.status], background: STATUS_BG[idea.status], fontWeight: 600 }}>
            {idea.status}
          </span>
          {idea.format && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#5a6a85' }}>{idea.format}</span>}
        </div>

        <div style={{ fontSize: '0.7rem', color: '#5a6a85', paddingInline: 14, marginBottom: 10 }}>
          {idea.scheduled_date ? `Dijadwalkan: ${idea.scheduled_date}` : 'Belum dijadwalkan'}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 16px', borderTop: '1px solid #1a1a1a' }}>
          <button onClick={onEdit}
            style={{ flex: 1, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            Edit Konten
          </button>
          {idea.canva_url && (
            <a href={idea.canva_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px', color: '#42a5f5', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
              Buka Canva ↗
            </a>
          )}
          {idea.gdrive_url && (
            <a href={idea.gdrive_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
              Drive ↗
            </a>
          )}
          <button onClick={onClose}
            style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#5a6a85', fontSize: '0.82rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function IGReelsPreview({ idea, workspaceName, onEdit, onClose }: {
  idea: ContentIdea; workspaceName: string; onEdit: () => void; onClose: () => void
}) {
  const thumb = getThumbnail(idea)
  const handle = workspaceName.toLowerCase().replace(/\s+/g, '')
  const initial = workspaceName.charAt(0).toUpperCase()
  const caption = [idea.hook, idea.body, idea.cta].filter(Boolean).join(' ') || idea.judul
  const hashtags = (idea.hashtags || []).join(' ')
  const fakeLikes = Math.floor(Math.random() * 9000) + 1000
  const fakeComments = Math.floor(Math.random() * 500) + 50

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, flexDirection: 'column', gap: 12 }}
      onClick={onClose}>
      {/* Reel container */}
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: 340, height: 604, borderRadius: 18, overflow: 'hidden', background: '#000', border: '1px solid #e5eaf2', flexShrink: 0 }}>

        {/* Background thumbnail */}
        {thumb
          ? <img src={thumb} alt={idea.judul} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <div style={{ position: 'absolute', inset: 0 }}><ThumbnailPlaceholder idea={idea} /></div>
        }

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.35) 100%)' }} />

        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '14px 14px 0' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Reels</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ cursor: 'pointer' }}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>

        {/* Play button */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ position: 'absolute', right: 10, bottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>{fakeLikes.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>{fakeComments}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span style={{ color: '#fff', fontSize: '0.68rem', fontWeight: 600 }}>Kirim</span>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>

        {/* Bottom info */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 48, padding: '0 14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
              {initial}
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{handle}</span>
            <span style={{ color: '#fff', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>Ikuti</span>
          </div>
          {caption && (
            <div style={{ color: '#fff', fontSize: '0.78rem', lineHeight: 1.4, marginBottom: 6 }}>
              {caption.length > 100 ? caption.slice(0, 100) + '…' : caption}
            </div>
          )}
          {hashtags && (
            <div style={{ color: '#93c5fd', fontSize: '0.73rem', marginBottom: 8 }}>
              {hashtags.length > 60 ? hashtags.slice(0, 60) + '…' : hashtags}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <span style={{ color: '#2a3547', fontSize: '0.7rem' }}>Audio original · {handle}</span>
          </div>
        </div>
      </div>

      {/* Action buttons below */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(30,30,30,0.9)', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', color: STATUS_COLOR[idea.status], fontWeight: 600 }}>{idea.status}</span>
          {idea.scheduled_date && <span style={{ fontSize: '0.65rem', color: '#5a6a85' }}>· {idea.scheduled_date}</span>}
        </div>
        <button onClick={onEdit} style={{ background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
          Edit Konten
        </button>
        {idea.canva_url && (
          <a href={idea.canva_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 14px', color: '#42a5f5', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
            Canva ↗
          </a>
        )}
        {idea.gdrive_url && (
          <a href={idea.gdrive_url} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 14px', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
            Drive ↗
          </a>
        )}
        <button onClick={onClose} style={{ background: 'rgba(30,30,30,0.9)', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 12px', color: '#5a6a85', fontSize: '0.78rem', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
    </div>
  )
}

const PREVIEW_RATIOS = [
  { key: '1:1',     label: '1:1',      sub: 'IG Grid',    w: 160, h: 160 },
  { key: '4:5',     label: '4:5',      sub: 'IG / TikTok', w: 128, h: 160 },
  { key: '16:9',    label: '16:9',     sub: 'YouTube',    w: 200, h: 113 },
  { key: '1.91:1',  label: '1.91:1',   sub: 'Landscape',  w: 200, h: 105 },
]

function MediaPreview({ idea }: { idea: ContentIdea }) {
  const [ratio, setRatio] = useState('1:1')
  const thumb = getThumbnail(idea)
  const r = PREVIEW_RATIOS.find(x => x.key === ratio) || PREVIEW_RATIOS[0]

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginBottom: 8 }}>Preview tampilan:</div>
      {/* Ratio toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {PREVIEW_RATIOS.map(rx => (
          <button key={rx.key} type="button" onClick={() => setRatio(rx.key)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 12px', borderRadius: 8, border: ratio === rx.key ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: ratio === rx.key ? 'rgba(26,115,232,0.15)' : '#f1f5f9', cursor: 'pointer', gap: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: ratio === rx.key ? 700 : 400, color: ratio === rx.key ? '#42a5f5' : '#94a3b8' }}>{rx.label}</span>
            <span style={{ fontSize: '0.6rem', color: ratio === rx.key ? '#1a73e8' : '#475569' }}>{rx.sub}</span>
          </button>
        ))}
      </div>
      {/* Preview box */}
      <div style={{ width: r.w, height: r.h, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5eaf2', background: '#fff', transition: 'all 0.2s' }}>
        {thumb
          ? <img src={thumb} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <ThumbnailPlaceholder idea={idea} />
        }
      </div>
      <div style={{ marginTop: 5, fontSize: '0.68rem', color: '#5a6a85' }}>{r.w}×{r.h}px · {r.label} · {r.sub}</div>
    </div>
  )
}

function SprintTimeline({ tasks, productName }: { tasks: TaskSnap[]; productName: string }) {
  const sprintTasks = tasks
    .filter(t => t.nama.includes(' — ') && t.nama.endsWith('— ' + productName))
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
  if (sprintTasks.length === 0) return null

  return (
    <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.18)', borderRadius: 8 }}>
      <div style={{ fontSize: '0.68rem', color: '#1a73e8', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>⚡ SPRINT TIMELINE</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sprintTasks.map(t => {
          const rawStep = t.nama.split(' —')[0].trim()
          const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
          const pct = t.percent_complete || 0
          const dot = pct === 100 ? '●' : pct > 0 ? '◑' : '○'
          const dotColor = pct === 100 ? '#86efac' : pct > 0 ? '#fbbf24' : '#64748b'
          const dateStr = t.due_date ? t.due_date.slice(5).replace('-', '/') : ''
          return (
            <span key={t.id} title={`${stepName} — ${t.due_date}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85' }}>
              <span style={{ color: dotColor, fontSize: '0.7rem' }}>{dot}</span>
              <span>{stepName}</span>
              {dateStr && <span style={{ color: '#5a6a85', marginLeft: 1 }}>{dateStr}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function ThumbnailPlaceholder({ idea }: { idea: ContentIdea }) {
  const letter = (idea.judul || '?').charAt(0).toUpperCase()
  const gradients: Record<string, string> = {
    Draft: 'linear-gradient(135deg, #1e293b, #334155)',
    Ready: 'linear-gradient(135deg, #14532d, #166534)',
    Scheduled: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
    Posted: 'linear-gradient(135deg, #3b0764, #6b21a8)',
  }
  return (
    <div style={{ width: '100%', height: '100%', background: gradients[idea.status] || gradients.Draft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif' }}>{letter}</span>
      {idea.canva_url && <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>Canva</span>}
    </div>
  )
}

export default function LibraryModule({ initialIdeas, workspaceId, workspaceName = 'workspace', products, pillars, tasks = [] }: {
  initialIdeas: ContentIdea[]
  workspaceId: string
  workspaceName?: string
  products: Product[]
  pillars: Pillar[]
  tasks?: TaskSnap[]
}) {
  const [ideas, setIdeas] = useState<ContentIdea[]>(initialIdeas)
  const [modal, setModal] = useState<{ open: boolean; idea: ContentIdea; tab: string }>({
    open: false, idea: emptyIdea(workspaceId), tab: 'basic',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [expandedScript, setExpandedScript] = useState<string | null>(null)
  const [scheduleModal, setScheduleModal] = useState<{ idea: ContentIdea } | null>(null)
  const [schedEntry, setSchedEntry] = useState({ platform: '', scheduled_at: '', status: 'Planned' })
  const [schedSaving, setSchedSaving] = useState(false)
  const [schedDone, setSchedDone] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function openSchedule(c: ContentIdea) {
    setScheduleModal({ idea: c })
    setSchedEntry({ platform: (c.platform || [])[0] || '', scheduled_at: '', status: 'Planned' })
    setSchedDone(false)
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduleModal?.idea.id) return
    setSchedSaving(true)
    const supabase = createClient()
    await supabase.from('kf_calendar_entries').insert({
      workspace_id: workspaceId,
      content_id: scheduleModal.idea.id,
      platform: schedEntry.platform,
      scheduled_at: schedEntry.scheduled_at,
      posted_at: null,
      posted_url: null,
      status: schedEntry.status,
    })
    if (['Draft', 'Ready'].includes(scheduleModal.idea.status)) {
      await supabase.from('kf_content_ideas').update({ status: 'Scheduled' }).eq('id', scheduleModal.idea.id)
      setIdeas(prev => prev.map(x => x.id === scheduleModal.idea.id ? { ...x, status: 'Scheduled' } : x))
    }
    setSchedSaving(false)
    setSchedDone(true)
    setTimeout(() => setScheduleModal(null), 1200)
  }

  function openAdd() {
    setModal({ open: true, idea: emptyIdea(workspaceId), tab: 'basic' })
    setError('')
  }
  function openEdit(c: ContentIdea) {
    setModal({ open: true, idea: { ...c }, tab: 'basic' })
    setError('')
  }
  function closeModal() { setModal(m => ({ ...m, open: false })) }
  function setField(key: keyof ContentIdea, value: string | string[] | boolean) {
    setModal(m => ({ ...m, idea: { ...m.idea, [key]: value } }))
  }
  function toggleArr(key: 'platform' | 'usp' | 'hashtags', val: string) {
    const arr = modal.idea[key] as string[]
    setField(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const c = modal.idea
    const payload = { ...c, workspace_id: workspaceId }
    if (c.id) {
      const { error: err } = await supabase.from('kf_content_ideas').update(payload).eq('id', c.id)
      if (err) { setError(err.message); setSaving(false); return }
      setIdeas(prev => prev.map(x => x.id === c.id ? { ...payload } : x))
    } else {
      const { data, error: err } = await supabase.from('kf_content_ideas').insert(payload).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setIdeas(prev => [{ ...payload, id: data.id }, ...prev])
    }
    setSaving(false)
    closeModal()
  }

  async function deleteIdea(id: string) {
    if (!confirm('Hapus konten ini?')) return
    const supabase = createClient()
    await supabase.from('kf_content_ideas').delete().eq('id', id)
    setIdeas(prev => prev.filter(x => x.id !== id))
  }

  async function generateScript() {
    if (!modal.idea.judul) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: modal.idea }),
      })
      const data = await res.json()
      if (data.hook) setField('hook', data.hook)
      if (data.body) setField('body', data.body)
      if (data.cta) setField('cta', data.cta)
      if (data.script) setField('script', data.script)
      if (data.hashtags) setField('hashtags', data.hashtags)
      setModal(m => ({ ...m, tab: 'script' }))
    } finally {
      setAiLoading(false)
    }
  }

  const filtered = ideas.filter(c =>
    (!filterStatus || c.status === filterStatus) &&
    (!filterPlatform || c.platform.includes(filterPlatform))
  )

  const pillarMap = Object.fromEntries(pillars.map(p => [p.id, p.nama]))
  const productMap = Object.fromEntries(products.map(p => [p.id, p.nama]))

  const MODAL_TABS = [
    { id: 'basic', label: 'Info Dasar' },
    { id: 'content', label: 'Konten' },
    { id: 'script', label: 'Script' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2a3547', letterSpacing: '-0.5px', marginBottom: 6 }}>Library</h1>
          <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Bank konten — hook, body, CTA, dan script siap pakai</p>
        </div>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Tambah Konten
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {STATUSES.map(s => (
          <div key={s} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2a3547' }}>{ideas.filter(c => c.status === s).length}</div>
            <div style={{ fontSize: '0.75rem', color: STATUS_COLOR[s], marginTop: 2, fontWeight: 500 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      {ideas.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterStatus === s ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: filterStatus === s ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: filterStatus === s ? '#42a5f5' : '#64748b', cursor: 'pointer' }}>
              {s || 'Semua'}
            </button>
          ))}
          <div style={{ width: 1, background: '#e5eaf2', margin: '0 4px', alignSelf: 'stretch' }} />
          {['', ...PLATFORMS].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterPlatform === p ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: filterPlatform === p ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: filterPlatform === p ? '#42a5f5' : '#64748b', cursor: 'pointer' }}>
              {p || 'Semua Platform'}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#5a6a85' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📚</div>
          <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>{ideas.length === 0 ? 'Library kosong' : 'Tidak ada konten'}</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>{ideas.length === 0 ? 'Mulai tambahkan ide konten kamu' : 'Coba filter lain'}</div>
          {ideas.length === 0 && (
            <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              + Buat Konten Pertama
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.9rem' }}>{c.judul || '(Tanpa judul)'}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[c.status], background: STATUS_BG[c.status], fontWeight: 600 }}>{c.status}</span>
                    {c.format && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: '#5a6a85', background: '#f8fafc', border: '1px solid #e5eaf2' }}>{c.format}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.platform.map(p => <span key={p} style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#1a73e8', background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.2)' }}>{p}</span>)}
                    {c.pillar_id && pillarMap[c.pillar_id] && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#5a6a85', background: '#f8fafc' }}>📌 {pillarMap[c.pillar_id]}</span>}
                    {c.product_id && productMap[c.product_id] && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#5a6a85', background: '#f8fafc' }}>📦 {productMap[c.product_id]}</span>}
                  </div>
                  {c.hook && (
                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#5a6a85', fontStyle: 'italic', borderLeft: '2px solid #1a73e8', paddingLeft: 10 }}>
                      "{c.hook.length > 120 ? c.hook.slice(0, 120) + '...' : c.hook}"
                    </div>
                  )}
                  {c.product_id && productMap[c.product_id] && (
                    <SprintTimeline tasks={tasks} productName={productMap[c.product_id]} />
                  )}
                  {c.script && expandedScript === c.id && (
                    <div style={{ marginTop: 10, background: '#fff', borderRadius: 8, padding: 14, fontSize: '0.8rem', color: '#5a6a85', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
                      {c.script}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {c.script && (
                    <button onClick={() => setExpandedScript(expandedScript === c.id ? null : c.id!)}
                      style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 10px', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer' }}>
                      {expandedScript === c.id ? 'Tutup' : 'Script'}
                    </button>
                  )}
                  <button onClick={() => openSchedule(c)}
                    style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, padding: '6px 10px', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
                    title="Jadwalkan ke Calendar">
                    📅
                  </button>
                  <button onClick={() => openEdit(c)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 8, padding: '6px 12px', color: '#42a5f5', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteIdea(c.id!)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 10px', color: '#5a6a85', fontSize: '0.78rem', cursor: 'pointer' }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Quick Schedule Modal */}
      {scheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2a3547' }}>📅 Jadwalkan ke Calendar</h3>
              <button onClick={() => setScheduleModal(null)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            {schedDone ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <div style={{ color: '#86efac', fontWeight: 600, fontSize: '0.9rem' }}>Berhasil dijadwalkan!</div>
              </div>
            ) : (
              <form onSubmit={handleSchedule} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem', color: '#5a6a85', border: '1px solid #e5eaf2' }}>
                  <span style={{ color: '#5a6a85', fontSize: '0.72rem' }}>Konten: </span>
                  <span style={{ fontWeight: 600, color: '#2a3547' }}>{scheduleModal.idea.judul}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform *</label>
                  <select style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                    value={schedEntry.platform} onChange={e => setSchedEntry(s => ({ ...s, platform: e.target.value }))} required>
                    <option value="">Pilih platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Jadwal Posting *</label>
                  <input type="datetime-local" required
                    style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const }}
                    value={schedEntry.scheduled_at} onChange={e => setSchedEntry(s => ({ ...s, scheduled_at: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                    value={schedEntry.status} onChange={e => setSchedEntry(s => ({ ...s, status: e.target.value }))}>
                    {['Planned', 'Ready'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setScheduleModal(null)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 18px', color: '#5a6a85', fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={schedSaving} style={{ background: schedSaving ? '#1557b0' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: schedSaving ? 'not-allowed' : 'pointer' }}>
                    {schedSaving ? 'Menjadwalkan...' : 'Jadwalkan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2a3547' }}>
                {modal.idea.id ? 'Edit Konten' : 'Tambah Konten'}
              </h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5eaf2', flexShrink: 0 }}>
              {MODAL_TABS.map(t => (
                <button key={t.id} onClick={() => setModal(m => ({ ...m, tab: t.id }))}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: modal.tab === t.id ? '2px solid #1a73e8' : '2px solid transparent', color: modal.tab === t.id ? '#42a5f5' : '#64748b', fontSize: '0.82rem', fontWeight: modal.tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}

              {/* Tab: Basic */}
              {modal.tab === 'basic' && <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Judul Konten *</label>
                  <input style={fieldStyle()} value={modal.idea.judul} onChange={e => setField('judul', e.target.value)} placeholder="Judul atau topik konten" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Format</label>
                    <select style={selectStyle()} value={modal.idea.format ?? ''} onChange={e => setField('format', e.target.value)}>
                      <option value="">Pilih format</option>
                      {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Formula</label>
                    <select style={selectStyle()} value={modal.idea.formula ?? ''} onChange={e => setField('formula', e.target.value)}>
                      <option value="">Pilih formula</option>
                      {FORMULAS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.82rem', padding: '6px 12px', borderRadius: 8, color: STATUS_COLOR[modal.idea.status] || '#475569', background: STATUS_BG[modal.idea.status] || '#f1f5f9', fontWeight: 600, border: `1px solid ${STATUS_COLOR[modal.idea.status] || '#e5eaf2'}33` }}>
                        {modal.idea.status || 'Draft'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#334155' }}>Diatur otomatis oleh workflow</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Produk</label>
                    <select style={selectStyle()} value={modal.idea.product_id ?? ''} onChange={e => setField('product_id', e.target.value)}>
                      <option value="">Tanpa produk</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Pillar</label>
                    <select style={selectStyle()} value={modal.idea.pillar_id ?? ''} onChange={e => setField('pillar_id', e.target.value)}>
                      <option value="">Tanpa pillar</option>
                      {pillars.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tanggal Tayang</label>
                    <input type="date" style={fieldStyle()} value={modal.idea.scheduled_date} onChange={e => setField('scheduled_date', e.target.value)} />
                  </div>
                </div>
                {['Reels', 'Video Pendek', 'Live'].includes(modal.idea.format) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2a3547' }}>Tampil di Feed</div>
                      <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginTop: 2 }}>Seperti opsi "Bagikan ke Feed" di Instagram Reels</div>
                    </div>
                    <button type="button"
                      onClick={() => setField('show_in_feed', !(modal.idea.show_in_feed !== false))}
                      style={{ width: 44, height: 24, borderRadius: 20, border: 'none', cursor: 'pointer', background: modal.idea.show_in_feed !== false ? 'linear-gradient(135deg,#1a73e8,#42a5f5)' : '#e5eaf2', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: modal.idea.show_in_feed !== false ? 23 : 3, transition: 'left 0.2s' }} />
                    </button>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 8, fontWeight: 500 }}>Platform</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PLATFORMS.map(p => (
                      <button key={p} type="button" onClick={() => toggleArr('platform', p)}
                        style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: modal.idea.platform.includes(p) ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: modal.idea.platform.includes(p) ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: modal.idea.platform.includes(p) ? '#42a5f5' : '#64748b', cursor: 'pointer' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {/* Tab: Content */}
              {modal.tab === 'content' && <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.82rem', color: '#5a6a85' }}>Isi komponen konten atau generate otomatis</div>
                  <button type="button" disabled={aiLoading || !modal.idea.judul} onClick={generateScript}
                    style={{ background: 'rgba(26,115,232,0.15)', border: '1px solid #1a73e8', borderRadius: 8, padding: '7px 14px', color: '#42a5f5', fontSize: '0.78rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                    {aiLoading ? '⏳...' : '✨ Generate AI'}
                  </button>
                </div>
                {[
                  { label: 'Hook (Pembuka)', key: 'hook' as keyof ContentIdea, placeholder: 'Kalimat pembuka yang menarik perhatian...', h: 72 },
                  { label: 'Body (Isi)', key: 'body' as keyof ContentIdea, placeholder: 'Isi konten utama...', h: 96 },
                  { label: 'CTA (Call to Action)', key: 'cta' as keyof ContentIdea, placeholder: 'Ajakan di akhir konten...', h: 56 },
                ].map(({ label, key, placeholder, h }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                    <textarea style={fieldStyle({ height: h, resize: 'none' })} value={modal.idea[key] as string} onChange={e => setField(key, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Hashtag (spasi-separated)</label>
                  <input style={fieldStyle()} value={(modal.idea.hashtags || []).join(' ')} onChange={e => setField('hashtags', e.target.value.split(/\s+/).filter(Boolean))} placeholder="#hashtag1 #hashtag2 #hashtag3" />
                </div>
              </>}

              {/* Tab: Script */}
              {modal.tab === 'script' && <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Prompt Script (untuk AI generator)</label>
                  <textarea style={fieldStyle({ height: 80, resize: 'none' })} value={modal.idea.prompt_script} onChange={e => setField('prompt_script', e.target.value)} placeholder="Instruksi khusus untuk generate script..." />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8rem', color: '#5a6a85', fontWeight: 500 }}>Script Lengkap</label>
                    <button type="button" disabled={aiLoading || !modal.idea.judul} onClick={generateScript}
                      style={{ background: 'rgba(26,115,232,0.15)', border: '1px solid #1a73e8', borderRadius: 8, padding: '5px 12px', color: '#42a5f5', fontSize: '0.75rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                      {aiLoading ? '⏳ Generating...' : '✨ Generate Script'}
                    </button>
                  </div>
                  <textarea style={fieldStyle({ height: 240, resize: 'vertical', lineHeight: '1.6', fontFamily: 'monospace' })} value={modal.idea.script} onChange={e => setField('script', e.target.value)} placeholder="Script lengkap konten akan muncul di sini..." />
                </div>
              </>}


              {/* Footer */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #e5eaf2', marginTop: 4 }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 20px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Menyimpan...' : modal.idea.id ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
