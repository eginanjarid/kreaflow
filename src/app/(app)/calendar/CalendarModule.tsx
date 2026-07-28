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

type ContentIdea = {
  id: string; judul: string; format: string; platform: string[]
  product_id: string | null; product_nama: string | null
}
type ReadyItem = {
  id: string; judul: string; format: string | null; platform: string[] | null
  product_id: string | null; product_nama: string | null; sprint_id: string | null
  tanggal_tayang: string | null; jam_tayang: string | null
}
type PlannedItem = {
  id: string; judul: string; product_id: string | null; product_nama: string | null
  tanggal_tayang: string; jam_tayang: string | null
}
type TaskSnap = { id: string; nama: string; platform: string; due_date: string; percent_complete: number; priority: string; stage?: string | null }

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const STATUSES = ['Planned', 'Ready', 'Posted', 'Cancelled']
const STATUS_COLOR: Record<string, string> = { Planned: '#93c5fd', Ready: '#fbbf24', Posted: '#86efac', Cancelled: '#475569' }
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function emptyEntry(wsId: string, date?: string): Entry {
  return { workspace_id: wsId, content_id: null, platform: '', scheduled_at: date ? `${date}T09:00` : '', posted_at: null, posted_url: null, status: 'Planned' }
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function CalendarModule({ initialEntries, workspaceId, ideas, tasks = [], readyQueue = [], plannedItems = [] }: {
  initialEntries: Entry[]
  workspaceId: string
  ideas: ContentIdea[]
  tasks?: TaskSnap[]
  readyQueue?: ReadyItem[]
  plannedItems?: PlannedItem[]
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
  const [queueOpen, setQueueOpen] = useState(true)
  const [readyItems, setReadyItems] = useState<ReadyItem[]>(readyQueue)
  const [schedModal, setSchedModal] = useState<{ item: ReadyItem; date: string; time: string; platform: string } | null>(null)
  const [schedSaving, setSchedSaving] = useState(false)
  const [schedError, setSchedError] = useState('')

  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

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
    const linkedTaskIds = new Set(entries.filter(e => e.task_id).map(e => e.task_id))
    return tasks.filter(t => t.due_date === dateStr && !linkedTaskIds.has(t.id) && t.stage === 'schedule')
  }

  function plannedForDay(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return plannedItems.filter(p => p.tanggal_tayang === dateStr)
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

  function openSchedModal(item: ReadyItem) {
    const defaultPlatform = (item.platform && item.platform.length === 1) ? item.platform[0] : ''
    const defaultDate = item.tanggal_tayang || todayDateStr
    const defaultTime = item.jam_tayang || '09:00'
    setSchedModal({ item, date: defaultDate, time: defaultTime, platform: defaultPlatform })
    setSchedError('')
  }

  async function confirmSchedule() {
    if (!schedModal) return
    const { item, date, time, platform } = schedModal
    const scheduled_at = `${date}T${time}`
    if (new Date(scheduled_at) < new Date()) {
      setSchedError('Jadwal tidak boleh di masa lalu. Pilih tanggal dan waktu yang akan datang.')
      return
    }
    setSchedSaving(true)
    setSchedError('')
    const supabase = createClient()
    const { data: entry } = await supabase.from('kf_calendar_entries').insert({
      workspace_id: workspaceId,
      content_id: item.id,
      platform,
      scheduled_at,
      status: 'Planned',
      posted_at: null,
      posted_url: null,
    }).select('id').single()
    await supabase.from('kf_content_ideas').update({ status: 'Terjadwal', tanggal_tayang: date }).eq('id', item.id)
    if (item.sprint_id) {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'schedule',
        title: `📅 Terjadwal — ${item.judul}`,
        message: `Konten dijadwalkan posting ${date} pukul ${time}${platform ? ' di ' + platform : ''}. Sprint progress bertambah!`,
        content_idea_id: item.id,
      })
    }
    if (entry) {
      setEntries(prev => [...prev, { id: entry.id, workspace_id: workspaceId, content_id: item.id, platform, scheduled_at, posted_at: null, posted_url: null, status: 'Planned' }])
    }
    setReadyItems(prev => prev.filter(r => r.id !== item.id))
    setSchedModal(null)
    setSchedSaving(false)
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
    if (t.stage !== 'schedule') return false
    const d = new Date(t.due_date)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).sort((a, b) => a.due_date.localeCompare(b.due_date)) : []

  const todayStr = todayDateStr

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2a3547', letterSpacing: '-0.5px', marginBottom: 6 }}>Calendar</h1>
          <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Jadwal posting konten kamu</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {tasks.length > 0 && (
            <button onClick={() => setShowTasks(s => !s)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${showTasks ? 'rgba(251,191,36,0.4)' : '#2a2a2a'}`, background: showTasks ? 'rgba(251,191,36,0.08)' : '#1a1a1a', color: showTasks ? '#fbbf24' : '#475569', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
              ⚡ {showTasks ? 'Tasks ON' : 'Tasks OFF'}
            </button>
          )}
          <div style={{ display: 'flex', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, overflow: 'hidden' }}>
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '8px 14px', background: view === v ? 'rgba(26,115,232,0.2)' : 'transparent', border: 'none', color: view === v ? '#42a5f5' : '#64748b', fontSize: '0.8rem', fontWeight: view === v ? 600 : 400, cursor: 'pointer' }}>
                {v === 'calendar' ? '📅 Kalender' : '📋 List'}
              </button>
            ))}
          </div>
          <button onClick={() => openAdd()} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            + Jadwalkan
          </button>
        </div>
      </div>

      {/* ── Antrian Posting ── */}
      {readyItems.length > 0 && (
        <div style={{ background: '#0f1a14', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, marginBottom: 20, overflow: 'hidden' }}>
          <button
            onClick={() => setQueueOpen(o => !o)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>⏰ Siap Dijadwalkan</span>
              <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{readyItems.length} konten</span>
            </div>
            <span style={{ color: '#5a6a85', fontSize: '0.8rem' }}>{queueOpen ? '▲' : '▼'}</span>
          </button>
          {queueOpen && (
            <div style={{ borderTop: '1px solid rgba(52,211,153,0.1)', padding: '8px 12px 12px' }}>
              {readyItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', borderBottom: '1px solid #1a2a1f' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                      {item.product_nama && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 3, background: 'rgba(66,165,245,0.12)', color: '#42a5f5', whiteSpace: 'nowrap' }}>
                          📦 {item.product_nama}
                        </span>
                      )}
                      {item.format && (
                        <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: '#f8fafc', color: '#5a6a85', border: '1px solid #e5eaf2' }}>{item.format}</span>
                      )}
                      {item.platform && item.platform.length > 0 && item.platform.map(p => (
                        <span key={p} style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 3, background: '#f8fafc', color: '#5a6a85', border: '1px solid #e5eaf2' }}>{p}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#2a3547', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.judul}</div>
                    {item.tanggal_tayang && (
                      <div style={{ fontSize: '0.65rem', color: '#5a6a85', marginTop: 2 }}>
                        📅 Rencana: {new Date(item.tanggal_tayang + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{item.jam_tayang ? ` pukul ${item.jam_tayang}` : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openSchedModal(item)}
                    style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, color: '#34d399', fontSize: '0.78rem', fontWeight: 700, padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    + Jadwalkan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 12px', color: '#5a6a85', cursor: 'pointer', fontSize: '1rem' }}>‹</button>
        <span style={{ fontWeight: 700, color: '#2a3547', fontSize: '1.1rem', minWidth: 160, textAlign: 'center' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px 12px', color: '#5a6a85', cursor: 'pointer', fontSize: '1rem' }}>›</button>
        <span style={{ fontSize: '0.8rem', color: '#5a6a85', marginLeft: 8 }}>
          {monthEntries.length} jadwal
          {monthTasks.length > 0 ? ` · ${monthTasks.length} deadline task` : ''}
          {(() => { const mp = plannedItems.filter(p => { const d = new Date(p.tanggal_tayang); return d.getFullYear() === viewYear && d.getMonth() === viewMonth }).length; return mp > 0 ? ` · ${mp} rencana` : '' })()}
        </span>
      </div>

      {view === 'calendar' ? (
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5eaf2' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#5a6a85', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {calDays.map((day, idx) => {
              const dayEntries = day ? entriesForDay(day) : []
              const dayTasks = day ? tasksForDay(day) : []
              const dayPlanned = day ? plannedForDay(day) : []
              const dateStr = day ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const isToday = dateStr === todayStr
              const totalItems = dayEntries.length + dayTasks.length + dayPlanned.length
              const MAX_SHOW = 3
              let shown = 0
              return (
                <div key={idx} onClick={() => day && openAdd(day)}
                  style={{
                    minHeight: 88, padding: 6, borderRight: (idx + 1) % 7 !== 0 ? '1px solid #1a1a1a' : 'none', borderBottom: '1px solid #1a1a1a',
                    background: day ? 'transparent' : '#0a0a0a', cursor: day ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}>
                  {day && (
                    <>
                      <div style={{ fontSize: '0.78rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : '#64748b', width: 22, height: 22, borderRadius: '50%', background: isToday ? '#1a73e8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        {day}
                      </div>
                      {dayEntries.slice(0, MAX_SHOW).map(e => {
                        shown++
                        const idea = e.content_id ? ideaMap[e.content_id] : null
                        const displayName = e.label || idea?.judul || '(konten)'
                        const productLabel = idea?.product_nama ? `📦${idea.product_nama.split(' ')[0]} · ` : ''
                        const timeStr = e.scheduled_at ? new Date(e.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
                        return (
                          <div key={e.id} onClick={ev => { ev.stopPropagation(); openEdit(e) }}
                            style={{ fontSize: '0.62rem', padding: '2px 5px', borderRadius: 3, marginBottom: 2, background: 'rgba(26,115,232,0.15)', border: `1px solid ${STATUS_COLOR[e.status] || '#2a2a2a'}`, color: STATUS_COLOR[e.status] || '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            title={`${idea?.product_nama ? idea.product_nama + ' · ' : ''}${displayName} · ${timeStr}`}>
                            {timeStr && <span style={{ opacity: 0.7 }}>{timeStr} </span>}{productLabel}{displayName}
                          </div>
                        )
                      })}
                      {dayTasks.slice(0, Math.max(0, MAX_SHOW - shown)).map(t => {
                        shown++
                        const pct = t.percent_complete
                        const taskColor = pct === 100 ? '#86efac' : pct > 0 ? '#fbbf24' : '#94a3b8'
                        const rawStep = t.nama.split(' —')[0].trim()
                        const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
                        const ctx = t.nama.match(/—\s*(.+)$/)?.[1]?.trim()
                        const dot = pct === 100 ? '●' : pct > 0 ? '◑' : '○'
                        return (
                          <div key={t.id} onClick={ev => ev.stopPropagation()}
                            style={{ fontSize: '0.63rem', padding: '2px 5px', borderRadius: 3, marginBottom: 2, background: pct === 100 ? 'rgba(134,239,172,0.06)' : pct > 0 ? 'rgba(251,191,36,0.06)' : 'rgba(148,163,184,0.06)', border: `1px solid ${taskColor}40`, color: taskColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}
                            title={`${t.nama} · ${pct}%`}>
                            {dot} {ctx ? ctx + ' · ' : ''}{stepName}
                          </div>
                        )
                      })}
                      {dayPlanned.slice(0, Math.max(0, MAX_SHOW - shown)).map(p => {
                        shown++
                        return (
                          <div key={p.id} onClick={ev => ev.stopPropagation()}
                            style={{ fontSize: '0.62rem', padding: '2px 5px', borderRadius: 3, marginBottom: 2, background: 'transparent', border: '1px dashed #334155', color: '#5a6a85', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}
                            title={`📋 Rencana: ${p.judul}${p.jam_tayang ? ' · ' + p.jam_tayang : ''}`}>
                            {p.jam_tayang && <span style={{ opacity: 0.6 }}>{p.jam_tayang} </span>}
                            {p.product_nama ? `${p.product_nama.split(' ')[0]} · ` : ''}
                            {p.judul.replace(/^.*?—\s*/, '').slice(0, 18)}
                          </div>
                        )
                      })}
                      {totalItems > MAX_SHOW && <div style={{ fontSize: '0.6rem', color: '#5a6a85' }}>+{totalItems - MAX_SHOW} lagi</div>}
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
            <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#5a6a85' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>Belum ada jadwal bulan ini</div>
              <button onClick={() => openAdd()} style={{ marginTop: 8, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                + Jadwalkan Konten
              </button>
            </div>
          ) : monthEntries.map(e => {
            const d = new Date(e.scheduled_at)
            const idea = e.content_id ? ideaMap[e.content_id] : null
            const isSprint = !!e.task_id
            const displayName = e.label || idea?.judul || '(konten tidak terhubung)'
            return (
              <div key={e.id} style={{ background: '#fff', border: `1px solid ${isSprint ? 'rgba(52,211,153,0.15)' : '#2a2a2a'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Date block */}
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2a3547' }}>{d.getDate()}</div>
                  <div style={{ fontSize: '0.68rem', color: '#5a6a85' }}>{MONTHS[d.getMonth()].slice(0, 3)}</div>
                  <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: 1 }}>{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ width: 1, height: 44, background: STATUS_COLOR[e.status] || '#2a2a2a', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Product + sprint badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    {idea?.product_nama && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(66,165,245,0.12)', color: '#42a5f5', border: '1px solid rgba(66,165,245,0.2)' }}>
                        📦 {idea.product_nama}
                      </span>
                    )}
                    {isSprint && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontWeight: 600 }}>⚡ Sprint</span>}
                  </div>
                  <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{displayName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>
                    {e.platform && `${e.platform}`}{idea?.format && ` · ${idea.format}`}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[e.status], background: `${STATUS_COLOR[e.status]}18`, fontWeight: 600, flexShrink: 0 }}>{e.status}</span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!isSprint && <button onClick={() => openEdit(e)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 7, padding: '5px 10px', color: '#42a5f5', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>}
                  {!isSprint && <button onClick={() => deleteEntry(e.id!)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 7, padding: '5px 8px', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer' }}>🗑</button>}
                  {isSprint && <span style={{ fontSize: '0.7rem', color: '#334155', padding: '5px 0' }}>auto-sync</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Jadwalkan Modal (from queue) ── */}
      {schedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 420 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '1rem' }}>📅 Jadwalkan Posting</div>
              <button onClick={() => setSchedModal(null)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Content info */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                {schedModal.item.product_nama && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#42a5f5', marginBottom: 4 }}>📦 {schedModal.item.product_nama}</div>
                )}
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2a3547', marginBottom: 2 }}>{schedModal.item.judul}</div>
                {schedModal.item.format && <div style={{ fontSize: '0.7rem', color: '#5a6a85' }}>{schedModal.item.format}</div>}
              </div>
              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tanggal Posting</label>
                <input type="date" style={fieldStyle()} value={schedModal.date} onChange={e => setSchedModal(s => s ? { ...s, date: e.target.value } : s)} />
              </div>
              {/* Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Jam Posting</label>
                <input type="time" style={fieldStyle()} value={schedModal.time} onChange={e => setSchedModal(s => s ? { ...s, time: e.target.value } : s)} />
              </div>
              {/* Platform */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform *</label>
                <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={schedModal.platform} onChange={e => setSchedModal(s => s ? { ...s, platform: e.target.value } : s)} required>
                  <option value="">Pilih platform</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {schedError && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: '0.8rem', color: '#f87171' }}>
                  {schedError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => { setSchedModal(null); setSchedError('') }} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 18px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button
                  onClick={confirmSchedule}
                  disabled={schedSaving || !schedModal.platform || !schedModal.date}
                  style={{ background: schedSaving ? '#15803d' : 'linear-gradient(135deg, #16a34a, #34d399)', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: (schedSaving || !schedModal.platform) ? 'not-allowed' : 'pointer', opacity: (!schedModal.platform || !schedModal.date) ? 0.5 : 1 }}>
                  {schedSaving ? 'Menjadwalkan...' : '✓ Jadwalkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit/Add Modal ── */}
      {modal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2a3547' }}>{modal.entry.id ? 'Edit Jadwal' : 'Jadwalkan Konten'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Konten dari Library</label>
                <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.content_id ?? ''} onChange={e => setField('content_id', e.target.value)}>
                  <option value="">Pilih konten (opsional)</option>
                  {ideas.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.product_nama ? `[${i.product_nama}] ` : ''}{i.judul}{i.format ? ` · ${i.format}` : ''}
                    </option>
                  ))}
                </select>
                {modal.entry.content_id && ideaMap[modal.entry.content_id]?.product_nama && (
                  <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#42a5f5' }}>📦 {ideaMap[modal.entry.content_id].product_nama}</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform *</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.platform ?? ''} onChange={e => setField('platform', e.target.value)} required>
                    <option value="">Pilih platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.status ?? 'Planned'} onChange={e => setField('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Jadwal Posting *</label>
                  <input type="datetime-local" style={fieldStyle()} value={modal.entry.scheduled_at} onChange={e => setField('scheduled_at', e.target.value)} required />
                </div>
                {modal.entry.status === 'Posted' && <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Waktu Posting</label>
                    <input type="datetime-local" style={fieldStyle()} value={modal.entry.posted_at ?? ''} onChange={e => setField('posted_at', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>URL Postingan</label>
                    <input type="url" style={fieldStyle()} value={modal.entry.posted_url ?? ''} onChange={e => setField('posted_url', e.target.value)} placeholder="https://..." />
                  </div>
                </>}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 20px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
