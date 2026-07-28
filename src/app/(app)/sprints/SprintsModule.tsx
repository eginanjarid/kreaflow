'use client'

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
    color: '#34d399',
    steps: [
      { id: 'naskah',   nama: 'Buat Naskah', icon: '📝', doneAt: 'Naskah Siap', href: '/plan' },
      { id: 'take_vid', nama: 'Take Video',  icon: '🎬', doneAt: 'Produksi',    href: '/studio' },
      { id: 'editing',  nama: 'Editing',     icon: '✂️', doneAt: 'Siap Tayang', href: '/studio' },
      { id: 'schedule', nama: 'Schedule',    icon: '📅', doneAt: 'Terjadwal',   href: '/calendar' },
    ],
  },
  creator: {
    label: 'Konten Creator',
    color: '#42a5f5',
    steps: [
      { id: 'naskah',   nama: 'Buat Naskah', icon: '📝', doneAt: 'Naskah Siap', href: '/plan' },
      { id: 'shooting', nama: 'Shooting',    icon: '🎬', doneAt: 'Produksi',    href: '/studio' },
      { id: 'editing',  nama: 'Editing',     icon: '✂️', doneAt: 'Siap Tayang', href: '/studio' },
      { id: 'caption',  nama: 'Caption',     icon: '✍️', doneAt: 'Siap Tayang', href: '/plan' },
      { id: 'schedule', nama: 'Schedule',    icon: '📅', doneAt: 'Terjadwal',   href: '/calendar' },
    ],
  },
  live: {
    label: 'Live Streaming',
    color: '#f87171',
    steps: [
      { id: 'rundown',   nama: 'Rundown',    icon: '📋', doneAt: 'Naskah Siap', href: '/plan' },
      { id: 'persiapan', nama: 'Persiapan',  icon: '🎙️', doneAt: 'Produksi',    href: '/studio' },
      { id: 'live',      nama: 'Live',       icon: '🔴', doneAt: 'Terjadwal',   href: '/studio' },
    ],
  },
}

const MASTER_STEPS: StepDef[] = [
  { id: 'naskah',    nama: 'Buat Naskah', icon: '📝', doneAt: 'Naskah Siap', href: '/plan' },
  { id: 'take_vid',  nama: 'Take Video',  icon: '🎬', doneAt: 'Produksi',    href: '/studio' },
  { id: 'shooting',  nama: 'Shooting',    icon: '📷', doneAt: 'Produksi',    href: '/studio' },
  { id: 'editing',   nama: 'Editing',     icon: '✂️', doneAt: 'Siap Tayang', href: '/studio' },
  { id: 'caption',   nama: 'Caption',     icon: '✍️', doneAt: 'Siap Tayang', href: '/plan' },
  { id: 'thumbnail', nama: 'Thumbnail',   icon: '🖼️', doneAt: 'Siap Tayang', href: '/studio' },
  { id: 'review',    nama: 'Review',      icon: '👀', doneAt: 'Siap Tayang', href: '/studio' },
  { id: 'rundown',   nama: 'Rundown',     icon: '📋', doneAt: 'Naskah Siap', href: '/plan' },
  { id: 'schedule',  nama: 'Schedule',    icon: '📅', doneAt: 'Terjadwal',   href: '/calendar' },
  { id: 'live',      nama: 'Live',        icon: '🔴', doneAt: 'Terjadwal',   href: '/studio' },
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
  if (key === 'custom') return '#94a3b8'
  return TEMPLATES[key]?.color || TEMPLATES.affiliate.color
}

