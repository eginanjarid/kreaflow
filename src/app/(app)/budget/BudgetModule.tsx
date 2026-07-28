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
const KATEGORI_PEMASUKAN = ['Komisi Affiliate', 'Fee Endorsement', 'Ads Revenue', 'Penjualan Produk', 'Lainnya']
const KATEGORI_PENGELUARAN = ['Iklan/Ads', 'Tools & Software', 'Konten Produksi', 'Gaji Freelancer', 'Internet', 'Peralatan', 'Lainnya']

function formatRp(n: number) {
  return 'Rp ' + Math.abs(n).toLocaleString('id-ID')
}
function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function emptyTx(wsId: string): Transaction {
  return { workspace_id: wsId, tanggal: new Date().toISOString().slice(0, 10), deskripsi: '', kategori: '', tipe: 'Pengeluaran', jumlah: '' }
}

export default function BudgetModule({ initialTx, workspaceId }: { initialTx: Transaction[]; workspaceId: string }) {
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2a3547', marginBottom: 6 }}>Budget</h1>
          <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Tracking pemasukan dan pengeluaran konten kamu</p>
        </div>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          + Catat Transaksi
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pemasukan</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#86efac' }}>{formatRp(pemasukan)}</div>
        </div>
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pengeluaran</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>{formatRp(pengeluaran)}</div>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${saldo >= 0 ? 'rgba(134,239,172,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 20, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#5a6a85', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo Bersih</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: saldo >= 0 ? '#42a5f5' : '#f87171' }}>{saldo < 0 ? '-' : ''}{formatRp(saldo)}</div>
        </div>
      </div>

      {/* Filter */}
      {transactions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['', ...TIPE].map(t => (
            <button key={t} onClick={() => setFilterTipe(t)}
              style={{ padding: '5px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: filterTipe === t ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: filterTipe === t ? 'rgba(26,115,232,0.15)' : '#1a1a1a', color: filterTipe === t ? '#42a5f5' : '#64748b', cursor: 'pointer' }}>
              {t || 'Semua'}
            </button>
          ))}
        </div>
      )}

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#5a6a85' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💰</div>
          <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>Belum ada transaksi</div>
          <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>Mulai catat pemasukan dan pengeluaran kamu</div>
          <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            + Catat Pertama
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, overflow: 'hidden' }}>
          {filtered.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: i < filtered.length - 1 ? '1px solid #1f1f1f' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.tipe === 'Pemasukan' ? 'rgba(134,239,172,0.1)' : 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {t.tipe === 'Pemasukan' ? '↑' : '↓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: '#2a3547', fontSize: '0.875rem', marginBottom: 2 }}>{t.deskripsi || t.kategori}</div>
                <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>{t.tanggal} · {t.kategori}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: t.tipe === 'Pemasukan' ? '#86efac' : '#f87171', marginRight: 8 }}>
                {t.tipe === 'Pemasukan' ? '+' : '-'}{formatRp(Number(t.jumlah))}
              </div>
              <button onClick={() => openEdit(t)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 8px', color: '#5a6a85', fontSize: '0.72rem', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => deleteTx(t.id!)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', cursor: 'pointer', fontSize: '0.85rem' }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2a3547' }}>{modal.tx.id ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tipe</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.tx.tipe ?? ''} onChange={e => { setField('tipe', e.target.value); setField('kategori', '') }}>
                    {TIPE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tanggal</label>
                  <input type="date" style={fieldStyle()} value={modal.tx.tanggal} onChange={e => setField('tanggal', e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Deskripsi *</label>
                  <input style={fieldStyle()} value={modal.tx.deskripsi} onChange={e => setField('deskripsi', e.target.value)} placeholder="Deskripsi transaksi" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Kategori</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.tx.kategori ?? ''} onChange={e => setField('kategori', e.target.value)}>
                    <option value="">Pilih kategori</option>
                    {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Jumlah (Rp) *</label>
                  <input type="number" style={fieldStyle()} value={modal.tx.jumlah} onChange={e => setField('jumlah', e.target.value)} placeholder="0" min="0" required />
                </div>
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
