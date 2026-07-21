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
}

type Product = { id: string; nama: string }
type Pillar = { id: string; nama: string }
type TaskSnap = { id: string; nama: string; due_date: string; percent_complete: number; priority: string }

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
    scheduled_date: '',
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

export default function LibraryModule({ initialIdeas, workspaceId, products, pillars, tasks = [] }: {
  initialIdeas: ContentIdea[]
  workspaceId: string
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

      {/* Filters */}
      {ideas.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterStatus === s ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: filterStatus === s ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: filterStatus === s ? '#A78BFA' : '#64748b', cursor: 'pointer' }}>
              {s || 'Semua'}
            </button>
          ))}
          <div style={{ width: 1, background: '#2a2a2a', margin: '0 4px' }} />
          {['', ...PLATFORMS].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, border: filterPlatform === p ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: filterPlatform === p ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: filterPlatform === p ? '#A78BFA' : '#64748b', cursor: 'pointer' }}>
              {p || 'Semua Platform'}
            </button>
          ))}
        </div>
      )}

      {/* Content List */}
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
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
