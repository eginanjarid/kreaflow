'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

type DailyMetric = {
  id?: string
  workspace_id: string
  tanggal: string
  platform: string
  views: number | string
  likes: number | string
  komentar: number | string
  shares: number | string
  follower_gained: number | string
}

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const PLATFORM_COLOR: Record<string, string> = {
  TikTok: '#010101', Instagram: '#e1306c', YouTube: '#ff0000',
  Facebook: '#1877f2', Shopee: '#f36f21',
}

function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function fmtNum(n: number | string) {
  const v = Number(n) || 0
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'jt'
  if (v >= 1000) return (v / 1000).toFixed(1) + 'rb'
  return v.toLocaleString('id-ID')
}

function fmtDateLabel(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const yest = new Date(today); yest.setDate(yest.getDate() - 1)
  const dtDay = new Date(dt); dtDay.setHours(0,0,0,0)
  if (dtDay.getTime() === today.getTime()) return 'Hari Ini'
  if (dtDay.getTime() === yest.getTime()) return 'Kemarin'
  return dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

function emptyMetric(wsId: string): DailyMetric {
  return { workspace_id: wsId, tanggal: yesterday(), platform: 'TikTok', views: '', likes: '', komentar: '', shares: '', follower_gained: '' }
}

export default function TrackerModule({ initialMetrics, workspaceId }: { initialMetrics: DailyMetric[]; workspaceId: string }) {
  const [metrics, setMetrics] = useState<DailyMetric[]>(initialMetrics)
  const [modal, setModal] = useState<{ open: boolean; metric: DailyMetric } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')

  // Weekly summary (last 7 days)
  const weeklySummary = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    const recent = metrics.filter(m => new Date(m.tanggal + 'T00:00:00') >= cutoff)
    const map = new Map<string, { views: number; likes: number; komentar: number; shares: number; follower: number }>()
    recent.forEach(m => {
      if (!map.has(m.platform)) map.set(m.platform, { views: 0, likes: 0, komentar: 0, shares: 0, follower: 0 })
      const p = map.get(m.platform)!
      p.views += Number(m.views) || 0
      p.likes += Number(m.likes) || 0
      p.komentar += Number(m.komentar) || 0
      p.shares += Number(m.shares) || 0
      p.follower += Number(m.follower_gained) || 0
    })
    return Array.from(map.entries()).map(([platform, d]) => ({
      platform, ...d,
      er: d.views > 0 ? ((d.likes + d.komentar + d.shares) / d.views * 100).toFixed(1) : '0',
    }))
  }, [metrics])

  // Group by date descending
  const grouped = useMemo(() => {
    const filtered = filterPlatform ? metrics.filter(m => m.platform === filterPlatform) : metrics
    const map = new Map<string, DailyMetric[]>()
    filtered.forEach(m => { if (!map.has(m.tanggal)) map.set(m.tanggal, []); map.get(m.tanggal)!.push(m) })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [metrics, filterPlatform])

  const usedPlatforms = [...new Set(metrics.map(m => m.platform))]

  function openAdd() { setModal({ open: true, metric: emptyMetric(workspaceId) }); setError('') }
  function openEdit(m: DailyMetric) { setModal({ open: true, metric: { ...m } }); setError('') }
  function setField(key: keyof DailyMetric, value: string | number) {
    setModal(prev => prev ? { ...prev, metric: { ...prev.metric, [key]: value } } : prev)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    const missing: string[] = []
    if (!modal.metric.tanggal) missing.push('Tanggal')
    if (!modal.metric.platform) missing.push('Platform')
    if (missing.length) { showToast(`Wajib diisi: ${missing.join(', ')}.`); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const numFields = ['views', 'likes', 'komentar', 'shares', 'follower_gained'] as const
    const m = { ...modal.metric, workspace_id: workspaceId }
    numFields.forEach(f => { (m as Record<string, unknown>)[f] = Number((m as Record<string, unknown>)[f]) || 0 })
    if (m.id) {
      const { error: err } = await supabase.from('kf_daily_metrics').update(m).eq('id', m.id)
      if (err) { setError(err.message); setSaving(false); return }
      setMetrics(prev => prev.map(x => x.id === m.id ? m : x))
    } else {
      const { data, error: err } = await supabase.from('kf_daily_metrics').insert(m).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setMetrics(prev => [{ ...m, id: data.id }, ...prev].sort((a, b) => b.tanggal.localeCompare(a.tanggal)))
    }
    setSaving(false); showToast('Data berhasil disimpan.', 'success'); setModal(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus data ini?')) return
    const supabase = createClient()
    await supabase.from('kf_daily_metrics').delete().eq('id', id)
    setMetrics(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Tracker</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Input performa harian tiap platform</p>
        </div>
        <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Input Hari Ini
        </button>
      </div>

      {/* Weekly Summary */}
      {weeklySummary.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Ringkasan 7 Hari Terakhir</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weeklySummary.map(s => (
              <div key={s.platform} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLOR[s.platform] || '#6b7280', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{s.platform}</span>
                  <span style={{ fontSize: '0.65rem', color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>ER {s.er}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {[['Views', s.views], ['Likes', s.likes], ['Komentar', s.komentar], ['Share', s.shares], ['Follower+', s.follower]].map(([label, value]) => (
                    <div key={label as string} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 8, padding: '8px 4px' }}>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>{fmtNum(value as number)}</div>
                      <div style={{ fontSize: '0.58rem', color: '#6b7280', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform filter */}
      {usedPlatforms.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['', ...usedPlatforms].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, border: filterPlatform === p ? `1px solid ${PLATFORM_COLOR[p] || '#1a73e8'}` : '1px solid #e5e7eb', background: filterPlatform === p ? (PLATFORM_COLOR[p] || '#1a73e8') + '15' : '#f3f4f6', color: filterPlatform === p ? (PLATFORM_COLOR[p] || '#1a73e8') : '#6b7280', cursor: 'pointer' }}>
              {p || 'Semua'}
            </button>
          ))}
        </div>
      )}

      {/* Entries grouped by date */}
      {grouped.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6 }}>Belum ada data performa</div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 20 }}>Input data harian dari setiap platform kamu</div>
          <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>+ Input Pertama</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(([tanggal, entries]) => (
            <div key={tanggal}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {fmtDateLabel(tanggal)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {entries.map(m => (
                  <div key={m.id} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLOR[m.platform] || '#6b7280' }} />
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>{m.platform}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(m)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 5, padding: '3px 8px', color: '#6b7280', fontSize: '0.68rem', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(m.id!)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '3px 4px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                      {[['Views', m.views], ['Likes', m.likes], ['Komen', m.komentar], ['Share', m.shares], ['Flwr+', m.follower_gained]].map(([label, value]) => (
                        <div key={label as string} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 6, padding: '6px 4px' }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.82rem' }}>{fmtNum(value as number)}</div>
                          <div style={{ fontSize: '0.58rem', color: '#6b7280', marginTop: 1 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{modal.metric.id ? 'Edit Data Performa' : 'Input Performa Harian'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.82rem' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Tanggal</label>
                  <input type="date" value={modal.metric.tanggal} onChange={e => setField('tanggal', e.target.value)} required
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Platform</label>
                  <select value={modal.metric.platform} onChange={e => setField('platform', e.target.value)}
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {([
                  ['views', 'Views / Tayangan'],
                  ['likes', 'Likes'],
                  ['komentar', 'Komentar'],
                  ['shares', 'Share / Repost'],
                  ['follower_gained', 'Follower Baru'],
                ] as [keyof DailyMetric, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>{label}</label>
                    <input type="number" min="0" value={modal.metric[key] as number} onChange={e => setField(key, e.target.value)} placeholder="0"
                      style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setModal(null)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 18px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
