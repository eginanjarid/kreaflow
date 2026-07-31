'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  '1 owner + 5 karyawan (6 slot tim)',
  'Semua 10 modul lengkap',
  'Sprint, Plan, Library, Studio, Calendar',
  'Tracker, Budget, Insights',
  'Unlimited konten & jadwal',
  'Semua update fitur ke depan',
]

export default function UpgradeModule({ failed }: { failed: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBuy() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payment/create-invoice', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal membuat invoice'); setLoading(false); return }
      router.push(data.invoice_url)
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
      {failed && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: '0.875rem', color: '#dc2626', fontWeight: 500 }}>
          Pembayaran gagal atau dibatalkan. Silakan coba lagi.
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: '#eff6ff', marginBottom: 16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>
          Aktifkan KreaFlow
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
          Bayar sekali, pakai selamanya. Termasuk semua update fitur ke depan.
        </p>
      </div>

      <div style={{ background: '#fff', border: '2px solid #1a73e8', borderRadius: 18, padding: '28px 28px 24px', boxShadow: '0 4px 24px rgba(26,115,232,0.1)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#1a73e8', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 14px', borderRadius: 20, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
          LAUNCH OFFER
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Lifetime Deal</div>
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', textDecoration: 'line-through', marginBottom: 4 }}>Rp299.000</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#1a73e8', letterSpacing: '-1.5px', lineHeight: 1 }}>Rp149.000</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6 }}>Bayar sekali · Akses & update selamanya</div>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, marginBottom: 22 }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{f}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 10, background: loading ? '#93c5fd' : '#1a73e8', color: '#fff', fontSize: '0.95rem', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', letterSpacing: '-0.2px' }}
        >
          {loading ? 'Memproses...' : 'Beli Lifetime Deal →'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: 12 }}>
          Pembayaran aman via Xendit · Transfer Bank, QRIS, E-Wallet
        </p>
      </div>

      <div style={{ marginTop: 24, background: '#f8fafc', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 10 }}>Yang sudah termasuk:</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.7 }}>
          Akun aktif otomatis setelah pembayaran terkonfirmasi (biasanya &lt;5 menit). Jika ada kendala, hubungi kami di <strong>hello@kreaflow.id</strong>.
        </div>
      </div>
    </div>
  )
}
