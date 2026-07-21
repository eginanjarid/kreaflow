'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type Entry = {
  id?: string
  workspace_id: string
  content_id: string | null
  task_id?: string | null
  label?: string | null
  platform: string
  scheduled_at: string
  posted_at: string | null
  posted_url: string | null
  status: string
}

type ContentIdea = { id: string; judul: string; format: string; platform: string[] }
type TaskSnap = { id: string; nama: string; platform: string; due_date: string; percent_complete: number; priority: string }

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const STATUSES = ['Planned', 'Ready', 'Posted', 'Cancelled']
const STATUS_COLOR: Record<string, string> = { Planned: '#93c5fd', Ready: '#fbbf24', Posted: '#86efac', Cancelled: '#475569' }
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function emptyEntry(wsId: string, date?: string): Entry {
  return { workspace_id: wsId, content_id: null, platform: '', scheduled_at: date ? `${date}T09:00` : '', posted_at: null, posted_url: null, status: 'Planned' }
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function CalendarModule({ initialEntries, workspaceId, ideas, tasks = [] }: {
  initialEntries: Entry[]
  workspaceId: string
  ideas: ContentIdea[]
  tasks?: TaskSnap[]
}) {
  const now = new Date()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [modal, setModal] = useState<{ open: boolean; entry: Entry } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [showTasks, setShowTasks] = useState(true)

  // Calendar grid
  const calDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [viewYear, viewMonth])

  function entriesForDay(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return entries.filter(e => e.scheduled_at?.startsWith(dateStr))
  }

  function tasksForDay(day: number) {
    if (!showTasks) return []
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    // Only show sprint tasks (nama contains ' — ') and skip already-linked ones
    const linkedTaskIds = new Set(entries.filter(e => e.task_id).map(e => e.task_id))
    return tasks.filter(t => t.due_date === dateStr && !linkedTaskIds.has(t.id) && t.nama.includes(' — '))
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1)
  }

  function openAdd(day?: number) {
    const date = day ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
    setModal({ open: true, entry: emptyEntry(workspaceId, date) })
    setError('')
  }
  function openEdit(e: Entry) { setModal({ open: true, entry: { ...e } }); setError('') }
  function closeModal() { setModal(null) }
  function setField(key: keyof Entry, value: string) { setModal(m => m ? { ...m, entry: { ...m.entry, [key]: value } } : m) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    setSaving(true)
    setError('')
    const supabase = createClient()
    const entry = {
      ...modal.entry,
      workspace_id: workspaceId,
      content_id: modal.entry.content_id || null,
      posted_at: modal.entry.posted_at || null,
      posted_url: modal.entry.posted_url || null,
    }
    if (entry.id) {
      const { error: err } = await supabase.from('kf_calendar_entries').update(entry).eq('id', entry.id)
      if (err) { setError(err.message); setSaving(false); return }
      setEntries(prev => prev.map(x => x.id === entry.id ? entry : x))
    } else {
      const { data, error: err } = await supabase.from('kf_calendar_entries').insert(entry).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setEntries(prev => [...prev, { ...entry, id: data.id }])
    }
    setSaving(false)
    closeModal()
  }

  async function deleteEntry(id: string) {
    if (!confirm('Hapus jadwal ini?')) return
    const supabase = createClient()
    await supabase.from('kf_calendar_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(x => x.id !== id))
  }

  const ideaMap = Object.fromEntries(ideas.map(i => [i.id, i]))
  const monthEntries = entries.filter(e => {
    const d = new Date(e.scheduled_at)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

  const linkedTaskIds = new Set(entries.filter(e => e.task_id).map(e => e.task_id))
  const monthTasks = showTasks ? tasks.filter(t => {
    if (!t.due_date) return false
    if (linkedTaskIds.has(t.id)) return false
    if (!t.nama.includes(' — ')) return false  // sprint tasks only
    const d = new Date(t.due_date)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).sort((a, b) => a.due_date.localeCompare(b.due_date)) : []

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Calendar</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Jadwal posting konten kamu</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {tasks.length > 0 && (
            <button onClick={() => setShowTasks(s => !s)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${showTasks ? 'rgba(251,191,36,0.4)' : '#2a2a2a'}`, background: showTasks ? 'rgba(251,191,36,0.08)' : '#1a1a1a', color: showTasks ? '#fbbf24' : '#475569', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
              ⚡ {showTasks ? 'Tasks ON' : 'Tasks OFF'}
            </button>
          )}
          <div style={{ display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '8px 14px', background: view === v ? 'rgba(124,58,237,0.2)' : 'transparent', border: 'none', color: view === v ? '#A78BFA' : '#64748b', fontSize: '0.8rem', fontWeight: view === v ? 600 : 400, cursor: 'pointer' }}>
                {v === 'calendar' ? '📅 Kalender' : '📋 List'}
              </button>
            ))}
          </div>
          <button onClick={() => openAdd()} style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            + Jadwalkan
          </button>
        </div>
      </div>

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>‹</button>
        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem', minWidth: 160, textAlign: 'center' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 12px', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>›</button>
        <span style={{ fontSize: '0.8rem', color: '#475569', marginLeft: 8 }}>{monthEntries.length} jadwal{monthTasks.length > 0 ? ` · ${monthTasks.length} deadline task` : ''}</span>
      </div>

      {view === 'calendar' ? (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1f1f1f' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calDays.map((day, idx) => {
              const dayEntries = day ? entriesForDay(day) : []
              const dayTasks = day ? tasksForDay(day) : []
              const dateStr = day ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const isToday = dateStr === todayStr
              const totalItems = dayEntries.length + dayTasks.length
              const MAX_SHOW = 3
              return (
                <div key={idx} onClick={() => day && openAdd(day)}
                  style={{
                    minHeight: 88, padding: 6, borderRight: (idx + 1) % 7 !== 0 ? '1px solid #1a1a1a' : 'none', borderBottom: '1px solid #1a1a1a',
                    background: day ? 'transparent' : '#0a0a0a', cursor: day ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}>
                  {day && (
                    <>
                      <div style={{ fontSize: '0.78rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : '#64748b', width: 22, height: 22, borderRadius: '50%', background: isToday ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        {day}
                      </div>
                      {/* Calendar entries (posting schedule) */}
                      {dayEntries.slice(0, MAX_SHOW).map(e => {
                        const isSprint = !!e.task_id
                        const displayName = e.label || (e.content_id ? ideaMap[e.content_id]?.judul : null) || '(konten)'
                        return (
                          <div key={e.id} onClick={ev => { ev.stopPropagation(); openEdit(e) }}
                            style={{ fontSize: '0.63rem', padding: '2px 5px', borderRadius: 3, marginBottom: 2, background: isSprint ? 'rgba(52,211,153,0.1)' : 'rgba(124,58,237,0.15)', border: `1px solid ${STATUS_COLOR[e.status] || '#2a2a2a'}`, color: STATUS_COLOR[e.status] || '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                            {isSprint ? '⚡' : '📅'} {e.platform ? `${e.platform} · ` : ''}{displayName}
                          </div>
                        )
                      })}
                      {/* Task deadlines (sprint only) */}
                      {dayTasks.slice(0, Math.max(0, MAX_SHOW - dayEntries.length)).map(t => {
                        const pct = t.percent_complete
                        const taskColor = pct === 100 ? '#86efac' : pct > 0 ? '#fbbf24' : '#94a3b8'
                        // Strip leading emoji from step name (format: "emoji Nama — Context")
                        const rawStep = t.nama.split(' —')[0].trim()
                        const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
                        const ctx = t.nama.match(/—\s*(.+)$/)?.[1]?.trim()
                        const dot = pct === 100 ? '●' : pct > 0 ? '◑' : '○'
                        return (
                          <div key={t.id} onClick={e => e.stopPropagation()}
                            style={{ fontSize: '0.63rem', padding: '2px 5px', borderRadius: 3, marginBottom: 2, background: pct === 100 ? 'rgba(134,239,172,0.06)' : pct > 0 ? 'rgba(251,191,36,0.06)' : 'rgba(148,163,184,0.06)', border: `1px solid ${taskColor}40`, color: taskColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}
                            title={`${t.nama} · ${pct}%`}>
                            {dot} {ctx ? ctx + ' · ' : ''}{stepName}
                          </div>
                        )
                      })}
                      {totalItems > MAX_SHOW && <div style={{ fontSize: '0.6rem', color: '#475569' }}>+{totalItems - MAX_SHOW} lagi</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthEntries.length === 0 ? (
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 48, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Belum ada jadwal bulan ini</div>
              <button onClick={() => openAdd()} style={{ marginTop: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                + Jadwalkan Konten
              </button>
            </div>
          ) : monthEntries.map(e => {
            const d = new Date(e.scheduled_at)
            const idea = e.content_id ? ideaMap[e.content_id] : null
            const isSprint = !!e.task_id
            const displayName = e.label || idea?.judul || '(konten tidak terhubung)'
            return (
              <div key={e.id} style={{ background: '#111', border: `1px solid ${isSprint ? 'rgba(52,211,153,0.15)' : '#2a2a2a'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>{d.getDate()}</div>
                  <div style={{ fontSize: '0.68rem', color: '#475569' }}>{MONTHS[d.getMonth()].slice(0, 3)}</div>
                </div>
                <div style={{ width: 1, height: 36, background: STATUS_COLOR[e.status] || '#2a2a2a', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {isSprint && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontWeight: 600 }}>⚡ Sprint</span>}
                    <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{displayName}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                    {e.platform && `${e.platform} · `}{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {idea?.format && ` · ${idea.format}`}
                    {isSprint && <span style={{ marginLeft: 6, color: '#334155' }}>· Dari sprint</span>}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[e.status], background: `${STATUS_COLOR[e.status]}18`, fontWeight: 600 }}>{e.status}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isSprint && <button onClick={() => openEdit(e)} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid #7C3AED', borderRadius: 7, padding: '5px 10px', color: '#A78BFA', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>}
                  {!isSprint && <button onClick={() => deleteEntry(e.id!)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 7, padding: '5px 8px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>🗑</button>}
                  {isSprint && <span style={{ fontSize: '0.7rem', color: '#334155', padding: '5px 0' }}>auto-sync</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>{modal.entry.id ? 'Edit Jadwal' : 'Jadwalkan Konten'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Konten dari Library</label>
                <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.content_id ?? ''} onChange={e => setField('content_id', e.target.value)}>
                  <option value="">Pilih konten (opsional)</option>
                  {ideas.map(i => <option key={i.id} value={i.id}>{i.judul} {i.format ? `· ${i.format}` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Platform *</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.platform ?? ''} onChange={e => setField('platform', e.target.value)} required>
                    <option value="">Pilih platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.status ?? 'Planned'} onChange={e => setField('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Jadwal Posting *</label>
                  <input type="datetime-local" style={fieldStyle()} value={modal.entry.scheduled_at} onChange={e => setField('scheduled_at', e.target.value)} required />
                </div>
                {modal.entry.status === 'Posted' && <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Waktu Posting</label>
                    <input type="datetime-local" style={fieldStyle()} value={modal.entry.posted_at ?? ''} onChange={e => setField('posted_at', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>URL Postingan</label>
                    <input type="url" style={fieldStyle()} value={modal.entry.posted_url ?? ''} onChange={e => setField('posted_url', e.target.value)} placeholder="https://..." />
                  </div>
                </>}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 20px', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
