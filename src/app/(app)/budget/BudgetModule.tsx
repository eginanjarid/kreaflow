'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

type Transaction = {
  id?: string
  workspace_id: string
  tanggal: string
  deskripsi: string
  kategori: string
  tipe: string
  jumlah: number | string
}

const TIPE = ['Pemasukan', 'Pengeluaran']
const KATEGORI_PEMASUKAN_AFFILIATE = ['Komisi Affiliate', 'Fee Endorsement', 'Ads Revenue', 'Penjualan Produk', 'Lainnya']
const KATEGORI_PEMASUKAN_CREATOR = ['Fee Endorsement', 'Ads Revenue', 'Penjualan Produk', 'Sponsor', 'Lainnya']
const KATEGORI_PENGELUARAN = ['Iklan/Ads', 'Tools & Software', 'Konten Produksi', 'Gaji Freelancer', 'Internet', 'Peralatan', 'Lainnya']
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatRp(n: number) { return 'Rp ' + Math.abs(n).toLocaleString('id-ID') }

function emptyTx(wsId: string): Transaction {
  return { workspace_id: wsId, tanggal: new Date().toISOString().slice(0, 10), deskripsi: '', kategori: '', tipe: 'Pengeluaran', jumlah: '' }
}

export default function BudgetModule({ initialTx, workspaceId, isAffiliate = false }: { initialTx: Transaction[]; workspaceId: string; isAffiliate?: boolean }) {
  const KATEGORI_PEMASUKAN = isAffiliate ? KATEGORI_PEMASUKAN_AFFILIATE : KATEGORI_PEMASUKAN_CREATOR
  const [transactions, setTransactions] = useState<Transaction[]>(initialTx)
  const [modal, setModal] = useState<{ open: boolean; tx: Transaction } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const [activeYear, setActiveYear] = useState(now.getFullYear())
  const [activeMonth, setActiveMonth] = useState(now.getMonth())

  // Available years
  const years = useMemo(() => {
    const set = new Set<number>([now.getFullYear()])
    transactions.forEach(t => set.add(new Date(t.tanggal + 'T00:00:00').getFullYear()))
    return Array.from(set).sort((a, b) => b - a)
  }, [transactions])

  // Transactions for active month
  const monthTx = useMemo(() =>
    transactions
      .filter(t => { const d = new Date(t.tanggal + 'T00:00:00'); return d.getFullYear() === activeYear && d.getMonth() === activeMonth })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [transactions, activeYear, activeMonth])

  const pemasukan = monthTx.filter(t => t.tipe === 'Pemasukan').reduce((s, t) => s + Number(t.jumlah), 0)
  const pengeluaran = monthTx.filter(t => t.tipe === 'Pengeluaran').reduce((s, t) => s + Number(t.jumlah), 0)
  const profit = pemasukan - pengeluaran
  const marginPct = pemasukan > 0 ? Math.round(profit / pemasukan * 100) : 0

  // Category breakdown
  const breakdown = useMemo(() => {
    const map = new Map<string, { tipe: string; total: number }>()
    monthTx.forEach(t => {
      const key = t.kategori || 'Lainnya'
      const ex = map.get(key)
      if (ex) ex.total += Number(t.jumlah)
      else map.set(key, { tipe: t.tipe, total: Number(t.jumlah) })
    })
    return Array.from(map.entries()).map(([nama, v]) => ({ nama, ...v })).sort((a, b) => b.total - a.total)
  }, [monthTx])
  const maxBreakdown = Math.max(...breakdown.map(k => k.total), 1)

  function openAdd() { setModal({ open: true, tx: emptyTx(workspaceId) }); setError('') }
  function openEdit(t: Transaction) { setModal({ open: true, tx: { ...t } }); setError('') }
  function setField(key: keyof Transaction, value: string | number) {
    setModal(prev => prev ? { ...prev, tx: { ...prev.tx, [key]: value } } : prev)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    const t = modal.tx
    const missing: string[] = []
    if (!t.tanggal) missing.push('Tanggal')
    if (!t.deskripsi?.trim()) missing.push('Deskripsi')
    if (!t.kategori) missing.push('Kategori')
    if (!Number(t.jumlah)) missing.push('Jumlah')
    if (missing.length) { showToast(`Wajib diisi: ${missing.join(', ')}.`); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const tx = { ...modal.tx, jumlah: Number(modal.tx.jumlah), workspace_id: workspaceId }
    if (tx.id) {
      const { error: err } = await supabase.from('kf_transactions').update(tx).eq('id', tx.id)
      if (err) { setError(err.message); setSaving(false); return }
      setTransactions(prev => prev.map(x => x.id === tx.id ? tx : x))
    } else {
      const { data, error: err } = await supabase.from('kf_transactions').insert(tx).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setTransactions(prev => [{ ...tx, id: data.id }, ...prev])
    }
    setSaving(false); showToast('Transaksi berhasil disimpan.', 'success'); setModal(null)
  }

  async function deleteTx(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    const supabase = createClient()
    await supabase.from('kf_transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Budget</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Pemasukan & pengeluaran per bulan</p>
        </div>
        <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Catat Transaksi
        </button>
      </div>

      {/* Year + Month Picker */}
      <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 16, padding: '12px 16px', marginBottom: 14 }}>
        {years.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {years.map(y => (
              <button key={y} onClick={() => setActiveYear(y)}
                style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, border: activeYear === y ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: activeYear === y ? 'rgba(26,115,232,0.1)' : 'transparent', color: activeYear === y ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
                {y}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          {MONTHS.map((m, i) => (
            <button key={i} onClick={() => setActiveMonth(i)}
              style={{ padding: '6px 2px', borderRadius: 8, fontSize: '0.7rem', fontWeight: activeMonth === i ? 700 : 400, border: 'none', background: activeMonth === i ? '#1a73e8' : 'transparent', color: activeMonth === i ? '#fff' : '#6b7280', cursor: 'pointer', textAlign: 'center' }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pemasukan</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#059669' }}>{formatRp(pemasukan)}</div>
        </div>
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Pengeluaran</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626' }}>{formatRp(pengeluaran)}</div>
        </div>
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 14, padding: '14px 16px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Profit Bersih</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: profit >= 0 ? '#1a73e8' : '#dc2626' }}>{profit < 0 ? '-' : ''}{formatRp(profit)}</div>
            </div>
            {pemasukan > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Margin</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: marginPct >= 50 ? '#059669' : marginPct >= 20 ? '#d97706' : '#dc2626' }}>{marginPct}%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {breakdown.length > 0 && (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Breakdown Kategori</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breakdown.map(k => (
              <div key={k.nama}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.78rem', color: '#374151' }}>{k.nama}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: k.tipe === 'Pemasukan' ? '#059669' : '#dc2626' }}>{formatRp(k.total)}</span>
                </div>
                <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${(k.total / maxBreakdown) * 100}%`, background: k.tipe === 'Pemasukan' ? '#10b981' : '#ef4444', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      {monthTx.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>💸</div>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>Belum ada transaksi di {MONTHS[activeMonth]} {activeYear}</div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 18 }}>Catat pemasukan dan pengeluaran kamu</div>
          <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '9px 18px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>+ Catat Transaksi</button>
        </div>
      ) : (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: 16, overflow: 'hidden' }}>
          {monthTx.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < monthTx.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: t.tipe === 'Pemasukan' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>
                {t.tipe === 'Pemasukan' ? '↑' : '↓'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.deskripsi || t.kategori}</div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                  {new Date(t.tanggal + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  {t.kategori && ` · ${t.kategori}`}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: t.tipe === 'Pemasukan' ? '#059669' : '#dc2626', flexShrink: 0 }}>
                {t.tipe === 'Pemasukan' ? '+' : '-'}{formatRp(Number(t.jumlah))}
              </div>
              <button onClick={() => openEdit(t)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 5, padding: '3px 7px', color: '#6b7280', fontSize: '0.68rem', cursor: 'pointer', flexShrink: 0 }}>Edit</button>
              <button onClick={() => deleteTx(t.id!)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{modal.tx.id ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.82rem' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Tipe</label>
                  <select value={modal.tx.tipe} onChange={e => { setField('tipe', e.target.value); setField('kategori', '') }}
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                    {TIPE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Tanggal</label>
                  <input type="date" value={modal.tx.tanggal} onChange={e => setField('tanggal', e.target.value)} required
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Deskripsi *</label>
                  <input value={modal.tx.deskripsi} onChange={e => setField('deskripsi', e.target.value)} placeholder="Deskripsi transaksi" required
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Kategori</label>
                  <select value={modal.tx.kategori} onChange={e => setField('kategori', e.target.value)}
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Pilih kategori</option>
                    {(modal.tx.tipe === 'Pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: 5, fontWeight: 600 }}>Jumlah (Rp) *</label>
                  <input type="number" min="0" value={modal.tx.jumlah} onChange={e => setField('jumlah', e.target.value)} placeholder="0" required
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: '0.875rem', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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
