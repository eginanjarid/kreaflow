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
}

type Product = { id: string; nama: string }
type Pillar = { id: string; nama: string }
type TaskSnap = { id: string; nama: string; due_date: string; percent_complete: number; priority: string }
type ViewMode = 'list' | 'ig' | 'tiktok'

const FORMATS = ['Video Pendek', 'Reels', 'Story', 'Carousel', 'Single Post', 'Thread', 'Live', 'Podcast', 'Blog']
const FORMULAS = ['AIDA', 'PAS', 'BAB', 'Hook-Story-Offer', 'FAB', '4C', 'Before-After', 'Story Telling', 'Tutorial']
const STATUSES = ['Draft', 'Ready', 'Scheduled', 'Posted']
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const STATUS_COLOR: Record<string, string> = {
  Draft: '#475569', Ready: '#166534', Scheduled: '#1e40af', Posted: '#6b21a8'
}
const STATUS_BG: Record<string, string> = {
  Draft: '#1a1a1a', Ready: 'rgba(22,101,52,0.15)', Scheduled: 'rgba(30,64,175,0.15)', Posted: 'rgba(107,33,168,0.15)'
}

function emptyIdea(workspaceId: string): ContentIdea {
  return {
    workspace_id: workspaceId, pillar_id: '', product_id: '', judul: '',
    format: '', formula: '', usp: [], hook: '', body: '', cta: '',
    hashtags: [], prompt_script: '', script: '', status: 'Draft', platform: [],
    scheduled_date: '', canva_url: '', gdrive_url: '', preview_url: '',
  }
}

