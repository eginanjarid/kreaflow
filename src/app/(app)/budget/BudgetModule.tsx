'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

function formatRp(n: number) {
  return 'Rp ' + Math.abs(n).toLocaleString('id-ID')
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function emptyTx(wsId: string): Transaction {
  return { workspace_id: wsId, tanggal: new Date().toISOString().slice(0, 10), deskripsi: '', kategori: '', tipe: 'Pengeluaran', jumlah: '' }
}

export default function BudgetModule({ initialTx, workspaceId, isAffiliate = false }: { initialTx: Transaction[]; workspaceId: string; isAffiliate?: boolean }) {
  const KATEGORI_PEMASUKAN = isAffiliate ? KATEGORI_PEMASUKAN_AFFILIATE : KATEGORI_PEMASUKAN_CREATOR
  const [transactions, setTransactions] = useState<Transaction[]>(initialTx)
  const [modal, setModal] = useState<{ open: boolean; tx: Transaction }>({ open: false, tx: emptyTx(workspaceId) })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterTipe, setFilterTipe] = useState('')

  const pemasukan = transactions.filter(t => t.tipe === 'Pemasukan').reduce((s, t) => s + Number(t.jumlah), 0)
  const pengeluaran = transactions.filter(t => t.tipe === 'Pengeluaran').reduce((s, t) => s + Number(t.jumlah), 0)
  const saldo = pemasukan - pengeluaran

  const filtered = transactions.filter(t => !filterTipe || t.tipe === filterTipe)

  function openAdd() { setModal({ open: true, tx: emptyTx(workspaceId) }); setError('') }
  function openEdit(t: Transaction) { setModal({ open: true, tx: { ...t } }); setError('') }
  function closeModal() { setModal(m => ({ ...m, open: false })) }
  function setField(key: keyof Transaction, value: string | number) { setModal(m => ({ ...m, tx: { ...m.tx, [key]: value } })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const t = { ...modal.tx, jumlah: Number(modal.tx.jumlah), workspace_id: workspaceId }
    if (t.id) {
      const { error: err } = await supabase.from('kf_transactions').update(t).eq('id', t.id)
      if (err) { setError(err.message); setSaving(false); return }
      setTransactions(prev => prev.map(x => x.id === t.id ? t : x))
    } else {
      const { data, error: err } = await supabase.from('kf_transactions').insert(t).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setTransactions(prev => [{ ...t, id: data.id }, ...prev])
    }
    setSaving(false)
    closeModal()
  }

  async function deleteTx(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    const supabase = createClient()
    await supabase.from('kf_transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(x => x.id !== id))
  }

  const kategoriOptions = modal.tx.tipe === 'Pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN

  return (
    <div>
      <div className="kf-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Budget</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tracking pemasukan dan pengeluaran konten kamu</p>
        </div>
        <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Catat Transaksi
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pemasukan</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#059669' }}>{formatRp(pemasukan)}</div>
        </div>
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pengeluaran</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#dc2626' }}>{formatRp(pengeluaran)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo Bersih</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: saldo >= 0 ? '#1a73e8' : '#dc2626' }}>{saldo < 0 ? '-' : ''}{formatRp(saldo)}</div>
        </div>
      </div>

      {/* Filter */}
      {transactions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['', ...TIPE].map(t => (
            <button key={t} onClick={() => setFilterTipe(t)}
              style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: filterTipe === t ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: filterTipe === t ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: filterTipe === t ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
              {t || 'Semua'}
            </button>
          ))}
        </div>
      )}

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#6b7280' }}>
          <div style={{ marginBottom: 12, color: '#6b7280' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
          <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Belum ada transaksi</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>Mulai catat pemasukan dan pengeluaran kamu</div>
          <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            + Catat Pertama
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, overflow: 'hidden' }}>
          {filtered.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #e5eaf2' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.tipe === 'Pemasukan' ? 'rgba(134,239,172,0.1)' : 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {t.tipe === 'Pemasukan' ? '↑' : '↓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem', marginBottom: 2 }}>{t.deskripsi || t.kategori}</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t.tanggal} · {t.kategori}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: t.tipe === 'Pemasukan' ? '#059669' : '#dc2626', marginRight: 8 }}>
                {t.tipe === 'Pemasukan' ? '+' : '-'}{formatRp(Number(t.jumlah))}
              </div>
              <button onClick={() => openEdit(t)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 8px', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteTx(t.id!)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{modal.tx.id ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Tipe</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.tx.tipe ?? ''} onChange={e => { setField('tipe', e.target.value); setField('kategori', '') }}>
                    {TIPE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Tanggal</label>
                  <input type="date" style={fieldStyle()} value={modal.tx.tanggal} onChange={e => setField('tanggal', e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Deskripsi *</label>
                  <input style={fieldStyle()} value={modal.tx.deskripsi} onChange={e => setField('deskripsi', e.target.value)} placeholder="Deskripsi transaksi" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Kategori</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.tx.kategori ?? ''} onChange={e => setField('kategori', e.target.value)}>
                    <option value="">Pilih kategori</option>
                    {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Jumlah (Rp) *</label>
                  <input type="number" style={fieldStyle()} value={modal.tx.jumlah} onChange={e => setField('jumlah', e.target.value)} placeholder="0" min="0" required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 20px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
