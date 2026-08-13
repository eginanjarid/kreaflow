'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

declare global { interface Window { fbq?: (...args: unknown[]) => void } }
const track = (event: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) window.fbq('track', event, params)
}

const PLANS: Record<string, { name: string; amount: number; workspaces: number; period: string; features: string[] }> = {
  bulanan: {
    name: 'Bulanan',
    amount: 99000,
    workspaces: 1,
    period: '/bulan',
    features: ['1 Workspace / Brand', '1 owner + 3 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal'],
  },
  basic: {
    name: 'Basic Lifetime',
    amount: 149000,
    workspaces: 2,
    period: 'lifetime',
    features: ['2 Workspace / Brand', '1 owner + 3 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'],
  },
  pro: {
    name: 'Pro Lifetime',
    amount: 199000,
    workspaces: 4,
    period: 'lifetime',
    features: ['4 Workspace / Brand', '1 owner + 5 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'],
  },
  agency: {
    name: 'Agency Lifetime',
    amount: 399000,
    workspaces: 10,
    period: 'lifetime',
    features: ['10 Workspace / Brand', '1 owner + 10 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'],
  },
}

const fmt = (n: number) => 'Rp' + n.toLocaleString('id-ID')

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f8fafc; }
  .co-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; }
  .co-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; margin-bottom: 28px; }
  .co-logo-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg,#1a73e8,#42a5f5); display: flex; align-items: center; justify-content: center; }
  .co-logo-name { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
  .co-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; max-width: 800px; }
  @media (max-width: 640px) { .co-grid { grid-template-columns: 1fr; } }
  .co-plan { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 28px 24px; }
  .co-plan-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #1a73e8; margin-bottom: 6px; }
  .co-plan-name { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 16px; }
  .co-price-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
  .co-price { font-size: 36px; font-weight: 900; color: #1a73e8; letter-spacing: -1px; line-height: 1; }
  .co-period { font-size: 14px; color: #94a3b8; font-weight: 500; }
  .co-period-note { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
  .co-divider { border: none; border-top: 1px solid #f1f5f9; margin: 20px 0; }
  .co-feat { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; margin-bottom: 9px; }
  .co-feat-check { color: #1a73e8; font-weight: 700; font-size: 14px; }
  .co-form { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 28px 24px; }
  .co-form-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .co-form-sub { font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
  .co-label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  .co-input { width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 14px; color: #0f172a; outline: none; margin-bottom: 14px; font-family: inherit; }
  .co-input:focus { border-color: #1a73e8; background: #fff; }
  .co-btn { width: 100%; background: #1a73e8; color: #fff; border: none; border-radius: 12px; padding: 15px; font-size: 15px; font-weight: 800; cursor: pointer; font-family: inherit; margin-top: 4px; }
  .co-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .co-trust { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: #94a3b8; margin-top: 12px; }
  .co-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 14px; }
  .co-ws-badge { display: inline-flex; align-items: center; gap: 4px; background: #eef3ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 700; color: #1a73e8; margin-bottom: 16px; }
`

function CheckoutInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planKey = searchParams.get('plan') || 'basic'
  const plan = PLANS[planKey] || PLANS.basic

  const [email, setEmail] = useState('')
  const [nama, setNama] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    track('InitiateCheckout', {
      value: plan.amount,
      currency: 'IDR',
      content_name: plan.name,
      content_category: 'KreaFlow',
      num_items: 1,
    })
  }, [plan.amount, plan.name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/payment/public-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, email, nama }),
      })
      const data = await res.json()
      if (!res.ok || !data.invoice_url) {
        setError(data.error || 'Gagal membuat invoice. Coba lagi.')
        setLoading(false)
        return
      }
      window.location.href = data.invoice_url
    } catch {
      setError('Tidak bisa terhubung ke server. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="co-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <a href="https://kreaflow.id" className="co-logo">
        <div className="co-logo-mark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="co-logo-name">KreaFlow</span>
      </a>

      <div className="co-grid">
        {/* Plan summary */}
        <div className="co-plan">
          <div className="co-plan-label">Paket yang dipilih</div>
          <div className="co-plan-name">{plan.name}</div>
          <div className="co-ws-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            {plan.workspaces} Workspace
          </div>
          <div className="co-price-row">
            <span className="co-price">{fmt(plan.amount)}</span>
            {plan.period !== 'lifetime' && <span className="co-period">{plan.period}</span>}
          </div>
          <div className="co-period-note">
            {plan.period === 'lifetime' ? 'Bayar sekali · Pakai selamanya' : 'Berlangganan bulanan · Cancel kapan saja'}
          </div>
          <hr className="co-divider" />
          {plan.features.map(f => (
            <div key={f} className="co-feat">
              <span className="co-feat-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
          {planKey !== 'bulanan' && (
            <>
              <hr className="co-divider" />
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Ganti paket?{' '}
                {Object.entries(PLANS).filter(([k]) => k !== planKey).map(([k, p]) => (
                  <button key={k} onClick={() => router.replace(`/checkout?plan=${k}`)}
                    style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: 11, cursor: 'pointer', padding: '0 4px', fontWeight: 600 }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Form */}
        <div className="co-form">
          <div className="co-form-title">Detail Pembayaran</div>
          <div className="co-form-sub">Masukkan email untuk menerima akses akun setelah pembayaran berhasil.</div>
          <form onSubmit={handleSubmit}>
            {error && <div className="co-error">{error}</div>}
            <label className="co-label">Nama Lengkap</label>
            <input
              className="co-input" type="text" required
              placeholder="Nama kamu"
              value={nama} onChange={e => setNama(e.target.value)}
            />
            <label className="co-label">Email</label>
            <input
              className="co-input" type="email" required
              placeholder="email@kamu.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <button className="co-btn" type="submit" disabled={loading}>
              {loading ? 'Membuat invoice...' : `Bayar ${fmt(plan.amount)}${plan.period !== 'lifetime' ? plan.period : ''} →`}
            </button>
          </form>
          <div className="co-trust">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Pembayaran diproses aman oleh Xendit
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutContent() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  )
}
