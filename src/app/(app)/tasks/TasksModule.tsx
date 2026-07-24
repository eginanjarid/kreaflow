'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Task = {
  id?: string
  workspace_id: string
  nama: string
  platform: string
  priority: string
  start_date: string
  due_date: string
  percent_complete: number
  notes: string
  stage?: string
}

type SprintStep = {
  id: string
  nama: string
  enabled: boolean
  is_optional: boolean
  days_offset: number
  due_date: string
  priority: string
  icon: string
}

const PRIORITIES = ['High', 'Medium', 'Low']
const PLATFORMS = ['', 'TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee', 'Umum']
const PRIORITY_COLOR: Record<string, string> = { High: '#f87171', Medium: '#fbbf24', Low: '#86efac' }
const PRIORITY_BG: Record<string, string> = { High: 'rgba(248,113,113,0.1)', Medium: 'rgba(251,191,36,0.1)', Low: 'rgba(134,239,172,0.1)' }

const STAGE_MAP: Record<string, string> = {
  riset: 'riset', naskah: 'naskah',
  take_video: 'produksi', broll_vo: 'produksi', editing: 'produksi',
  shooting: 'produksi', broll: 'produksi', caption: 'produksi',
  topik: 'produksi', persiapan: 'produksi', promo: 'produksi', live: 'produksi', clip: 'produksi',
  schedule: 'schedule',
}

const SPRINT_TEMPLATES: Record<string, { label: string; color: string; steps: SprintStep[] }> = {
  affiliate: {
    label: 'Konten Affiliate',
    color: '#34d399',
    steps: [
      { id: 'riset', nama: 'Riset Produk & Analisis USP', enabled: true, is_optional: true, days_offset: 0, due_date: '', priority: 'Medium', icon: '🔍' },
      { id: 'naskah', nama: 'Buat Naskah / Script', enabled: true, is_optional: false, days_offset: 0, due_date: '', priority: 'High', icon: '📝' },
      { id: 'take_video', nama: 'Take Video', enabled: true, is_optional: false, days_offset: 1, due_date: '', priority: 'High', icon: '🎬' },
      { id: 'broll_vo', nama: 'Take B-roll / Voice Over', enabled: false, is_optional: true, days_offset: 2, due_date: '', priority: 'Medium', icon: '🎥' },
      { id: 'editing', nama: 'Editing', enabled: true, is_optional: false, days_offset: 3, due_date: '', priority: 'High', icon: '✂️' },
      { id: 'schedule', nama: 'Schedule Post', enabled: true, is_optional: false, days_offset: 4, due_date: '', priority: 'Medium', icon: '📅' },
    ],
  },
  creator: {
    label: 'Konten Creator',
    color: '#A78BFA',
    steps: [
      { id: 'riset', nama: 'Riset Topik & Hook Angle', enabled: true, is_optional: false, days_offset: 0, due_date: '', priority: 'High', icon: '🔍' },
      { id: 'naskah', nama: 'Buat Naskah / Script', enabled: true, is_optional: false, days_offset: 1, due_date: '', priority: 'High', icon: '📝' },
      { id: 'shooting', nama: 'Shooting / Take Video', enabled: true, is_optional: false, days_offset: 2, due_date: '', priority: 'High', icon: '🎬' },
      { id: 'broll', nama: 'Take B-roll', enabled: false, is_optional: true, days_offset: 3, due_date: '', priority: 'Medium', icon: '🎥' },
      { id: 'editing', nama: 'Editing', enabled: true, is_optional: false, days_offset: 4, due_date: '', priority: 'High', icon: '✂️' },
      { id: 'caption', nama: 'Review & Buat Caption', enabled: true, is_optional: false, days_offset: 5, due_date: '', priority: 'Medium', icon: '✍️' },
      { id: 'schedule', nama: 'Schedule Post', enabled: true, is_optional: false, days_offset: 5, due_date: '', priority: 'Medium', icon: '📅' },
    ],
  },
  live: {
    label: 'Live Streaming',
    color: '#f87171',
    steps: [
      { id: 'topik', nama: 'Tentukan Topik & Rundown Live', enabled: true, is_optional: false, days_offset: 0, due_date: '', priority: 'High', icon: '📋' },
      { id: 'persiapan', nama: 'Persiapan Set & Produk', enabled: true, is_optional: false, days_offset: 1, due_date: '', priority: 'High', icon: '🎙️' },
      { id: 'promo', nama: 'Buat Konten Promo (Story/Feed)', enabled: false, is_optional: true, days_offset: 1, due_date: '', priority: 'Medium', icon: '📣' },
      { id: 'live', nama: 'Live Streaming', enabled: true, is_optional: false, days_offset: 2, due_date: '', priority: 'High', icon: '🔴' },
      { id: 'clip', nama: 'Clip Highlight untuk Repost', enabled: false, is_optional: true, days_offset: 3, due_date: '', priority: 'Low', icon: '🎞️' },
    ],
  },
}

