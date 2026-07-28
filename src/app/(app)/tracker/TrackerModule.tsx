'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Metric = {
  id?: string
  workspace_id: string
  platform: string
  month: number
  year: number
  impressions: number | string
  reach: number | string
  follower_growth: number | string
  shares: number | string
  comments: number | string
  likes: number | string
  clicks: number | string
  cost_of_campaign: number | string
  conversions: number | string
}

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const NOW = new Date()

function emptyMetric(wsId: string): Metric {
  return {
    workspace_id: wsId, platform: 'TikTok',
    month: NOW.getMonth() + 1, year: NOW.getFullYear(),
    impressions: '', reach: '', follower_growth: '', shares: '',
    comments: '', likes: '', clicks: '', cost_of_campaign: '', conversions: '',
  }
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function fmt(n: number | string) { return Number(n).toLocaleString('id-ID') }

export default function TrackerModule({ initialMetrics, workspaceId }: { initialMetrics: Metric[]; workspaceId: string }) {
  const [metrics, setMetrics] = useState<Metric[]>(initialMetrics)
  const [modal, setModal] = useState<{ open: boolean; metric: Metric }>({ open: false, metric: emptyMetric(workspaceId) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')

  function openAdd() { setModal({ open: true, metric: emptyMetric(workspaceId) }); setError('') }
  function openEdit(m: Metric) { setModal({ open: true, metric: { ...m } }); setError('') }
  function closeModal() { setModal(m => ({ ...m, open: false })) }
  function setField(key: keyof Metric, value: string | number) { setModal(m => ({ ...m, metric: { ...m.metric, [key]: value } })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const numFields = ['impressions', 'reach', 'follower_growth', 'shares', 'comments', 'likes', 'clicks', 'conversions'] as const
    const m = { ...modal.metric, workspace_id: workspaceId, cost_of_campaign: Number(modal.metric.cost_of_campaign) || 0 }
    numFields.forEach(f => { (m as Record<string, unknown>)[f] = Number((m as Record<string, unknown>)[f]) || 0 })
    if (m.id) {
      const { error: err } = await supabase.from('kf_monthly_metrics').update(m).eq('id', m.id)
      if (err) { setError(err.message); setSaving(false); return }
      setMetrics(prev => prev.map(x => x.id === m.id ? m : x))
    } else {
      const { data, error: err } = await supabase.from('kf_monthly_metrics').insert(m).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setMetrics(prev => [{ ...m, id: data.id }, ...prev])
    }
    setSaving(false)
    closeModal()
  }

  async function deleteMetric(id: string) {
    if (!confirm('Hapus data ini?')) return
    const supabase = createClient()
    await supabase.from('kf_monthly_metrics').delete().eq('id', id)
    setMetrics(prev => prev.filter(x => x.id !== id))
  }

  const filtered = metrics.filter(m => !filterPlatform || m.platform === filterPlatform)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2a3547', letterSpacing: '-0.5px', marginBottom: 6 }}>Tracker</h1>
          <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Pantau performa bulanan di setiap platform</p>
        </div>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Input Performa
        </button>
      </div>

      {/* Platform Filter */}
      {metrics.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['', ...PLATFORMS].map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)}
              style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: filterPlatform === p ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: filterPlatform === p ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: filterPlatform === p ? '#1a73e8' : '#64748b', cursor: 'pointer' }}>
              {p || 'Semua'}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#5a6a85' }}>
          <div style={{ marginBottom: 12, color: '#5a6a85' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>Belum ada data performa</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>Input data bulanan dari setiap platform kamu</div>
          <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            + Input Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(m => (
            <div key={m.id} style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: '#1a73e8', fontSize: '0.95rem' }}>{m.platform}</span>
                  <span style={{ fontSize: '0.8rem', color: '#5a6a85' }}>{MONTHS[(m.month as number) - 1]} {m.year}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(m)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 7, padding: '5px 10px', color: '#1a73e8', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteMetric(m.id!)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 7, padding: '5px 8px', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Impressi', value: m.impressions },
                  { label: 'Reach', value: m.reach },
                  { label: 'Follower +', value: m.follower_growth },
                  { label: 'Likes', value: m.likes },
                  { label: 'Komentar', value: m.comments },
                  { label: 'Share', value: m.shares },
                  { label: 'Klik', value: m.clicks },
                  { label: 'Konversi', value: m.conversions },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#5a6a85', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.9rem' }}>{fmt(value)}</div>
                  </div>
                ))}
              </div>
              {Number(m.cost_of_campaign) > 0 && (
                <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#5a6a85' }}>
                  Cost campaign: <span style={{ color: '#dc2626', fontWeight: 600 }}>Rp {fmt(m.cost_of_campaign)}</span>
                  {Number(m.conversions) > 0 && (
                    <span style={{ marginLeft: 16 }}>
                      CPR: <span style={{ color: '#1a73e8', fontWeight: 600 }}>Rp {Math.round(Number(m.cost_of_campaign) / Number(m.conversions)).toLocaleString('id-ID')}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2a3547' }}>Input Data Performa</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.metric.platform ?? ''} onChange={e => setField('platform', e.target.value)}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Bulan</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.metric.month ?? 1} onChange={e => setField('month', Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tahun</label>
                  <input type="number" style={fieldStyle()} value={modal.metric.year} onChange={e => setField('year', Number(e.target.value))} min="2020" max="2030" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {([
                  ['impressions', 'Impressi'],
                  ['reach', 'Reach'],
                  ['follower_growth', 'Follower Growth'],
                  ['likes', 'Likes'],
                  ['comments', 'Komentar'],
                  ['shares', 'Share'],
                  ['clicks', 'Klik/Visit'],
                  ['conversions', 'Konversi/Order'],
                  ['cost_of_campaign', 'Cost Campaign (Rp)'],
                ] as [keyof Metric, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                    <input type="number" style={fieldStyle()} value={modal.metric[key] as number} onChange={e => setField(key, e.target.value)} placeholder="0" min="0" />
                  </div>
                ))}
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
