'use client'

import { ISearch, IPen, IVideo, IFilm, IScissors, ICalendar, STEP_ICON_MAP } from '@/components/ui/Icons'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type StepConfig = { id: string; deadline: string; memberName: string }

type Sprint = {
  id: string
  workspace_id: string
  nama: string
  start_date: string
  end_date: string
  target_konten: number
  platform: string
  akun: string | null
  status: string
  template_type: string
  step_config: StepConfig[] | null
  created_at: string
}

type ContentItem = {
  id: string
  workspace_id: string
  sprint_id: string | null
  judul: string
  format: string | null
  platform: string[] | string | null
  status: string
  product_id: string | null
  tanggal_tayang: string | null
  jam_tayang: string | null
  assigned_riset: string | null
  assigned_naskah: string | null
  assigned_produksi: string | null
  assigned_schedule: string | null
  step_log: Record<string, string> | null
}

type Product = { id: string; nama: string; platform_affiliate: string | null }

type ManualTask = {
  id?: string
  workspace_id: string
  nama: string
  platform: string
  priority: string
  start_date: string
  due_date: string
  percent_complete: number
  notes: string
}

// ── Sprint templates ──────────────────────────────────────────────────────────
type StepDef = { id: string; nama: string; icon: string; doneAt: string; href: string }

const TEMPLATES: Record<string, { label: string; color: string; steps: StepDef[] }> = {
  affiliate: {
    label: 'Konten Affiliate',
    color: '#059669',
    steps: [
      { id: 'naskah',   nama: 'Buat Naskah', icon: 'naskah', doneAt: 'Naskah Siap', href: '/plan' },
      { id: 'take_vid', nama: 'Take Video',  icon: 'take_vid', doneAt: 'Produksi',    href: '/studio' },
      { id: 'editing',  nama: 'Editing',     icon: 'scissors', doneAt: 'Siap Tayang', href: '/studio' },
      { id: 'schedule', nama: 'Schedule',    icon: 'calendar', doneAt: 'Terjadwal',   href: '/calendar' },
    ],
  },
  creator: {
    label: 'Konten Creator',
    color: '#1a73e8',
    steps: [
      { id: 'naskah',   nama: 'Buat Naskah', icon: 'naskah', doneAt: 'Naskah Siap', href: '/plan' },
      { id: 'shooting', nama: 'Shooting',    icon: 'take_vid', doneAt: 'Produksi',    href: '/studio' },
      { id: 'editing',  nama: 'Editing',     icon: 'scissors', doneAt: 'Siap Tayang', href: '/studio' },
      { id: 'caption',  nama: 'Caption',     icon: 'pen', doneAt: 'Siap Tayang', href: '/plan' },
      { id: 'schedule', nama: 'Schedule',    icon: 'calendar', doneAt: 'Terjadwal',   href: '/calendar' },
    ],
  },
  live: {
    label: 'Live Streaming',
    color: '#dc2626',
    steps: [
      { id: 'rundown',   nama: 'Rundown',    icon: 'list', doneAt: 'Naskah Siap', href: '/plan' },
      { id: 'persiapan', nama: 'Persiapan',  icon: 'live', doneAt: 'Produksi',    href: '/studio' },
      { id: 'live',      nama: 'Live',       icon: 'live', doneAt: 'Terjadwal',   href: '/studio' },
    ],
  },
}

const MASTER_STEPS: StepDef[] = [
  { id: 'naskah',    nama: 'Buat Naskah', icon: 'naskah', doneAt: 'Naskah Siap', href: '/plan' },
  { id: 'take_vid',  nama: 'Take Video',  icon: 'take_vid', doneAt: 'Produksi',    href: '/studio' },
  { id: 'shooting',  nama: 'Shooting',    icon: 'take_video', doneAt: 'Produksi',    href: '/studio' },
  { id: 'editing',   nama: 'Editing',     icon: 'scissors', doneAt: 'Siap Tayang', href: '/studio' },
  { id: 'caption',   nama: 'Caption',     icon: 'pen', doneAt: 'Siap Tayang', href: '/plan' },
  { id: 'thumbnail', nama: 'Thumbnail',   icon: 'broll', doneAt: 'Siap Tayang', href: '/studio' },
  { id: 'review',    nama: 'Review',      icon: 'persiapan', doneAt: 'Siap Tayang', href: '/studio' },
  { id: 'rundown',   nama: 'Rundown',     icon: 'list', doneAt: 'Naskah Siap', href: '/plan' },
  { id: 'schedule',  nama: 'Schedule',    icon: 'calendar', doneAt: 'Terjadwal',   href: '/calendar' },
  { id: 'live',      nama: 'Live',        icon: 'live', doneAt: 'Terjadwal',   href: '/studio' },
]

function parseTemplateType(template_type: string): { key: string; stepIds: string[] | null } {
  if (!template_type) return { key: 'affiliate', stepIds: null }
  const colonIdx = template_type.indexOf(':')
  if (colonIdx === -1) return { key: template_type, stepIds: null }
  return { key: template_type.slice(0, colonIdx), stepIds: template_type.slice(colonIdx + 1).split(',').filter(Boolean) }
}

function getTemplateSteps(template_type: string): StepDef[] {
  const { key, stepIds } = parseTemplateType(template_type)
  if (stepIds) return stepIds.map(id => MASTER_STEPS.find(s => s.id === id)).filter(Boolean) as StepDef[]
  return TEMPLATES[key]?.steps || TEMPLATES.affiliate.steps
}

function getTemplateLabel(template_type: string): string {
  const { key } = parseTemplateType(template_type)
  if (key === 'custom') return 'Custom'
  return TEMPLATES[key]?.label || 'Konten Affiliate'
}

function getTemplateColor(template_type: string): string {
  const { key } = parseTemplateType(template_type)
  if (key === 'custom') return '#6b7280'
  return TEMPLATES[key]?.color || TEMPLATES.affiliate.color
}

const STATUS_ORDER = ['Draft', 'Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const FORMATS = ['Reels', 'Feed/Carousel', 'Story', 'Video Pendek', 'Shorts', 'TikTok Video', 'Live', 'Lainnya']
const PRIORITIES = ['High', 'Medium', 'Low']
const PRIORITY_COLOR: Record<string, string> = { High: '#dc2626', Medium: '#d97706', Low: '#059669' }
const PRODUCT_COLORS = ['#1a73e8','#059669','#dc2626','#d97706','#0284c7','#be185d','#047857','#0369a1']

const BOARD_COLS = [
  { id: 'todo',  label: 'Todo',       count_color: '#6b7280', accentColor: '#94a3b8', border: '#e5eaf2', bg: '' },
  { id: 'doing', label: 'Dikerjakan', count_color: '#d97706', accentColor: '#f59e0b', border: 'rgba(217,119,6,0.25)', bg: '' },
  { id: 'done',  label: 'Done',       count_color: '#059669', accentColor: '#10b981', border: 'rgba(5,150,105,0.25)', bg: '' },
]

function getColFromStatus(status: string): 'todo' | 'doing' | 'done' {
  if (status === 'Tayang') return 'done'
  if (status === 'Draft') return 'todo'
  return 'doing'
}

function isStepDone(status: string, doneAt: string): boolean {
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(doneAt)
}

function getWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(mon), end: fmt(sun) }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

