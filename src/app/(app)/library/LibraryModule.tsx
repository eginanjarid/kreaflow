'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

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
  sprint_id?: string | null
}

type Product = { id: string; nama: string }
type Pillar = { id: string; nama: string }
type TaskSnap = { id: string; nama: string; due_date: string; percent_complete: number; priority: string }
type Sprint = { id: string; nama: string; start_date: string; end_date: string }

const FORMATS = ['Video Pendek', 'Reels', 'Story', 'Carousel', 'Single Post', 'Thread', 'Live', 'Podcast', 'Blog']
const FORMULAS = ['AIDA', 'PAS', 'BAB', 'Hook-Story-Offer', 'FAB', '4C', 'Before-After', 'Story Telling', 'Tutorial']
const PIPELINE_STATUSES = ['Draft', 'Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']
const BANK_STATUSES = ['Ide', 'Kandidat']
const ALL_STATUSES = [...BANK_STATUSES, ...PIPELINE_STATUSES]
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']

const STATUS_COLOR: Record<string, string> = {
  Ide: '#7c3aed', Kandidat: '#d97706',
  Draft: '#6b7280', 'Naskah Siap': '#d97706', Produksi: '#1a73e8',
  'Siap Tayang': '#059669', Terjadwal: '#a855f7', Tayang: '#6b21a8',
  Ready: '#166534', Scheduled: '#1e40af', Posted: '#6b21a8',
}
const STATUS_BG: Record<string, string> = {
  Ide: 'rgba(124,58,237,0.10)', Kandidat: 'rgba(217,119,6,0.12)',
  Draft: '#f3f4f6', 'Naskah Siap': 'rgba(245,158,11,0.12)',
  Produksi: 'rgba(59,130,246,0.12)', 'Siap Tayang': 'rgba(34,197,94,0.12)',
  Terjadwal: 'rgba(168,85,247,0.12)', Tayang: 'rgba(107,33,168,0.15)',
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
    width: '100%', background: '#f3f4f6', border: 'none',
    borderRadius: 8, padding: '10px 12px', color: '#111827',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const,
    ...extra,
  }
}
function selectStyle() {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{handle}</div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 2 }}>Original audio</div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: 600 }}>Ikuti</span>
        </div>
        <div style={{ width: '100%', aspectRatio: '4/5', background: '#1e293b', position: 'relative', overflow: 'hidden' }}>
          {thumb ? <img src={thumb} alt={idea.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>{(idea.judul || '?').charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 14 }}>
          {['heart', 'chat', 'send'].map(i => (
            <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {i === 'heart' && <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}
              {i === 'chat' && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}
              {i === 'send' && <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>}
            </svg>
          ))}
        </div>
        <div style={{ paddingInline: 14, fontSize: '0.82rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{fakeLikes.toLocaleString()} suka</div>
        {caption && <div style={{ paddingInline: 14, fontSize: '0.82rem', color: '#f1f5f9', lineHeight: 1.5, marginBottom: 4, whiteSpace: 'pre-wrap' }}><span style={{ fontWeight: 700, marginRight: 6 }}>{handle}</span>{caption.length > 150 ? caption.slice(0, 150) + '...' : caption}</div>}
        {hashtags && <div style={{ paddingInline: 14, fontSize: '0.8rem', color: '#1a73e8', marginBottom: 8 }}>{hashtags}</div>}
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 16px', borderTop: '1px solid #222' }}>
          <button onClick={onEdit} style={{ flex: 1, background: '#1a73e8', border: 'none', borderRadius: 8, padding: '9px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Edit Konten</button>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '9px 12px', color: '#e5e7eb', fontSize: '0.82rem', cursor: 'pointer' }}>✕</button>
        </div>
      </div>
    </div>
  )
}

function SprintTimeline({ tasks, productName }: { tasks: TaskSnap[]; productName: string }) {
  const sprintTasks = tasks.filter(t => t.nama.includes(' — ') && t.nama.endsWith('— ' + productName)).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
  if (sprintTasks.length === 0) return null
  return (
    <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.18)', borderRadius: 8 }}>
      <div style={{ fontSize: '0.68rem', color: '#1a73e8', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em' }}>SPRINT TIMELINE</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sprintTasks.map(t => {
          const rawStep = t.nama.split(' —')[0].trim()
          const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
          const pct = t.percent_complete || 0
          const dot = pct === 100 ? '●' : pct > 0 ? '◑' : '○'
          const dotColor = pct === 100 ? '#059669' : pct > 0 ? '#d97706' : '#6b7280'
          const dateStr = t.due_date ? t.due_date.slice(5).replace('-', '/') : ''
          return (
            <span key={t.id} title={`${stepName} — ${t.due_date}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>
              <span style={{ color: dotColor, fontSize: '0.7rem' }}>{dot}</span>
              <span>{stepName}</span>
              {dateStr && <span style={{ color: '#6b7280', marginLeft: 1 }}>{dateStr}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Bank Ide ─────────────────────────────────────────────────────────────────

function BankIdeTab({
  ideas, workspaceId, sprints, onIdeaUpdate, onIdeaDelete,
}: {
  ideas: ContentIdea[]
  workspaceId: string
  sprints: Sprint[]
  onIdeaUpdate: (updated: ContentIdea) => void
  onIdeaDelete: (id: string) => void
}) {
  const [bankFilter, setBankFilter] = useState<'Semua' | 'Ide' | 'Kandidat'>('Semua')
  const [sprintModal, setSprintModal] = useState<{ open: boolean; idea: ContentIdea | null; format: string; tanggal: string }>({ open: false, idea: null, format: '', tanggal: '' })
  const [selectedSprint, setSelectedSprint] = useState('')
  const [promoting, setPromoting] = useState<string | null>(null)

  const bankIdeas = ideas.filter(i => BANK_STATUSES.includes(i.status))
  const filtered = bankFilter === 'Semua' ? bankIdeas : bankIdeas.filter(i => i.status === bankFilter)

  async function upgradeStatus(idea: ContentIdea, newStatus: string) {
    setPromoting(idea.id!)
    const supabase = createClient()
    const { error } = await supabase.from('kf_content_ideas').update({ status: newStatus }).eq('id', idea.id)
    if (error) { showToast('Gagal update status'); setPromoting(null); return }
    onIdeaUpdate({ ...idea, status: newStatus })
    showToast(`Status diubah ke ${newStatus}`, 'success')
    setPromoting(null)
  }

  function openSprintModal(idea: ContentIdea) {
    setSelectedSprint(sprints[0]?.id || '')
    setSprintModal({ open: true, idea, format: idea.format || '', tanggal: '' })
  }

  async function promoteToSprint() {
    if (!sprintModal.idea || !selectedSprint) return
    if (!sprintModal.format) { showToast('Pilih format konten dulu'); return }
    if (!sprintModal.tanggal) { showToast('Pilih tanggal tayang dulu'); return }
    setPromoting(sprintModal.idea.id!)
    const supabase = createClient()
    const { error } = await supabase.from('kf_content_ideas').update({
      sprint_id: selectedSprint,
      status: 'Draft',
      format: sprintModal.format,
      tanggal_tayang: sprintModal.tanggal,
    }).eq('id', sprintModal.idea.id)
    if (error) { showToast('Gagal masukkan ke sprint'); setPromoting(null); return }
    onIdeaUpdate({ ...sprintModal.idea, sprint_id: selectedSprint, status: 'Draft', format: sprintModal.format })
    showToast('Ide masuk ke Sprint Board!', 'success')
    setSprintModal({ open: false, idea: null, format: '', tanggal: '' })
    setSelectedSprint('')
    setPromoting(null)
  }

  const ideCount = bankIdeas.filter(i => i.status === 'Ide').length
  const kandidatCount = bankIdeas.filter(i => i.status === 'Kandidat').length
  const activeSprint = sprints.find(s => s.id === selectedSprint)

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Ide', value: bankIdeas.length, color: '#7c3aed', bg: 'rgba(124,58,237,0.07)' },
          { label: 'Ide Baru', value: ideCount, color: '#7c3aed', bg: 'rgba(124,58,237,0.07)' },
          { label: 'Kandidat', value: kandidatCount, color: '#d97706', bg: 'rgba(217,119,6,0.07)' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['Semua', 'Ide', 'Kandidat'] as const).map(f => (
          <button key={f} onClick={() => setBankFilter(f)}
            style={{ padding: '6px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: bankFilter === f ? 600 : 400, border: bankFilter === f ? '1px solid #7c3aed' : '1px solid #e5e7eb', background: bankFilter === f ? 'rgba(124,58,237,0.10)' : '#f3f4f6', color: bankFilter === f ? '#7c3aed' : '#6b7280', cursor: 'pointer' }}>
            {f} {f !== 'Semua' && <span style={{ fontWeight: 700 }}>({f === 'Ide' ? ideCount : kandidatCount})</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', alignSelf: 'center' }}>
          Klik tombol + (kanan bawah) untuk simpan ide baru
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>💡</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            {bankIdeas.length === 0 ? 'Bank ide masih kosong' : 'Tidak ada ide dengan filter ini'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
            Klik tombol <strong>+</strong> di kanan bawah untuk simpan ide kapanpun dan dimanapun
          </div>
        </div>
      )}

      {/* Idea cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(idea => {
          const ideaSprint = idea.sprint_id ? sprints.find(s => s.id === idea.sprint_id) : null
          return (
            <div key={idea.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)', borderLeft: `3px solid ${STATUS_COLOR[idea.status] || '#e5e7eb'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>{idea.judul}</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, color: STATUS_COLOR[idea.status], background: STATUS_BG[idea.status], fontWeight: 600 }}>{idea.status}</span>
                  </div>

                  {/* Notes */}
                  {idea.hook && (
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                      {idea.hook.length > 140 ? idea.hook.slice(0, 140) + '...' : idea.hook}
                    </div>
                  )}

                  {/* Platform + date */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(idea.platform || []).map(p => (
                      <span key={p} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 20, color: '#1a73e8', background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)' }}>{p}</span>
                    ))}
                    {idea.id && (
                      <span style={{ fontSize: '0.65rem', color: '#c4c4c4', marginLeft: 2 }}>{fmtDate((idea as any).created_at)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {idea.status === 'Ide' && (
                    <button
                      onClick={() => upgradeStatus(idea, 'Kandidat')}
                      disabled={promoting === idea.id}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d97706', background: 'rgba(217,119,6,0.08)', color: '#d97706', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      → Kandidat
                    </button>
                  )}
                  {ideaSprint ? (
                    <span style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #059669', background: 'rgba(5,150,105,0.08)', color: '#059669', fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      ✓ {ideaSprint.nama}
                    </span>
                  ) : sprints.length > 0 ? (
                    <button
                      onClick={() => openSprintModal(idea)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #059669', background: 'rgba(5,150,105,0.08)', color: '#059669', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Ke Sprint
                    </button>
                  ) : null}
                  <button
                    onClick={() => { if (confirm('Hapus ide ini?')) onIdeaDelete(idea.id!) }}
                    style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#f9fafb', color: '#9ca3af', fontSize: '0.72rem', cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sprint Modal */}
      {sprintModal.open && sprintModal.idea && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }} onClick={() => setSprintModal({ open: false, idea: null, format: '', tanggal: '' })}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 420 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>Masukkan ke Sprint</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 20 }}>
              <strong>{sprintModal.idea.judul}</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Sprint selector */}
              {sprints.length > 1 && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>Sprint</label>
                  <select
                    value={selectedSprint}
                    onChange={e => { setSelectedSprint(e.target.value); setSprintModal(m => ({ ...m, tanggal: '' })) }}
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                    {sprints.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.start_date.slice(5).replace('-', '/')} – {s.end_date.slice(5).replace('-', '/')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {sprints.length === 1 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                  Sprint: {sprints[0].nama} ({sprints[0].start_date.slice(5).replace('-', '/')} – {sprints[0].end_date.slice(5).replace('-', '/')})
                </div>
              )}

              {/* Format */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>Format Konten *</label>
                <select
                  value={sprintModal.format}
                  onChange={e => setSprintModal(m => ({ ...m, format: e.target.value }))}
                  style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: sprintModal.format ? '#111827' : '#9ca3af', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="">— Pilih format —</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {/* Tanggal Tayang */}
              <div>
                <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: 5, fontWeight: 600 }}>Tanggal Tayang *</label>
                <input
                  type="date"
                  value={sprintModal.tanggal}
                  min={activeSprint?.start_date}
                  max={activeSprint?.end_date}
                  onChange={e => setSprintModal(m => ({ ...m, tanggal: e.target.value }))}
                  style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                />
                {activeSprint && (
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 4 }}>
                    Rentang sprint: {activeSprint.start_date.slice(5).replace('-', '/')} – {activeSprint.end_date.slice(5).replace('-', '/')}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setSprintModal({ open: false, idea: null, format: '', tanggal: '' })} style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={promoteToSprint} disabled={!selectedSprint || !!promoting} style={{ flex: 1, background: '#059669', border: 'none', borderRadius: 10, padding: '10px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                {promoting ? 'Memproses...' : 'Masukkan ke Sprint →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main Module ───────────────────────────────────────────────────────────────

export default function LibraryModule({ initialIdeas, workspaceId, workspaceName = 'workspace', products, pillars, tasks = [], sprints = [] }: {
  initialIdeas: ContentIdea[]
  workspaceId: string
  workspaceName?: string
  products: Product[]
  pillars: Pillar[]
  tasks?: TaskSnap[]
  sprints?: Sprint[]
}) {
  const [ideas, setIdeas] = useState<ContentIdea[]>(initialIdeas)
  const [activeTab, setActiveTab] = useState<'bank' | 'naskah'>('bank')
  const [modal, setModal] = useState<{ open: boolean; idea: ContentIdea; tab: string }>({
    open: false, idea: emptyIdea(workspaceId), tab: 'basic',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [expandedScript, setExpandedScript] = useState<string | null>(null)
  const [previewModal, setPreviewModal] = useState<ContentIdea | null>(null)

  const bankIdeas = ideas.filter(i => BANK_STATUSES.includes(i.status))
  const naskhahIdeas = ideas.filter(i => !BANK_STATUSES.includes(i.status))

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
    if (!modal.idea.judul?.trim()) { showToast('Judul konten wajib diisi.'); return }
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
    showToast('Konten berhasil disimpan.', 'success')
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

  const filtered = naskhahIdeas.filter(c =>
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Library</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Bank ide & konten siap produksi</p>
        </div>
        {activeTab === 'naskah' && (
          <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '9px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
            + Tambah Konten
          </button>
        )}
      </div>

      {/* Top tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #f3f4f6' }}>
        {[
          { key: 'bank', label: 'Bank Ide', count: bankIdeas.length, color: '#7c3aed' },
          { key: 'naskah', label: 'Naskah & Pipeline', count: naskhahIdeas.length, color: '#1a73e8' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as 'bank' | 'naskah')}
            style={{
              padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
              color: activeTab === t.key ? t.color : '#6b7280', fontSize: '0.88rem', fontWeight: activeTab === t.key ? 700 : 400,
              cursor: 'pointer', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {t.label}
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: activeTab === t.key ? t.color + '18' : '#f3f4f6', color: activeTab === t.key ? t.color : '#9ca3af' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Bank Ide Tab */}
      {activeTab === 'bank' && (
        <BankIdeTab
          ideas={ideas}
          workspaceId={workspaceId}
          sprints={sprints}
          onIdeaUpdate={updated => setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i))}
          onIdeaDelete={id => setIdeas(prev => prev.filter(i => i.id !== id))}
        />
      )}

      {/* Naskah & Pipeline Tab */}
      {activeTab === 'naskah' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {PIPELINE_STATUSES.slice(0, 4).map(s => (
              <div key={s} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>{naskhahIdeas.filter(c => c.status === s).length}</div>
                <div style={{ fontSize: '0.75rem', color: STATUS_COLOR[s], marginTop: 2, fontWeight: 500 }}>{s}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          {naskhahIdeas.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {['', ...PIPELINE_STATUSES].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterStatus === s ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: filterStatus === s ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: filterStatus === s ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
                  {s || 'Semua'}
                </button>
              ))}
              <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />
              {['', ...PLATFORMS].map(p => (
                <button key={p} onClick={() => setFilterPlatform(p)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterPlatform === p ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: filterPlatform === p ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: filterPlatform === p ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
                  {p || 'Semua Platform'}
                </button>
              ))}
            </div>
          )}

          {/* Content list */}
          {filtered.length === 0 ? (
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ marginBottom: 12 }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div>
              <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{naskhahIdeas.length === 0 ? 'Belum ada naskah' : 'Tidak ada konten'}</div>
              <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{naskhahIdeas.length === 0 ? 'Buat naskah dari modul Plan, atau promosikan ide dari Bank Ide' : 'Coba filter lain'}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(c => (
                <div key={c.id} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)', borderRadius: 16, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{c.judul || '(Tanpa judul)'}</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[c.status], background: STATUS_BG[c.status], fontWeight: 600 }}>{c.status}</span>
                        {c.format && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: '#6b7280', background: '#f3f4f6' }}>{c.format}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.platform.map(p => <span key={p} style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#1a73e8', background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.2)' }}>{p}</span>)}
                        {c.pillar_id && pillarMap[c.pillar_id] && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#6b7280', background: '#f3f4f6' }}>{pillarMap[c.pillar_id]}</span>}
                        {c.product_id && productMap[c.product_id] && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#6b7280', background: '#f3f4f6' }}>{productMap[c.product_id]}</span>}
                      </div>
                      {c.hook && (
                        <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#6b7280', fontStyle: 'italic', borderLeft: '2px solid #1a73e8', paddingLeft: 10 }}>
                          "{c.hook.length > 120 ? c.hook.slice(0, 120) + '...' : c.hook}"
                        </div>
                      )}
                      {c.product_id && productMap[c.product_id] && <SprintTimeline tasks={tasks} productName={productMap[c.product_id]} />}
                      {c.script && expandedScript === c.id && (
                        <div style={{ marginTop: 10, background: '#f9fafb', borderRadius: 8, padding: 14, fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>
                          {c.script}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {c.script && (
                        <button onClick={() => setExpandedScript(expandedScript === c.id ? null : c.id!)}
                          style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>
                          {expandedScript === c.id ? 'Tutup' : 'Script'}
                        </button>
                      )}
                      <button onClick={() => setPreviewModal(c)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>Preview</button>
                      <button onClick={() => openEdit(c)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 8, padding: '6px 12px', color: '#1a73e8', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteIdea(c.id!)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#6b7280', fontSize: '0.78rem', cursor: 'pointer' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <IGPostPreview
          idea={previewModal}
          workspaceName={workspaceName}
          onEdit={() => { openEdit(previewModal); setPreviewModal(null) }}
          onClose={() => setPreviewModal(null)}
        />
      )}

      {/* Edit/Add Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{modal.idea.id ? 'Edit Konten' : 'Tambah Konten'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <div className="kf-tabs-wrap" style={{ '--tabs-bg': '#fff' } as React.CSSProperties}>
              <div className="kf-tabs-scroll" style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                {MODAL_TABS.map(t => (
                  <button key={t.id} onClick={() => setModal(m => ({ ...m, tab: t.id }))}
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: modal.tab === t.id ? '2px solid #1a73e8' : '2px solid transparent', color: modal.tab === t.id ? '#1a73e8' : '#6b7280', fontSize: '0.82rem', fontWeight: modal.tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSave} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}

              {modal.tab === 'basic' && <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Judul Konten *</label>
                  <input style={fieldStyle()} value={modal.idea.judul} onChange={e => setField('judul', e.target.value)} placeholder="Judul atau topik konten" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Format</label>
                    <select style={selectStyle()} value={modal.idea.format ?? ''} onChange={e => setField('format', e.target.value)}>
                      <option value="">Pilih format</option>
                      {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Formula</label>
                    <select style={selectStyle()} value={modal.idea.formula ?? ''} onChange={e => setField('formula', e.target.value)}>
                      <option value="">Pilih formula</option>
                      {FORMULAS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.82rem', padding: '6px 12px', borderRadius: 8, color: STATUS_COLOR[modal.idea.status] || '#6b7280', background: STATUS_BG[modal.idea.status] || '#f3f4f6', fontWeight: 600, border: `1px solid ${STATUS_COLOR[modal.idea.status] || '#e5e7eb'}33` }}>
                        {modal.idea.status || 'Draft'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Diatur otomatis oleh workflow</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Produk</label>
                    <select style={selectStyle()} value={modal.idea.product_id ?? ''} onChange={e => setField('product_id', e.target.value)}>
                      <option value="">Tanpa produk</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Pillar</label>
                    <select style={selectStyle()} value={modal.idea.pillar_id ?? ''} onChange={e => setField('pillar_id', e.target.value)}>
                      <option value="">Tanpa pillar</option>
                      {pillars.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Tanggal Tayang</label>
                    <input type="date" style={fieldStyle()} value={modal.idea.scheduled_date} onChange={e => setField('scheduled_date', e.target.value)} />
                  </div>
                </div>
                {['Reels', 'Video Pendek', 'Live'].includes(modal.idea.format) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>Tampil di Feed</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Seperti opsi "Bagikan ke Feed" di Instagram Reels</div>
                    </div>
                    <button type="button" onClick={() => setField('show_in_feed', !(modal.idea.show_in_feed !== false))}
                      style={{ width: 44, height: 24, borderRadius: 20, border: 'none', cursor: 'pointer', background: modal.idea.show_in_feed !== false ? '#1a73e8' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: modal.idea.show_in_feed !== false ? 23 : 3, transition: 'left 0.2s' }} />
                    </button>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Platform</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PLATFORMS.map(p => (
                      <button key={p} type="button" onClick={() => toggleArr('platform', p)}
                        style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: modal.idea.platform.includes(p) ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: modal.idea.platform.includes(p) ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: modal.idea.platform.includes(p) ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {modal.tab === 'content' && <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Isi komponen konten atau generate otomatis</div>
                  <button type="button" disabled={aiLoading || !modal.idea.judul} onClick={generateScript}
                    style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                    {aiLoading ? '...' : 'Generate AI'}
                  </button>
                </div>
                {[
                  { label: 'Hook (Pembuka)', key: 'hook' as keyof ContentIdea, placeholder: 'Kalimat pembuka yang menarik perhatian...', h: 72 },
                  { label: 'Body (Isi)', key: 'body' as keyof ContentIdea, placeholder: 'Isi konten utama...', h: 96 },
                  { label: 'CTA (Call to Action)', key: 'cta' as keyof ContentIdea, placeholder: 'Ajakan di akhir konten...', h: 56 },
                ].map(({ label, key, placeholder, h }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                    <textarea style={fieldStyle({ height: h, resize: 'none' })} value={modal.idea[key] as string} onChange={e => setField(key, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Hashtag (spasi-separated)</label>
                  <input style={fieldStyle()} value={(modal.idea.hashtags || []).join(' ')} onChange={e => setField('hashtags', e.target.value.split(/\s+/).filter(Boolean))} placeholder="#hashtag1 #hashtag2 #hashtag3" />
                </div>
              </>}

              {modal.tab === 'script' && <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Prompt Script (untuk AI generator)</label>
                  <textarea style={fieldStyle({ height: 80, resize: 'none' })} value={modal.idea.prompt_script} onChange={e => setField('prompt_script', e.target.value)} placeholder="Instruksi khusus untuk generate script..." />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Script Lengkap</label>
                    <button type="button" disabled={aiLoading || !modal.idea.judul} onClick={generateScript}
                      style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                      {aiLoading ? 'Generating...' : 'Generate Script'}
                    </button>
                  </div>
                  <textarea style={fieldStyle({ height: 240, resize: 'vertical', lineHeight: '1.6', fontFamily: 'monospace' })} value={modal.idea.script} onChange={e => setField('script', e.target.value)} placeholder="Script lengkap konten akan muncul di sini..." />
                </div>
              </>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
                <button type="button" onClick={closeModal} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
