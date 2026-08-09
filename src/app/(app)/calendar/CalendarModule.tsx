'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  tanggal_tayang: string | null; jam_tayang: string | null
}
type ReadyItem = {
  id: string; judul: string; format: string | null; platform: string[] | null
  product_id: string | null; product_nama: string | null; sprint_id: string | null
  tanggal_tayang: string | null; jam_tayang: string | null
}
type TaskSnap = { id: string; nama: string; platform: string | null; due_date: string; percent_complete: number; priority: string; stage?: string | null; assigned_to?: string | null }
type SosmedAkun = { id: string; platform: string; handle: string; nama: string }
type ImportantDate = { id: string; workspace_id: string | null; nama: string; tanggal: string; tipe: string; warna: string; deskripsi: string | null; is_repeating: boolean }

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const PRIORITY_COLOR: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#059669' }
const STATUSES = ['Planned', 'Ready', 'Posted', 'Cancelled']
const STATUS_COLOR: Record<string, string> = { Planned: '#1a73e8', Ready: '#d97706', Posted: '#059669', Cancelled: '#6b7280' }
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// Supabase returns timestamptz as "2024-08-05T18:00:00+00:00" — strip tz so JS parses as local time
function parseLocal(s: string) { return new Date(s.slice(0, 19)) }

