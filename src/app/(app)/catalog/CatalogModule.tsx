'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Product = {
  id?: string
  workspace_id: string
  kode: string
  nama: string
  link: string
  platform: string
  harga_normal: number | string
  harga_diskon: number | string
  satuan: string
  kategori: string
  deskripsi: string
  thumbnail_url: string
  is_active: boolean
  tipe_produk: string
  tipe_digital: string
  link_affiliate: string
  platform_affiliate: string
  komisi_tipe: string
  komisi_nilai: number | string
}

const PLATFORMS_FISIK = ['Shopee', 'Tokopedia', 'TikTok Shop', 'Lazada', 'Website', 'Lainnya']
const PLATFORMS_AFFILIATE = ['Shopee Affiliate', 'TikTok Affiliate', 'Tokopedia Affiliate', 'Involve Asia', 'AccessTrade', 'Lainnya']
const PLATFORMS_DIGITAL = ['Digicreative', 'Teachable', 'Gumroad', 'Whop', 'Kajabi', 'Website Sendiri', 'Lainnya']
const KATEGORI_FISIK = ['Fashion', 'Kecantikan', 'Makanan & Minuman', 'Elektronik', 'Rumah Tangga', 'Kesehatan', 'Olahraga', 'Lainnya']
const KATEGORI_DIGITAL = ['Kelas Online', 'Ebook', 'Template', 'SaaS / Software', 'Plugin', 'Mentoring', 'Membership', 'Lainnya']
const SATUAN = ['pcs', 'kg', 'gr', 'liter', 'paket', 'botol', 'box', 'lisensi', 'akses']

function formatRp(n: number | string) {
  const num = Number(n)
  if (!num) return '-'
  return 'Rp ' + num.toLocaleString('id-ID')
}

function emptyProduct(workspaceId: string): Product {
  return {
    workspace_id: workspaceId, kode: '', nama: '', link: '', platform: '',
    harga_normal: '', harga_diskon: '', satuan: 'pcs', kategori: '', deskripsi: '',
    thumbnail_url: '', is_active: true,
    tipe_produk: 'Fisik', tipe_digital: '', link_affiliate: '',
    platform_affiliate: '', komisi_tipe: 'persen', komisi_nilai: '',
  }
}

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function selectStyle() {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }
}

const TIPE_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  Fisik: { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', icon: 'box' },
  Digital: { color: '#a78bfa', bg: 'rgba(66,165,245,0.1)', icon: 'digital' },
  Affiliate: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', icon: 'link' },
}