function emptyTask(wsId: string): Task {
  return { workspace_id: wsId, nama: '', platform: '', priority: 'Medium', start_date: '', due_date: '', percent_complete: 0, notes: '' }
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

type ProductSnap = { id: string; nama: string; platform_affiliate?: string; kategori?: string }

export default function TasksModule({ initialTasks, workspaceId, products = [], contentPillars = '' }: {
  initialTasks: Task[]
  workspaceId: string
  products?: ProductSnap[]
  contentPillars?: string
}) {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [modal, setModal] = useState<{ open: boolean; task: Task }>({ open: false, task: emptyTask(workspaceId) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [view, setView] = useState<'kanban' | 'list' | 'sprint'>(
    searchParams.get('view') === 'sprint' ? 'sprint' : 'kanban'
  )

  useEffect(() => {
    if (searchParams.get('view') === 'sprint') setView('sprint')
  }, [searchParams])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [filterContext, setFilterContext] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Sprint modal state
  const [sprintModal, setSprintModal] = useState(false)
  const [sprintType, setSprintType] = useState<keyof typeof SPRINT_TEMPLATES | 'custom'>('affiliate')
  const [sprintCustomLabel, setSprintCustomLabel] = useState('')
  const [sprintProductId, setSprintProductId] = useState('')
  const [sprintPillar, setSprintPillar] = useState('')
  const [sprintPlatform, setSprintPlatform] = useState('')
  const [sprintStart, setSprintStart] = useState('')
  const [sprintNamaKonten, setSprintNamaKonten] = useState('')
  const [sprintTanggalTayang, setSprintTanggalTayang] = useState('')
  const [sprintSteps, setSprintSteps] = useState<SprintStep[]>(SPRINT_TEMPLATES.affiliate.steps.map(s => ({ ...s })))
  const [savingSprint, setSavingSprint] = useState(false)
  const [sprintError, setSprintError] = useState('')

  function openAdd() { setModal({ open: true, task: emptyTask(workspaceId) }); setError('') }
  function openEdit(t: Task) { setModal({ open: true, task: { ...t } }); setError('') }
  function closeModal() { setModal(m => ({ ...m, open: false })) }
  function setField(key: keyof Task, value: string | number) { setModal(m => ({ ...m, task: { ...m.task, [key]: value } })) }

  function stepsWithDates(type: keyof typeof SPRINT_TEMPLATES, start: string): SprintStep[] {
    return SPRINT_TEMPLATES[type].steps.map(s => ({ ...s, due_date: addDays(start, s.days_offset) }))
  }

  function openSprint() {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setSprintType('affiliate')
    setSprintCustomLabel('')
    setSprintProductId('')
    setSprintPillar('')
    setSprintPlatform('')
    setSprintStart(today)
    setSprintNamaKonten('')
    setSprintTanggalTayang('')
    setSprintSteps(stepsWithDates('affiliate', today))
    setSprintError('')
    setSprintModal(true)
  }

  function switchSprintType(t: keyof typeof SPRINT_TEMPLATES | 'custom') {
    setSprintType(t)
    if (t === 'custom') {
      // Start with one blank step
      const now = new Date()
      const today = sprintStart || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      setSprintSteps([{ id: `custom_${Date.now()}`, nama: '', enabled: true, is_optional: false, days_offset: 0, due_date: today, priority: 'High', icon: '⚙️' }])
    } else {
      setSprintSteps(stepsWithDates(t, sprintStart || new Date().toISOString().split('T')[0]))
    }
  }

  function handleSprintStartChange(date: string) {
    setSprintStart(date)
    setSprintSteps(prev => prev.map(s => ({ ...s, due_date: addDays(date, s.days_offset) })))
  }

  function updateStepDueDate(id: string, due_date: string) {
    setSprintSteps(prev => prev.map(s => s.id === id ? { ...s, due_date } : s))
  }

  function toggleStep(id: string) {
    setSprintSteps(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }
  function updateStepNama(id: string, nama: string) {
    setSprintSteps(prev => prev.map(s => s.id === id ? { ...s, nama } : s))
  }
  function updateStepOffset(id: string, offset: number) {
    setSprintSteps(prev => prev.map(s => s.id === id ? { ...s, days_offset: offset } : s))
  }
  function addCustomStep() {
    const maxOffset = Math.max(...sprintSteps.map(s => s.days_offset), 0) + 1
    const newStep: SprintStep = {
      id: `custom_${Date.now()}`,
      nama: '',
      enabled: true,
      is_optional: false,
      days_offset: maxOffset,
      due_date: sprintStart ? addDays(sprintStart, maxOffset) : '',
      priority: 'Medium',
      icon: '⚙️',
    }
    setSprintSteps(prev => [...prev, newStep])
  }
  function removeCustomStep(id: string) {
    setSprintSteps(prev => prev.filter(s => s.id !== id))
  }

  async function createSprint() {
    if (sprintType === 'affiliate' && !sprintProductId) { setSprintError('Pilih produk terlebih dahulu'); return }
    if (sprintType === 'creator' && !sprintPillar.trim()) { setSprintError('Pilih atau isi pilar konten'); return }
    if (sprintType === 'custom' && !sprintCustomLabel.trim()) { setSprintError('Isi nama konten / topik terlebih dahulu'); return }
    if (!sprintStart) { setSprintError('Tanggal mulai wajib diisi'); return }
    const enabledSteps = sprintSteps.filter(s => s.enabled && s.nama.trim())
    if (enabledSteps.length === 0) { setSprintError('Minimal 1 step harus aktif'); return }

    const selectedProduct = products.find(p => p.id === sprintProductId)
    const sprintLabel = sprintType === 'affiliate'
      ? (selectedProduct?.nama || 'Produk')
      : sprintType === 'custom'
      ? sprintCustomLabel.trim()
      : sprintPillar

    setSavingSprint(true)
    setSprintError('')
    const supabase = createClient()

    const contentLabel = sprintNamaKonten.trim() || sprintLabel

    const newTasks: Task[] = enabledSteps.map(step => ({
      workspace_id: workspaceId,
      nama: `${step.icon} ${step.nama}${contentLabel ? ' — ' + contentLabel : ''}`,
      platform: sprintPlatform,
      priority: step.priority,
      start_date: sprintStart,
      due_date: step.due_date || sprintStart,
      percent_complete: 0,
      notes: step.is_optional ? '(Opsional)' : '',
      stage: STAGE_MAP[step.id] || 'produksi',
    }))

    const { data, error: err } = await supabase
      .from('kf_tasks').insert(newTasks).select('id')
    if (err) { setSprintError(err.message); setSavingSprint(false); return }

    const created = newTasks.map((t, i) => ({ ...t, id: data[i].id }))

    // Auto-create calendar entries for "schedule" steps
    const scheduleSteps = enabledSteps
      .map((step, i) => ({ step, taskId: data[i].id }))
      .filter(({ step }) => step.id === 'schedule' || step.id.startsWith('schedule') || step.icon === '📅')
    if (scheduleSteps.length > 0) {
      const tanggalTayang = sprintTanggalTayang || null
      const calEntries = scheduleSteps.map(({ step, taskId }) => ({
        workspace_id: workspaceId,
        task_id: taskId,
        label: contentLabel,
        platform: sprintPlatform || null,
        scheduled_at: `${tanggalTayang || step.due_date || sprintStart}T09:00:00`,
        posted_at: null,
        posted_url: null,
        status: 'Planned',
        content_id: null,
      }))
      await supabase.from('kf_calendar_entries').insert(calEntries)
    }

    // Notification chain: insert first notif based on first enabled step
    const firstStep = enabledSteps[0]
    const firstTaskId = data[0].id
    const firstStage = STAGE_MAP[firstStep.id] || 'produksi'
    const notifTypeMap: Record<string, { type: string; title: string; message: string }> = {
      riset: { type: 'riset', title: `Mulai Riset — ${contentLabel}`, message: 'Sprint baru dibuat. Mulai riset untuk konten ini.' },
      naskah: { type: 'naskah', title: `Mulai Naskah — ${contentLabel}`, message: 'Sprint baru dibuat. Langsung ke Plan untuk buat naskah.' },
      produksi: { type: 'produksi', title: `Mulai Produksi — ${contentLabel}`, message: 'Sprint baru dibuat. Buka Studio untuk mulai produksi.' },
      schedule: { type: 'schedule', title: `Siap Schedule — ${contentLabel}`, message: 'Sprint baru dibuat. Jadwalkan konten ini.' },
    }
    const firstNotif = notifTypeMap[firstStage]
    if (firstNotif) {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        ...firstNotif,
        task_id: firstTaskId,
      })
    }

    setTasks(prev => [...created, ...prev])
    setSavingSprint(false)
    setSprintModal(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const t = { ...modal.task, workspace_id: workspaceId }
    if (t.id) {
      const { error: err } = await supabase.from('kf_tasks').update(t).eq('id', t.id)
      if (err) { setError(err.message); setSaving(false); return }
      setTasks(prev => prev.map(x => x.id === t.id ? t : x))
    } else {
      const { data, error: err } = await supabase.from('kf_tasks').insert(t).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setTasks(prev => [{ ...t, id: data.id }, ...prev])
    }
    setSaving(false)
    closeModal()
  }

  async function deleteTask(id: string) {
    if (!confirm('Hapus task ini?')) return
    const supabase = createClient()
    await supabase.from('kf_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(x => x.id !== id))
  }

  async function updateProgress(id: string, pct: number) {
    const supabase = createClient()
    await supabase.from('kf_tasks').update({ percent_complete: pct }).eq('id', id)
    const calStatus = pct === 100 ? 'Posted' : pct > 0 ? 'Ready' : 'Planned'
    await supabase.from('kf_calendar_entries').update({ status: calStatus }).eq('task_id', id)

    // Notification chain
    if (pct === 100) {
      const task = tasks.find(t => t.id === id)
      if (task?.stage === 'riset') {
        const label = getTaskContext(task.nama)
        await supabase.from('kf_notifications').insert({
          workspace_id: workspaceId,
          type: 'naskah',
          title: `Mulai Naskah — ${label || task.nama}`,
          message: 'Riset selesai. Buka Plan untuk mulai buat naskah konten.',
          task_id: id,
        })
      }
    }

    setTasks(prev => prev.map(x => x.id === id ? { ...x, percent_complete: pct } : x))
  }

  function getTaskContext(nama: string): string {
    const match = nama.match(/—\s*(.+)$/)
    return match ? match[1].trim() : ''
  }

  function getTaskCol(pct: number): string {
    if (pct === 100) return 'done'
    if (pct > 0) return 'in_progress'
    return 'todo'
  }

  async function dropToCol(col: string) {
    if (!draggingId) return
    const pctMap: Record<string, number> = { todo: 0, in_progress: 50, done: 100 }
    await updateProgress(draggingId, pctMap[col])
    setDraggingId(null)
    setDragOverCol(null)
  }


  const allContexts = [...new Set(tasks.map(t => getTaskContext(t.nama)).filter(Boolean))].sort()
  const filtered = tasks.filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterContext && getTaskContext(t.nama) !== filterContext) return false
    if (filterDate) {
      const due = t.due_date || t.start_date
      if (!due || !due.startsWith(filterDate)) return false
    }
    return true
  })
  const done = filtered.filter(t => t.percent_complete === 100)
  const ongoing = filtered.filter(t => t.percent_complete < 100)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Tasks</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Kelola tugas dan sprint produksi konten kamu</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setView('kanban')} title="Kanban Board"
              style={{ padding: '8px 12px', border: 'none', background: view === 'kanban' ? '#7C3AED' : 'transparent', color: view === 'kanban' ? '#fff' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: view === 'kanban' ? 600 : 400, transition: 'all 0.15s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18"/><rect x="10" y="3" width="5" height="18"/><rect x="17" y="3" width="5" height="18"/></svg>
              Board
            </button>
            <button onClick={() => setView('list')} title="List View"
              style={{ padding: '8px 12px', border: 'none', background: view === 'list' ? '#7C3AED' : 'transparent', color: view === 'list' ? '#fff' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: view === 'list' ? 600 : 400, transition: 'all 0.15s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              List
            </button>
            <button onClick={() => setView('sprint')} title="Sprint Monitor"
              style={{ padding: '8px 12px', border: 'none', background: view === 'sprint' ? '#7C3AED' : 'transparent', color: view === 'sprint' ? '#fff' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: view === 'sprint' ? 600 : 400, transition: 'all 0.15s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Monitor
            </button>
          </div>
          <button onClick={openSprint} style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 10, padding: '10px 18px', color: '#34d399', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚡ Buat Sprint
          </button>
          <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            + Task Manual
          </button>
        </div>
      </div>

      {/* Sprint template info card (only show when no tasks) */}
      {tasks.length === 0 && (
        <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 12, padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: 2 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 4 }}>Sprint — Auto-generate checklist task sekaligus</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7 }}>
              Klik <strong style={{ color: '#94a3b8' }}>Buat Sprint</strong> untuk template konten (Naskah → Editing → Schedule Post) atau buat checklist custom sendiri — Belajar Ecourse, Persiapan Event, dll.
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: tasks.length, color: '#94a3b8' },
          { label: 'Ongoing', value: tasks.filter(t => t.percent_complete < 100 && t.percent_complete > 0).length, color: '#fbbf24' },
          { label: 'Selesai', value: tasks.filter(t => t.percent_complete === 100).length, color: '#86efac' },
          { label: 'Belum Mulai', value: tasks.filter(t => t.percent_complete === 0).length, color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {tasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Priority filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Priority:</span>
            {['', ...PRIORITIES].map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, border: filterPriority === p ? '1px solid #7C3AED' : '1px solid #2a2a2a', background: filterPriority === p ? 'rgba(124,58,237,0.15)' : '#1a1a1a', color: filterPriority === p ? '#A78BFA' : '#64748b', cursor: 'pointer' }}>
                {p || 'Semua'}
              </button>
            ))}
          </div>

          {/* Context filter pills + date */}
          {allContexts.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Sprint:</span>
              <button onClick={() => setFilterContext('')}
                style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, border: filterContext === '' ? '1px solid #34d399' : '1px solid #2a2a2a', background: filterContext === '' ? 'rgba(52,211,153,0.12)' : '#1a1a1a', color: filterContext === '' ? '#34d399' : '#64748b', cursor: 'pointer' }}>
                Semua
              </button>
              {allContexts.map(ctx => (
                <button key={ctx} onClick={() => setFilterContext(ctx === filterContext ? '' : ctx)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, border: filterContext === ctx ? '1px solid #34d399' : '1px solid #2a2a2a', background: filterContext === ctx ? 'rgba(52,211,153,0.12)' : '#1a1a1a', color: filterContext === ctx ? '#34d399' : '#64748b', cursor: 'pointer', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ctx}
                </button>
              ))}
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ marginLeft: 'auto', background: '#1a1a1a', border: `1px solid ${filterDate ? '#34d399' : '#2a2a2a'}`, borderRadius: 20, padding: '3px 12px', color: filterDate ? '#34d399' : '#475569', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }} />
              {(filterContext || filterDate) && (
                <button onClick={() => { setFilterContext(''); setFilterDate('') }}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', border: '1px solid #2a2a2a', background: 'transparent', color: '#475569', cursor: 'pointer' }}>
                  Reset ✕
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN BOARD VIEW ── */}
      {view === 'kanban' && tasks.length > 0 && (() => {
        const COLS = [
          { id: 'todo', label: 'Todo', icon: '📋', color: '#94a3b8' },
          { id: 'in_progress', label: 'Dikerjakan', icon: '🔄', color: '#fbbf24' },
          { id: 'done', label: 'Selesai', icon: '✅', color: '#86efac' },
        ]
        const colTasks = (colId: string) => filtered.filter(t => getTaskCol(t.percent_complete) === colId)

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
            {COLS.map(col => {
              const colItems = colTasks(col.id)
              const isOver = dragOverCol === col.id
              return (
                <div key={col.id}
                  onDragOver={e => { e.preventDefault(); setDragOverCol(col.id) }}
                  onDragLeave={e => {
                    // Only clear when truly leaving the column — not when hovering over child elements
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverCol(null)
                    }
                  }}
                  onDrop={async e => { e.preventDefault(); await dropToCol(col.id) }}
                  style={{
                    background: isOver ? `${col.color}14` : '#0d0d0d',
                    border: `${isOver ? 2 : 1}px solid ${isOver ? col.color + 'cc' : '#1f1f1f'}`,
                    borderRadius: 14,
                    minHeight: 200,
                    transition: 'background 0.12s, border-color 0.12s',
                    overflow: 'hidden',
                    boxShadow: isOver ? `0 0 18px ${col.color}22` : 'none',
                  }}>
                  {/* Column header */}
                  <div style={{ padding: '13px 16px', borderBottom: `1px solid ${isOver ? col.color + '30' : '#1f1f1f'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem' }}>{col.icon}</span>
                      <span style={{ fontWeight: 700, color: col.color, fontSize: '0.875rem' }}>{col.label}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isOver ? col.color : '#475569', background: isOver ? `${col.color}18` : '#1a1a1a', border: `1px solid ${isOver ? col.color + '50' : '#2a2a2a'}`, borderRadius: 10, padding: '2px 8px', transition: 'all 0.12s' }}>{colItems.length}</span>
                  </div>
                  {/* Cards */}
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 140 }}>
                    {colItems.length === 0 ? (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', padding: '32px 12px', border: `2px dashed ${isOver ? col.color + '80' : '#1f1f1f'}`, borderRadius: 10, marginTop: 4, color: isOver ? col.color : '#2a2a2a', background: isOver ? `${col.color}08` : 'transparent', transition: 'all 0.12s' }}>
                        {isOver ? '⬇ Lepas di sini' : 'Kosong'}
                      </div>
                    ) : (
                      <>
                        {colItems.map(t => (
                          <KanbanCard key={t.id} task={t} isDragging={draggingId === t.id} colColor={col.color}
                            onDragStart={() => setDraggingId(t.id!)}
                            onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                            onEdit={openEdit} onDelete={deleteTask} />
                        ))}
                        {/* Drop indicator at bottom */}
                        {isOver && (
                          <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${col.color}, transparent)`, margin: '2px 8px', opacity: 0.8 }} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {filtered.length === 0 && tasks.length > 0 ? (
            <div style={{ color: '#475569', textAlign: 'center', padding: 32 }}>Tidak ada task dengan filter ini.</div>
          ) : filtered.length === 0 ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {ongoing.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Ongoing ({ongoing.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ongoing.map(t => <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={deleteTask} onProgress={updateProgress} />)}
                  </div>
                </div>
              )}
              {done.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Selesai ({done.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.6 }}>
                    {done.map(t => <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={deleteTask} onProgress={updateProgress} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── SPRINT MONITOR VIEW ── */}
      {view === 'sprint' && (() => {
        const groups: Record<string, Task[]> = {}
        tasks.forEach(t => {
          const ctx = getTaskContext(t.nama)
          if (ctx) {
            if (!groups[ctx]) groups[ctx] = []
            groups[ctx].push(t)
          }
        })
        const entries = Object.entries(groups)
          .filter(([ctx]) => !filterContext || ctx === filterContext)
          .filter(([, ctxTasks]) => {
            if (!filterDate) return true
            return ctxTasks.some(t => (t.due_date || t.start_date || '').startsWith(filterDate))
          })
        const soloTasks = tasks.filter(t => !getTaskContext(t.nama))

        if (entries.length === 0 && soloTasks.length === 0) {
          return (
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 48, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>📊</div>
              <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Belum ada sprint</div>
              <div style={{ fontSize: '0.82rem' }}>Buat sprint lewat tombol ⚡ Buat Sprint untuk mulai monitoring</div>
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entries.map(([ctx, ctxTasks]) => {
              const total = ctxTasks.length
              const doneCount = ctxTasks.filter(t => t.percent_complete === 100).length
              const inProgressCount = ctxTasks.filter(t => t.percent_complete > 0 && t.percent_complete < 100).length
              const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
              const platform = ctxTasks.find(t => t.platform)?.platform || ''
              const allDates = ctxTasks.map(t => t.due_date).filter(Boolean).sort()
              const startDate = ctxTasks.map(t => t.start_date).filter(Boolean).sort()[0]
              const endDate = allDates.at(-1)
              const hasOverdue = ctxTasks.some(t => t.due_date && new Date(t.due_date) < new Date() && t.percent_complete < 100)
              const barColor = pct === 100 ? 'linear-gradient(90deg,#34d399,#86efac)' : hasOverdue ? 'linear-gradient(90deg,#f87171,#fca5a5)' : 'linear-gradient(90deg,#7C3AED,#A78BFA)'

              return (
                <div key={ctx} style={{ background: '#111', border: `1px solid ${hasOverdue && pct < 100 ? 'rgba(248,113,113,0.25)' : '#2a2a2a'}`, borderRadius: 14, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctx}</span>
                      {platform && <span style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#64748b', flexShrink: 0 }}>{platform}</span>}
                      {hasOverdue && pct < 100 && <span style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', flexShrink: 0 }}>⚠ Overdue</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: '#475569', textAlign: 'right' }}>
                        <span style={{ color: '#86efac', fontWeight: 600 }}>{doneCount}</span>
                        {inProgressCount > 0 && <span style={{ color: '#fbbf24', fontWeight: 600 }}> +{inProgressCount}</span>}
                        <span style={{ color: '#475569' }}> / {total}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: pct === 100 ? '#86efac' : '#A78BFA', minWidth: 36, textAlign: 'right' }}>{pct}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 3, background: '#1a1a1a' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, transition: 'width 0.3s' }} />
                  </div>

                  {/* Step chips */}
                  <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {ctxTasks.map(t => {
                      const stepName = t.nama.split(' —')[0].trim()
                      const col = getTaskCol(t.percent_complete)
                      const overdue = t.due_date && new Date(t.due_date) < new Date() && t.percent_complete < 100
                      const chipColor = overdue ? '#f87171' : col === 'done' ? '#86efac' : col === 'in_progress' ? '#fbbf24' : '#475569'
                      const chipBg = overdue ? 'rgba(248,113,113,0.08)' : col === 'done' ? 'rgba(134,239,172,0.08)' : col === 'in_progress' ? 'rgba(251,191,36,0.08)' : '#1a1a1a'
                      const chipBorder = overdue ? 'rgba(248,113,113,0.3)' : col === 'done' ? 'rgba(134,239,172,0.25)' : col === 'in_progress' ? 'rgba(251,191,36,0.25)' : '#2a2a2a'
                      const icon = col === 'done' ? '✓' : col === 'in_progress' ? '◷' : '○'
                      return (
                        <div key={t.id}
                          title={`${t.due_date ? 'Due: ' + new Date(t.due_date).toLocaleDateString('id-ID') + ' · ' : ''}${t.priority} — klik untuk toggle selesai`}
                          onClick={() => updateProgress(t.id!, t.percent_complete === 100 ? 0 : 100)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, background: chipBg, border: `1px solid ${chipBorder}`, color: chipColor, fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s, transform 0.1s' }}>
                          <span style={{ fontSize: '0.7rem' }}>{icon}</span>
                          {stepName}
                          {t.due_date && (
                            <span style={{ fontSize: '0.65rem', opacity: 0.65, marginLeft: 2 }}>
                              {new Date(t.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Date range footer */}
                  {(startDate || endDate) && (
                    <div style={{ padding: '0 20px 12px', display: 'flex', gap: 20, fontSize: '0.7rem', color: '#475569' }}>
                      {startDate && <span>Mulai: <span style={{ color: '#64748b' }}>{new Date(startDate).toLocaleDateString('id-ID')}</span></span>}
                      {endDate && <span>Target selesai: <span style={{ color: endDate < new Date().toISOString().split('T')[0] && pct < 100 ? '#f87171' : '#64748b' }}>{new Date(endDate).toLocaleDateString('id-ID')}</span></span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {tasks.length === 0 && filtered.length === 0 && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 48, textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Belum ada task</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>Gunakan Sprint untuk bikin task produksi konten sekaligus</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={openSprint} style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8, padding: '10px 18px', color: '#34d399', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              ⚡ Buat Sprint
            </button>
            <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              + Task Manual
            </button>
          </div>
        </div>
      )}

      {/* Sprint Modal */}
      {sprintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '20px 20px', overflowY: 'auto' }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 20, width: '100%', maxWidth: 580, marginTop: 20, marginBottom: 20 }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.1rem' }}>⚡ Buat Sprint</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Auto-generate checklist task dari template — bisa dikustomisasi</div>
              </div>
              <button onClick={() => setSprintModal(false)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#64748b', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
            </div>

            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {sprintError && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{sprintError}</div>}

              {/* Sprint type selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori Sprint</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.entries(SPRINT_TEMPLATES) as [keyof typeof SPRINT_TEMPLATES, typeof SPRINT_TEMPLATES[keyof typeof SPRINT_TEMPLATES]][]).map(([key, tpl]) => (
                    <button key={key} type="button" onClick={() => switchSprintType(key)}
                      style={{ flex: 1, minWidth: 100, padding: '10px', borderRadius: 10, border: `1px solid ${sprintType === key ? tpl.color + '60' : '#2a2a2a'}`, background: sprintType === key ? tpl.color + '12' : '#1a1a1a', color: sprintType === key ? tpl.color : '#64748b', fontSize: '0.82rem', fontWeight: sprintType === key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {tpl.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => switchSprintType('custom')}
                    style={{ flex: 1, minWidth: 100, padding: '10px', borderRadius: 10, border: `1px solid ${sprintType === 'custom' ? '#e879f960' : '#2a2a2a'}`, background: sprintType === 'custom' ? '#e879f912' : '#1a1a1a', color: sprintType === 'custom' ? '#e879f9' : '#64748b', fontSize: '0.82rem', fontWeight: sprintType === 'custom' ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                    ✏️ Custom
                  </button>
                </div>
                {/* Custom label input */}
                {sprintType === 'custom' && (
                  <input style={{ ...fieldStyle({ marginTop: 10, fontSize: '0.875rem' }) }}
                    value={sprintCustomLabel}
                    onChange={e => setSprintCustomLabel(e.target.value)}
                    placeholder="Nama kategori, cth: Belajar Ecourse, Persiapan Event, Launch Produk..." />
                )}
              </div>

              {/* Context — produk (affiliate) / pilar (creator) / judul (live) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sprintType === 'affiliate' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produk yang Dikontennin *</label>
                    {products.length > 0 ? (
                      <select style={{ ...fieldStyle(), cursor: 'pointer', fontSize: '0.85rem' }} value={sprintProductId} onChange={e => setSprintProductId(e.target.value)}>
                        <option value="">— Pilih produk dari katalog —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.nama}{p.platform_affiliate ? ` (${p.platform_affiliate})` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#f59e0b' }}>
                        Belum ada produk. <a href="/catalog" style={{ color: '#f59e0b', fontWeight: 700 }}>Tambah di Katalog →</a>
                      </div>
                    )}
                  </div>
                )}

                {sprintType === 'creator' && (() => {
                  const pillarLines = contentPillars
                    ? contentPillars.split('\n').map(l => l.replace(/^\d+\.\s*/, '').split('—')[0].trim()).filter(Boolean)
                    : []
                  const isCustomPillar = sprintPillar !== '' && !pillarLines.includes(sprintPillar)
                  return (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pilar / Tema Konten *</label>
                      {pillarLines.length > 0 ? (
                        <>
                          <select style={{ ...fieldStyle(), cursor: 'pointer', fontSize: '0.85rem' }} value={isCustomPillar ? '' : sprintPillar} onChange={e => setSprintPillar(e.target.value)}>
                            <option value="">— Pilih pilar dari brand —</option>
                            {pillarLines.map((line, i) => <option key={i} value={line}>{line}</option>)}
                          </select>
                          <input style={fieldStyle({ fontSize: '0.82rem', marginTop: 6, color: isCustomPillar ? '#e2e8f0' : '#475569' })}
                            value={isCustomPillar ? sprintPillar : ''}
                            onChange={e => setSprintPillar(e.target.value)}
                            placeholder="atau ketik tema bebas..." />
                        </>
                      ) : (
                        <>
                          <input style={fieldStyle({ fontSize: '0.85rem' })} value={sprintPillar} onChange={e => setSprintPillar(e.target.value)} placeholder="cth: Tutorial, Review, Behind The Scene, Tips & Trick..." />
                          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4 }}>Lengkapi Content Pillars di <a href="/brand" style={{ color: '#A78BFA' }}>Brand</a> untuk pilihan otomatis.</div>
                        </>
                      )}
                    </div>
                  )
                })()}

                {sprintType === 'live' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topik Live *</label>
                    <input style={fieldStyle({ fontSize: '0.85rem' })} value={sprintPillar} onChange={e => setSprintPillar(e.target.value)} placeholder="cth: Flash Sale Skincare, Live Q&A, Demo Produk Dapur..." />
                  </div>
                )}

                {sprintType === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama / Label Sprint *</label>
                    <input style={fieldStyle({ fontSize: '0.85rem' })} value={sprintCustomLabel} onChange={e => setSprintCustomLabel(e.target.value)} placeholder="cth: Belajar Copywriting Week 1, Persiapan Webinar Juli, Launch Produk Baru..." />
                  </div>
                )}

                {/* Nama Konten */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Konten / Judul</label>
                  <input style={fieldStyle({ fontSize: '0.875rem' })} value={sprintNamaKonten} onChange={e => setSprintNamaKonten(e.target.value)} placeholder="cth: Review Serum Vit C Erha, Tutorial Skincare Pagi, 3 Tips Diet Sehat..." />
                  <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: 4 }}>Nama ini dipakai di semua notifikasi dan task label</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</label>
                    <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={sprintPlatform} onChange={e => setSprintPlatform(e.target.value)}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p || 'Semua'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal Mulai *</label>
                    <input type="date" style={fieldStyle()} value={sprintStart} onChange={e => handleSprintStartChange(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal Tayang (Rencana)</label>
                    <input type="date" style={fieldStyle()} value={sprintTanggalTayang} onChange={e => setSprintTanggalTayang(e.target.value)} min={sprintStart} />
                    <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: 4 }}>Muncul di Calendar. Jika kosong, pakai tanggal deadline step Schedule.</div>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Langkah-langkah Sprint</label>
                  <button type="button" onClick={addCustomStep}
                    style={{ background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 7, padding: '4px 12px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                    + Tambah Step
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sprintSteps.map((step, i) => {
                    const isCustom = step.id.startsWith('custom_')
                    return (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: step.enabled ? '#1a1a1a' : '#0d0d0d', border: `1px solid ${step.enabled ? '#2a2a2a' : '#1a1a1a'}`, opacity: step.enabled ? 1 : 0.5, transition: 'all 0.15s' }}>
                        {/* Toggle */}
                        <div onClick={() => toggleStep(step.id)}
                          style={{ width: 36, height: 20, borderRadius: 10, background: step.enabled ? (SPRINT_TEMPLATES[sprintType as keyof typeof SPRINT_TEMPLATES]?.color ?? '#e879f9') : '#2a2a2a', position: 'relative', cursor: 'pointer', flexShrink: 0, marginTop: 2, transition: 'background 0.2s' }}>
                          <div style={{ position: 'absolute', top: 3, left: step.enabled ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                        </div>

                        <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{step.icon}</span>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input
                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a', color: step.enabled ? '#e2e8f0' : '#475569', fontSize: '0.875rem', fontWeight: 600, outline: 'none', padding: '0 0 4px 0', width: '100%' }}
                            value={step.nama}
                            onChange={e => updateStepNama(step.id, e.target.value)}
                            placeholder="Nama step..."
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap' }}>Selesai:</span>
                              <input type="date" min={sprintStart}
                                style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 6, padding: '3px 8px', color: step.due_date ? '#94a3b8' : '#334155', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                                value={step.due_date}
                                onChange={e => updateStepDueDate(step.id, e.target.value)}
                              />
                            </div>
                            <select style={{ marginLeft: 'auto', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 5, padding: '3px 8px', color: PRIORITY_COLOR[step.priority] || '#94a3b8', fontSize: '0.72rem', outline: 'none', cursor: 'pointer' }}
                              value={step.priority}
                              onChange={e => setSprintSteps(prev => prev.map(s => s.id === step.id ? { ...s, priority: e.target.value } : s))}>
                              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            {step.is_optional && <span style={{ fontSize: '0.65rem', color: '#475569', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 3, padding: '1px 5px' }}>opsional</span>}
                            {isCustom && (
                              <button type="button" onClick={() => removeCustomStep(step.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 8 }}>
                  Toggle on/off tiap step. Tanggal selesai dihitung otomatis dari tanggal mulai — bisa diubah manual per step. Edit nama sesuai workflow kamu.
                </div>
              </div>

              {/* Preview summary */}
              {sprintStart && (sprintProductId || sprintPillar.trim() || sprintCustomLabel.trim() || sprintNamaKonten.trim()) && (
                <div style={{ background: '#0d1117', border: '1px solid #1f1f1f', borderRadius: 10, padding: '12px 16px', fontSize: '0.78rem', color: '#475569', lineHeight: 1.9 }}>
                  <div style={{ color: '#334155', fontWeight: 600, marginBottom: 4 }}>SPRINT PREVIEW</div>
                  {sprintNamaKonten.trim() && (
                    <div>Nama Konten: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{sprintNamaKonten.trim()}</span></div>
                  )}
                  {sprintType === 'affiliate' && sprintProductId && (
                    <div>Produk: <span style={{ color: '#64748b' }}>{products.find(p => p.id === sprintProductId)?.nama}</span></div>
                  )}
                  {(sprintType === 'creator' || sprintType === 'live') && sprintPillar && (
                    <div>{sprintType === 'live' ? 'Topik' : 'Pilar'}: <span style={{ color: '#64748b' }}>{sprintPillar}</span></div>
                  )}
                  {sprintType === 'custom' && sprintCustomLabel && (
                    <div>Konten: <span style={{ color: '#64748b' }}>{sprintCustomLabel}</span></div>
                  )}
                  <div>Mulai: <span style={{ color: '#64748b' }}>{sprintStart}</span> · {sprintSteps.filter(s => s.enabled).length} tasks akan dibuat</div>
                  {sprintTanggalTayang && (
                    <div>Tayang: <span style={{ color: '#34d399', fontWeight: 600 }}>{sprintTanggalTayang}</span></div>
                  )}
                  {sprintSteps.filter(s => s.enabled && s.due_date).length > 0 && (
                    <div>
                      Target selesai: <span style={{ color: '#64748b' }}>
                        {sprintSteps.filter(s => s.enabled && s.due_date).map(s => s.due_date).sort().at(-1)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 10, padding: '11px 20px', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="button" onClick={createSprint} disabled={savingSprint}
                  style={{ background: savingSprint ? '#1a3a2f' : 'linear-gradient(135deg, #059669, #34d399)', border: 'none', borderRadius: 10, padding: '11px 28px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingSprint ? 'not-allowed' : 'pointer' }}>
                  {savingSprint ? 'Membuat...' : `⚡ Buat ${sprintSteps.filter(s => s.enabled).length} Tasks`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 500 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>{modal.task.id ? 'Edit Task' : 'Tambah Task'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Nama Task *</label>
                <input style={fieldStyle()} value={modal.task.nama} onChange={e => setField('nama', e.target.value)} placeholder="Apa yang perlu dikerjakan?" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Priority</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.task.priority ?? 'Medium'} onChange={e => setField('priority', e.target.value)}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.task.platform ?? ''} onChange={e => setField('platform', e.target.value)}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p || 'Semua'}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Mulai</label>
                  <input type="date" style={fieldStyle()} value={modal.task.start_date} onChange={e => setField('start_date', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Deadline</label>
                  <input type="date" style={fieldStyle()} value={modal.task.due_date} onChange={e => setField('due_date', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Progress ({modal.task.percent_complete}%)</label>
                <input type="range" min="0" max="100" step="5" value={modal.task.percent_complete} onChange={e => setField('percent_complete', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#7C3AED' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Catatan</label>
                <textarea style={fieldStyle({ height: 72, resize: 'none' })} value={modal.task.notes} onChange={e => setField('notes', e.target.value)} placeholder="Catatan tambahan..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 10, padding: '10px 20px', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Menyimpan...' : modal.task.id ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function KanbanCard({ task, isDragging, colColor, onDragStart, onDragEnd, onEdit, onDelete }: {
  task: Task
  isDragging: boolean
  colColor: string
  onDragStart: () => void
  onDragEnd: () => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const overdue = task.due_date && new Date(task.due_date) < new Date() && task.percent_complete < 100
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      style={{
        background: isDragging ? '#0d0d0d' : '#111',
        border: isDragging
          ? `2px dashed ${colColor}60`
          : `1px solid ${overdue ? 'rgba(248,113,113,0.25)' : '#2a2a2a'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        transform: isDragging ? 'scale(0.97)' : 'scale(1)',
        transition: 'opacity 0.12s, transform 0.12s, border-color 0.12s',
        boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0,0,0,0.3)',
        userSelect: 'none',
      }}>
      {/* Drag handle indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 3, flexShrink: 0, opacity: isDragging ? 0.6 : 0.3, transition: 'opacity 0.12s' }}>
          <div style={{ display: 'flex', gap: 2 }}><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} /><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} /></div>
          <div style={{ display: 'flex', gap: 2 }}><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} /><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} /></div>
          <div style={{ display: 'flex', gap: 2 }}><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} /><div style={{ width: 3, height: 3, borderRadius: '50%', background: '#94a3b8' }} /></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: isDragging ? '#475569' : '#e2e8f0', fontSize: '0.82rem', lineHeight: 1.4, wordBreak: 'break-word', transition: 'color 0.12s' }}>{task.nama}</div>
        </div>
      </div>
      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: task.due_date ? 6 : 0 }}>
        {task.priority && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority], fontWeight: 600 }}>{task.priority}</span>}
        {task.platform && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, color: '#64748b', background: '#1a1a1a' }}>{task.platform}</span>}
        {overdue && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>Overdue</span>}
      </div>
      {task.due_date && (
        <div style={{ fontSize: '0.7rem', color: overdue ? '#f87171' : '#475569' }}>
          Due: {new Date(task.due_date).toLocaleDateString('id-ID')}
        </div>
      )}
      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={e => { e.stopPropagation(); onEdit(task) }} style={{ flex: 1, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '4px 0', color: '#A78BFA', fontSize: '0.72rem', cursor: 'pointer' }}>Edit</button>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id!) }} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 8px', color: '#475569', fontSize: '0.72rem', cursor: 'pointer' }}>🗑</button>
      </div>
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onProgress }: {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onProgress: (id: string, pct: number) => void
}) {
  const pct = task.percent_complete
  const overdue = task.due_date && new Date(task.due_date) < new Date() && pct < 100
  return (
    <div style={{ background: '#111', border: `1px solid ${overdue ? 'rgba(248,113,113,0.3)' : '#2a2a2a'}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button onClick={() => onProgress(task.id!, pct === 100 ? 0 : 100)}
          style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${pct === 100 ? '#7C3AED' : '#2a2a2a'}`, background: pct === 100 ? '#7C3AED' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pct === 100 && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: pct === 100 ? '#475569' : '#e2e8f0', fontSize: '0.875rem', textDecoration: pct === 100 ? 'line-through' : 'none' }}>{task.nama}</span>
            {task.priority && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority], fontWeight: 600 }}>{task.priority}</span>}
            {task.platform && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#64748b', background: '#1a1a1a' }}>{task.platform}</span>}
            {overdue && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>Overdue</span>}
          </div>
          {task.due_date && <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 8 }}>Due: {new Date(task.due_date).toLocaleDateString('id-ID')}</div>}
          {pct > 0 && pct < 100 && (
            <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(task)} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid #7C3AED', borderRadius: 7, padding: '5px 10px', color: '#A78BFA', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
          <button onClick={() => onDelete(task.id!)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 7, padding: '5px 8px', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>🗑</button>
        </div>
      </div>
    </div>
  )
}
