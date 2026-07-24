'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type Sprint = {
  id: string
  workspace_id: string
  nama: string
  start_date: string
  end_date: string
  target_konten: number
  platform: string
  status: string
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
  riset_done_at: string | null
  terjadwal_at: string | null
  tayang_at: string | null
  assigned_riset: string | null
  assigned_naskah: string | null
  assigned_produksi: string | null
  assigned_schedule: string | null
  hook: string | null
  body: string | null
  cta: string | null
  script: string | null
  canva_url: string | null
  drive_url: string | null
  studio_done_at: string | null
}

type Product = { id: string; nama: string; platform_affiliate: string | null }

const FORMATS = ['Reels', 'Feed/Carousel', 'Story', 'Video Pendek', 'Shorts', 'TikTok Video', 'Live', 'Lainnya']
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']

const STAGE_COLS = [
  { id: 'riset', label: 'Riset', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', statuses: ['Draft'] },
  { id: 'naskah', label: 'Naskah', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', statuses: ['Naskah Siap'] },
  { id: 'produksi', label: 'Produksi', color: '#f97316', bg: 'rgba(249,115,22,0.08)', statuses: ['Produksi'] },
  { id: 'siap', label: 'Siap Tayang', color: '#34d399', bg: 'rgba(52,211,153,0.08)', statuses: ['Siap Tayang'] },
  { id: 'terjadwal', label: 'Terjadwal', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', statuses: ['Terjadwal'] },
  { id: 'tayang', label: 'Tayang', color: '#86efac', bg: 'rgba(134,239,172,0.08)', statuses: ['Tayang'] },
]

const PRODUCT_COLORS = ['#7C3AED','#059669','#dc2626','#d97706','#0284c7','#be185d','#7c3aed','#047857']

function getWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start: fmt(mon), end: fmt(sun) }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function relativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  return `${Math.floor(h / 24)}h lalu`
}

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function SprintsModule({ initialSprints, initialContents, products, workspaceId, memberCount }: {
  initialSprints: Sprint[]
  initialContents: ContentItem[]
  products: Product[]
  workspaceId: string
  memberCount: number
}) {
  const supabase = createClient()
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints)
  const [contents, setContents] = useState<ContentItem[]>(initialContents)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(initialSprints[0]?.id || null)
  const [filterProduct, setFilterProduct] = useState('')
  const [search, setSearch] = useState('')

  // Sprint create modal
  const [sprintModal, setSprintModal] = useState(false)
  const [sprintForm, setSprintForm] = useState({ nama: '', start_date: '', end_date: '', target_konten: 5, platform: '' })
  const [savingSprint, setSavingSprint] = useState(false)

  // Content add modal
  const [contentModal, setContentModal] = useState<{ open: boolean; item: Partial<ContentItem> & { _sprintId: string } } | null>(null)
  const [savingContent, setSavingContent] = useState(false)

  // Card detail modal
  const [detailModal, setDetailModal] = useState<ContentItem | null>(null)
  const [savingAction, setSavingAction] = useState(false)

  const selectedSprint = sprints.find(s => s.id === selectedSprintId)
  const sprintContents = contents.filter(c => c.sprint_id === selectedSprintId)

  const productColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    products.forEach((p, i) => { map[p.id] = PRODUCT_COLORS[i % PRODUCT_COLORS.length] })
    return map
  }, [products])

  const filteredContents = sprintContents.filter(c => {
    if (filterProduct && c.product_id !== filterProduct) return false
    if (search && !c.judul.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const colItems = (statuses: string[]) => filteredContents.filter(c => statuses.includes(c.status))

  const totalDone = sprintContents.filter(c => c.status === 'Tayang').length
  const totalPct = sprintContents.length > 0 ? Math.round((totalDone / sprintContents.length) * 100) : 0

  function openSprintModal() {
    const { start, end } = getWeekDates()
    const startFmt = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const endFmt = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    setSprintForm({ nama: `Sprint ${startFmt} – ${endFmt}`, start_date: start, end_date: end, target_konten: 35, platform: '' })
    setSprintModal(true)
  }

  async function createSprint() {
    if (!sprintForm.nama.trim() || !sprintForm.start_date) return
    setSavingSprint(true)
    const { data, error } = await supabase.from('kf_sprints').insert({
      workspace_id: workspaceId,
      nama: sprintForm.nama.trim(),
      start_date: sprintForm.start_date,
      end_date: sprintForm.end_date,
      target_konten: sprintForm.target_konten,
      platform: sprintForm.platform || null,
      status: 'active',
    }).select('*').single()
    if (!error && data) {
      setSprints(prev => [data, ...prev])
      setSelectedSprintId(data.id)
      setSprintModal(false)
    }
    setSavingSprint(false)
  }

  function openAddContent(sprintId: string) {
    setContentModal({
      open: true,
      item: {
        _sprintId: sprintId,
        sprint_id: sprintId,
        workspace_id: workspaceId,
        status: 'Draft',
        judul: '',
        format: '',
        platform: [],
        product_id: '',
        tanggal_tayang: null,
        assigned_riset: '',
        assigned_naskah: '',
        assigned_produksi: '',
        assigned_schedule: '',
      }
    })
    setSavingContent(false)
  }

  async function saveContent() {
    if (!contentModal) return
    const item = contentModal.item
    if (!item.judul?.trim()) return
    setSavingContent(true)
    const payload = {
      workspace_id: workspaceId,
      sprint_id: item._sprintId,
      judul: item.judul!.trim(),
      format: item.format || null,
      platform: item.platform || [],
      status: 'Draft',
      product_id: item.product_id || null,
      tanggal_tayang: item.tanggal_tayang || null,
      assigned_riset: item.assigned_riset || null,
      assigned_naskah: item.assigned_naskah || null,
      assigned_produksi: item.assigned_produksi || null,
      assigned_schedule: item.assigned_schedule || null,
    }
    const { data, error } = await supabase.from('kf_content_ideas').insert(payload).select('*').single()
    if (!error && data) {
      setContents(prev => [data, ...prev])
      // Insert riset notification
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'riset',
        title: `Mulai Riset — ${data.judul}`,
        message: `Konten baru ditambahkan ke sprint. ${item.assigned_riset ? 'Assignee: ' + item.assigned_riset : 'Mulai riset sekarang.'}`,
        content_idea_id: data.id,
      })
      setContentModal(null)
    }
    setSavingContent(false)
  }

  async function markRisetDone(item: ContentItem) {
    setSavingAction(true)
    const now = new Date().toISOString()
    await supabase.from('kf_content_ideas').update({ riset_done_at: now }).eq('id', item.id)
    await supabase.from('kf_notifications').insert({
      workspace_id: workspaceId,
      type: 'naskah',
      title: `Mulai Naskah — ${item.judul}`,
      message: `Riset selesai. ${item.assigned_naskah ? item.assigned_naskah + ', buka' : 'Buka'} Plan untuk buat naskah.`,
      content_idea_id: item.id,
    })
    setContents(prev => prev.map(c => c.id === item.id ? { ...c, riset_done_at: now } : c))
    if (detailModal?.id === item.id) setDetailModal(prev => prev ? { ...prev, riset_done_at: now } : prev)
    setSavingAction(false)
  }

  async function updateStatus(item: ContentItem, newStatus: string) {
    setSavingAction(true)
    const update: Record<string, string> = { status: newStatus }
    if (newStatus === 'Terjadwal') update.terjadwal_at = new Date().toISOString()
    if (newStatus === 'Tayang') update.tayang_at = new Date().toISOString()
    await supabase.from('kf_content_ideas').update(update).eq('id', item.id)

    if (newStatus === 'Terjadwal') {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'schedule',
        title: `Terjadwal — ${item.judul}`,
        message: `Konten sudah dijadwalkan.${item.tanggal_tayang ? ' Tayang: ' + fmtDate(item.tanggal_tayang) : ''}`,
        content_idea_id: item.id,
      })
    }
    setContents(prev => prev.map(c => c.id === item.id ? { ...c, ...update } : c))
    if (detailModal?.id === item.id) setDetailModal(prev => prev ? { ...prev, ...update } : prev)
    setSavingAction(false)
  }

  async function deleteContent(id: string) {
    if (!confirm('Hapus konten ini dari sprint?')) return
    await supabase.from('kf_content_ideas').update({ sprint_id: null }).eq('id', id)
    setContents(prev => prev.filter(c => c.id !== id))
    setDetailModal(null)
  }

  function getProductName(id: string | null) {
    if (!id) return null
    return products.find(p => p.id === id)?.nama || null
  }

  function getStageOf(item: ContentItem) {
    return STAGE_COLS.find(col => col.statuses.includes(item.status))?.id || 'riset'
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: 0, overflow: 'hidden' }}>

      {/* Left: Sprint List */}
      <div style={{ width: 240, flexShrink: 0, background: '#0d0d0d', borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Sprint</div>
          <button onClick={openSprintModal}
            style={{ width: '100%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            + Buat Sprint
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {sprints.length === 0 && (
            <div style={{ fontSize: '0.75rem', color: '#334155', padding: '16px 8px', textAlign: 'center' }}>Belum ada sprint</div>
          )}
          {sprints.map(s => {
            const sc = contents.filter(c => c.sprint_id === s.id)
            const done = sc.filter(c => c.status === 'Tayang').length
            const active = s.id === selectedSprintId
            const isThisWeek = s.start_date <= new Date().toISOString().split('T')[0] && s.end_date >= new Date().toISOString().split('T')[0]
            return (
              <div key={s.id} onClick={() => setSelectedSprintId(s.id)}
                style={{ padding: '10px 10px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: active ? 'rgba(124,58,237,0.15)' : 'transparent', border: `1px solid ${active ? 'rgba(124,58,237,0.3)' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  {isThisWeek && <span style={{ fontSize: '0.55rem', background: '#34d399', color: '#000', fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>AKTIF</span>}
                  <span style={{ fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? '#A78BFA' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                  {fmtDate(s.start_date)} – {fmtDate(s.end_date)}
                </div>
                <div style={{ marginTop: 5, height: 3, background: '#1f1f1f', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${sc.length > 0 ? Math.round(done / sc.length * 100) : 0}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '0.62rem', color: '#334155', marginTop: 3 }}>{done}/{sc.length} tayang</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main: Sprint Board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedSprint ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, color: '#334155' }}>
            <div style={{ fontSize: '2.5rem' }}>⚡</div>
            <div style={{ fontWeight: 700, color: '#475569' }}>Pilih atau buat sprint</div>
            <button onClick={openSprintModal} style={{ background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}>
              + Buat Sprint Pertama
            </button>
          </div>
        ) : (
          <>
            {/* Sprint Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '1rem' }}>{selectedSprint.nama}</span>
                  {selectedSprint.platform && <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#64748b' }}>{selectedSprint.platform}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>{fmtDate(selectedSprint.start_date)} – {fmtDate(selectedSprint.end_date)}</span>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>·</span>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>{sprintContents.length}/{selectedSprint.target_konten} konten</span>
                  <span style={{ fontSize: '0.72rem', color: totalPct === 100 ? '#86efac' : '#A78BFA', fontWeight: 700 }}>{totalPct}% done</span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 140, height: 6, background: '#1a1a1a', borderRadius: 3, flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${totalPct}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              {/* Filters */}
              <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, padding: '6px 10px', color: filterProduct ? '#A78BFA' : '#475569', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}>
                <option value="">Semua Produk</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari konten..."
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: '0.75rem', outline: 'none', width: 140 }} />
            </div>

            {/* Kanban Board */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', padding: '16px', gap: 12 }}>
              {STAGE_COLS.map(col => {
                const items = colItems(col.statuses)
                return (
                  <div key={col.id} style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0d0d0d', border: `1px solid ${col.color}25`, borderRadius: 12, overflow: 'hidden' }}>
                    {/* Column Header */}
                    <div style={{ padding: '10px 12px', borderBottom: `1px solid ${col.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: col.bg }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: col.color }}>{col.label}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: col.color, background: `${col.color}20`, border: `1px solid ${col.color}40`, borderRadius: 8, padding: '1px 7px' }}>{items.length}</span>
                    </div>
                    {/* Cards */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {items.map(item => (
                        <ContentCard key={item.id} item={item} col={col}
                          productName={getProductName(item.product_id)}
                          productColor={item.product_id ? productColorMap[item.product_id] : '#475569'}
                          onClick={() => setDetailModal(item)} />
                      ))}
                      {/* Add button in Riset column */}
                      {col.id === 'riset' && (
                        <button onClick={() => openAddContent(selectedSprint.id)}
                          style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px dashed ${col.color}40`, borderRadius: 8, color: col.color, fontSize: '0.72rem', cursor: 'pointer', marginTop: 2 }}>
                          + Tambah Konten
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Sprint Modal */}
      {sprintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>⚡ Buat Sprint Baru</div>
              <button onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Nama Sprint *</label>
                <input style={fieldStyle()} value={sprintForm.nama} onChange={e => setSprintForm(f => ({ ...f, nama: e.target.value }))} placeholder="cth: Sprint 23-29 Juni" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Mulai *</label>
                  <input type="date" style={fieldStyle()} value={sprintForm.start_date} onChange={e => setSprintForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Selesai *</label>
                  <input type="date" style={fieldStyle()} value={sprintForm.end_date} onChange={e => setSprintForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Target Konten</label>
                  <input type="number" min={1} style={fieldStyle()} value={sprintForm.target_konten} onChange={e => setSprintForm(f => ({ ...f, target_konten: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={sprintForm.platform} onChange={e => setSprintForm(f => ({ ...f, platform: e.target.value }))}>
                    <option value="">Semua</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ background: '#0d1117', border: '1px solid #1f1f1f', borderRadius: 8, padding: '10px 14px', fontSize: '0.75rem', color: '#475569' }}>
                💡 Setelah sprint dibuat, tambah konten satu per satu di kolom <strong style={{ color: '#60a5fa' }}>Riset</strong>. Setiap konten bisa di-assign ke anggota tim berbeda.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setSprintModal(false)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 18px', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button onClick={createSprint} disabled={savingSprint}
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingSprint ? 'not-allowed' : 'pointer' }}>
                  {savingSprint ? 'Membuat...' : 'Buat Sprint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {contentModal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 500, marginTop: 20, marginBottom: 20 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>+ Tambah Konten ke Sprint</div>
              <button onClick={() => setContentModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>Nama Konten *</label>
                <input style={fieldStyle()} value={contentModal.item.judul || ''} onChange={e => setContentModal(m => m ? { ...m, item: { ...m.item, judul: e.target.value } } : m)} placeholder="cth: Review Serum Vit C – Drama Version" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>Produk</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={contentModal.item.product_id || ''} onChange={e => setContentModal(m => m ? { ...m, item: { ...m.item, product_id: e.target.value } } : m)}>
                    <option value="">— Pilih produk —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>Format</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={contentModal.item.format || ''} onChange={e => setContentModal(m => m ? { ...m, item: { ...m.item, format: e.target.value } } : m)}>
                    <option value="">— Format —</option>
                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={Array.isArray(contentModal.item.platform) ? contentModal.item.platform[0] || '' : ''} onChange={e => setContentModal(m => m ? { ...m, item: { ...m.item, platform: [e.target.value] } } : m)}>
                    <option value="">— Platform —</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 5, fontWeight: 600 }}>Tanggal Tayang</label>
                  <input type="date" style={fieldStyle()} value={contentModal.item.tanggal_tayang || ''} onChange={e => setContentModal(m => m ? { ...m, item: { ...m.item, tanggal_tayang: e.target.value } } : m)} />
                </div>
              </div>
              {memberCount > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>Assign Tim (opsional)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { key: 'assigned_riset', label: '🔍 Riset' },
                      { key: 'assigned_naskah', label: '✍️ Naskah' },
                      { key: 'assigned_produksi', label: '🎨 Produksi' },
                      { key: 'assigned_schedule', label: '📅 Schedule' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: 3 }}>{label}</div>
                        <input style={fieldStyle({ fontSize: '0.8rem', padding: '7px 10px' })}
                          value={(contentModal.item as Record<string, string>)[key] || ''}
                          onChange={e => setContentModal(m => m ? { ...m, item: { ...m.item, [key]: e.target.value } } : m)}
                          placeholder="Nama anggota..." />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setContentModal(null)} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 18px', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button onClick={saveContent} disabled={savingContent}
                  style={{ background: 'linear-gradient(135deg,#059669,#34d399)', border: 'none', borderRadius: 8, padding: '9px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: savingContent ? 'not-allowed' : 'pointer' }}>
                  {savingContent ? 'Menyimpan...' : 'Tambah ke Sprint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Action Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                {detailModal.product_id && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: productColorMap[detailModal.product_id], marginBottom: 4 }}>
                    {getProductName(detailModal.product_id)}
                  </div>
                )}
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{detailModal.judul}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  {detailModal.format && <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#64748b' }}>{detailModal.format}</span>}
                  {Array.isArray(detailModal.platform) && detailModal.platform[0] && <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#64748b' }}>{detailModal.platform[0]}</span>}
                  {detailModal.tanggal_tayang && <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>📅 {fmtDate(detailModal.tanggal_tayang)}</span>}
                </div>
              </div>
              <button onClick={() => setDetailModal(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>

            {/* Stage progress */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1f1f1f' }}>
              <div style={{ display: 'flex', gap: 0 }}>
                {STAGE_COLS.map((col, i) => {
                  const isCurrent = col.statuses.includes(detailModal.status)
                  const isPast = STAGE_COLS.findIndex(c => c.statuses.includes(detailModal.status)) > i
                  return (
                    <div key={col.id} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: isCurrent ? col.color : isPast ? '#334155' : '#1a1a1a', border: `2px solid ${isCurrent ? col.color : isPast ? '#334155' : '#2a2a2a'}`, margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isPast && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
                      </div>
                      <div style={{ fontSize: '0.55rem', color: isCurrent ? col.color : '#334155', fontWeight: isCurrent ? 700 : 400 }}>{col.label}</div>
                      {i < STAGE_COLS.length - 1 && <div style={{ position: 'absolute', top: 9, left: '60%', right: '-40%', height: 2, background: isPast ? '#334155' : '#1a1a1a' }} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assignments */}
            {(detailModal.assigned_riset || detailModal.assigned_naskah || detailModal.assigned_produksi || detailModal.assigned_schedule) && (
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #1f1f1f', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'assigned_riset', label: '🔍', val: detailModal.assigned_riset },
                  { key: 'assigned_naskah', label: '✍️', val: detailModal.assigned_naskah },
                  { key: 'assigned_produksi', label: '🎨', val: detailModal.assigned_produksi },
                  { key: 'assigned_schedule', label: '📅', val: detailModal.assigned_schedule },
                ].filter(a => a.val).map(a => (
                  <span key={a.key} style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.label} <span style={{ color: '#94a3b8' }}>{a.val}</span></span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detailModal.status === 'Draft' && !detailModal.riset_done_at && (
                <button onClick={() => markRisetDone(detailModal)} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '10px', color: '#60a5fa', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  🔍 Tandai Riset Selesai → Notif Naskah
                </button>
              )}
              {detailModal.status === 'Draft' && detailModal.riset_done_at && (
                <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, padding: '10px', fontSize: '0.8rem', color: '#60a5fa', textAlign: 'center' }}>
                  ✓ Riset selesai {relativeTime(detailModal.riset_done_at)} — menunggu naskah di Plan
                </div>
              )}
              {(detailModal.status === 'Draft' || detailModal.status === 'Naskah Siap') && (
                <a href="/plan" style={{ display: 'block', width: '100%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '10px', color: '#fbbf24', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                  ✍️ Buka Plan → Buat Naskah
                </a>
              )}
              {detailModal.status === 'Naskah Siap' && (
                <a href="/studio" style={{ display: 'block', width: '100%', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '10px', color: '#f97316', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                  🎨 Buka Studio → Produksi
                </a>
              )}
              {detailModal.status === 'Produksi' && (
                <a href="/studio" style={{ display: 'block', width: '100%', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '10px', color: '#f97316', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
                  🎨 Lanjut di Studio
                </a>
              )}
              {detailModal.status === 'Siap Tayang' && (
                <button onClick={() => updateStatus(detailModal, 'Terjadwal')} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 8, padding: '10px', color: '#a78bfa', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  📅 Tandai Terjadwal
                </button>
              )}
              {detailModal.status === 'Terjadwal' && (
                <button onClick={() => updateStatus(detailModal, 'Tayang')} disabled={savingAction}
                  style={{ width: '100%', background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.3)', borderRadius: 8, padding: '10px', color: '#86efac', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                  🚀 Tandai Tayang
                </button>
              )}
              {detailModal.status === 'Tayang' && (
                <div style={{ background: 'rgba(134,239,172,0.06)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px', fontSize: '0.8rem', color: '#86efac', textAlign: 'center' }}>
                  ✓ Sudah Tayang {detailModal.tayang_at ? relativeTime(detailModal.tayang_at) : ''}
                </div>
              )}
              <button onClick={() => deleteContent(detailModal.id)}
                style={{ width: '100%', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px', color: '#475569', fontSize: '0.78rem', cursor: 'pointer' }}>
                Hapus dari Sprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ContentCard({ item, col, productName, productColor, onClick }: {
  item: ContentItem
  col: typeof STAGE_COLS[0]
  productName: string | null
  productColor: string
  onClick: () => void
}) {
  const platform = Array.isArray(item.platform) ? item.platform[0] : item.platform
  return (
    <div onClick={onClick}
      style={{ background: '#111', border: `1px solid ${col.color}20`, borderRadius: 8, padding: '10px 10px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.1s' }}>
      {productName && (
        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: productColor, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ● {productName}
        </div>
      )}
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 6 }}>{item.judul}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: item.tanggal_tayang || item.assigned_riset ? 5 : 0 }}>
        {item.format && <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3, background: '#1a1a1a', color: '#475569' }}>{item.format}</span>}
        {platform && <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3, background: '#1a1a1a', color: '#475569' }}>{platform}</span>}
        {item.riset_done_at && item.status === 'Draft' && <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>riset ✓</span>}
      </div>
      {item.tanggal_tayang && (
        <div style={{ fontSize: '0.62rem', color: '#334155' }}>📅 {new Date(item.tanggal_tayang).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
      )}
      {(item.assigned_riset || item.assigned_naskah || item.assigned_produksi || item.assigned_schedule) && (
        <div style={{ fontSize: '0.6rem', color: '#334155', marginTop: 3 }}>
          👤 {item.assigned_riset || item.assigned_naskah || item.assigned_produksi || item.assigned_schedule}
        </div>
      )}
    </div>
  )
}