const STATUS_ORDER = ['Draft', 'Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const FORMATS = ['Reels', 'Feed/Carousel', 'Story', 'Video Pendek', 'Shorts', 'TikTok Video', 'Live', 'Lainnya']
const PRIORITIES = ['High', 'Medium', 'Low']
const PRIORITY_COLOR: Record<string, string> = { High: '#f87171', Medium: '#fbbf24', Low: '#86efac' }
const PRODUCT_COLORS = ['#1a73e8','#059669','#dc2626','#d97706','#0284c7','#be185d','#047857','#0369a1']

const BOARD_COLS = [
  { id: 'todo',  label: 'Todo',       count_color: '#5a6a85', border: '#2a2a2a', bg: '#0d0d0d' },
  { id: 'doing', label: 'Dikerjakan', count_color: '#fbbf24', border: 'rgba(251,191,36,0.25)', bg: 'rgba(251,191,36,0.03)' },
  { id: 'done',  label: 'Done ✓',    count_color: '#86efac', border: 'rgba(134,239,172,0.25)', bg: 'rgba(134,239,172,0.03)' },
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
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
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
        title: `📝 Naskah Siap — ${item.judul}`,
        message: 'Naskah selesai dibuat. Lanjut ke Take Video / Produksi di Studio.',
      },
      'Produksi': {
        type: 'produksi',
        title: `🎬 Take Video Selesai — ${item.judul}`,
        message: 'Take video selesai. Lanjut ke Editing di Studio.',
      },
      'Siap Tayang': {
        type: 'produksi',
        title: `✂️ Editing Selesai — ${item.judul}`,
        message: 'Editing selesai. Konten siap dijadwalkan — buka Calendar.',
      },
      'Terjadwal': {
        type: 'schedule',
        title: `📅 Terjadwal — ${item.judul}`,
        message: item.tanggal_tayang ? `Tayang: ${fmtDate(item.tanggal_tayang)}` : 'Konten sudah dijadwalkan.',
      },
      'Tayang': {
        type: 'schedule',
        title: `🚀 Tayang! — ${item.judul}`,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5eaf2', background: '#fff', flexShrink: 0, paddingLeft: 16 }}>
        {[
          { key: 'board', label: '⚡ Sprint Board' },
          { key: 'tasks', label: '✅ Tasks' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as 'board' | 'tasks')}
            style={{ padding: '14px 20px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? '#1a73e8' : 'transparent'}`, color: activeTab === tab.key ? '#42a5f5' : '#475569', fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {tab.key === 'tasks' && tasksTodo.length > 0 && (
              <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#1f1f1f', color: '#5a6a85', borderRadius: 8, padding: '1px 6px' }}>{tasksTodo.length}</span>
            )}
          </button>
        ))}
      </div>

    {activeTab === 'tasks' ? (
      // ── TASKS TAB ──────────────────────────────────────────────────────────
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, color: '#2a3547', fontSize: '1.1rem' }}>Tasks</div>
            <div style={{ fontSize: '0.75rem', color: '#5a6a85', marginTop: 2 }}>Checklist manual — non-konten (beli alat, meeting, dll)</div>
          </div>
          <button onClick={() => setTaskModal({ open: true, task: emptyTask() })}
            style={{ background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            + Task
          </button>
        </div>

        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 600, color: '#5a6a85' }}>Belum ada task manual</div>
          </div>
        )}
        {tasksTodo.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Belum Selesai ({tasksTodo.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasksTodo.map(t => (
                <div key={t.id} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <button onClick={() => toggleTask(t.id!, t.percent_complete)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid #2a2a2a', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.875rem' }}>{t.nama}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {t.priority && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 3, color: PRIORITY_COLOR[t.priority], background: `${PRIORITY_COLOR[t.priority]}18`, fontWeight: 600 }}>{t.priority}</span>}
                      {t.due_date && <span style={{ fontSize: '0.65rem', color: new Date(t.due_date) < new Date() ? '#f87171' : '#475569' }}>Due {new Date(t.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                      {t.notes && <span style={{ fontSize: '0.65rem', color: '#334155' }}>{t.notes}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setTaskModal({ open: true, task: { ...t } })} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 10px', color: '#5a6a85', fontSize: '0.72rem', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => deleteTask(t.id!)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 8px', color: '#334155', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tasksDone.length > 0 && (
          <div style={{ opacity: 0.45 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Selesai ({tasksDone.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasksDone.map(t => (
                <div key={t.id} style={{ background: '#fff', border: '1px solid #1a1a1a', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => toggleTask(t.id!, t.percent_complete)} style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid #1a73e8', background: '#1a73e8', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <span style={{ flex: 1, color: '#334155', fontSize: '0.875rem', textDecoration: 'line-through' }}>{t.nama}</span>
                  <button onClick={() => deleteTask(t.id!)} style={{ background: 'transparent', border: 'none', color: '#1f2937', fontSize: '0.72rem', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {taskModal?.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
            <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 18, width: '100%', maxWidth: 440 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, color: '#2a3547' }}>{taskModal.task.id ? 'Edit Task' : '+ Task Baru'}</div>
                <button onClick={() => setTaskModal(null)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Nama Task *</label>
                  <input style={fieldStyle()} value={taskModal.task.nama} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, nama: e.target.value } } : m)} placeholder="cth: Beli tripod, Perpanjang domain..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Priority</label>
                    <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={taskModal.task.priority} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, priority: e.target.value } } : m)}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Deadline</label>
                    <input type="date" style={fieldStyle()} value={taskModal.task.due_date} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, due_date: e.target.value } } : m)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Catatan</label>
                  <input style={fieldStyle()} value={taskModal.task.notes} onChange={e => setTaskModal(m => m ? { ...m, task: { ...m.task, notes: e.target.value } } : m)} placeholder="Detail..." />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setTaskModal(null)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 16px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                  <button onClick={saveTask} disabled={savingTask} style={{ background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: Sprint List */}
        <div style={{ width: 230, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5eaf2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #e5eaf2' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Sprint Mingguan</div>
            <button onClick={openSprintModal}
              style={{ width: '100%', background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              + Buat Sprint
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {sprints.length === 0 && <div style={{ fontSize: '0.75rem', color: '#1f2937', padding: '20px 8px', textAlign: 'center' }}>Belum ada sprint</div>}
            {sprints.map(s => {
              const sc = contents.filter(c => c.sprint_id === s.id)
              const done = sc.filter(c => c.status === 'Tayang').length
              const active = s.id === selectedSprintId
              const today = new Date().toISOString().split('T')[0]
              const isCurrent = s.start_date <= today && s.end_date >= today
              const tplLabel = getTemplateLabel(s.template_type)
              const tplColor = getTemplateColor(s.template_type)
              return (
                <div key={s.id} onClick={() => setSelectedSprintId(s.id)}
                  style={{ position: 'relative', padding: '10px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: active ? 'rgba(26,115,232,0.15)' : 'transparent', border: `1px solid ${active ? 'rgba(26,115,232,0.3)' : 'transparent'}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    {isCurrent && <span style={{ fontSize: '0.5rem', background: '#34d399', color: '#000', fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>AKTIF</span>}
                    <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: tplColor + '18', color: tplColor }}>{tplLabel}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSprint(s.id, s.nama) }}
                      title="Hapus sprint"
                      style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer', padding: '1px 4px', borderRadius: 4, lineHeight: 1 }}
                    >✕</button>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? '#42a5f5' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</div>
                  <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: 1 }}>{fmtDate(s.start_date)} – {fmtDate(s.end_date)}{s.akun ? ` · @${s.akun.replace(/^@/, '')}` : ''}</div>
                  <div style={{ marginTop: 5, height: 3, background: '#f8fafc', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${sc.length > 0 ? Math.round(done / sc.length * 100) : 0}%`, background: 'linear-gradient(90deg,#1a73e8,#42a5f5)', borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#1f2937', marginTop: 2 }}>{done}/{sc.length} done</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main: Board */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedSprint ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#334155' }}>
              <div style={{ fontSize: '2.5rem' }}>⚡</div>
              <div style={{ fontWeight: 700, color: '#5a6a85' }}>Pilih atau buat sprint mingguan</div>
              <button onClick={openSprintModal} style={{ background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
                + Buat Sprint Pertama
              </button>
            </div>
          ) : (
            <>
              {/* Sprint header */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: '#2a3547', fontSize: '0.95rem' }}>{selectedSprint.nama}</span>
                    {selectedSprint.platform && <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85' }}>{selectedSprint.platform}</span>}
                    {selectedSprint.akun && <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(66,165,245,0.1)', border: '1px solid rgba(66,165,245,0.25)', color: '#42a5f5', fontWeight: 600 }}>@{selectedSprint.akun.replace(/^@/, '')}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: '0.7rem', color: '#334155' }}>{fmtDate(selectedSprint.start_date)} – {fmtDate(selectedSprint.end_date)}</span>
                    <span style={{ fontSize: '0.7rem', color: '#334155' }}>·</span>
                    <span style={{ fontSize: '0.7rem', color: '#334155' }}>{sprintContents.length}/{selectedSprint.target_konten} konten</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: totalPct === 100 ? '#86efac' : '#42a5f5' }}>{totalPct}% done</span>
                    {/* Step legend */}
                    <span style={{ fontSize: '0.65rem', color: '#334155', marginLeft: 4 }}>
                      Steps: {steps.map(s => s.icon).join(' ')}
                    </span>
                  </div>
                </div>
                <div style={{ width: 120, height: 5, background: '#f8fafc', borderRadius: 3, flexShrink: 0 }}>
                  <div style={{ height: '100%', width: `${totalPct}%`, background: 'linear-gradient(90deg,#1a73e8,#42a5f5)', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
                  style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 7, padding: '6px 10px', color: filterProduct ? '#42a5f5' : '#475569', fontSize: '0.72rem', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Semua Produk</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..."
                  style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 7, padding: '6px 10px', color: '#2a3547', fontSize: '0.72rem', outline: 'none', width: 120 }} />
                <button onClick={() => setReportOpen(true)}
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 7, padding: '6px 12px', color: '#fbbf24', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  📊 Laporan Tim
                </button>
              </div>

              {/* 3-Column Kanban */}
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', padding: '14px', gap: 12 }}>
                {BOARD_COLS.map(col => {
                  const items = colItems(col.id)
                  return (
                    <div key={col.id} style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', background: col.bg, border: `1px solid ${col.border}`, borderRadius: 20, overflow: 'hidden' }}>
                      {/* Column header */}
                      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: col.count_color }}>{col.label}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: col.count_color, background: `${col.count_color}15`, border: `1px solid ${col.count_color}30`, borderRadius: 8, padding: '1px 7px' }}>{items.length}</span>
                          {col.id === 'todo' && (
                            <button onClick={openAddModal}
                              style={{ background: 'transparent', border: `1px dashed ${col.count_color}40`, borderRadius: 6, padding: '2px 8px', color: col.count_color, fontSize: '0.68rem', cursor: 'pointer' }}>
                              + Konten
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Cards */}
                      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {items.map(item => (
                          <ContentCard key={item.id} item={item} steps={stepsWithMeta}
                            productName={item.product_id ? products.find(p => p.id === item.product_id)?.nama || null : null}
                            productColor={item.product_id ? productColorMap[item.product_id] : '#475569'}
                            onClick={() => {
                              setDetailItem(item)
                              setDetailJadwal({ date: item.tanggal_tayang || '', time: item.jam_tayang || '18:00' })
                            }}
                            onStepDone={(step) => advanceToStep(item, step)} />
                        ))}
                        {items.length === 0 && col.id === 'todo' && sprintContents.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '28px 16px', border: '1px dashed rgba(26,115,232,0.3)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: '1.5rem' }}>📋</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5a6a85' }}>Sprint siap!</div>
                            <div style={{ fontSize: '0.68rem', color: '#334155' }}>Tambah konten yang mau dikerjakan minggu ini</div>
                            <button onClick={openAddModal} style={{ marginTop: 4, background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 7, padding: '7px 16px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              + Tambah Konten
                            </button>
                          </div>
                        )}
                        {items.length === 0 && !(col.id === 'todo' && sprintContents.length === 0) && (
                          <div style={{ textAlign: 'center', padding: '32px 12px', color: '#1f2937', fontSize: '0.72rem', border: '1px dashed #1f1f1f', borderRadius: 8 }}>Kosong</div>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '1rem' }}>⚡ Buat Sprint Baru</div>
              <button onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              {/* Template selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 8, fontWeight: 600 }}>Jenis Konten</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.entries(TEMPLATES) as [string, { label: string; color: string; steps: StepDef[] }][]).map(([key, tpl]) => (
                    <button key={key} type="button" onClick={() => { setSprintForm(f => ({ ...f, template_type: key })); initStepsFromTemplate(key) }}
                      style={{ flex: '1 1 auto', minWidth: 90, padding: '8px 6px', borderRadius: 8, border: `1px solid ${sprintForm.template_type === key ? tpl.color + '60' : '#2a2a2a'}`, background: sprintForm.template_type === key ? tpl.color + '12' : '#1a1a1a', color: sprintForm.template_type === key ? tpl.color : '#475569', fontSize: '0.75rem', fontWeight: sprintForm.template_type === key ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {tpl.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setSprintForm(f => ({ ...f, template_type: 'custom' })); setSprintSteps([]) }}
                    style={{ flex: '1 1 auto', minWidth: 90, padding: '8px 6px', borderRadius: 8, border: `1px solid ${sprintForm.template_type === 'custom' ? '#94a3b860' : '#2a2a2a'}`, background: sprintForm.template_type === 'custom' ? 'rgba(148,163,184,0.08)' : '#1a1a1a', color: sprintForm.template_type === 'custom' ? '#94a3b8' : '#475569', fontSize: '0.75rem', fontWeight: sprintForm.template_type === 'custom' ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                    ✏️ Custom
                  </button>
                </div>
              </div>

              {/* ── Step Editor (unified: add/remove steps + assign) ── */}
              <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5a6a85' }}>Steps Pekerjaan</div>
                    <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: 1 }}>Hapus step yg gak diperlukan, tambah yg kurang, assign ke anggota tim</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#5a6a85' }}>{sprintSteps.length} step</span>
                </div>

                {/* Step rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sprintSteps.map(({ step, memberId, deadline }, idx) => (
                    <div key={`${step.id}-${idx}`} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '8px 10px' }}>
                      {/* Row 1: number + name + delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700, background: '#f8fafc', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{idx + 1}</span>
                        <span style={{ fontSize: '0.9rem' }}>{step.icon}</span>
                        <span style={{ fontSize: '0.82rem', color: '#2a3547', fontWeight: 600, flex: 1 }}>{step.nama}</span>
                        <button type="button" onClick={() => setSprintSteps(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 5, width: 22, height: 22, color: '#5a6a85', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                      {/* Row 2: assign + deadline */}
                      <div style={{ display: 'grid', gridTemplateColumns: workspaceMembers.length > 0 ? '1fr 130px' : '1fr', gap: 6 }}>
                        {workspaceMembers.length > 0 && (
                          <select
                            value={memberId}
                            onChange={e => setSprintSteps(prev => prev.map((x, i) => i === idx ? { ...x, memberId: e.target.value } : x))}
                            style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '5px 8px', color: memberId ? '#42a5f5' : '#334155', fontSize: '0.72rem', outline: 'none', cursor: 'pointer' }}>
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
                            style={{ ...fieldStyle({ padding: '5px 8px', fontSize: '0.72rem', color: deadline ? '#fbbf24' : '#334155' }) }}
                            placeholder="Deadline"
                          />
                          {!deadline && <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: '0.68rem', color: '#334155', pointerEvents: 'none' }}>📅 Deadline</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sprintSteps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '12px', color: '#1f2937', fontSize: '0.72rem', border: '1px dashed #1f1f1f', borderRadius: 8 }}>Belum ada step — tambah dari daftar di bawah</div>
                  )}
                </div>

                {/* Add step */}
                <div style={{ marginTop: 8, position: 'relative' }}>
                  <button type="button" onClick={() => setAddStepOpen(v => !v)}
                    style={{ width: '100%', background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 7, padding: '6px', color: '#5a6a85', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <span>+</span> Tambah Step
                  </button>
                  {addStepOpen && (
                    <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '6px', zIndex: 10, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {MASTER_STEPS.filter(ms => !sprintSteps.some(ss => ss.step.id === ms.id)).map(ms => (
                        <button key={ms.id} type="button"
                          onClick={() => { setSprintSteps(prev => [...prev, { step: ms, memberId: '', deadline: '' }]); setAddStepOpen(false) }}
                          style={{ background: 'transparent', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#2a3547', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, textAlign: 'left' }}>
                          <span style={{ fontSize: '0.9rem' }}>{ms.icon}</span> {ms.nama}
                        </button>
                      ))}
                      {MASTER_STEPS.filter(ms => !sprintSteps.some(ss => ss.step.id === ms.id)).length === 0 && (
                        <div style={{ padding: '6px 10px', color: '#334155', fontSize: '0.72rem' }}>Semua step sudah ditambah</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Nama Sprint *</label>
                <input style={fieldStyle()} value={sprintForm.nama} onChange={e => setSprintForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Sprint 20-26 Jul" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Mulai</label>
                  <input type="date" style={fieldStyle()} value={sprintForm.start_date} onChange={e => setSprintForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Selesai</label>
                  <input type="date" style={fieldStyle()} value={sprintForm.end_date} onChange={e => setSprintForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={sprintForm.platform} onChange={e => setSprintForm(f => ({ ...f, platform: e.target.value }))}>
                    <option value="">Semua Platform</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Akun Posting</label>
                  {accounts.length > 0 ? (
                    <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={sprintForm.akun} onChange={e => setSprintForm(f => ({ ...f, akun: e.target.value }))}>
                      <option value="">Pilih akun</option>
                      {accounts.map(a => <option key={a.id} value={`${a.nama} (@${a.handle})`}>{a.platform} · {a.nama} (@{a.handle})</option>)}
                    </select>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem', color: '#5a6a85' }}>
                      Belum ada akun. <a href="/brand?tab=akun" style={{ color: '#42a5f5', textDecoration: 'none' }}>Daftarkan dulu di Brand → Akun Sosial →</a>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Produk & Jumlah Konten ── */}
              <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5a6a85' }}>Slot Konten</div>
                    <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: 1 }}>Produk opsional — bisa dikosongkan untuk konten kreator</div>
                  </div>
                  {(() => {
                    const total = sprintProducts.filter(r => r.jumlah > 0).reduce((s, r) => s + r.jumlah, 0)
                    return total > 0 && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#42a5f5', background: 'rgba(26,115,232,0.1)', padding: '3px 8px', borderRadius: 5 }}>
                        Total: {total} konten
                      </span>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sprintProducts.map((row, idx) => (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {/* Baris 1: produk + jumlah + hapus */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 26px', gap: 6, alignItems: 'center' }}>
                        <select
                          value={row.product_id}
                          onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, product_id: e.target.value } : r))}
                          style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '6px 8px', color: '#2a3547', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', width: '100%' }}>
                          <option value="">— Tanpa Produk —</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                        <input
                          type="number" min={1} max={99}
                          value={row.jumlah}
                          onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, jumlah: Math.max(1, Number(e.target.value)) } : r))}
                          style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '6px 4px', color: '#2a3547', fontSize: '0.8rem', outline: 'none', textAlign: 'center', width: '100%' }}
                        />
                        <button
                          type="button"
                          onClick={() => setSprintProducts(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 5, width: 26, height: 28, color: '#334155', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✕
                        </button>
                      </div>
                      {/* Baris 2: jadwal posting */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px', gap: 6 }}>
                        <div>
                          <div style={{ fontSize: '0.6rem', color: '#5a6a85', marginBottom: 3 }}>📅 Mulai Posting</div>
                          <input
                            type="date"
                            value={row.mulai}
                            onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, mulai: e.target.value } : r))}
                            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '6px 8px', color: row.mulai ? '#e2e8f0' : '#475569', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6rem', color: '#5a6a85', marginBottom: 3 }}>Jam</div>
                          <input
                            type="time"
                            value={row.jam}
                            onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, jam: e.target.value } : r))}
                            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '6px 8px', color: '#2a3547', fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box' as const }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.6rem', color: '#5a6a85', marginBottom: 3 }}>Interval</div>
                          <select
                            value={row.interval}
                            onChange={e => setSprintProducts(prev => prev.map((r, i) => i === idx ? { ...r, interval: Number(e.target.value) } : r))}
                            style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '6px 8px', color: '#2a3547', fontSize: '0.75rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}>
                            <option value={1}>Tiap 1 hari</option>
                            <option value={2}>Tiap 2 hari</option>
                            <option value={3}>Tiap 3 hari</option>
                            <option value={7}>Tiap 7 hari</option>
                          </select>
                        </div>
                      </div>
                      {/* Preview jadwal */}
                      {row.mulai && (
                        <div style={{ fontSize: '0.62rem', color: '#5a6a85', background: '#f0f5f9', borderRadius: 5, padding: '5px 8px', lineHeight: 1.5 }}>
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
                    style={{ flex: 1, background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 7, padding: '6px', color: '#5a6a85', fontSize: '0.72rem', cursor: 'pointer' }}>
                    + Tambah Baris
                  </button>
                  {products.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSprintProducts(prev => [
                        ...prev,
                        ...products.map(p => ({ product_id: p.id, jumlah: 7, mulai: sprintForm.start_date, interval: 1, jam: '18:00' }))
                      ])}
                      style={{ flex: 1, background: 'rgba(26,115,232,0.08)', border: '1px dashed rgba(26,115,232,0.3)', borderRadius: 7, padding: '6px', color: '#42a5f5', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                      + Tambahkan Semua Produk
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 18px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button onClick={createSprint} disabled={savingSprint}
                  style={{ background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingSprint ? 'not-allowed' : 'pointer' }}>
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
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#2a3547' }}>+ Tambah Konten ke Sprint</div>
              <button onClick={() => setAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Nama / Judul Konten *</label>
                <input style={fieldStyle()} value={addForm.judul} onChange={e => setAddForm(f => ({ ...f, judul: e.target.value }))} placeholder="cth: Review Serum Vit C — Drama Version" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Produk</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={addForm.product_id} onChange={e => setAddForm(f => ({ ...f, product_id: e.target.value }))}>
                    <option value="">— Pilih produk —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Format</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={addForm.format} onChange={e => setAddForm(f => ({ ...f, format: e.target.value }))}>
                    <option value="">— Format —</option>
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={addForm.platform} onChange={e => setAddForm(f => ({ ...f, platform: e.target.value }))}>
                    <option value="">— Platform —</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 5, fontWeight: 600 }}>Tanggal Tayang</label>
                  <input type="date" style={fieldStyle()} value={addForm.tanggal_tayang} onChange={e => setAddForm(f => ({ ...f, tanggal_tayang: e.target.value }))} />
                </div>
              </div>
              {workspaceMembers.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Assign Tim (opsional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { key: 'assigned_naskah', label: '📝 Naskah' },
                      { key: 'assigned_produksi', label: '🎬 Produksi' },
                      { key: 'assigned_schedule', label: '📅 Schedule' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <div style={{ fontSize: '0.68rem', color: '#5a6a85', marginBottom: 3 }}>{label}</div>
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
                <button onClick={() => setAddModal(false)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '9px 18px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button onClick={saveContent} disabled={savingAdd}
                  style={{ background: 'linear-gradient(135deg,#059669,#34d399)', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingAdd ? 'not-allowed' : 'pointer' }}>
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
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                {detailItem.product_id && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: productColorMap[detailItem.product_id], marginBottom: 4 }}>
                    {products.find(p => p.id === detailItem.product_id)?.nama}
                  </div>
                )}
                <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '0.95rem' }}>{detailItem.judul}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                  {detailItem.format && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85' }}>{detailItem.format}</span>}
                  {Array.isArray(detailItem.platform) && detailItem.platform[0] && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85' }}>{detailItem.platform[0]}</span>}
                  {detailItem.tanggal_tayang && <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>📅 {fmtDate(detailItem.tanggal_tayang)}{detailItem.jam_tayang ? ` · ${detailItem.jam_tayang}` : ''}</span>}
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Step checklist */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5eaf2' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stepsWithMeta.map(step => {
                  const done = isStepDone(detailItem.status, step.doneAt)
                  const isOverdue = step.deadline && !done && new Date(step.deadline) < new Date()
                  return (
                    <div key={step.id} style={{ padding: '8px 12px', borderRadius: 8, background: done ? 'rgba(52,211,153,0.06)' : '#1a1a1a', border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : done ? 'rgba(52,211,153,0.2)' : '#2a2a2a'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${done ? '#34d399' : '#2a2a2a'}`, background: done ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{step.icon}</span>
                          <span style={{ fontSize: '0.82rem', color: done ? '#34d399' : '#e2e8f0', fontWeight: done ? 400 : 600, textDecoration: done ? 'line-through' : 'none' }}>{step.nama}</span>
                        </div>
                        {!done && (
                          <Link href={step.href} onClick={() => setDetailItem(null)}
                            style={{ fontSize: '0.68rem', color: '#42a5f5', fontWeight: 600, textDecoration: 'none', padding: '3px 8px', borderRadius: 5, background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.2)' }}>
                            Buka →
                          </Link>
                        )}
                      </div>
                      {/* Meta: assignee + deadline */}
                      {(step.memberName || step.deadline) && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 5, paddingLeft: 26 }}>
                          {step.memberName && <span style={{ fontSize: '0.65rem', color: '#5a6a85' }}>👤 {step.memberName}</span>}
                          {step.deadline && (
                            <span style={{ fontSize: '0.65rem', color: isOverdue ? '#f87171' : done ? '#334155' : '#fbbf24', fontWeight: isOverdue ? 700 : 400 }}>
                              {isOverdue ? '⚠️ ' : '📅 '}{new Date(step.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
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
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Jadwal Posting</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#5a6a85', marginBottom: 3 }}>Tanggal</div>
                  <input type="date" value={detailJadwal.date}
                    onChange={e => setDetailJadwal(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', background: '#f0f5f9', border: '1px solid #e5eaf2', borderRadius: 6, padding: '7px 10px', color: '#2a3547', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#5a6a85', marginBottom: 3 }}>Jam</div>
                  <input type="time" value={detailJadwal.time}
                    onChange={e => setDetailJadwal(prev => ({ ...prev, time: e.target.value }))}
                    style={{ width: '100%', background: '#f0f5f9', border: '1px solid #e5eaf2', borderRadius: 6, padding: '7px 10px', color: '#2a3547', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button onClick={saveJadwal} disabled={savingJadwal}
                style={{ marginTop: 8, width: '100%', background: 'linear-gradient(135deg,#1a73e8,#42a5f5)', border: 'none', borderRadius: 7, padding: '8px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: savingJadwal ? 'not-allowed' : 'pointer', opacity: savingJadwal ? 0.7 : 1 }}>
                {savingJadwal ? 'Menyimpan...' : '💾 Simpan Jadwal'}
              </button>
            </div>

            {/* Manual status advance */}
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailItem.status !== 'Terjadwal' && detailItem.status !== 'Tayang' && (
                <button onClick={() => advanceStatus(detailItem, 'Terjadwal')} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(66,165,245,0.1)', border: '1px solid rgba(66,165,245,0.3)', borderRadius: 8, padding: '9px', color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  📅 Tandai Terjadwal
                </button>
              )}
              {detailItem.status === 'Terjadwal' && (
                <button onClick={() => advanceStatus(detailItem, 'Tayang')} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.3)', borderRadius: 8, padding: '9px', color: '#86efac', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  🚀 Tandai Tayang → Done
                </button>
              )}
              {detailItem.status === 'Tayang' && (
                <div style={{ textAlign: 'center', padding: '8px', fontSize: '0.82rem', color: '#86efac' }}>✓ Sudah Tayang — Done</div>
              )}
              <button onClick={() => removeFromSprint(detailItem.id)}
                style={{ width: '100%', background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '8px', color: '#334155', fontSize: '0.75rem', cursor: 'pointer' }}>
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
            <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '1rem' }}>📊 Laporan Tim — {selectedSprint.nama}</div>
                  <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginTop: 2 }}>{fmtDate(selectedSprint.start_date)} – {fmtDate(selectedSprint.end_date)} · {sprintContents.length} konten</div>
                </div>
                <button onClick={() => setReportOpen(false)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {report.map(r => {
                  const pct = r.total > 0 ? Math.round(r.done / r.total * 100) : 0
                  const hasDeadline = !!r.deadline
                  const dlOverdue = hasDeadline && now > new Date(r.deadline) && r.done < r.total
                  return (
                    <div key={r.step.id} style={{ background: '#0f0f0f', border: `1px solid ${dlOverdue ? 'rgba(248,113,113,0.3)' : '#1f1f1f'}`, borderRadius: 10, padding: '14px 16px' }}>
                      {/* Step header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1rem' }}>{r.step.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '0.85rem' }}>{r.step.nama}</div>
                            <div style={{ fontSize: '0.68rem', color: '#5a6a85', marginTop: 1 }}>
                              {r.memberName}
                              {hasDeadline && <span style={{ marginLeft: 6, color: dlOverdue ? '#f87171' : '#334155' }}>
                                · Deadline: {new Date(r.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                {dlOverdue && ' ⚠ Overdue'}
                              </span>}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pct === 100 ? '#86efac' : '#42a5f5' }}>{pct}%</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 5, background: '#f8fafc', borderRadius: 3, marginBottom: 10 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#34d399' : 'linear-gradient(90deg,#1a73e8,#42a5f5)', borderRadius: 3, transition: 'width 0.3s' }} />
                      </div>
                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(134,239,172,0.1)', color: '#86efac' }}>
                          ✓ {r.done} selesai
                        </span>
                        {hasDeadline && r.done > 0 && (
                          <>
                            <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>
                              🎯 {r.onTime} tepat waktu
                            </span>
                            {r.late > 0 && (
                              <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: 'rgba(248,113,113,0.08)', color: '#f87171' }}>
                                ⚠ {r.late} terlambat
                              </span>
                            )}
                          </>
                        )}
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 5, background: '#f8fafc', color: r.overdue > 0 ? '#f87171' : '#475569' }}>
                          ○ {r.pending} belum{r.overdue > 0 ? ` (${r.overdue} overdue)` : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {report.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#334155', padding: 32 }}>
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
          <span style={{ fontSize: '0.88rem', color: '#2a3547' }}>
            Sprint <strong>"{deleteUndo.sprintName}"</strong> dihapus
          </span>
          <button onClick={cancelDelete} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '6px 16px', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
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
    <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
      <div onClick={onClick}>
        {productName && (
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: productColor, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ● {productName}
          </div>
        )}
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2a3547', lineHeight: 1.4, marginBottom: 8 }}>{item.judul}</div>
      </div>

      {/* Step chips */}
      {steps.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {steps.map((step, idx) => {
            const done = isStepDone(item.status, step.doneAt)
            const isNext = idx === nextStepIdx

            if (done) {
              return (
                <div key={step.id} style={{ fontSize: '0.6rem', padding: '3px 7px', borderRadius: 4, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', display: 'flex', alignItems: 'center', gap: 2 }}>
                  ✓ {step.nama}
                </div>
              )
            }

            if (isNext) {
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Navigate to module */}
                  <a
                    href={step.href}
                    onClick={e => e.stopPropagation()}
                    title={`Buka ${step.nama}`}
                    style={{ fontSize: '0.6rem', padding: '3px 7px', borderRadius: 4, background: 'rgba(66,165,245,0.12)', border: '1px solid rgba(66,165,245,0.4)', color: '#42a5f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
                    ▶ {step.nama}
                  </a>
                  {/* Mark done — separate explicit button */}
                  <button
                    type="button"
                    title={`Tandai ${step.nama} selesai`}
                    onClick={e => { e.stopPropagation(); onStepDone(step) }}
                    style={{ fontSize: '0.6rem', padding: '3px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    ✓
                  </button>
                </div>
              )
            }

            // Future step
            return (
              <div key={step.id} style={{ fontSize: '0.6rem', padding: '3px 7px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5eaf2', color: '#334155', display: 'flex', alignItems: 'center', gap: 2 }}>
                ○ {step.nama}
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom: deadline of next step or tayang date */}
      {(() => {
        const nextStep = nextStepIdx >= 0 ? steps[nextStepIdx] : null
        const dl = nextStep?.deadline
        if (dl) {
          const overdue = new Date(dl) < new Date()
          return (
            <div style={{ fontSize: '0.6rem', marginTop: 5, color: overdue ? '#f87171' : '#475569' }}>
              {overdue ? '⚠️' : '📅'} Due {new Date(dl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              {overdue ? ' — terlambat' : ''}
            </div>
          )
        }
        if (item.tanggal_tayang) return (
          <div style={{ fontSize: '0.6rem', color: '#5a6a85', marginTop: 5 }}>
            📅 {new Date(item.tanggal_tayang).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{item.jam_tayang ? ` · ${item.jam_tayang}` : ''}
          </div>
        )
        return null
      })()}
    </div>
  )
}