type WorkspaceMember = { id: string; user_id: string; role: string; jabatan: string; email: string; nama: string }

// Map step id → assigned_* column name
const STEP_ASSIGN_COL: Record<string, string> = {
  naskah:    'assigned_naskah',
  rundown:   'assigned_naskah',
  caption:   'assigned_naskah',
  take_vid:  'assigned_produksi',
  shooting:  'assigned_produksi',
  editing:   'assigned_produksi',
  thumbnail: 'assigned_produksi',
  review:    'assigned_produksi',
  schedule:  'assigned_schedule',
  live:      'assigned_schedule',
  persiapan: 'assigned_produksi',
}

const JABATAN_PRESETS = ['Copywriter', 'Videografer', 'Editor', 'Admin Sosmed', 'Art Director', 'Owner', 'Content Creator']

type SosmedAkun = { id: string; platform: string; handle: string; nama: string }

export default function SprintsModule({ initialSprints, initialContents, products, workspaceId, workspaceMembers, initialTasks, accounts = [] }: {
  initialSprints: Sprint[]
  initialContents: ContentItem[]
  products: Product[]
  workspaceId: string
  workspaceMembers: WorkspaceMember[]
  initialTasks: ManualTask[]
  accounts?: SosmedAkun[]
}) {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'board' | 'tasks'>(
    searchParams.get('tab') === 'tasks' ? 'tasks' : 'board'
  )
  useEffect(() => {
    if (searchParams.get('tab') === 'tasks') setActiveTab('tasks')
  }, [searchParams])

  const [sprints, setSprints] = useState<Sprint[]>(initialSprints)
  const [contents, setContents] = useState<ContentItem[]>(initialContents)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(initialSprints[0]?.id || null)
  const [search, setSearch] = useState('')
  const [filterProduct, setFilterProduct] = useState('')

  // Sprint create modal
  const [sprintModal, setSprintModal] = useState(false)
  const [sprintForm, setSprintForm] = useState({ nama: '', start_date: '', end_date: '', target_konten: 35, platform: '', akun: '', template_type: 'affiliate' })
  // sprintSteps: ordered list of steps + assign + deadline
  const [sprintSteps, setSprintSteps] = useState<{ step: StepDef; memberId: string; deadline: string }[]>([])
  const [addStepOpen, setAddStepOpen] = useState(false)
  const [sprintProducts, setSprintProducts] = useState<{ product_id: string; jumlah: number; mulai: string; interval: number; jam: string }[]>([{ product_id: '', jumlah: 7, mulai: '', interval: 1, jam: '18:00' }])
  const [savingSprint, setSavingSprint] = useState(false)

  // Content add modal
  const [addModal, setAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ judul: '', product_id: '', format: '', platform: '', tanggal_tayang: '', assigned_naskah: '', assigned_produksi: '', assigned_schedule: '' })
  const [savingAdd, setSavingAdd] = useState(false)

  // Detail modal
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null)
  const [savingAction, setSavingAction] = useState(false)
  const [detailJadwal, setDetailJadwal] = useState<{ date: string; time: string }>({ date: '', time: '18:00' })
  const [savingJadwal, setSavingJadwal] = useState(false)

  // Manual tasks
  const [tasks, setTasks] = useState<ManualTask[]>(initialTasks)
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: ManualTask } | null>(null)
  const [savingTask, setSavingTask] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [deleteUndo, setDeleteUndo] = useState<{
    sprintId: string; sprintName: string; sprint: Sprint; contents: ContentItem[]; timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  const selectedSprint = sprints.find(s => s.id === selectedSprintId)
  const sprintContents = contents.filter(c => c.sprint_id === selectedSprintId)
  const steps = selectedSprint ? getTemplateSteps(selectedSprint.template_type) : []
  // Merge step_config (deadline + memberName) into steps for display
  type StepWithMeta = StepDef & { deadline?: string; memberName?: string }
  const stepsWithMeta: StepWithMeta[] = steps.map(s => {
    const cfg = selectedSprint?.step_config?.find(c => c.id === s.id)
    return { ...s, deadline: cfg?.deadline || '', memberName: cfg?.memberName || '' }
  })

  const productColorMap = useMemo(() => {
    const m: Record<string, string> = {}
    products.forEach((p, i) => { m[p.id] = PRODUCT_COLORS[i % PRODUCT_COLORS.length] })
    return m
  }, [products])

  const filtered = sprintContents.filter(c => {
    if (filterProduct && c.product_id !== filterProduct) return false
    if (search && !c.judul.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const colItems = (colId: string) => filtered.filter(c => getColFromStatus(c.status) === colId)
  const totalDone = sprintContents.filter(c => c.status === 'Tayang').length
  const totalPct = sprintContents.length > 0 ? Math.round((totalDone / sprintContents.length) * 100) : 0

  function initStepsFromTemplate(tpl: string) {
    const base = tpl === 'custom' ? [] : (TEMPLATES[tpl]?.steps || TEMPLATES.affiliate.steps)
    setSprintSteps(base.map(s => ({ step: s, memberId: '', deadline: '' })))
  }

  // ── Sprint create ─────────────────────────────────────────────────────────
  function openSprintModal() {
    const { start, end } = getWeekDates()
    const tpl = 'affiliate'
    setSprintForm({ nama: `Sprint ${fmtDate(start)} – ${fmtDate(end)}`, start_date: start, end_date: end, target_konten: 35, platform: '', akun: '', template_type: tpl })
    initStepsFromTemplate(tpl)
    setAddStepOpen(false)
    setSprintProducts([{ product_id: '', jumlah: 7, mulai: start, interval: 1, jam: '18:00' }])
    setSprintModal(true)
  }

  async function createSprint() {
    if (!sprintForm.nama.trim() || !sprintForm.start_date) return
    setSavingSprint(true)
    const stepIds = sprintSteps.map(s => s.step.id)
    const tplType = stepIds.length > 0
      ? `${sprintForm.template_type === 'custom' ? 'custom' : sprintForm.template_type}:${stepIds.join(',')}`
      : sprintForm.template_type

    const totalFromProducts = sprintProducts.filter(r => r.jumlah > 0).reduce((s, r) => s + r.jumlah, 0)
    const stepConfigData: StepConfig[] = sprintSteps.map(({ step, memberId, deadline }) => {
      const m = workspaceMembers.find(x => x.id === memberId)
      return { id: step.id, deadline, memberName: m ? (m.nama || m.email) + (m.jabatan ? ` (${m.jabatan})` : '') : '' }
    })

    const { data: sprint, error } = await supabase.from('kf_sprints').insert({
      workspace_id: workspaceId,
      nama: sprintForm.nama.trim(),
      start_date: sprintForm.start_date,
      end_date: sprintForm.end_date,
      target_konten: totalFromProducts > 0 ? totalFromProducts : sprintForm.target_konten,
      platform: sprintForm.platform || null,
      akun: sprintForm.akun.trim() || null,
      template_type: tplType,
      step_config: stepConfigData,
      status: 'active',
    }).select('*').single()

    if (!error && sprint) {
      // Auto-generate content items from all rows (product optional)
      const rows = sprintProducts.filter(r => r.jumlah > 0)
      if (rows.length > 0) {
        // Build per-step assign lookup: step.id → member display name
        const assignByCol: Record<string, string> = {}
        sprintSteps.forEach(({ step, memberId }) => {
          const col = STEP_ASSIGN_COL[step.id]
          if (col && memberId) {
            const m = workspaceMembers.find(x => x.id === memberId)
            if (m) assignByCol[col] = m.nama || m.email
          }
        })

        const items = rows.flatMap(row => {
          const produk = products.find(p => p.id === row.product_id)
          const baseDateStr = row.mulai || sprintForm.start_date
          return Array.from({ length: row.jumlah }, (_, i) => {
            let tanggal_tayang: string | null = null
            if (baseDateStr) {
              const d = new Date(baseDateStr + 'T00:00:00')
              d.setDate(d.getDate() + i * (row.interval || 1))
              tanggal_tayang = d.toISOString().split('T')[0]
            }
            return {
              workspace_id: workspaceId,
              sprint_id: sprint.id,
              judul: produk ? `${produk.nama} — Konten ${i + 1}` : `Konten ${i + 1}`,
              status: 'Draft',
              product_id: row.product_id || null,
              platform: sprintForm.platform ? [sprintForm.platform] : [],
              tanggal_tayang,
              jam_tayang: row.jam || null,
              ...assignByCol,
            }
          })
        })
        const { data: inserted } = await supabase.from('kf_content_ideas').insert(items).select('*')
        if (inserted) setContents(prev => [...inserted, ...prev])
      }
      setSprints(prev => [sprint, ...prev])
      setSelectedSprintId(sprint.id)
    }
    setSavingSprint(false)
    setSprintModal(false)
  }

  // ── Add content ───────────────────────────────────────────────────────────
  function openAddModal() {
    setAddForm({ judul: '', product_id: '', format: '', platform: '', tanggal_tayang: '', assigned_naskah: '', assigned_produksi: '', assigned_schedule: '' })
    setAddModal(true)
  }

  async function saveContent() {
    if (!addForm.judul.trim() || !selectedSprintId) return
    setSavingAdd(true)
    const { data, error } = await supabase.from('kf_content_ideas').insert({
      workspace_id: workspaceId,
      sprint_id: selectedSprintId,
      judul: addForm.judul.trim(),
      format: addForm.format || null,
      platform: addForm.platform ? [addForm.platform] : [],
      status: 'Draft',
      product_id: addForm.product_id || null,
      tanggal_tayang: addForm.tanggal_tayang || null,
      assigned_naskah: addForm.assigned_naskah || null,
      assigned_produksi: addForm.assigned_produksi || null,
      assigned_schedule: addForm.assigned_schedule || null,
    }).select('*').single()
    if (!error && data) {
      setContents(prev => [data, ...prev])
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'naskah',
        title: `Mulai Naskah — ${data.judul}`,
        message: `Konten baru di sprint. ${addForm.assigned_naskah ? 'Assign: ' + addForm.assigned_naskah + '.' : 'Buka Plan untuk buat naskah.'}`,
        content_idea_id: data.id,
      })
      setAddModal(false)
    }
    setSavingAdd(false)
  }

  // ── Advance to a specific step's doneAt status (from card chip click) ───────
  async function advanceToStep(item: ContentItem, step: StepDef) {
    const targetStatus = step.doneAt
    const currentIdx = STATUS_ORDER.indexOf(item.status)
    const targetIdx = STATUS_ORDER.indexOf(targetStatus)
    if (targetIdx <= currentIdx) return
    const newStepLog = { ...(item.step_log || {}), [`${step.id}_done_at`]: new Date().toISOString() }
    await supabase.from('kf_content_ideas').update({ step_log: newStepLog }).eq('id', item.id)
    setContents(prev => prev.map(c => c.id === item.id ? { ...c, step_log: newStepLog } : c))
    await advanceStatus(item, targetStatus)
  }

  // ── Status update ─────────────────────────────────────────────────────────
  async function advanceStatus(item: ContentItem, newStatus: string) {
    setSavingAction(true)
    const update: Record<string, string> = { status: newStatus }
    if (newStatus === 'Terjadwal') update.terjadwal_at = new Date().toISOString()
    if (newStatus === 'Tayang') update.tayang_at = new Date().toISOString()
    await supabase.from('kf_content_ideas').update(update).eq('id', item.id)

    // Notification chain: setiap step selesai → notif ke step/modul berikutnya
    const CHAIN: Record<string, { type: string; title: string; message: string }> = {
      'Naskah Siap': {
        type: 'produksi',
        title: `Naskah Siap — ${item.judul}`,
        message: 'Naskah selesai dibuat. Lanjut ke Take Video / Produksi di Studio.',
      },
      'Produksi': {
        type: 'produksi',
        title: `Take Video Selesai — ${item.judul}`,
        message: 'Take video selesai. Lanjut ke Editing di Studio.',
      },
      'Siap Tayang': {
        type: 'produksi',
        title: `Editing Selesai — ${item.judul}`,
        message: 'Editing selesai. Konten siap dijadwalkan — buka Calendar.',
      },
      'Terjadwal': {
        type: 'schedule',
        title: `Terjadwal — ${item.judul}`,
        message: item.tanggal_tayang ? `Tayang: ${fmtDate(item.tanggal_tayang)}` : 'Konten sudah dijadwalkan.',
      },
      'Tayang': {
        type: 'schedule',
        title: `Tayang! — ${item.judul}`,
        message: 'Konten sudah live. Sprint progress bertambah!',
      },
    }
    const notif = CHAIN[newStatus]
    if (notif) {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        content_idea_id: item.id,
      })
    }

    setContents(prev => prev.map(c => c.id === item.id ? { ...c, ...update } : c))
    if (detailItem?.id === item.id) setDetailItem(prev => prev ? { ...prev, ...update } : prev)
    setSavingAction(false)
  }

  async function removeFromSprint(id: string) {
    if (!confirm('Hapus konten ini dari sprint?')) return
    await supabase.from('kf_content_ideas').update({ sprint_id: null }).eq('id', id)
    setContents(prev => prev.filter(c => c.id !== id))
    setDetailItem(null)
  }

  async function saveJadwal() {
    if (!detailItem) return
    setSavingJadwal(true)
    const tanggal = detailJadwal.date || null
    const jam = detailJadwal.time || null
    const { error } = await supabase
      .from('kf_content_ideas')
      .update({ tanggal_tayang: tanggal, jam_tayang: jam })
      .eq('id', detailItem.id)
    if (!error) {
      setContents(prev => prev.map(c => c.id === detailItem.id ? { ...c, tanggal_tayang: tanggal, jam_tayang: jam } : c))
      setDetailItem(prev => prev ? { ...prev, tanggal_tayang: tanggal, jam_tayang: jam } : null)
    }
    setSavingJadwal(false)
  }

  function deleteSprint(sprintId: string, sprintName: string) {
    const sprint = sprints.find(s => s.id === sprintId)
    const sprintContentsToDelete = contents.filter(c => c.sprint_id === sprintId)
    if (!sprint) return

    if (deleteUndo) {
      clearTimeout(deleteUndo.timeoutId)
      supabase.from('kf_content_ideas').delete().eq('sprint_id', deleteUndo.sprintId)
      supabase.from('kf_sprints').delete().eq('id', deleteUndo.sprintId)
    }

    setSprints(prev => prev.filter(s => s.id !== sprintId))
    setContents(prev => prev.filter(c => c.sprint_id !== sprintId))
    if (selectedSprintId === sprintId) setSelectedSprintId(sprints.find(s => s.id !== sprintId)?.id || null)

    const timeoutId = setTimeout(() => {
      supabase.from('kf_content_ideas').delete().eq('sprint_id', sprintId)
      supabase.from('kf_sprints').delete().eq('id', sprintId)
      setDeleteUndo(null)
    }, 5000)

    setDeleteUndo({ sprintId, sprintName, sprint, contents: sprintContentsToDelete, timeoutId })
  }

  function cancelDelete() {
    if (!deleteUndo) return
    clearTimeout(deleteUndo.timeoutId)
    setSprints(prev => [...prev, deleteUndo.sprint].sort((a, b) => b.start_date.localeCompare(a.start_date)))
    setContents(prev => [...prev, ...deleteUndo.contents])
    setSelectedSprintId(deleteUndo.sprintId)
    setDeleteUndo(null)
  }

  // ── Manual tasks ──────────────────────────────────────────────────────────
  function emptyTask(): ManualTask {
    return { workspace_id: workspaceId, nama: '', platform: '', priority: 'Medium', start_date: '', due_date: '', percent_complete: 0, notes: '' }
  }
  async function saveTask() {
    if (!taskModal || !taskModal.task.nama.trim()) return
    setSavingTask(true)
    const t = { ...taskModal.task, workspace_id: workspaceId }
    if (t.id) {
      await supabase.from('kf_tasks').update(t).eq('id', t.id)
      setTasks(prev => prev.map(x => x.id === t.id ? t : x))
    } else {
      const { data } = await supabase.from('kf_tasks').insert(t).select('id').single()
      if (data) setTasks(prev => [{ ...t, id: data.id }, ...prev])
    }
    setSavingTask(false); setTaskModal(null)
  }
  async function toggleTask(id: string, current: number) {
    const pct = current === 100 ? 0 : 100
    await supabase.from('kf_tasks').update({ percent_complete: pct }).eq('id', id)
    setTasks(prev => prev.map(x => x.id === id ? { ...x, percent_complete: pct } : x))
  }
  async function deleteTask(id: string) {
    if (!confirm('Hapus task ini?')) return
    await supabase.from('kf_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(x => x.id !== id))
  }

  const tasksTodo = tasks.filter(t => t.percent_complete < 100)
  const tasksDone = tasks.filter(t => t.percent_complete === 100)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 80px)', overflow: 'hidden' }}>
      <style>{`
        .kf-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .kf-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.10) !important; transform: translateY(-1px); }
        .kf-sprint-item:hover { background: #f9fafb !important; }
      `}</style>

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', flexShrink: 0, paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid rgba(0,0,0,0.06)', gap: 4 }}>
        {[
          { key: 'board', label: 'Sprint Board' },
          { key: 'tasks', label: 'Tasks' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as 'board' | 'tasks')}
            style={{ padding: '13px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? '#1a73e8' : 'transparent'}`, color: activeTab === tab.key ? '#111827' : '#6b7280', fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {tab.key === 'tasks' && tasksTodo.length > 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#ef4444', color: '#fff', borderRadius: 20, padding: '1px 7px' }}>{tasksTodo.length}</span>
            )}
          </button>
        ))}
      </div>

    {activeTab === 'tasks' ? (
      // ── TASKS TAB ──────────────────────────────────────────────────────────
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', maxWidth: 720 }}>
        <div className="kf-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>Tasks</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>Checklist manual — non-konten (beli alat, meeting, dll)</div>
          </div>
          <button onClick={() => setTaskModal({ open: true, task: emptyTask() })}
            style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '9px 18px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            + Task
          </button>
        </div>

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
            <div style={{ marginBottom: 10, color: '#059669' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <div style={{ fontWeight: 600, color: '#6b7280' }}>Belum ada task manual</div>
          </div>
        )}
        {tasksTodo.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Belum Selesai ({tasksTodo.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasksTodo.map(t => (
                <div key={t.id} className="kf-card" style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                  <button onClick={() => toggleTask(t.id!, t.percent_complete)} style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid #d1d5db', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{t.nama}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {t.priority && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, color: PRIORITY_COLOR[t.priority], background: `${PRIORITY_COLOR[t.priority]}18`, fontWeight: 600 }}>{t.priority}</span>}
                      {t.due_date && <span style={{ fontSize: '0.65rem', color: new Date(t.due_date) < new Date() ? '#dc2626' : '#6b7280' }}>Due {new Date(t.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                      {t.notes && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{t.notes}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setTaskModal({ open: true, task: { ...t } })} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 10px', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteTask(t.id!)} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tasksDone.length > 0 && (
          <div style={{ opacity: 0.45 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Selesai ({tasksDone.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasksDone.map(t => (
                <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' }}>
                  <button onClick={() => toggleTask(t.id!, t.percent_complete)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid #1a73e8', background: '#1a73e8', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <span style={{ flex: 1, color: '#6b7280', fontSize: '0.875rem', textDecoration: 'line-through' }}>{t.nama}</span>
                  <button onClick={() => deleteTask(t.id!)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {taskModal?.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 18, width: '100%', maxWidth: 440 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{taskModal.task.id ? 'Edit Task' : '+ Task Baru'}</div>
                <button onClick={() => setTaskModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Nama Task *</label>
                  <input style={fieldStyle()} value={taskModal.task.nama} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, nama: e.target.value } } : m)} placeholder="cth: Beli tripod, Perpanjang domain..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Priority</label>
                    <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={taskModal.task.priority} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, priority: e.target.value } } : m)}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Deadline</label>
                    <input type="date" style={fieldStyle()} value={taskModal.task.due_date} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, due_date: e.target.value } } : m)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Catatan</label>
                  <input style={fieldStyle()} value={taskModal.task.notes} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, notes: e.target.value } } : m)} placeholder="Detail..." />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setTaskModal(null)} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 16px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                  <button onClick={saveTask} disabled={savingTask} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
                    {savingTask ? 'Menyimpan...' : taskModal.task.id ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    ) : (

      // ── SPRINT BOARD TAB ───────────────────────────────────────────────────
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#f5f6fa' }}>

        {/* Left: Sprint sidebar */}
        <div className="kf-sprint-sidebar" style={{ width: 224, flexShrink: 0, background: '#fff', boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <button onClick={openSprintModal}
              style={{ width: '100%', background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 0', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em' }}>
              + Buat Sprint
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {sprints.length === 0 && <div style={{ fontSize: '0.78rem', color: '#9ca3af', padding: '24px 8px', textAlign: 'center' }}>Belum ada sprint</div>}
            {sprints.map(s => {
              const sc = contents.filter(c => c.sprint_id === s.id)
              const done = sc.filter(c => c.status === 'Tayang').length
              const active = s.id === selectedSprintId
              const today = new Date().toISOString().split('T')[0]
              const isCurrent = s.start_date <= today && s.end_date >= today
              const tplLabel = getTemplateLabel(s.template_type)
              const tplColor = getTemplateColor(s.template_type)
              const pct = sc.length > 0 ? Math.round(done / sc.length * 100) : 0
              return (
                <div key={s.id} onClick={() => setSelectedSprintId(s.id)}
                  className="kf-sprint-item"
                  style={{ position: 'relative', padding: '10px 12px', borderRadius: 10, marginBottom: 2, cursor: 'pointer', background: active ? 'rgba(26,115,232,0.07)' : 'transparent', borderLeft: `3px solid ${active ? '#1a73e8' : 'transparent'}`, transition: 'background 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {isCurrent && <span style={{ fontSize: '0.6rem', background: '#059669', color: '#fff', fontWeight: 700, padding: '2px 6px', borderRadius: 20 }}>AKTIF</span>}
                    <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '2px 6px', borderRadius: 20, background: tplColor + '18', color: tplColor }}>{tplLabel}</span>
                    <button onClick={e => { e.stopPropagation(); deleteSprint(s.id, s.nama) }} title="Hapus sprint"
                      style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#d1d5db', fontSize: '0.8rem', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>✕</button>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 500, color: active ? '#111827' : '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{s.nama}</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: 7 }}>{fmtDate(s.start_date)} – {fmtDate(s.end_date)}</div>
                  <div style={{ height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: active ? '#1a73e8' : '#d1d5db', borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 4 }}>{done}/{sc.length} selesai</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main: Board */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Mobile: Sprint picker bar (hidden on desktop via CSS) */}
          <div className="kf-sprint-mobile-bar" style={{ display: 'none', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '8px 12px', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 6, paddingBottom: 2 }}>
              {sprints.map(s => (
                <button key={s.id} onClick={() => setSelectedSprintId(s.id)}
                  style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${selectedSprintId === s.id ? '#1a73e8' : '#e5eaf2'}`, background: selectedSprintId === s.id ? 'rgba(26,115,232,0.08)' : 'transparent', color: selectedSprintId === s.id ? '#1a73e8' : '#6b7280', fontSize: '0.75rem', fontWeight: selectedSprintId === s.id ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {s.nama}
                </button>
              ))}
            </div>
            <button onClick={openSprintModal}
              style={{ flexShrink: 0, background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              + Sprint
            </button>
          </div>

          {!selectedSprint ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>Mulai dengan Sprint Mingguan</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>Buat sprint untuk mengatur konten minggu ini dalam kanban board</div>
              <button onClick={openSprintModal} style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                + Buat Sprint Pertama
              </button>
            </div>
          ) : (
            <>
              {/* Sprint header bar */}
              <div style={{ padding: '10px 16px', background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{selectedSprint.nama}</span>
                    {selectedSprint.platform && <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>{selectedSprint.platform}</span>}
                    {selectedSprint.akun && <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(26,115,232,0.08)', color: '#1a73e8', fontWeight: 600 }}>@{selectedSprint.akun.replace(/^@/, '')}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{fmtDate(selectedSprint.start_date)} – {fmtDate(selectedSprint.end_date)}</span>
                    <span style={{ fontSize: '0.72rem', color: '#d1d5db' }}>·</span>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{sprintContents.length}/{selectedSprint.target_konten} konten</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: totalPct === 100 ? '#059669' : '#1a73e8' }}>{totalPct}%</span>
                    <div style={{ width: 60, height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${totalPct}%`, background: totalPct === 100 ? '#059669' : '#1a73e8', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {steps.map(s => <span key={s.id} title={s.nama} style={{ color: '#9ca3af', display: 'flex' }}>{STEP_ICON_MAP[s.id] || null}</span>)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
                    style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px 10px', color: filterProduct ? '#1a73e8' : '#6b7280', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Semua Produk</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari konten..."
                    style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '7px 10px', color: '#111827', fontSize: '0.75rem', outline: 'none', width: 130 }} />
                  <button onClick={() => setReportOpen(true)}
                    style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', color: '#374151', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Laporan Tim
                  </button>
                </div>
              </div>

              {/* 3-Column Kanban */}
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', padding: '16px', gap: 12 }}>
                {BOARD_COLS.map(col => {
                  const items = colItems(col.id)
                  return (
                    <div key={col.id} style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)', borderTop: `3px solid ${col.accentColor}` }}>
                      {/* Column header */}
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{col.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', borderRadius: 20, padding: '2px 9px' }}>{items.length}</span>
                          {col.id === 'todo' && (
                            <button onClick={openAddModal}
                              style={{ background: '#1a73e8', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}>
                              + Konten
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Cards */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items.map(item => (
                          <ContentCard key={item.id} item={item} steps={stepsWithMeta}
                            productName={item.product_id ? products.find(p => p.id === item.product_id)?.nama || null : null}
                            productColor={item.product_id ? productColorMap[item.product_id] : '#6b7280'}
                            onClick={() => {
                              setDetailItem(item)
                              setDetailJadwal({ date: item.tanggal_tayang || '', time: item.jam_tayang || '18:00' })
                            }}
                            onStepDone={(step) => advanceToStep(item, step)} />
                        ))}
                        {items.length === 0 && col.id === 'todo' && sprintContents.length === 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 16px', border: '2px dashed #e5e7eb', borderRadius: 12, margin: '4px 0' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                            </div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>Sprint siap!</div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af', textAlign: 'center' }}>Tambah konten minggu ini</div>
                            <button onClick={openAddModal} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                              + Tambah Konten
                            </button>
                          </div>
                        )}
                        {items.length === 0 && !(col.id === 'todo' && sprintContents.length === 0) && (
                          <div style={{ textAlign: 'center', padding: '40px 12px', color: '#d1d5db', fontSize: '0.78rem' }}>Kosong</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    )}

      {/* ── Sprint Create Modal ─────────────────────────────────────────────── */}
      {sprintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>Buat Sprint Baru</div>
              <button onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Template selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Jenis Konten</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.entries(TEMPLATES) as [string, { label: string; color: string; steps: StepDef[] }][]).map(([key, tpl]) => (
                    <button key={key} type="button" onClick={() => { setSprintForm(f => ({ ...f, template_type: key })); initStepsFromTemplate(key) }}
                      style={{ flex: '1 1 auto', minWidth: 90, padding: '8px 6px', borderRadius: 8, border: `1px solid ${sprintForm.template_type === key ? tpl.color + '60' : '#e5eaf2'}`, background: sprintForm.template_type === key ? tpl.color + '12' : '#f1f5f9', color: sprintForm.template_type === key ? tpl.color : '#6b7280', fontSize: '0.75rem', fontWeight: sprintForm.template_type === key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {tpl.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setSprintForm(f => ({ ...f, template_type: 'custom' })); setSprintSteps([]) }}
                    style={{ flex: '1 1 auto', minWidth: 90, padding: '8px 6px', borderRadius: 8, border: `1px solid ${sprintForm.template_type === 'custom' ? '#94a3b860' : '#e5eaf2'}`, background: sprintForm.template_type === 'custom' ? 'rgba(148,163,184,0.08)' : '#f1f5f9', color: sprintForm.template_type === 'custom' ? '#374151' : '#6b7280', fontSize: '0.75rem', fontWeight: sprintForm.template_type === 'custom' ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                    Custom
                  </button>
                </div>
              </div>

              {/* ── Step Editor (unified: add/remove steps + assign) ── */}
              <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>Steps Pekerjaan</div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Hapus step yg gak diperlukan, tambah yg kurang, assign ke anggota tim</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{sprintSteps.length} step</span>
                </div>

                {/* Step rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sprintSteps.map(({ step, memberId, deadline }, idx) => (
                    <div key={`${step.id}-${idx}`} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
                      {/* Row 1: number + name + delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, background: '#f8fafc', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{idx + 1}</span>
                        <span style={{ color: '#6b7280', display: 'flex', flexShrink: 0 }}>{STEP_ICON_MAP[step.id] || null}</span>
                        <span style={{ fontSize: '0.82rem', color: '#111827', fontWeight: 600, flex: 1 }}>{step.nama}</span>
                        <button type="button" onClick={() => setSprintSteps(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: '1px solid #f3f4f6', borderRadius: 5, width: 22, height: 22, color: '#6b7280', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                      {/* Row 2: assign + deadline */}
                      <div className="kf-sprint-step-grid" style={{ display: 'grid', gridTemplateColumns: workspaceMembers.length > 0 ? '1fr 130px' : '1fr', gap: 6 }}>
                        {workspaceMembers.length > 0 && (
                          <select
                            value={memberId}
                            onChange={e => setSprintSteps(prev => prev.map((x, i) => i === idx ? { ...x, memberId: e.target.value } : x))}
                            style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', color: memberId ? '#1a73e8' : '#374151', fontSize: '0.72rem', outline: 'none', cursor: 'pointer' }}>
                            <option value="">— Assign ke —</option>
                            {workspaceMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.nama || m.email}{m.jabatan ? ` (${m.jabatan})` : ''}</option>
                            ))}
                          </select>
                        )}
                        <div style={{ position: 'relative' }}>
                          <input type="date"
                            value={deadline}
                            onChange={e => setSprintSteps(prev => prev.map((x, i) => i === idx ? { ...x, deadline: e.target.value } : x))}
                            style={{ ...fieldStyle({ padding: '5px 8px', fontSize: '0.72rem', color: deadline ? '#d97706' : '#374151' }) }}
                            placeholder="Deadline"
                          />
                          {!deadline && <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: '#6b7280', pointerEvents: 'none' }}>Deadline</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sprintSteps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '0.72rem', border: '1px dashed #e5eaf2', borderRadius: 8 }}>Belum ada step — tambah dari daftar di bawah</div>
                  )}
                </div>

                {/* Add step */}
                <div style={{ marginTop: 8, position: 'relative' }}>
                  <button type="button" onClick={() => setAddStepOpen(v => !v)}
                    style={{ width: '100%', background: 'transparent', border: '1px dashed #c8d1e0', borderRadius: 7, padding: '6px', color: '#9fa9ba', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <span>+</span> Tambah Step
                  </button>
                  {addStepOpen && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px', zIndex: 10, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {MASTER_STEPS.filter(ms => !sprintSteps.some(ss => ss.step.id === ms.id)).map(ms => (
                        <button key={ms.id} type="button"
                          onClick={() => { setSprintSteps(prev => [...prev, { step: ms, memberId: '', deadline: '' }]); setAddStepOpen(false) }}
                          style={{ background: 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#111827', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left' }}>
                          <span style={{ color: '#6b7280', display: 'flex', flexShrink: 0 }}>{STEP_ICON_MAP[ms.id] || null}</span> {ms.nama}
                        </button>
                      ))}
                      {MASTER_STEPS.filter(ms => !sprintSteps.some(ss => ss.step.id === ms.id)).length === 0 && (
                        <div style={{ padding: '6px 10px', color: '#6b7280', fontSize: '0.72rem' }}>Semua step sudah ditambah</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Nama Sprint *</label>
                <input style={fieldStyle()} value={sprintForm.nama} onChange={e => setSprintForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Sprint 20-26 Jul" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Mulai</label>
                  <input type="date" style={fieldStyle()} value={sprintForm.start_date} onChange={e => setSprintForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Selesai</label>
                  <input type="date" style={fieldStyle()} value={sprintForm.end_date} onChange={e => setSprintForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={sprintForm.platform} onChange={e => setSprintForm(f => ({ ...f, platform: e.target.value }))}>
                    <option value="">Semua Platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Akun Posting</label>
                  {accounts.length > 0 ? (
                    <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={sprintForm.akun} onChange={e => setSprintForm(f => ({ ...f, akun: e.target.value }))}>
                      <option value="">Pilih akun</option>
                      {accounts.map(a => <option key={a.id} value={`${a.nama} (@${a.handle})`}>{a.platform} · {a.nama} (@{a.handle})</option>)}
                    </select>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', color: '#6b7280' }}>
                      Belum ada akun. <a href="/brand?tab=akun" style={{ color: '#1a73e8', textDecoration: 'none' }}>Daftarkan dulu di Brand → Akun Sosial →</a>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Produk & Jumlah Konten ── */}
              <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>Slot Konten</div>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 1 }}>Produk opsional — bisa dikosongkan untuk konten kreator</div>
                  </div>
                  {(() => {
                    const total = sprintProducts.filter(r => r.jumlah > 0).reduce((s, r) => s + r.jumlah, 0)
                    return total > 0 && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a73e8', background: 'rgba(26,115,232,0.1)', padding: '3px 8px', borderRadius: 5 }}>
                        Total: {total} konten
                      </span>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sprintProducts.map((row, idx) => (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {/* Baris 1: produk + jumlah + hapus */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 26px', gap: 6, alignItems: 'center' }}>
                        <select
                          value={row.product_id}
                          onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, product_id: e.target.value } : r))}
                          style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', color: '#111827', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', width: '100%' }}>
                          <option value="">— Tanpa Produk —</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                        <input
                          type="number" min={1} max={99}
                          value={row.jumlah}
                          onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, jumlah: Math.max(1, Number(e.target.value)) } : r))}
                          style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 4px', color: '#111827', fontSize: '0.8rem', outline: 'none', textAlign: 'center', width: '100%' }}
                        />
                        <button
                          type="button"
                          onClick={() => setSprintProducts(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: '1px solid #f3f4f6', borderRadius: 5, width: 26, height: 28, color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✕
                        </button>
                      </div>
                      {/* Baris 2: jadwal posting */}
                      <div className="kf-sprint-dates-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px', gap: 6 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 3 }}>Mulai Posting</div>
                          <input
                            type="date"
                            value={row.mulai}
                            onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, mulai: e.target.value } : r))}
                            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', color: row.mulai ? '#111827' : '#6b7280', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 3 }}>Jam</div>
                          <input
                            type="time"
                            value={row.jam}
                            onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, jam: e.target.value } : r))}
                            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', color: '#111827', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 3 }}>Interval</div>
                          <select
                            value={row.interval}
                            onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, interval: Number(e.target.value) } : r))}
                            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', color: '#111827', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}>
                            <option value={1}>Tiap 1 hari</option>
                            <option value={2}>Tiap 2 hari</option>
                            <option value={3}>Tiap 3 hari</option>
                            <option value={7}>Tiap 7 hari</option>
                          </select>
                        </div>
                      </div>
                      {/* Preview jadwal */}
                      {row.mulai && (
                        <div style={{ fontSize: '0.62rem', color: '#6b7280', background: '#f0f5f9', borderRadius: 5, padding: '5px 8px', lineHeight: 1.5 }}>
                          {(() => {
                            const dates = Array.from({ length: Math.min(row.jumlah, 4) }, (_, i) => {
                              const d = new Date(row.mulai + 'T00:00:00')
                              d.setDate(d.getDate() + i * (row.interval || 1))
                              return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            })
                            return `${dates.join(' · ')}${row.jumlah > 4 ? ` · +${row.jumlah - 4} lagi` : ''} @ ${row.jam}`
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSprintProducts(prev => [...prev, { product_id: '', jumlah: 7, mulai: sprintForm.start_date, interval: 1, jam: '18:00' }])}
                    style={{ flex: 1, background: 'transparent', border: '1px dashed #c8d1e0', borderRadius: 7, padding: '6px', color: '#9fa9ba', fontSize: '0.72rem', cursor: 'pointer' }}>
                    + Tambah Baris
                  </button>
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSprintProducts(prev => [
                        ...prev,
                        ...products.map(p => ({ product_id: p.id, jumlah: 7, mulai: sprintForm.start_date, interval: 1, jam: '18:00' }))
                      ])}
                      style={{ flex: 1, background: 'rgba(26,115,232,0.08)', border: '1px dashed rgba(26,115,232,0.3)', borderRadius: 7, padding: '6px', color: '#1a73e8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                      + Tambahkan Semua Produk
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 18px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button onClick={createSprint} disabled={savingSprint}
                  style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingSprint ? 'not-allowed' : 'pointer' }}>
                  {savingSprint ? 'Membuat Sprint...' : `Buat Sprint (${sprintProducts.filter(r=>r.jumlah>0).reduce((s,r)=>s+r.jumlah,0)} konten)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Content Modal ───────────────────────────────────────────────── */}
      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>+ Tambah Konten ke Sprint</div>
              <button onClick={() => setAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Nama / Judul Konten *</label>
                <input style={fieldStyle()} value={addForm.judul} onChange={e => setAddForm(f => ({ ...f, judul: e.target.value }))} placeholder="cth: Review Serum Vit C — Drama Version" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Produk</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={addForm.product_id} onChange={e => setAddForm(f => ({ ...f, product_id: e.target.value }))}>
                    <option value="">— Pilih produk —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Format</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={addForm.format} onChange={e => setAddForm(f => ({ ...f, format: e.target.value }))}>
                    <option value="">— Format —</option>
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={addForm.platform} onChange={e => setAddForm(f => ({ ...f, platform: e.target.value }))}>
                    <option value="">— Platform —</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Tanggal Tayang</label>
                  <input type="date" style={fieldStyle()} value={addForm.tanggal_tayang} onChange={e => setAddForm(f => ({ ...f, tanggal_tayang: e.target.value }))} />
                </div>
              </div>
              {workspaceMembers.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Assign Tim (opsional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { key: 'assigned_naskah', label: 'Naskah' },
                      { key: 'assigned_produksi', label: 'Produksi' },
                      { key: 'assigned_schedule', label: 'Schedule' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <div style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: 3 }}>{label}</div>
                        <input style={fieldStyle({ fontSize: '0.8rem', padding: '7px 10px' })}
                          value={(addForm as Record<string, string>)[key] || ''}
                          onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder="Nama anggota..." />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setAddModal(false)} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 18px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button onClick={saveContent} disabled={savingAdd}
                  style={{ background: '#059669', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingAdd ? 'not-allowed' : 'pointer' }}>
                  {savingAdd ? 'Menyimpan...' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                {detailItem.product_id && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: productColorMap[detailItem.product_id], marginBottom: 4 }}>
                    {products.find(p => p.id === detailItem.product_id)?.nama}
                  </div>
                )}
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{detailItem.judul}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  {detailItem.format && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #f3f4f6', color: '#6b7280' }}>{detailItem.format}</span>}
                  {Array.isArray(detailItem.platform) && detailItem.platform[0] && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #f3f4f6', color: '#6b7280' }}>{detailItem.platform[0]}</span>}
                  {detailItem.tanggal_tayang && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#059669' }}>{fmtDate(detailItem.tanggal_tayang)}{detailItem.jam_tayang ? ` · ${detailItem.jam_tayang}` : ''}</span>}
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Step checklist */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5eaf2' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stepsWithMeta.map(step => {
                  const done = isStepDone(detailItem.status, step.doneAt)
                  const isOverdue = step.deadline && !done && new Date(step.deadline) < new Date()
                  return (
                    <div key={step.id} style={{ padding: '8px 12px', borderRadius: 8, background: done ? 'rgba(52,211,153,0.06)' : '#f1f5f9', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : done ? '#d1fae5' : '#e5eaf2'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${done ? '#059669' : '#e5eaf2'}`, background: done ? '#059669' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span style={{ color: done ? '#059669' : '#6b7280', display: 'flex', flexShrink: 0 }}>{STEP_ICON_MAP[step.id] || null}</span>
                          <span style={{ fontSize: '0.82rem', color: done ? '#059669' : '#111827', fontWeight: done ? 400 : 600, textDecoration: done ? 'line-through' : 'none' }}>{step.nama}</span>
                        </div>
                        {!done && (
                          <Link href={step.href} onClick={() => setDetailItem(null)}
                            style={{ fontSize: '0.68rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none', padding: '3px 8px', borderRadius: 5, background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.2)' }}>
                            Buka →
                          </Link>
                        )}
                      </div>
                      {/* Meta: assignee + deadline */}
                      {(step.memberName || step.deadline) && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 5, paddingLeft: 26 }}>
                          {step.memberName && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{step.memberName}</span>}
                          {step.deadline && (
                            <span style={{ fontSize: '0.65rem', color: isOverdue ? '#dc2626' : done ? '#374151' : '#d97706', fontWeight: isOverdue ? 700 : 400 }}>
                              {isOverdue ? 'Perhatian: ' : ''}{new Date(step.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              {isOverdue && !done ? ' (terlambat)' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Jadwal Posting */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5eaf2' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Jadwal Posting</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 3 }}>Tanggal</div>
                  <input type="date" value={detailJadwal.date}
                    onChange={e => setDetailJadwal(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', background: '#f0f5f9', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 10px', color: '#111827', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: 3 }}>Jam</div>
                  <input type="time" value={detailJadwal.time}
                    onChange={e => setDetailJadwal(prev => ({ ...prev, time: e.target.value }))}
                    style={{ width: '100%', background: '#f0f5f9', border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 10px', color: '#111827', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button onClick={saveJadwal} disabled={savingJadwal}
                style={{ marginTop: 8, width: '100%', background: '#1a73e8', border: 'none', borderRadius: 7, padding: '8px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: savingJadwal ? 'not-allowed' : 'pointer', opacity: savingJadwal ? 0.7 : 1 }}>
                {savingJadwal ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </div>

            {/* Manual status advance */}
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailItem.status !== 'Terjadwal' && detailItem.status !== 'Tayang' && (
                <button onClick={() => advanceStatus(detailItem, 'Terjadwal')} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(66,165,245,0.1)', border: '1px solid rgba(66,165,245,0.3)', borderRadius: 8, padding: '9px', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  Tandai Terjadwal
                </button>
              )}
              {detailItem.status === 'Terjadwal' && (
                <button onClick={() => advanceStatus(detailItem, 'Tayang')} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.3)', borderRadius: 8, padding: '9px', color: '#059669', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  Tandai Tayang → Done
                </button>
              )}
              {detailItem.status === 'Tayang' && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.82rem', color: '#059669' }}>✓ Sudah Tayang — Done</div>
              )}
              <button onClick={() => removeFromSprint(detailItem.id)}
                style={{ width: '100%', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>
                Hapus dari Sprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Laporan Tim Modal ───────────────────────────────────────────────── */}
      {reportOpen && selectedSprint && (() => {
        const reportSteps = getTemplateSteps(selectedSprint.template_type)
        const stepCfgMap = Object.fromEntries((selectedSprint.step_config || []).map(c => [c.id, c]))
        const now = new Date()

        type StepReport = {
          step: StepDef
          memberName: string
          deadline: string
          total: number
          done: number
          onTime: number
          late: number
          pending: number
          overdue: number
        }

        const report: StepReport[] = reportSteps.map(step => {
          const cfg = stepCfgMap[step.id]
          const deadline = cfg?.deadline || ''
          const memberName = cfg?.memberName || '—'
          const dlDate = deadline ? new Date(deadline) : null

          let done = 0, onTime = 0, late = 0, pending = 0, overdue = 0
          sprintContents.forEach(item => {
            const stepDone = isStepDone(item.status, step.doneAt)
            if (stepDone) {
              done++
              const doneAt = item.step_log?.[`${step.id}_done_at`]
              if (dlDate && doneAt) {
                if (new Date(doneAt) <= dlDate) onTime++
                else late++
              } else {
                onTime++ // done but no deadline set → count as ok
              }
            } else {
              pending++
              if (dlDate && now > dlDate) overdue++
            }
          })
          return { step, memberName, deadline, total: sprintContents.length, done, onTime, late, pending, overdue }
        })

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>Laporan Tim — {selectedSprint.nama}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>{fmtDate(selectedSprint.start_date)} – {fmtDate(selectedSprint.end_date)} · {sprintContents.length} konten</div>
                </div>
                <button onClick={() => setReportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {report.map(r => {
                  const pct = r.total > 0 ? Math.round(r.done / r.total * 100) : 0
                  const hasDeadline = !!r.deadline
                  const dlOverdue = hasDeadline && now > new Date(r.deadline) && r.done < r.total
                  return (
                    <div key={r.step.id} style={{ background: '#fff', border: `1px solid ${dlOverdue ? 'rgba(248,113,113,0.3)' : '#e5eaf2'}`, borderRadius: 10, padding: '14px 16px' }}>
                      {/* Step header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#6b7280', display: 'flex', flexShrink: 0 }}>{STEP_ICON_MAP[r.step.id] || null}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{r.step.nama}</div>
                            <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 1 }}>
                              {r.memberName}
                              {hasDeadline && <span style={{ marginLeft: 6, color: dlOverdue ? '#dc2626' : '#374151' }}>
                                · Deadline: {new Date(r.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                {dlOverdue && ' ⚠ Overdue'}
                              </span>}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pct === 100 ? '#059669' : '#1a73e8' }}>{pct}%</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 5, background: '#f8fafc', borderRadius: 3, marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#059669' : 'linear-gradient(90deg,#1a73e8,#42a5f5)', borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(134,239,172,0.1)', color: '#059669' }}>
                          ✓ {r.done} selesai
                        </span>
                        {hasDeadline && r.done > 0 && (
                          <>
                            <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(52,211,153,0.08)', color: '#059669' }}>
                              {r.onTime} tepat waktu
                            </span>
                            {r.late > 0 && (
                              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(248,113,113,0.08)', color: '#dc2626' }}>
                                ⚠ {r.late} terlambat
                              </span>
                            )}
                          </>
                        )}
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: '#f8fafc', color: r.overdue > 0 ? '#dc2626' : '#6b7280' }}>
                          ○ {r.pending} belum{r.overdue > 0 ? ` (${r.overdue} overdue)` : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {report.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: 32 }}>
                    Belum ada step yang dikonfigurasi untuk sprint ini
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {deleteUndo && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: '#f8fafc', border: '1px solid #3a3a3a', borderRadius: 20, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 320 }}>
          <span style={{ fontSize: '0.88rem', color: '#111827' }}>
            Sprint <strong>"{deleteUndo.sprintName}"</strong> dihapus
          </span>
          <button onClick={cancelDelete} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Batalkan
          </button>
        </div>
      )}
    </div>
  )
}

function ContentCard({ item, steps, productName, productColor, onClick, onStepDone }: {
  item: ContentItem
  steps: (StepDef & { deadline?: string; memberName?: string })[]
  productName: string | null
  productColor: string
  onClick: () => void
  onStepDone: (step: StepDef) => void
}) {
  const nextStepIdx = steps.findIndex(s => !isStepDone(item.status, s.doneAt))

  return (
    <div className="kf-card" style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)' }}>
      <div onClick={onClick}>
        {productName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: productColor, flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: productColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName}</span>
          </div>
        )}
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', lineHeight: 1.45, marginBottom: 10 }}>{item.judul}</div>
      </div>

      {steps.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {steps.map((step, idx) => {
            const done = isStepDone(item.status, step.doneAt)
            const isNext = idx === nextStepIdx

            if (done) return (
              <div key={step.id} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {step.nama}
              </div>
            )

            if (isNext) return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <a href={step.href} onClick={e => e.stopPropagation()} title={`Buka ${step.nama}`}
                  style={{ fontSize: '0.68rem', padding: '3px 9px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {step.nama}
                </a>
                <button type="button" onClick={e => { e.stopPropagation(); onStepDone(step) }} title={`Tandai ${step.nama} selesai`}
                  style={{ padding: '4px 7px', borderRadius: 20, background: '#dcfce7', border: 'none', color: '#15803d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            )

            return (
              <div key={step.id} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/></svg>
                {step.nama}
              </div>
            )
          })}
        </div>
      )}

      {(() => {
        const nextStep = nextStepIdx >= 0 ? steps[nextStepIdx] : null
        const dl = nextStep?.deadline
        if (dl) {
          const overdue = new Date(dl) < new Date()
          return (
            <div style={{ fontSize: '0.7rem', marginTop: 8, color: overdue ? '#dc2626' : '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
              {overdue && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              Due {new Date(dl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              {overdue && ' — terlambat'}
            </div>
          )
        }
        if (item.tanggal_tayang) return (
          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 8 }}>
            {new Date(item.tanggal_tayang).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{item.jam_tayang ? ` · ${item.jam_tayang}` : ''}
          </div>
        )
        return null
      })()}
    </div>
  )
}