function fieldStyle(extra?: object) {
  return {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, padding: '10px 12px', color: '#e2e8f0',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const,
    ...extra,
  }
}
function selectStyle() {
  return { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }
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
        style={{ width: 390, maxHeight: '92vh', overflowY: 'auto', background: '#000', borderRadius: 16, border: '1px solid #222', display: 'flex', flexDirection: 'column' }}>

        {/* IG Post Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{handle}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>Original audio</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>Ikuti</span>
            <span style={{ color: '#64748b', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>···</span>
          </div>
        </div>

        {/* Image */}
        <div style={{ width: '100%', aspectRatio: '4 / 5', background: '#111', position: 'relative', overflow: 'hidden' }}>
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
        <div style={{ paddingInline: 14, fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          {fakeLikes.toLocaleString()} suka
        </div>

        {/* Caption */}
        {caption && (
          <div style={{ paddingInline: 14, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: 4 }}>
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
          {idea.format && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#475569' }}>{idea.format}</span>}
        </div>

        <div style={{ fontSize: '0.7rem', color: '#475569', paddingInline: 14, marginBottom: 10 }}>
          {idea.scheduled_date ? `Dijadwalkan: ${idea.scheduled_date}` : 'Belum dijadwalkan'}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 16px', borderTop: '1px solid #1a1a1a' }}>
          <button onClick={onEdit}
            style={{ flex: 1, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            Edit Konten
          </button>
          {idea.canva_url && (
            <a href={idea.canva_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px', color: '#A78BFA', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
              Buka Canva ↗
            </a>
          )}
          {idea.gdrive_url && (
            <a href={idea.gdrive_url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
              Drive ↗
            </a>
          )}
          <button onClick={onClose}
            style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
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
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 8 }}>Preview tampilan:</div>
      {/* Ratio toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {PREVIEW_RATIOS.map(rx => (
          <button key={rx.key} type="button" onClick={() => setRatio(rx.key)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 12px', borderRadius: 8, border: ratio === rx.key ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: ratio === rx.key ? 'rgba(124,58,237,0.15)' : '#1a1a1a', cursor: 'pointer', gap: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: ratio === rx.key ? 700 : 400, color: ratio === rx.key ? '#A78BFA' : '#94a3b8' }}>{rx.label}</span>
            <span style={{ fontSize: '0.6rem', color: ratio === rx.key ? '#7C3AED' : '#475569' }}>{rx.sub}</span>
          </button>
        ))}
      </div>
      {/* Preview box */}
      <div style={{ width: r.w, height: r.h, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a2a2a', background: '#0d0d0d', transition: 'all 0.2s' }}>
        {thumb
          ? <img src={thumb} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <ThumbnailPlaceholder idea={idea} />
        }
      </div>
      <div style={{ marginTop: 5, fontSize: '0.68rem', color: '#475569' }}>{r.w}×{r.h}px · {r.label} · {r.sub}</div>
    </div>
  )
}

function SprintTimeline({ tasks, productName }: { tasks: TaskSnap[]; productName: string }) {
  const sprintTasks = tasks
    .filter(t => t.nama.includes(' — ') && t.nama.endsWith('— ' + productName))
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
  if (sprintTasks.length === 0) return null

  return (
    <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 8 }}>
      <div style={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>⚡ SPRINT TIMELINE</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sprintTasks.map(t => {
          const rawStep = t.nama.split(' —')[0].trim()
          const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
          const pct = t.percent_complete || 0
          const dot = pct === 100 ? '●' : pct > 0 ? '◑' : '○'
          const dotColor = pct === 100 ? '#86efac' : pct > 0 ? '#fbbf24' : '#64748b'
          const dateStr = t.due_date ? t.due_date.slice(5).replace('-', '/') : ''
          return (
            <span key={t.id} title={`${stepName} — ${t.due_date}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#94a3b8' }}>
              <span style={{ color: dotColor, fontSize: '0.7rem' }}>{dot}</span>
              <span>{stepName}</span>
              {dateStr && <span style={{ color: '#475569', marginLeft: 1 }}>{dateStr}</span>}
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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [previewPost, setPreviewPost] = useState<ContentIdea | null>(null)

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
  function setField(key: keyof ContentIdea, value: string | string[]) {
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
    { id: 'media', label: '🖼 Media' },
  ]

  const VIEW_BTNS: { mode: ViewMode; label: string; title: string }[] = [
    { mode: 'list', label: '☰', title: 'List View' },
    { mode: 'ig', label: '⊞', title: 'IG Grid 1:1 (3 kolom)' },
    { mode: 'tiktok', label: '▭▭', title: 'Feed 4:5 Portrait (2 kolom)' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Library</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Bank konten — hook, body, CTA, dan script siap pakai</p>
        </div>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Tambah Konten
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {STATUSES.map(s => (
          <div key={s} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9' }}>{ideas.filter(c => c.status === s).length}</div>
            <div style={{ fontSize: '0.75rem', color: STATUS_COLOR[s], marginTop: 2, fontWeight: 500 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      {ideas.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterStatus === s ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: filterStatus === s ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: filterStatus === s ? '#A78BFA' : '#64748b', cursor: 'pointer' }}>
              {s || 'Semua'}
            </button>
          ))}
          <div style={{ width: 1, background: '#2a2a2a', margin: '0 4px', alignSelf: 'stretch' }} />
          {['', ...PLATFORMS].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterPlatform === p ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: filterPlatform === p ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: filterPlatform === p ? '#A78BFA' : '#64748b', cursor: 'pointer' }}>
              {p || 'Semua Platform'}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {VIEW_BTNS.map(v => (
              <button key={v.mode} onClick={() => setViewMode(v.mode)} title={v.title}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', border: viewMode === v.mode ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: viewMode === v.mode ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: viewMode === v.mode ? '#A78BFA' : '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 48, textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📚</div>
          <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{ideas.length === 0 ? 'Library kosong' : 'Tidak ada konten'}</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>{ideas.length === 0 ? 'Mulai tambahkan ide konten kamu' : 'Coba filter lain'}</div>
          {ideas.length === 0 && (
            <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              + Buat Konten Pertama
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Thumbnail mini di list view */}
                {getThumbnail(c) ? (
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #2a2a2a', cursor: 'pointer' }} onClick={() => openEdit(c)}>
                    <img src={getThumbnail(c)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                ) : (c.canva_url || c.gdrive_url) ? (
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #2a2a2a', cursor: 'pointer' }} onClick={() => openEdit(c)}>
                    <ThumbnailPlaceholder idea={c} />
                  </div>
                ) : null}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>{c.judul || '(Tanpa judul)'}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[c.status], background: STATUS_BG[c.status], fontWeight: 600 }}>{c.status}</span>
                    {c.format && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: '#64748b', background: '#1a1a1a', border: '1px solid #2a2a2a' }}>{c.format}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.platform.map(p => <span key={p} style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#7C3AED', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>{p}</span>)}
                    {c.pillar_id && pillarMap[c.pillar_id] && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#64748b', background: '#1a1a1a' }}>📌 {pillarMap[c.pillar_id]}</span>}
                    {c.product_id && productMap[c.product_id] && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#64748b', background: '#1a1a1a' }}>📦 {productMap[c.product_id]}</span>}
                  </div>
                  {c.hook && (
                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', borderLeft: '2px solid #7C3AED', paddingLeft: 10 }}>
                      "{c.hook.length > 120 ? c.hook.slice(0, 120) + '...' : c.hook}"
                    </div>
                  )}
                  {c.product_id && productMap[c.product_id] && (
                    <SprintTimeline tasks={tasks} productName={productMap[c.product_id]} />
                  )}
                  {c.script && expandedScript === c.id && (
                    <div style={{ marginTop: 10, background: '#0d0d0d', borderRadius: 8, padding: 14, fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
                      {c.script}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {c.script && (
                    <button onClick={() => setExpandedScript(expandedScript === c.id ? null : c.id!)}
                      style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 10px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                      {expandedScript === c.id ? 'Tutup' : 'Script'}
                    </button>
                  )}
                  <button onClick={() => openSchedule(c)}
                    style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, padding: '6px 10px', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
                    title="Jadwalkan ke Calendar">
                    📅
                  </button>
                  <button onClick={() => openEdit(c)} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid #7C3AED', borderRadius: 8, padding: '6px 12px', color: '#A78BFA', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteIdea(c.id!)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 10px', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer' }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'ig' ? (
        /* IG Grid: 3-col square */
        <div>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E4405F', display: 'inline-block' }} />
            Instagram Grid Preview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 540, background: '#0a0a0a', padding: 2, borderRadius: 4 }}>
            {filtered.map(c => {
              const thumb = getThumbnail(c)
              const isHovered = hoveredId === c.id
              return (
                <div key={c.id}
                  style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', cursor: 'pointer', background: '#0d0d0d' }}
                  onMouseEnter={() => setHoveredId(c.id!)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setPreviewPost(c)}>
                  {thumb ? (
                    <img src={thumb} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <ThumbnailPlaceholder idea={c} />
                  )}
                  {/* Hover overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 5,
                    opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s',
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#f1f5f9', textAlign: 'center', lineHeight: 1.3 }}>
                      {(c.judul || '(Tanpa judul)').length > 30 ? (c.judul || '').slice(0, 30) + '…' : (c.judul || '(Tanpa judul)')}
                    </div>
                    <span style={{ fontSize: '0.58rem', padding: '1px 6px', borderRadius: 3, color: STATUS_COLOR[c.status], background: STATUS_BG[c.status], fontWeight: 600 }}>
                      {c.status}
                    </span>
                    <button onClick={e => { e.stopPropagation(); openEdit(c) }}
                      style={{ background: 'rgba(124,58,237,0.85)', border: 'none', borderRadius: 5, padding: '3px 10px', color: '#fff', fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', marginTop: 2 }}>
                      Edit
                    </button>
                  </div>
                  {/* Status dot */}
                  {!isHovered && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[c.status], boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#475569' }}>
            {filtered.length} konten · Klik untuk preview · Hover lalu Edit untuk edit
          </div>
        </div>
      ) : (
        /* Feed 4:5 portrait: 2-col */
        <div>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#69C9D0', display: 'inline-block' }} />
            Feed Preview 4:5 (2 kolom) — IG portrait, TikTok foto
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, maxWidth: 440, background: '#0a0a0a', padding: 3, borderRadius: 4 }}>
            {filtered.map(c => {
              const thumb = getThumbnail(c)
              const isHovered = hoveredId === c.id
              return (
                <div key={c.id}
                  style={{ position: 'relative', aspectRatio: '4 / 5', overflow: 'hidden', cursor: 'pointer', background: '#0d0d0d' }}
                  onMouseEnter={() => setHoveredId(c.id!)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setPreviewPost(c)}>
                  {thumb ? (
                    <img src={thumb} alt={c.judul} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <ThumbnailPlaceholder idea={c} />
                  )}
                  {/* Hover overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6,
                    opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f1f5f9', textAlign: 'center', lineHeight: 1.3, marginBottom: 2 }}>
                      {(c.judul || '(Tanpa judul)').length > 40 ? (c.judul || '').slice(0, 40) + '…' : (c.judul || '(Tanpa judul)')}
                    </div>
                    <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: 3, color: STATUS_COLOR[c.status], background: STATUS_BG[c.status], fontWeight: 600 }}>
                      {c.status}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {c.platform.slice(0, 2).map(p => (
                        <span key={p} style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, color: '#69C9D0', background: 'rgba(105,201,208,0.12)', border: '1px solid rgba(105,201,208,0.3)' }}>{p}</span>
                      ))}
                    </div>
                    {c.canva_url && (
                      <a href={c.canva_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: '0.62rem', color: '#A78BFA', textDecoration: 'underline' }}>
                        Canva ↗
                      </a>
                    )}
                    {c.gdrive_url && (
                      <a href={c.gdrive_url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: '0.62rem', color: '#38bdf8', textDecoration: 'underline' }}>
                        Drive ↗
                      </a>
                    )}
                  </div>
                  {/* Status dot */}
                  {!isHovered && (
                    <div style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[c.status], boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#475569' }}>
            {filtered.length} konten · Klik untuk preview · Hover lalu Edit untuk edit
          </div>
        </div>
      )}

      {/* IG Post Preview Modal */}
      {previewPost && (
        <IGPostPreview
          idea={previewPost}
          workspaceName={workspaceName}
          onEdit={() => { setPreviewPost(null); openEdit(previewPost) }}
          onClose={() => setPreviewPost(null)}
        />
      )}

      {/* Quick Schedule Modal */}
      {scheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9' }}>📅 Jadwalkan ke Calendar</h3>
              <button onClick={() => setScheduleModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            {schedDone ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                <div style={{ color: '#86efac', fontWeight: 600, fontSize: '0.9rem' }}>Berhasil dijadwalkan!</div>
              </div>
            ) : (
              <form onSubmit={handleSchedule} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem', color: '#94a3b8', border: '1px solid #2a2a2a' }}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Konten: </span>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{scheduleModal.idea.judul}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Platform *</label>
                  <select style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                    value={schedEntry.platform} onChange={e => setSchedEntry(s => ({ ...s, platform: e.target.value }))} required>
                    <option value="">Pilih platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Jadwal Posting *</label>
                  <input type="datetime-local" required
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const }}
                    value={schedEntry.scheduled_at} onChange={e => setSchedEntry(s => ({ ...s, scheduled_at: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                    value={schedEntry.status} onChange={e => setSchedEntry(s => ({ ...s, status: e.target.value }))}>
                    {['Planned', 'Ready'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setScheduleModal(null)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 18px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={schedSaving} style={{ background: schedSaving ? '#5B21B6' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: schedSaving ? 'not-allowed' : 'pointer' }}>
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
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>
                {modal.idea.id ? 'Edit Konten' : 'Tambah Konten'}
              </h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
              {MODAL_TABS.map(t => (
                <button key={t.id} onClick={() => setModal(m => ({ ...m, tab: t.id }))}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: modal.tab === t.id ? '2px solid #7C3AED' : '2px solid transparent', color: modal.tab === t.id ? '#A78BFA' : '#64748b', fontSize: '0.82rem', fontWeight: modal.tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}

              {/* Tab: Basic */}
              {modal.tab === 'basic' && <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Judul Konten *</label>
                  <input style={fieldStyle()} value={modal.idea.judul} onChange={e => setField('judul', e.target.value)} placeholder="Judul atau topik konten" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Format</label>
                    <select style={selectStyle()} value={modal.idea.format ?? ''} onChange={e => setField('format', e.target.value)}>
                      <option value="">Pilih format</option>
                      {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Formula</label>
                    <select style={selectStyle()} value={modal.idea.formula ?? ''} onChange={e => setField('formula', e.target.value)}>
                      <option value="">Pilih formula</option>
                      {FORMULAS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Status</label>
                    <select style={selectStyle()} value={modal.idea.status ?? 'Draft'} onChange={e => setField('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Produk</label>
                    <select style={selectStyle()} value={modal.idea.product_id ?? ''} onChange={e => setField('product_id', e.target.value)}>
                      <option value="">Tanpa produk</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Pillar</label>
                    <select style={selectStyle()} value={modal.idea.pillar_id ?? ''} onChange={e => setField('pillar_id', e.target.value)}>
                      <option value="">Tanpa pillar</option>
                      {pillars.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Tanggal Tayang</label>
                    <input type="date" style={fieldStyle()} value={modal.idea.scheduled_date} onChange={e => setField('scheduled_date', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>Platform</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PLATFORMS.map(p => (
                      <button key={p} type="button" onClick={() => toggleArr('platform', p)}
                        style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: modal.idea.platform.includes(p) ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: modal.idea.platform.includes(p) ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: modal.idea.platform.includes(p) ? '#A78BFA' : '#64748b', cursor: 'pointer' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {/* Tab: Content */}
              {modal.tab === 'content' && <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Isi komponen konten atau generate otomatis</div>
                  <button type="button" disabled={aiLoading || !modal.idea.judul} onClick={generateScript}
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid #7C3AED', borderRadius: 8, padding: '7px 14px', color: '#A78BFA', fontSize: '0.78rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                    {aiLoading ? '⏳...' : '✨ Generate AI'}
                  </button>
                </div>
                {[
                  { label: 'Hook (Pembuka)', key: 'hook' as keyof ContentIdea, placeholder: 'Kalimat pembuka yang menarik perhatian...', h: 72 },
                  { label: 'Body (Isi)', key: 'body' as keyof ContentIdea, placeholder: 'Isi konten utama...', h: 96 },
                  { label: 'CTA (Call to Action)', key: 'cta' as keyof ContentIdea, placeholder: 'Ajakan di akhir konten...', h: 56 },
                ].map(({ label, key, placeholder, h }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                    <textarea style={fieldStyle({ height: h, resize: 'none' })} value={modal.idea[key] as string} onChange={e => setField(key, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Hashtag (spasi-separated)</label>
                  <input style={fieldStyle()} value={(modal.idea.hashtags || []).join(' ')} onChange={e => setField('hashtags', e.target.value.split(/\s+/).filter(Boolean))} placeholder="#hashtag1 #hashtag2 #hashtag3" />
                </div>
              </>}

              {/* Tab: Script */}
              {modal.tab === 'script' && <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Prompt Script (untuk AI generator)</label>
                  <textarea style={fieldStyle({ height: 80, resize: 'none' })} value={modal.idea.prompt_script} onChange={e => setField('prompt_script', e.target.value)} placeholder="Instruksi khusus untuk generate script..." />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Script Lengkap</label>
                    <button type="button" disabled={aiLoading || !modal.idea.judul} onClick={generateScript}
                      style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid #7C3AED', borderRadius: 8, padding: '5px 12px', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                      {aiLoading ? '⏳ Generating...' : '✨ Generate Script'}
                    </button>
                  </div>
                  <textarea style={fieldStyle({ height: 240, resize: 'vertical', lineHeight: '1.6', fontFamily: 'monospace' })} value={modal.idea.script} onChange={e => setField('script', e.target.value)} placeholder="Script lengkap konten akan muncul di sini..." />
                </div>
              </>}

              {/* Tab: Media */}
              {modal.tab === 'media' && <>
                <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  Paste link share dari Canva atau Google Drive. Thumbnail otomatis muncul di Grid View.
                </div>

                {/* Canva */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                    Link Canva <span style={{ color: '#475569', fontWeight: 400 }}>(hanya shortcut buka desain)</span>
                  </label>
                  <input style={fieldStyle()} value={modal.idea.canva_url || ''} onChange={e => setField('canva_url', e.target.value)} placeholder="https://www.canva.com/design/... atau canva.link/..." />
                  <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
                    ⚠️ Canva tidak mendukung thumbnail publik — link ini hanya untuk shortcut buka desain. Gunakan GDrive di bawah untuk thumbnail.
                  </div>
                  {modal.idea.canva_url && (
                    <a href={modal.idea.canva_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 4, fontSize: '0.75rem', color: '#A78BFA', textDecoration: 'underline' }}>
                      Buka di Canva ↗
                    </a>
                  )}
                </div>

                {/* Google Drive */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                    Link Google Drive <span style={{ color: '#86efac', fontWeight: 400 }}>← thumbnail otomatis dari sini</span>
                  </label>
                  <input style={fieldStyle()} value={modal.idea.gdrive_url || ''} onChange={e => setField('gdrive_url', e.target.value)} placeholder="https://drive.google.com/file/d/..." />
                  <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
                    Export desain Canva ke Google Drive → klik kanan file → "Bagikan" → "Siapapun yang punya link" → paste link-nya di sini.
                  </div>
                  {modal.idea.gdrive_url && (() => {
                    const id = extractGdriveId(modal.idea.gdrive_url || '')
                    const thumb = id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : null
                    return thumb ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6 }}>Preview thumbnail:</div>
                        <img src={thumb} alt="preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a2a2a', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div style="font-size:0.72rem;color:#ef4444;margin-top:4px">Gagal load — pastikan file sudah di-share publik di Google Drive</div>' }} />
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#ef4444' }}>Format link tidak dikenali. Gunakan link dari drive.google.com/file/d/...</div>
                    )
                  })()}
                </div>

                {/* Manual preview URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                    URL Gambar Thumbnail <span style={{ color: '#475569', fontWeight: 400 }}>(opsional — harus link gambar langsung)</span>
                  </label>
                  <input style={fieldStyle()} value={modal.idea.preview_url || ''} onChange={e => setField('preview_url', e.target.value)} placeholder="https://i.imgur.com/... atau link .jpg/.png langsung" />
                  {modal.idea.preview_url && (() => {
                    const isCanva = modal.idea.preview_url?.includes('canva') || modal.idea.preview_url?.includes('canva.link')
                    if (isCanva) return (
                      <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#ef4444' }}>
                        Link Canva tidak bisa dijadikan thumbnail. Paste URL gambar langsung atau link Google Drive.
                      </div>
                    )
                    const thumb = getThumbnail({ ...modal.idea, gdrive_url: '' })
                    return thumb ? (
                      <img src={thumb} alt="preview" style={{ marginTop: 10, width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #2a2a2a', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).outerHTML = '<div style="margin-top:10px;font-size:0.72rem;color:#ef4444">Gagal load gambar — pastikan URL adalah link gambar langsung atau link Google Drive yang sudah di-share publik</div>' }} />
                    ) : null
                  })()}
                </div>

                {/* Preview selector */}
                {(modal.idea.canva_url || modal.idea.gdrive_url || modal.idea.preview_url) && (
                  <MediaPreview idea={modal.idea} />
                )}
              </>}

              {/* Footer */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #1f1f1f', marginTop: 4 }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 20px', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
