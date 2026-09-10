'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing'

function fmtPrice(n: number) {
  return 'Rp' + n.toLocaleString('id-ID')
}

export default function UpgradeModule({
  failed,
  isLifetime = false,
  currentMaxWs = 0,
  wsCount = 0,
  pricing,
  trialUsed = false,
}: {
  failed: boolean
  isLifetime?: boolean
  currentMaxWs?: number
  wsCount?: number
  pricing?: PricingConfig
  trialUsed?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number; type: string; value: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [activeTier, setActiveTier] = useState<string | null>(null)

  const config = pricing ?? DEFAULT_PRICING

  async function applyCode(tier: string) {
    if (!couponInput.trim()) return
    setCouponLoading(true); setCouponError(''); setCouponApplied(null)
    const tierObj = config.tiers.find(t => t.id === tier)
    const originalAmount = tierObj?.price ?? 0
    const res = await fetch('/api/payment/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput.trim(), tier, originalAmount }),
    })
    const data = await res.json()
    setCouponLoading(false)
    if (!data.valid) { setCouponError(data.error || 'Kupon tidak valid'); return }
    setCouponApplied({ code: data.coupon.code, discountAmount: data.discountAmount, type: data.coupon.type, value: data.coupon.value })
    setActiveTier(tier)
  }

  function clearCoupon() { setCouponApplied(null); setCouponError(''); setCouponInput(''); setActiveTier(null) }

  async function handleBuy(tier: string) {
    setLoading(tier)
    setError('')
    try {
      const res = await fetch('/api/payment/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, couponCode: couponApplied?.code || '' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal membuat invoice'); setLoading(null); return }
      router.push(data.invoice_url)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(null)
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px' }}>
      {failed && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: '#dc2626', fontWeight: 500 }}>
          Pembayaran gagal atau dibatalkan. Silakan coba lagi.
        </div>
      )}

      {!failed && trialUsed && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
          Trial 7 hari kamu sudah selesai. Makasih udah coba KreaFlow — yuk lanjut berlangganan biar tim kamu nggak putus alur kerja.
        </div>
      )}
      {!failed && !trialUsed && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: '#1a73e8', fontWeight: 500 }}>
          Pilih paket buat lanjut pakai KreaFlow.
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: '#eff6ff', marginBottom: 16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>
          {isLifetime ? 'Tambah Workspace' : 'Aktifkan KreaFlow'}
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
          {isLifetime
            ? `Kamu sudah punya ${wsCount} dari ${currentMaxWs} workspace. Upgrade paket atau beli add-on untuk tambah slot.`
            : 'Pilih paket yang sesuai kebutuhanmu.'}
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: '#dc2626', fontWeight: 500, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Tier cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {config.tiers.map(tier => {
          const isCurrent = isLifetime && currentMaxWs === tier.maxWorkspaces
          const isLoading = loading === tier.id
          return (
            <div key={tier.id} style={{
              background: '#fff',
              border: `2px solid ${tier.highlight ? '#1a73e8' : '#e5eaf2'}`,
              borderRadius: 18,
              padding: '24px 22px',
              position: 'relative',
              boxShadow: tier.highlight ? '0 4px 24px rgba(26,115,232,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {tier.badge && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#1a73e8', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '3px 12px', borderRadius: 20, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {tier.badge}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: -11, right: 16, background: '#059669', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em' }}>
                  PAKET KAMU
                </div>
              )}

              {(() => {
                const hasCoupon = couponApplied && activeTier === tier.id
                const finalPrice = hasCoupon ? tier.price - couponApplied!.discountAmount : tier.price
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{tier.name}</div>
                    {hasCoupon && (
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', textDecoration: 'line-through', marginBottom: 2 }}>{fmtPrice(tier.price)}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: '2rem', fontWeight: 900, color: hasCoupon ? '#059669' : tier.highlight ? '#1a73e8' : '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{fmtPrice(finalPrice)}</span>
                      {tier.isMonthly && <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>/bln</span>}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>{tier.isMonthly ? 'Per bulan · bisa batal kapan saja' : 'Bayar sekali · Lifetime'}</div>
                  </div>
                )
              })()}

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, marginBottom: 18 }}>
                {tier.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: tier.highlight ? '#eff6ff' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={tier.highlight ? '#1a73e8' : '#059669'} strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: f.includes('Workspace') ? 700 : 400 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleBuy(tier.id)}
                disabled={!!loading || isCurrent}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: isCurrent ? '#f0fdf4' : isLoading ? '#93c5fd' : tier.highlight ? '#1a73e8' : '#f8fafc',
                  color: isCurrent ? '#059669' : isLoading ? '#fff' : tier.highlight ? '#fff' : '#374151',
                  fontSize: '0.875rem', fontWeight: 700, border: isCurrent ? '1px solid #bbf7d0' : `1px solid ${tier.highlight ? '#1a73e8' : '#e5eaf2'}`,
                  cursor: loading || isCurrent ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                }}
              >
                {isCurrent ? 'Paket Aktif' : isLoading ? 'Memproses...' : tier.isMonthly ? 'Mulai Berlangganan →' : `Beli ${tier.name} →`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Coupon code */}
      <div style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 14, padding: '16px 20px', marginBottom: 10 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Punya kode promo?</div>
        {couponApplied ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>{couponApplied.code}</span>
              <span style={{ fontSize: '0.78rem', color: '#059669' }}>
                — Diskon {couponApplied.type === 'percent' ? `${couponApplied.value}%` : fmtPrice(couponApplied.value)} = hemat {fmtPrice(couponApplied.discountAmount)}
                {activeTier ? ` untuk ${config.tiers.find(t => t.id === activeTier)?.name}` : ''}
              </span>
            </div>
            <button onClick={clearCoupon} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 8, padding: '7px 14px', color: '#6b7280', fontSize: '0.78rem', cursor: 'pointer' }}>Hapus</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={couponInput}
              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
              onKeyDown={e => e.key === 'Enter' && activeTier && applyCode(activeTier)}
              placeholder="KODE PROMO"
              style={{ flex: 1, minWidth: 160, background: '#fff', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 14px', fontSize: '0.85rem', color: '#111827', outline: 'none', letterSpacing: '0.05em', fontWeight: 600 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {config.tiers.filter(t => !t.isMonthly).map(t => (
                <button
                  key={t.id}
                  onClick={() => applyCode(t.id)}
                  disabled={couponLoading || !couponInput.trim()}
                  style={{ padding: '8px 14px', borderRadius: 9, background: couponLoading ? '#93c5fd' : '#1a73e8', color: '#fff', fontSize: '0.78rem', fontWeight: 700, border: 'none', cursor: couponLoading || !couponInput.trim() ? 'not-allowed' : 'pointer', opacity: !couponInput.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
                >
                  {couponLoading ? '...' : `Cek untuk ${t.name.replace(' Lifetime', '')}`}
                </button>
              ))}
            </div>
          </div>
        )}
        {couponError && <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#dc2626' }}>{couponError}</div>}
      </div>

      {/* Add-on rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLifetime && (
          <div style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '0.9rem', marginBottom: 2 }}>Add-on +1 Workspace</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Tambah 1 workspace extra tanpa ganti paket. Berlaku lifetime. Khusus pengguna lifetime.</div>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', flexShrink: 0 }}>{fmtPrice(config.addonWs)}</div>
            <button
              onClick={() => handleBuy('addon')}
              disabled={!!loading}
              style={{ padding: '10px 20px', borderRadius: 9, background: loading === 'addon' ? '#93c5fd' : '#1a73e8', color: '#fff', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading === 'addon' ? 'Memproses...' : 'Beli Add-on →'}
            </button>
          </div>
        )}
        <div style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', opacity: 0.6 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '0.9rem' }}>Add-on Auto Schedule Post</div>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em' }}>SEGERA HADIR</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Otomatis posting ke IG, TikTok, FB dari KreaFlow. Tidak perlu buka apps lain.</div>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', flexShrink: 0 }}>{fmtPrice(config.addonSchedule)}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>/bln</span></div>
          <button disabled style={{ padding: '10px 20px', borderRadius: 9, background: '#e5eaf2', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'not-allowed' }}>
            Segera Hadir
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, background: '#f8fafc', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Akun aktif otomatis setelah pembayaran terkonfirmasi (&lt;5 menit). Pembayaran aman via Xendit · Transfer Bank, QRIS, E-Wallet.
          Pertanyaan? <a href="mailto:hello@kreaflow.id" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>hello@kreaflow.id</a>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link href="/sprints" style={{ fontSize: '0.78rem', color: '#9fa9ba', textDecoration: 'none' }}>← Kembali ke app</Link>
      </div>
    </div>
  )
}