export default function CatalogModule({ initialProducts, workspaceId, modes }: {
  initialProducts: Product[]
  workspaceId: string
  modes: string[]
}) {
  const isAffiliate = modes.includes('affiliate')
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [modal, setModal] = useState<{ open: boolean; product: Product } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [filterTipe, setFilterTipe] = useState('')

  function openAdd() { setModal({ open: true, product: emptyProduct(workspaceId) }); setError('') }
  function openEdit(p: Product) { setModal({ open: true, product: { ...p } }); setError('') }
  function closeModal() { setModal(null) }
  function setField(key: keyof Product, value: string | boolean | number) {
    setModal(m => m ? { ...m, product: { ...m.product, [key]: value } } : m)
  }

  const isDigital = modal?.product.tipe_produk === 'Digital'
  const isAffiliateProduct = modal?.product.tipe_produk === 'Affiliate'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    setSaving(true); setError('')
    const supabase = createClient()
    const p = modal.product
    const payload = {
      ...p, workspace_id: workspaceId,
      harga_normal: Number(p.harga_normal) || 0,
      harga_diskon: Number(p.harga_diskon) || 0,
      komisi_nilai: Number(p.komisi_nilai) || 0,
    }
    if (p.id) {
      const { error: err } = await supabase.from('kf_products').update(payload).eq('id', p.id)
      if (err) { setError(err.message); setSaving(false); return }
      setProducts(prev => prev.map(x => x.id === p.id ? { ...payload } : x))
    } else {
      const { data, error: err } = await supabase.from('kf_products').insert(payload).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      setProducts(prev => [...prev, { ...payload, id: data.id }])
    }
    setSaving(false); closeModal()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return
    setDeleting(id)
    await createClient().from('kf_products').delete().eq('id', id)
    setProducts(prev => prev.filter(x => x.id !== id))
    setDeleting(null)
  }

  async function toggleActive(p: Product) {
    await createClient().from('kf_products').update({ is_active: !p.is_active }).eq('id', p.id!)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  function hitungKomisi(p: Product) {
    if (!p.komisi_nilai || !p.harga_normal) return null
    const harga = Number(p.harga_diskon || p.harga_normal)
    if (p.komisi_tipe === 'persen') return (harga * Number(p.komisi_nilai)) / 100
    return Number(p.komisi_nilai)
  }

  const filtered = products.filter(p =>
    (!filter || p.nama.toLowerCase().includes(filter.toLowerCase()) || p.platform.toLowerCase().includes(filter.toLowerCase())) &&
    (!filterTipe || p.tipe_produk === filterTipe)
  )

  const totalKomisiPotensi = products.filter(p => p.is_active).reduce((s, p) => {
    const k = hitungKomisi(p); return s + (k || 0)
  }, 0)

  const tipes = ['Fisik', 'Digital', ...(isAffiliate ? ['Affiliate'] : [])]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2a3547', letterSpacing: '-0.5px', marginBottom: 6 }}>Catalog</h1>
          <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Produk fisik, digital, dan affiliate yang kamu promosikan</p>
        </div>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          + Tambah Produk
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isAffiliate ? 4 : 3}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Produk', value: products.length, color: '#2a3547' },
          { label: 'Aktif', value: products.filter(p => p.is_active).length, color: '#86efac' },
          { label: 'Affiliate', value: products.filter(p => p.tipe_produk === 'Affiliate').length, color: '#34d399', hide: !isAffiliate },
          { label: 'Potensi Komisi/item', value: totalKomisiPotensi > 0 ? formatRp(totalKomisiPotensi) : '-', color: '#42a5f5', hide: !isAffiliate },
        ].filter(s => !s.hide).map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: s.value.toString().startsWith('Rp') ? '1.1rem' : '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={fieldStyle({ maxWidth: 260 })} placeholder="Cari produk..." value={filter} onChange={e => setFilter(e.target.value)} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['', ...tipes].map(t => (
              <button key={t} onClick={() => setFilterTipe(t)}
                style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: filterTipe === t ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: filterTipe === t ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: filterTipe === t ? '#42a5f5' : '#64748b', cursor: 'pointer' }}>
                {t || 'Semua'} {t && `(${products.filter(p => p.tipe_produk === t).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#5a6a85' }}>
          <div style={{ marginBottom: 12, color: '#c8d1e0' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
          <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>{products.length === 0 ? 'Belum ada produk' : 'Tidak ditemukan'}</div>
          {products.length === 0 && <button onClick={openAdd} style={{ marginTop: 12, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>+ Tambah Produk Pertama</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => {
            const tipe = TIPE_COLORS[p.tipe_produk] || TIPE_COLORS.Fisik
            const komisi = hitungKomisi(p)
            return (
              <div key={p.id} style={{ background: '#fff', border: `1px solid ${p.is_active ? '#e5eaf2' : '#f1f5f9'}`, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ height: 140, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: tipe.color }}>
                    {tipe.icon === 'box' ? <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> : tipe.icon === 'digital' ? <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg> : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>}
                  </div>}
                  <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, color: tipe.color, background: tipe.bg, fontWeight: 600 }}>{p.tipe_produk}</div>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <button onClick={() => toggleActive(p)} style={{ background: p.is_active ? 'rgba(22,101,52,0.9)' : 'rgba(50,0,0,0.9)', border: 'none', borderRadius: 20, padding: '3px 10px', color: p.is_active ? '#86efac' : '#f87171', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.9rem', lineHeight: 1.3 }}>{p.nama}</div>
                    {p.kode && <span style={{ fontSize: '0.68rem', color: '#1a73e8', background: 'rgba(26,115,232,0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{p.kode}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                    {(p.platform || p.platform_affiliate) && <span style={{ fontSize: '0.7rem', color: '#5a6a85', background: '#f8fafc', border: '1px solid #e5eaf2', padding: '1px 7px', borderRadius: 4 }}>{p.platform_affiliate || p.platform}</span>}
                    {p.kategori && <span style={{ fontSize: '0.7rem', color: '#5a6a85', background: '#f8fafc', border: '1px solid #e5eaf2', padding: '1px 7px', borderRadius: 4 }}>{p.kategori}</span>}
                    {p.tipe_digital && <span style={{ fontSize: '0.7rem', color: '#a78bfa', background: 'rgba(66,165,245,0.08)', border: '1px solid rgba(66,165,245,0.2)', padding: '1px 7px', borderRadius: 4 }}>{p.tipe_digital}</span>}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {Number(p.harga_normal) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Number(p.harga_diskon) > 0 ? <>
                          <span style={{ fontWeight: 700, color: '#42a5f5', fontSize: '0.9rem' }}>{formatRp(p.harga_diskon)}</span>
                          <span style={{ color: '#5a6a85', fontSize: '0.75rem', textDecoration: 'line-through' }}>{formatRp(p.harga_normal)}</span>
                        </> : <span style={{ fontWeight: 700, color: '#42a5f5', fontSize: '0.9rem' }}>{formatRp(p.harga_normal)}</span>}
                      </div>
                    )}
                    {komisi && <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 2 }}>Komisi: {formatRp(komisi)} {p.komisi_tipe === 'persen' ? `(${p.komisi_nilai}%)` : '(flat)'}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 8, padding: '7px', color: '#42a5f5', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer' }}>Edit</button>
                    {(p.link_affiliate || p.link) && (
                      <a href={p.link_affiliate || p.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '7px', color: '#5a6a85', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
                        {p.link_affiliate ? 'Afiliasi' : 'Lihat'}
                      </a>
                    )}
                    <button onClick={() => handleDelete(p.id!)} disabled={deleting === p.id} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '7px 10px', color: '#5a6a85', fontSize: '0.78rem', cursor: 'pointer' }}>
                      {deleting === p.id ? '...' : ''}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2a3547' }}>{modal.product.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}

              {/* Tipe Produk */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 8, fontWeight: 500 }}>Tipe Produk</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {tipes.map(t => {
                    const tc = TIPE_COLORS[t]
                    return (
                      <button key={t} type="button" onClick={() => setField('tipe_produk', t)}
                        style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, border: `1px solid ${modal.product.tipe_produk === t ? tc.color : '#e5eaf2'}`, background: modal.product.tipe_produk === t ? tc.bg : '#f1f5f9', color: modal.product.tipe_produk === t ? tc.color : '#64748b', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: tc.color }}>
                          {tc.icon === 'box' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> : tc.icon === 'digital' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>}
                        </span> {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Nama Produk *</label>
                  <input style={fieldStyle()} value={modal.product.nama} onChange={e => setField('nama', e.target.value)} placeholder="Nama produk" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Kode / SKU</label>
                  <input style={fieldStyle()} value={modal.product.kode} onChange={e => setField('kode', e.target.value)} placeholder="SKU-001" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Kategori</label>
                  <select style={selectStyle()} value={modal.product.kategori ?? ''} onChange={e => setField('kategori', e.target.value)}>
                    <option value="">Pilih kategori</option>
                    {(isDigital || isAffiliateProduct ? KATEGORI_DIGITAL : KATEGORI_FISIK).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                {/* Platform */}
                {isAffiliateProduct ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform Affiliate</label>
                    <select style={selectStyle()} value={modal.product.platform_affiliate ?? ''} onChange={e => setField('platform_affiliate', e.target.value)}>
                      <option value="">Pilih platform</option>
                      {PLATFORMS_AFFILIATE.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                ) : isDigital ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform Digital</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <select style={selectStyle()} value={modal.product.platform ?? ''} onChange={e => setField('platform', e.target.value)}>
                        <option value="">Platform jualan</option>
                        {PLATFORMS_DIGITAL.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select style={selectStyle()} value={modal.product.tipe_digital ?? ''} onChange={e => setField('tipe_digital', e.target.value)}>
                        <option value="">Tipe konten digital</option>
                        {KATEGORI_DIGITAL.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Platform</label>
                    <select style={selectStyle()} value={modal.product.platform ?? ''} onChange={e => setField('platform', e.target.value)}>
                      <option value="">Pilih platform</option>
                      {PLATFORMS_FISIK.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {/* Harga */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Harga Normal (Rp)</label>
                  <input style={fieldStyle()} type="number" value={modal.product.harga_normal} onChange={e => setField('harga_normal', e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Harga Diskon (Rp)</label>
                  <input style={fieldStyle()} type="number" value={modal.product.harga_diskon} onChange={e => setField('harga_diskon', e.target.value)} placeholder="0" min="0" />
                </div>

                {/* Komisi (affiliate & digital) */}
                {(isAffiliateProduct || isDigital) && <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tipe Komisi</label>
                    <select style={selectStyle()} value={modal.product.komisi_tipe ?? 'persen'} onChange={e => setField('komisi_tipe', e.target.value)}>
                      <option value="persen">Persentase (%)</option>
                      <option value="flat">Flat (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>
                      Nilai Komisi {modal.product.komisi_tipe === 'persen' ? '(%)' : '(Rp)'}
                    </label>
                    <input style={fieldStyle()} type="number" value={modal.product.komisi_nilai} onChange={e => setField('komisi_nilai', e.target.value)} placeholder={modal.product.komisi_tipe === 'persen' ? '30' : '50000'} min="0" />
                  </div>
                </>}

                {!isDigital && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Satuan</label>
                    <select style={selectStyle()} value={modal.product.satuan ?? ''} onChange={e => setField('satuan', e.target.value)}>
                      {SATUAN.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={selectStyle()} value={modal.product.is_active ? 'true' : 'false'} onChange={e => setField('is_active', e.target.value === 'true')}>
                    <option value="true">Aktif</option>
                    <option value="false">Tidak Aktif</option>
                  </select>
                </div>

                {/* Links */}
                {isAffiliateProduct ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#34d399', marginBottom: 6, fontWeight: 500 }}>Link Affiliate Kamu</label>
                    <input style={fieldStyle({ border: '1px solid rgba(52,211,153,0.3)' })} value={modal.product.link_affiliate} onChange={e => setField('link_affiliate', e.target.value)} placeholder="https://s.shopee.co.id/affiliate-link-kamu" />
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Link Produk</label>
                    <input style={fieldStyle()} value={modal.product.link} onChange={e => setField('link', e.target.value)} placeholder="https://..." />
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>URL Thumbnail</label>
                  <input style={fieldStyle()} value={modal.product.thumbnail_url} onChange={e => setField('thumbnail_url', e.target.value)} placeholder="https://..." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>
                    Deskripsi Produk
                    <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#6366f1', fontWeight: 400 }}>Tips: Isi lengkap — dipakai auto-fill di Naskah Generator</span>
                  </label>
                  <textarea style={fieldStyle({ height: 110, resize: 'vertical' })} value={modal.product.deskripsi ?? ''} onChange={e => setField('deskripsi', e.target.value)} placeholder="Paste deskripsi produk lengkap di sini: spesifikasi, manfaat, keunggulan, harga, platform beli... Semakin lengkap semakin akurat analisis USP-nya." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 20px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Menyimpan...' : modal.product.id ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