function emptyEntry(wsId: string, date?: string): Entry {
  return { workspace_id: wsId, content_id: null, platform: '', scheduled_at: date ? `${date}T09:00` : '', posted_at: null, posted_url: null, status: 'Planned' }
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function CalendarModule({ initialEntries, workspaceId, ideas, tasks = [], readyQueue = [], autoContentId, accounts = [], importantDates: initialImportantDates = [] }: {
  initialEntries: Entry[]
  workspaceId: string
  ideas: ContentIdea[]
  tasks?: TaskSnap[]
  readyQueue?: ReadyItem[]
  autoContentId?: string
  accounts?: SosmedAkun[]
  importantDates?: ImportantDate[]
}) {
  const now = new Date()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [modal, setModal] = useState<{ open: boolean; entry: Entry } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isMobile = useIsMobile()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const effectiveView = isMobile ? 'list' : view
  const [showTasks, setShowTasks] = useState(true)
  const [readyItems, setReadyItems] = useState<ReadyItem[]>(readyQueue)
  const [schedModal, setSchedModal] = useState<{ item: ReadyItem; date: string; time: string; platforms: string[] } | null>(null)
  // selectedAkunIds: akun yang dipilih untuk scheduling (id dari kf_accounts)
  const [schedSaving, setSchedSaving] = useState(false)
  const [schedError, setSchedError] = useState('')

  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [importantDates, setImportantDates] = useState<ImportantDate[]>(initialImportantDates)
  const [dateModal, setDateModal] = useState<{ open: boolean; item: Partial<ImportantDate> } | null>(null)
  const [dateSaving, setDateSaving] = useState(false)
  const [showImportantDates, setShowImportantDates] = useState(true)
  const [detailEntry, setDetailEntry] = useState<Entry | null>(null)

  function openDetail(e: Entry) { setDetailEntry(e) }
  function closeDetail() { setDetailEntry(null) }

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
    return entries.filter(e => {
      const d = parseLocal(e.scheduled_at)
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day
    })
  }

  function tasksForDay(day: number) {
    if (!showTasks) return []
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.due_date === dateStr && t.percent_complete < 100)
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
  function setField(key: keyof Entry, value: string) {
    setModal(m => {
      if (!m) return m
      const newEntry: Entry = { ...m.entry, [key]: value }
      if (key === 'content_id' && value) {
        const idea = ideas.find(i => i.id === value)
        if (idea?.tanggal_tayang) {
          newEntry.scheduled_at = `${idea.tanggal_tayang}T${idea.jam_tayang || '09:00'}`
        }
        if (idea?.platform && idea.platform.length === 1) {
          newEntry.platform = idea.platform[0]
        }
      }
      return { ...m, entry: newEntry }
    })
  }

  useEffect(() => {
    if (!autoContentId) return
    const ready = readyItems.find(r => r.id === autoContentId)
    if (ready) {
      openSchedModal(ready)
      return
    }
    const idea = ideas.find(i => i.id === autoContentId)
    if (!idea) return
    const date = idea.tanggal_tayang || todayDateStr
    const time = idea.jam_tayang || '09:00'
    setModal({ open: true, entry: { ...emptyEntry(workspaceId, date), content_id: autoContentId, scheduled_at: `${date}T${time}` } })
    if (idea.tanggal_tayang) {
      const d = new Date(idea.tanggal_tayang + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoContentId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    const missing: string[] = []
    if (!modal.entry.platform) missing.push('Platform')
    if (!modal.entry.scheduled_at) missing.push('Jadwal posting')
    if (missing.length) { showToast(`Wajib diisi: ${missing.join(', ')}.`); return }
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
    showToast('Jadwal berhasil disimpan.', 'success')
    closeModal()
  }

  async function deleteEntry(id: string) {
    if (!confirm('Hapus jadwal ini?')) return
    const supabase = createClient()
    await supabase.from('kf_calendar_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(x => x.id !== id))
  }

  function openSchedModal(item: ReadyItem) {
    // Default: pilih platform yang sudah ada akunnya
    const contentPlatforms = item.platform || []
    const registeredPlatforms = accounts.map(a => a.platform)
    const defaultPlatforms = contentPlatforms.length > 0
      ? contentPlatforms.filter(p => registeredPlatforms.includes(p))
      : registeredPlatforms
    const defaultDate = item.tanggal_tayang || todayDateStr
    const defaultTime = item.jam_tayang || '09:00'
    setSchedModal({ item, date: defaultDate, time: defaultTime, platforms: defaultPlatforms })
    setSchedError('')
  }

  async function confirmSchedule() {
    if (!schedModal) return
    const { item, date, time, platforms } = schedModal
    if (platforms.length === 0) { setSchedError('Pilih minimal 1 platform.'); return }
    const scheduled_at = `${date}T${time}`
    if (new Date(scheduled_at) < new Date()) {
      setSchedError('Jadwal tidak boleh di masa lalu. Pilih tanggal dan waktu yang akan datang.')
      return
    }
    setSchedSaving(true)
    setSchedError('')
    const supabase = createClient()
    // Create one entry per platform
    const { data: newEntries } = await supabase.from('kf_calendar_entries').insert(
      platforms.map(p => ({ workspace_id: workspaceId, content_id: item.id, platform: p, scheduled_at, status: 'Planned', posted_at: null, posted_url: null }))
    ).select('id, platform')
    await supabase.from('kf_content_ideas').update({ status: 'Terjadwal', tanggal_tayang: date }).eq('id', item.id)
    if (item.sprint_id) {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'schedule',
        title: `Terjadwal — ${item.judul}`,
        message: `Konten dijadwalkan posting ${date} pukul ${time} di ${platforms.join(', ')}. Sprint progress bertambah!`,
        content_idea_id: item.id,
      })
    }
    if (newEntries) {
      setEntries(prev => [...prev, ...newEntries.map(e => ({ id: e.id, workspace_id: workspaceId, content_id: item.id, platform: e.platform, scheduled_at, posted_at: null, posted_url: null, status: 'Planned' }))])
    }
    setReadyItems(prev => prev.filter(r => r.id !== item.id))
    setSchedModal(null)
    setSchedSaving(false)
  }

  function importantDatesForDay(day: number) {
    if (!showImportantDates) return []
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return importantDates.filter(d => {
      if (d.is_repeating) {
        return d.tanggal.slice(5) === dateStr.slice(5) // same MM-DD
      }
      return d.tanggal === dateStr
    })
  }

  async function saveImportantDate() {
    if (!dateModal?.item.nama || !dateModal?.item.tanggal) return
    setDateSaving(true)
    const supabase = createClient()
    const payload = { workspace_id: workspaceId, nama: dateModal.item.nama, tanggal: dateModal.item.tanggal, tipe: dateModal.item.tipe || 'brand_moment', warna: dateModal.item.warna || '#f59e0b', deskripsi: dateModal.item.deskripsi || null, is_repeating: dateModal.item.is_repeating || false }
    if (dateModal.item.id) {
      await supabase.from('kf_important_dates').update(payload).eq('id', dateModal.item.id)
      setImportantDates(prev => prev.map(d => d.id === dateModal.item.id ? { ...d, ...payload } : d))
    } else {
      const { data } = await supabase.from('kf_important_dates').insert(payload).select('id').single()
      if (data) setImportantDates(prev => [...prev, { id: data.id, ...payload }])
    }
    setDateSaving(false)
    setDateModal(null)
  }

  async function deleteImportantDate(id: string) {
    if (!confirm('Hapus tanggal penting ini?')) return
    const supabase = createClient()
    await supabase.from('kf_important_dates').delete().eq('id', id)
    setImportantDates(prev => prev.filter(d => d.id !== id))
  }

  const ideaMap = Object.fromEntries(ideas.map(i => [i.id, i]))
  const monthEntries = entries.filter(e => {
    const d = parseLocal(e.scheduled_at)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

  const monthTasks = showTasks ? tasks.filter(t => {
    if (!t.due_date) return false
    if (t.percent_complete === 100) return false
    const d = new Date(t.due_date + 'T00:00:00')
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).sort((a, b) => a.due_date.localeCompare(b.due_date)) : []

  const todayStr = todayDateStr

  return (
    <div>
      {/* Header */}
      <div className="kf-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Calendar</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Jadwal posting konten kamu</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowImportantDates(s => !s)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${showImportantDates ? 'rgba(239,68,68,0.3)' : '#e5e7eb'}`, background: showImportantDates ? 'rgba(239,68,68,0.06)' : '#f3f4f6', color: showImportantDates ? '#ef4444' : '#6b7280', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
            Tgl Penting {showImportantDates ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setDateModal({ open: true, item: { tipe: 'brand_moment', warna: '#f59e0b', is_repeating: false } })}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', color: '#d97706', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            + Tgl Penting
          </button>
          {tasks.length > 0 && (
            <button onClick={() => setShowTasks(s => !s)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${showTasks ? 'rgba(251,191,36,0.4)' : '#e5e7eb'}`, background: showTasks ? 'rgba(251,191,36,0.08)' : '#f3f4f6', color: showTasks ? '#d97706' : '#6b7280', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>
              Tasks {showTasks ? 'ON' : 'OFF'}
            </button>
          )}
          {!isMobile && (
            <div style={{ display: 'flex', background: '#f3f4f6', border: 'none', borderRadius: 8, overflow: 'hidden' }}>
              {(['calendar', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '8px 14px', background: effectiveView === v ? 'rgba(26,115,232,0.10)' : 'transparent', border: 'none', color: effectiveView === v ? '#1a73e8' : '#6b7280', fontSize: '0.8rem', fontWeight: effectiveView === v ? 600 : 400, cursor: 'pointer' }}>
                  {v === 'calendar' ? 'Kalender' : 'List'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Antrian Posting ── */}
      {readyItems.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>Siap Dijadwalkan</span>
              <span style={{ background: '#059669', color: '#fff', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{readyItems.length}</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Klik untuk jadwalkan</span>
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {readyItems.map(item => (
              <button key={item.id} type="button" onClick={() => openSchedModal(item)}
                style={{ flexShrink: 0, width: 172, textAlign: 'left', background: '#f9fafb', border: '1.5px solid #f3f4f6', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(5,150,105,0.1)', color: '#059669' }}>SIAP TAYANG</span>
                  {item.format && <span style={{ fontSize: '0.58rem', color: '#6b7280', background: '#f3f4f6', borderRadius: 3, padding: '1px 5px' }}>{item.format}</span>}
                </div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.8rem', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.judul}>
                  {item.judul}
                </div>
                {item.tanggal_tayang ? (
                  <div style={{ fontSize: '0.68rem', color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {new Date(item.tanggal_tayang + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{item.jam_tayang ? ` ${item.jam_tayang}` : ''}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Belum dijadwalkan</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={prevMonth} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, flexShrink: 0 }}>‹</button>
        <span style={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem', minWidth: 150, textAlign: 'center' }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600, flexShrink: 0 }}>›</button>
        {(viewYear !== now.getFullYear() || viewMonth !== now.getMonth()) && (
          <button onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }}
            style={{ background: 'rgba(26,115,232,0.08)', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#1a73e8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
            Hari Ini
          </button>
        )}
        <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 4 }}>
          {monthEntries.length > 0 && `${monthEntries.length} jadwal`}
          {monthTasks.length > 0 ? ` · ${monthTasks.length} deadline` : ''}
        </span>
      </div>

      {effectiveView === 'calendar' ? (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: i === 0 ? '#ef4444' : i === 6 ? '#1a73e8' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '110px' }}>
            {calDays.map((day, idx) => {
              const dayEntries = day ? entriesForDay(day) : []
              const dayTasks = day ? tasksForDay(day) : []
              const dayImportant = day ? importantDatesForDay(day) : []
              const dateStr = day ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const isToday = dateStr === todayStr
              const totalItems = dayEntries.length + dayTasks.length
              const MAX_SHOW = 3
              let shown = 0
              return (
                <div key={idx}
                  style={{
                    height: '100%', overflow: 'hidden', padding: 6, borderRight: (idx + 1) % 7 !== 0 ? '1px solid #f3f4f6' : 'none', borderBottom: '1px solid #f3f4f6',
                    background: dayImportant.length > 0 ? `${dayImportant[0].warna}08` : day ? 'transparent' : '#f9fafb', cursor: 'default',
                  }}>
                  {day && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: isToday ? 700 : 400, color: isToday ? '#fff' : idx % 7 === 0 ? '#ef4444' : '#374151', width: 22, height: 22, borderRadius: '50%', background: isToday ? '#1a73e8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {day}
                        </div>
                        {dayImportant.map(d => (
                          <div key={d.id} title={d.nama + (d.deskripsi ? ` — ${d.deskripsi}` : '')}
                            style={{ fontSize: '0.52rem', padding: '1px 4px', borderRadius: 3, background: d.warna + '20', border: `1px solid ${d.warna}40`, color: d.warna, fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, cursor: 'default' }}>
                            {d.nama.split(' ').slice(0, 2).join(' ')}
                          </div>
                        ))}
                      </div>
                      {dayEntries.slice(0, MAX_SHOW).map(e => {
                        shown++
                        const idea = e.content_id ? ideaMap[e.content_id] : null
                        const displayName = e.label || idea?.judul || '(konten)'
                        const productLabel = idea?.product_nama ? `${idea.product_nama.split(' ')[0]} · ` : ''
                        const timeStr = e.scheduled_at ? parseLocal(e.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
                        return (
                          <div key={e.id} onClick={ev => { ev.stopPropagation(); openDetail(e) }}
                            style={{ fontSize: '0.62rem', padding: '2px 5px', borderRadius: 4, marginBottom: 2, background: `${STATUS_COLOR[e.status] || '#6b7280'}18`, borderLeft: `2px solid ${STATUS_COLOR[e.status] || '#6b7280'}`, color: STATUS_COLOR[e.status] || '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            title={`${idea?.product_nama ? idea.product_nama + ' · ' : ''}${displayName} · ${timeStr}`}>
                            {timeStr && <span style={{ opacity: 0.7 }}>{timeStr} </span>}{productLabel}{displayName}
                          </div>
                        )
                      })}
                      {dayTasks.slice(0, Math.max(0, MAX_SHOW - shown)).map(t => {
                        shown++
                        const pct = t.percent_complete
                        const taskColor = pct === 100 ? '#059669' : pct > 0 ? '#d97706' : '#6b7280'
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
                      {totalItems > MAX_SHOW && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>+{totalItems - MAX_SHOW} lagi</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {monthEntries.length === 0 && monthTasks.length === 0 ? (
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ marginBottom: 12, color: '#6b7280' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
              <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Belum ada jadwal bulan ini</div>
              <div style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Jadwalkan konten dari antrian "Siap Dijadwalkan" di atas</div>
            </div>
          ) : null}
          {showTasks && monthTasks.map(t => {
            const d = new Date(t.due_date + 'T00:00:00')
            const isOverdue = t.due_date < todayStr
            const taskColor = isOverdue ? '#dc2626' : '#d97706'
            return (
              <div key={t.id} style={{ background: '#fff', border: `1px solid ${taskColor}30`, borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isOverdue ? '#dc2626' : '#111827' }}>{d.getDate()}</div>
                  <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{MONTHS[d.getMonth()].slice(0, 3)}</div>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', minHeight: 44, background: taskColor, flexShrink: 0, opacity: 0.5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: `${taskColor}15`, color: taskColor, border: `1px solid ${taskColor}30` }}>
                      {isOverdue ? 'OVERDUE' : 'DEADLINE'}
                    </span>
                    <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 3, background: `${PRIORITY_COLOR[t.priority] || '#6b7280'}15`, color: PRIORITY_COLOR[t.priority] || '#6b7280', fontWeight: 600 }}>{t.priority}</span>
                    {t.assigned_to && <span style={{ fontSize: '0.62rem', color: '#1a73e8', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {t.assigned_to}
                    </span>}
                  </div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', marginBottom: 2 }}>{t.nama}</div>
                </div>
              </div>
            )
          })}
          {monthEntries.map(e => {
            const d = parseLocal(e.scheduled_at)
            const idea = e.content_id ? ideaMap[e.content_id] : null
            const isSprint = !!e.task_id
            const displayName = e.label || idea?.judul || '(konten tidak terhubung)'
            return (
              <div key={e.id} style={{ background: '#fff', boxShadow: isSprint ? '0 0 0 1px rgba(52,211,153,0.2)' : '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Date block */}
                <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>{d.getDate()}</div>
                  <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{MONTHS[d.getMonth()].slice(0, 3)}</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', minHeight: 44, background: STATUS_COLOR[e.status] || '#e5e7eb', flexShrink: 0 }} />
                {/* Content + actions in one column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Product + sprint badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    {idea?.product_nama && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(66,165,245,0.12)', color: '#1a73e8', border: '1px solid rgba(66,165,245,0.2)' }}>
                        {idea.product_nama}
                      </span>
                    )}
                    {isSprint && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 3, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#059669', fontWeight: 600 }}>Sprint</span>}
                  </div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{displayName}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>
                    {e.platform && `${e.platform}`}{idea?.format && ` · ${idea.format}`}
                  </div>
                  {/* Status + action buttons row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[e.status], background: `${STATUS_COLOR[e.status]}18`, fontWeight: 600 }}>{e.status}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      {!isSprint && <button onClick={() => openEdit(e)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 7, padding: '5px 10px', color: '#1a73e8', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>}
                      {!isSprint && <button onClick={() => deleteEntry(e.id!)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 7, padding: '5px 8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>}
                      {isSprint && <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>auto-sync</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Jadwalkan Modal (from queue) ── */}
      {schedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 420 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>Jadwalkan Posting</div>
              <button onClick={() => setSchedModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Content info */}
              <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '12px 14px' }}>
                {schedModal.item.product_nama && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a73e8', marginBottom: 4 }}>{schedModal.item.product_nama}</div>
                )}
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: 2 }}>{schedModal.item.judul}</div>
                {schedModal.item.format && <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{schedModal.item.format}</div>}
              </div>
              {/* Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Tanggal Posting</label>
                <input type="date" style={fieldStyle()} value={schedModal.date} onChange={e => setSchedModal(s => s ? { ...s, date: e.target.value } : s)} />
              </div>
              {/* Time */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Jam Posting</label>
                <input type="time" style={fieldStyle()} value={schedModal.time} onChange={e => setSchedModal(s => s ? { ...s, time: e.target.value } : s)} />
              </div>
              {/* Akun / Platform multi-select */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>Posting ke Akun *</label>
                  {schedModal.platforms.length > 0 && (
                    <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>{schedModal.platforms.length} dipilih</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(schedModal.item.platform && schedModal.item.platform.length > 0 ? schedModal.item.platform : PLATFORMS).map(p => {
                    const akun = accounts.find(a => a.platform === p)
                    const checked = schedModal.platforms.includes(p)
                    const hasAkun = !!akun
                    return (
                      <button key={p} type="button"
                        onClick={() => {
                          if (!hasAkun) return
                          setSchedModal(s => {
                            if (!s) return s
                            const next = checked ? s.platforms.filter(x => x !== p) : [...s.platforms, p]
                            return { ...s, platforms: next }
                          })
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${checked ? '#1a73e8' : hasAkun ? '#e5e7eb' : '#f3f4f6'}`, background: checked ? 'rgba(26,115,232,0.06)' : hasAkun ? '#fafafa' : '#f9fafb', cursor: hasAkun ? 'pointer' : 'default', textAlign: 'left' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? '#1a73e8' : hasAkun ? '#d1d5db' : '#e5e7eb'}`, background: checked ? '#1a73e8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checked && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: checked ? 700 : 500, color: hasAkun ? (checked ? '#1a73e8' : '#111827') : '#9ca3af' }}>
                            {p}
                            {hasAkun && <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>· @{akun.handle}</span>}
                          </div>
                          {!hasAkun && (
                            <div style={{ fontSize: '0.65rem', color: '#d97706', marginTop: 1 }}>
                              Belum ada akun — <a href="/brand" style={{ color: '#1a73e8', textDecoration: 'none' }}>daftarkan di Brand →</a>
                            </div>
                          )}
                        </div>
                        {hasAkun && <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 6, background: '#f3f4f6', color: '#6b7280' }}>{akun.nama}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              {schedError && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: '0.8rem', color: '#dc2626' }}>
                  {schedError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => { setSchedModal(null); setSchedError('') }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button
                  onClick={confirmSchedule}
                  disabled={schedSaving || schedModal.platforms.length === 0 || !schedModal.date}
                  style={{ background: schedSaving ? '#15803d' : '#059669', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: (schedSaving || schedModal.platforms.length === 0) ? 'not-allowed' : 'pointer', opacity: (schedModal.platforms.length === 0 || !schedModal.date) ? 0.5 : 1 }}>
                  {schedSaving ? 'Menjadwalkan...' : 'Jadwalkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Popup (read-only) ── */}
      {detailEntry && (() => {
        const e = detailEntry
        const idea = e.content_id ? ideaMap[e.content_id] : null
        const displayName = e.label || idea?.judul || '(konten)'
        const timeStr = e.scheduled_at ? parseLocal(e.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
        const dateStr2 = e.scheduled_at ? parseLocal(e.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''
        const statusColor = STATUS_COLOR[e.status] || '#6b7280'
        const isSprint = !e.id || entries.find(x => x.id === e.id)?.task_id != null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}
            onClick={closeDetail}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
              onClick={ev => ev.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${statusColor}18`, color: statusColor }}>{e.status}</span>
                <button onClick={closeDetail} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
              {/* Body */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {idea?.product_nama && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a73e8' }}>{idea.product_nama}</div>
                )}
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', lineHeight: 1.4 }}>{displayName}</div>
                {idea?.format && <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{idea.format}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontSize: '0.78rem', color: '#374151' }}>{dateStr2}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{ fontSize: '0.78rem', color: '#374151' }}>{timeStr}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2H3v16h5l3 3 3-3h7V2z"/></svg>
                    <span style={{ fontSize: '0.78rem', color: '#374151' }}>{e.platform}</span>
                  </div>
                </div>
              </div>
              {/* Footer actions */}
              {!isSprint && (
                <div style={{ padding: '12px 18px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { closeDetail(); deleteEntry(e.id!) }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#6b7280', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                    Hapus
                  </button>
                  <button onClick={() => { closeDetail(); openEdit(e) }} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 16px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    Edit Jadwal
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Edit/Add Modal ── */}
      {modal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 300, padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{modal.entry.id ? 'Edit Jadwal' : 'Jadwalkan Konten'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Konten dari Library</label>
                <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.content_id ?? ''} onChange={e => setField('content_id', e.target.value)}>
                  <option value="">Pilih konten (opsional)</option>
                  {ideas.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.product_nama ? `[${i.product_nama}] ` : ''}{i.judul}{i.format ? ` · ${i.format}` : ''}
                    </option>
                  ))}
                </select>
                {modal.entry.content_id && ideaMap[modal.entry.content_id]?.product_nama && (
                  <div style={{ marginTop: 5, fontSize: '0.72rem', color: '#1a73e8' }}>{ideaMap[modal.entry.content_id].product_nama}</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Platform *</label>
                  {(() => {
                    const selectedPlatforms = modal.entry.content_id ? (ideaMap[modal.entry.content_id]?.platform || []) : []
                    const platformOptions = selectedPlatforms.length > 0 ? selectedPlatforms : PLATFORMS
                    return (
                      <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.platform ?? ''} onChange={e => setField('platform', e.target.value)} required>
                        <option value="">Pilih platform</option>
                        {platformOptions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )
                  })()}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.entry.status ?? 'Planned'} onChange={e => setField('status', e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Jadwal Posting *</label>
                  <input type="datetime-local" style={fieldStyle()} value={modal.entry.scheduled_at} onChange={e => setField('scheduled_at', e.target.value)} required />
                </div>
                {modal.entry.status === 'Posted' && <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Waktu Posting</label>
                    <input type="datetime-local" style={fieldStyle()} value={modal.entry.posted_at ?? ''} onChange={e => setField('posted_at', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>URL Postingan</label>
                    <input type="url" style={fieldStyle()} value={modal.entry.posted_url ?? ''} onChange={e => setField('posted_url', e.target.value)} placeholder="https://..." />
                  </div>
                </>}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tanggal Penting Modal ──────────────────────────────────────────── */}
      {dateModal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{dateModal.item.id ? 'Edit' : 'Tambah'} Tanggal Penting</div>
              <button onClick={() => setDateModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Nama</div>
                <input value={dateModal.item.nama || ''} onChange={e => setDateModal(m => m ? { ...m, item: { ...m.item, nama: e.target.value } } : m)}
                  style={fieldStyle()} placeholder="e.g. Harbolnas 12.12, Hari Ulang Tahun Brand" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Tanggal</div>
                  <input type="date" value={dateModal.item.tanggal || ''} onChange={e => setDateModal(m => m ? { ...m, item: { ...m.item, tanggal: e.target.value } } : m)} style={fieldStyle()} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Tipe</div>
                  <select value={dateModal.item.tipe || 'brand_moment'} onChange={e => setDateModal(m => m ? { ...m, item: { ...m.item, tipe: e.target.value } } : m)} style={fieldStyle({ cursor: 'pointer' })}>
                    <option value="libur_nasional">Libur Nasional</option>
                    <option value="hari_besar">Hari Besar</option>
                    <option value="campaign">Campaign</option>
                    <option value="brand_moment">Brand Moment</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Warna</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['#ef4444','#f59e0b','#10b981','#1a73e8','#8b5cf6','#ec4899'].map(c => (
                      <button key={c} type="button" onClick={() => setDateModal(m => m ? { ...m, item: { ...m.item, warna: c } } : m)}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: dateModal.item.warna === c ? '3px solid #111827' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Ulangi Tiap Tahun</div>
                  <button type="button" onClick={() => setDateModal(m => m ? { ...m, item: { ...m.item, is_repeating: !m.item.is_repeating } } : m)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${dateModal.item.is_repeating ? '#10b981' : '#e5e7eb'}`, background: dateModal.item.is_repeating ? 'rgba(16,185,129,0.08)' : '#f3f4f6', color: dateModal.item.is_repeating ? '#10b981' : '#6b7280', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    {dateModal.item.is_repeating ? 'Ya (Repeat)' : 'Tidak'}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Deskripsi (opsional)</div>
                <input value={dateModal.item.deskripsi || ''} onChange={e => setDateModal(m => m ? { ...m, item: { ...m.item, deskripsi: e.target.value } } : m)}
                  style={fieldStyle()} placeholder="Catatan singkat..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              {dateModal.item.id && (
                <button onClick={() => { deleteImportantDate(dateModal.item.id!); setDateModal(null) }}
                  style={{ background: 'transparent', border: '1px solid #fca5a5', borderRadius: 8, padding: '9px 16px', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}>Hapus</button>
              )}
              <button onClick={() => setDateModal(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={saveImportantDate} disabled={dateSaving || !dateModal.item.nama || !dateModal.item.tanggal}
                style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: (!dateModal.item.nama || !dateModal.item.tanggal) ? 0.5 : 1 }}>
                {dateSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
