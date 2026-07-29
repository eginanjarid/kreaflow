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
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function selectStyle() {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }
}

const TIPE_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
  Fisik: { color: '#0284c7', bg: 'rgba(2,132,199,0.07)', icon: 'bag' },
  Digital: { color: '#7c3aed', bg: 'rgba(124,58,237,0.07)', icon: 'monitor' },
  Affiliate: { color: '#059669', bg: 'rgba(5,150,105,0.07)', icon: 'share' },
}

function TipeIcon({ icon, color, size = 22 }: { icon: string; color: string; size?: number }) {
  const s = { width: size, height: size }
  if (icon === 'bag') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )
  if (icon === 'monitor') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
  return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
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
      <div className="kf-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Catalog</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Produk fisik, digital, dan affiliate yang kamu promosikan</p>
        </div>
        <button onClick={openAdd} style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          + Tambah Produk
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isAffiliate ? 4 : 3}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Produk', value: products.length, color: '#111827' },
          { label: 'Aktif', value: products.filter(p => p.is_active).length, color: '#111827' },
          { label: 'Affiliate', value: products.filter(p => p.tipe_produk === 'Affiliate').length, color: '#111827', hide: !isAffiliate },
          { label: 'Potensi Komisi/item', value: totalKomisiPotensi > 0 ? formatRp(totalKomisiPotensi) : '-', color: '#1a73e8', hide: !isAffiliate },
        ].filter(s => !s.hide).map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: s.value.toString().startsWith('Rp') ? '1.1rem' : '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {products.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input style={fieldStyle({ maxWidth: 260 })} placeholder="Cari produk..." value={filter} onChange={e => setFilter(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['', ...tipes].map(t => (
              <button key={t} onClick={() => setFilterTipe(t)}
                style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: filterTipe === t ? '1px solid #1a73e8' : '1px solid #e5e7eb', background: filterTipe === t ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: filterTipe === t ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
                {t || 'Semua'} {t && `(${products.filter(p => p.tipe_produk === t).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#6b7280' }}>
          <div style={{ marginBottom: 12, color: '#6b7280' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
          <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>{products.length === 0 ? 'Belum ada produk' : 'Tidak ditemukan'}</div>
          {products.length === 0 && <button onClick={openAdd} style={{ marginTop: 12, background: '#1a73e8', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>+ Tambah Produk Pertama</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(p => {
            const tipe = TIPE_COLORS[p.tipe_produk] || TIPE_COLORS.Fisik
            const komisi = hitungKomisi(p)
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', opacity: p.is_active ? 1 : 0.55 }}>
                <div style={{ height: 120, background: p.thumbnail_url ? '#f3f4f6' : tipe.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {p.thumbnail_url
                    ? <img src={p.thumbnail_url} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TipeIcon icon={tipe.icon} color={tipe.color} size={24} />
                      </div>
                  }
                  <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.65rem', padding: '2px 8px', borderRadius: 6, color: tipe.color, background: '#fff', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>{p.tipe_produk}</div>
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <button onClick={() => toggleActive(p)} style={{ background: p.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 20, padding: '3px 9px', color: p.is_active ? '#059669' : '#9ca3af', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, backdropFilter: 'blur(4px)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.is_active ? '#059669' : '#9ca3af', display: 'inline-block', flexShrink: 0 }} />
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem', lineHeight: 1.3 }}>{p.nama}</div>
                    {p.kode && <span style={{ fontSize: '0.68rem', color: '#1a73e8', background: 'rgba(26,115,232,0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{p.kode}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                    {(p.platform || p.platform_affiliate) && <span style={{ fontSize: '0.68rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 7px', borderRadius: 5 }}>{p.platform_affiliate || p.platform}</span>}
                    {p.kategori && <span style={{ fontSize: '0.68rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 7px', borderRadius: 5 }}>{p.kategori}</span>}
                    {p.tipe_digital && <span style={{ fontSize: '0.68rem', color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '2px 7px', borderRadius: 5 }}>{p.tipe_digital}</span>}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    {Number(p.harga_normal) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {Number(p.harga_diskon) > 0 ? <>
                          <span style={{ fontWeight: 700, color: '#1a73e8', fontSize: '0.9rem' }}>{formatRp(p.harga_diskon)}</span>
                          <span style={{ color: '#6b7280', fontSize: '0.75rem', textDecoration: 'line-through' }}>{formatRp(p.harga_normal)}</span>
                        </> : <span style={{ fontWeight: 700, color: '#1a73e8', fontSize: '0.9rem' }}>{formatRp(p.harga_normal)}</span>}
                      </div>
                    )}
                    {komisi && <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 2 }}>Komisi: {formatRp(komisi)} {p.komisi_tipe === 'persen' ? `(${p.komisi_nilai}%)` : '(flat)'}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, background: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                    {(p.link_affiliate || p.link) && (
                      <a href={p.link_affiliate || p.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px', color: '#374151', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
                        {p.link_affiliate ? 'Afiliasi' : 'Lihat'}
                      </a>
                    )}
                    <button onClick={() => handleDelete(p.id!)} disabled={deleting === p.id} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 10px', color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer' }}>
                      {deleting === p.id ? '…' : '✕'}
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
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{modal.product.id ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}

              {/* Tipe Produk */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Tipe Produk</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {tipes.map(t => {
                    const tc = TIPE_COLORS[t]
                    return (
                      <button key={t} type="button" onClick={() => setField('tipe_produk', t)}
                        style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, border: `1px solid ${modal.product.tipe_produk === t ? tc.color : '#e5e7eb'}`, background: modal.product.tipe_produk === t ? tc.bg : '#f9fafb', color: modal.product.tipe_produk === t ? tc.color : '#6b7280', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <TipeIcon icon={tc.icon} color={tc.color} size={20} />
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Nama Produk *</label>
                  <input style={fieldStyle()} value={modal.product.nama} onChange={e => setField('nama', e.target.value)} placeholder="Nama produk" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Kode / SKU</label>
                  <input style={fieldStyle()} value={modal.product.kode} onChange={e => setField('kode', e.target.value)} placeholder="SKU-001" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Kategori</label>
                  <select style={selectStyle()} value={modal.product.kategori ?? ''} onChange={e => setField('kategori', e.target.value)}>
                    <option value="">Pilih kategori</option>
                    {(isDigital || isAffiliateProduct ? KATEGORI_DIGITAL : KATEGORI_FISIK).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                {/* Platform */}
                {isAffiliateProduct ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Platform Affiliate</label>
                    <select style={selectStyle()} value={modal.product.platform_affiliate ?? ''} onChange={e => setField('platform_affiliate', e.target.value)}>
                      <option value="">Pilih platform</option>
                      {PLATFORMS_AFFILIATE.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                ) : isDigital ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Platform Digital</label>
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
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Platform</label>
                    <select style={selectStyle()} value={modal.product.platform ?? ''} onChange={e => setField('platform', e.target.value)}>
                      <option value="">Pilih platform</option>
                      {PLATFORMS_FISIK.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {/* Harga */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Harga Normal (Rp)</label>
                  <input style={fieldStyle()} type="number" value={modal.product.harga_normal} onChange={e => setField('harga_normal', e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Harga Diskon (Rp)</label>
                  <input style={fieldStyle()} type="number" value={modal.product.harga_diskon} onChange={e => setField('harga_diskon', e.target.value)} placeholder="0" min="0" />
                </div>

                {/* Komisi (affiliate & digital) */}
                {(isAffiliateProduct || isDigital) && <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Tipe Komisi</label>
                    <select style={selectStyle()} value={modal.product.komisi_tipe ?? 'persen'} onChange={e => setField('komisi_tipe', e.target.value)}>
                      <option value="persen">Persentase (%)</option>
                      <option value="flat">Flat (Rp)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>
                      Nilai Komisi {modal.product.komisi_tipe === 'persen' ? '(%)' : '(Rp)'}
                    </label>
                    <input style={fieldStyle()} type="number" value={modal.product.komisi_nilai} onChange={e => setField('komisi_nilai', e.target.value)} placeholder={modal.product.komisi_tipe === 'persen' ? '30' : '50000'} min="0" />
                  </div>
                </>}

                {!isDigital && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Satuan</label>
                    <select style={selectStyle()} value={modal.product.satuan ?? ''} onChange={e => setField('satuan', e.target.value)}>
                      {SATUAN.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={selectStyle()} value={modal.product.is_active ? 'true' : 'false'} onChange={e => setField('is_active', e.target.value === 'true')}>
                    <option value="true">Aktif</option>
                    <option value="false">Tidak Aktif</option>
                  </select>
                </div>

                {/* Links */}
                {isAffiliateProduct ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#059669', marginBottom: 6, fontWeight: 500 }}>Link Affiliate Kamu</label>
                    <input style={fieldStyle({ border: '1px solid rgba(52,211,153,0.3)' })} value={modal.product.link_affiliate} onChange={e => setField('link_affiliate', e.target.value)} placeholder="https://s.shopee.co.id/affiliate-link-kamu" />
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Link Produk</label>
                    <input style={fieldStyle()} value={modal.product.link} onChange={e => setField('link', e.target.value)} placeholder="https://..." />
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>URL Thumbnail</label>
                  <input style={fieldStyle()} value={modal.product.thumbnail_url} onChange={e => setField('thumbnail_url', e.target.value)} placeholder="https://..." />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>
                    Deskripsi Produk
                    <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#4f46e5', fontWeight: 400 }}>Tips: Isi lengkap — dipakai auto-fill di Naskah Generator</span>
                  </label>
                  <textarea style={fieldStyle({ height: 110, resize: 'vertical' })} value={modal.product.deskripsi ?? ''} onChange={e => setField('deskripsi', e.target.value)} placeholder="Paste deskripsi produk lengkap di sini: spesifikasi, manfaat, keunggulan, harga, platform beli... Semakin lengkap semakin akurat analisis USP-nya." />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #f3f4f6', borderRadius: 10, padding: '10px 20px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: saving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
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
