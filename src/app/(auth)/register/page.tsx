'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ── Ganti URL ini dengan link checkout Scalev kamu ──────────────────────────
const SCALEV = {
  bulanan: 'https://scalev.id/#', // TODO: isi link Scalev bulanan
  basic:   'https://scalev.id/#', // TODO: isi link Scalev basic lifetime
  pro:     'https://scalev.id/#', // TODO: isi link Scalev pro lifetime
  agency:  'https://scalev.id/#', // TODO: isi link Scalev agency lifetime
}
// ────────────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'bulanan',
    name: 'Bulanan',
    badge: null,
    price: 99000,
    period: '/bulan',
    color: '#0f172a',
    accent: '#64748b',
    features: [
      '1 Workspace / Brand',
      '1 owner + 3 anggota tim',
      'Semua modul lengkap',
      'Unlimited konten & jadwal',
    ],
    cta: 'Mulai Bulanan',
    href: SCALEV.bulanan,
  },
  {
    id: 'basic',
    name: 'Basic Lifetime',
    badge: 'TERPOPULER',
    price: 149000,
    period: 'sekali bayar',
    color: '#1a73e8',
    accent: '#1a73e8',
    features: [
      '2 Workspace / Brand',
      '1 owner + 3 anggota tim',
      'Semua modul lengkap',
      'Unlimited konten & jadwal',
      'Update fitur selamanya',
    ],
    cta: 'Beli Basic Lifetime',
    href: SCALEV.basic,
  },
  {
    id: 'pro',
    name: 'Pro Lifetime',
    badge: null,
    price: 199000,
    period: 'sekali bayar',
    color: '#7c3aed',
    accent: '#7c3aed',
    features: [
      '4 Workspace / Brand',
      '1 owner + 5 anggota tim',
      'Semua modul lengkap',
      'Unlimited konten & jadwal',
      'Update fitur selamanya',
    ],
    cta: 'Beli Pro Lifetime',
    href: SCALEV.pro,
  },
  {
    id: 'agency',
    name: 'Agency Lifetime',
    badge: null,
    price: 399000,
    period: 'sekali bayar',
    color: '#059669',
    accent: '#059669',
    features: [
      '10 Workspace / Brand',
      '1 owner + 10 anggota tim',
      'Semua modul lengkap',
      'Unlimited konten & jadwal',
      'Update fitur selamanya',
      'Cocok untuk agensi & tim besar',
    ],
    cta: 'Beli Agency Lifetime',
    href: SCALEV.agency,
  },
]

function fmt(n: number) {
  return 'Rp' + n.toLocaleString('id-ID')
}

export default function RegisterPage() {
  const [activePlan, setActivePlan] = useState<string | null>(null)

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get('plan')
    if (plan) setActivePlan(plan)
  }, [])

  return (
    <div style={{ width: '100%', maxWidth: 900, padding: '0 4px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(26,115,232,0.3)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>KreaFlow</span>
        </div>
        <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 500 }}>Pilih paket yang sesuai dengan kebutuhanmu</p>
        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 4 }}>Beli di Scalev → akses otomatis dikirim ke email kamu</p>
      </div>

      {/* Plan grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {PLANS.map(plan => {
          const isActive = activePlan === plan.id
          const isPopular = plan.badge === 'TERPOPULER'
          return (
            <div
              key={plan.id}
              id={plan.id}
              style={{
                background: '#fff',
                border: `2px solid ${isActive || isPopular ? plan.accent : '#e2e8f0'}`,
                borderRadius: 20,
                padding: '24px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                boxShadow: isActive || isPopular
                  ? `0 8px 32px ${plan.accent}22`
                  : '0 1px 4px rgba(0,0,0,0.06)',
                position: 'relative',
                transition: 'box-shadow 0.2s',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: plan.accent, color: '#fff', fontSize: '0.62rem', fontWeight: 800,
                  letterSpacing: '1.5px', padding: '3px 12px', borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: plan.accent, marginBottom: 6 }}>
                {plan.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>
                  {fmt(plan.price)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 20 }}>{plan.period}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <svg style={{ flexShrink: 0, marginTop: 2 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={plan.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <a
                href={plan.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '11px 16px',
                  background: isPopular || isActive ? plan.accent : 'transparent',
                  color: isPopular || isActive ? '#fff' : plan.accent,
                  border: `2px solid ${plan.accent}`,
                  borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
                  textDecoration: 'none', transition: 'all 0.15s',
                  letterSpacing: '-0.1px',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.background = plan.accent
                  el.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = isPopular || isActive ? plan.accent : 'transparent'
                  el.style.color = isPopular || isActive ? '#fff' : plan.accent
                }}
              >
                {plan.cta} →
              </a>
            </div>
          )
        })}
      </div>

      {/* Free plan note */}
      <div style={{ marginTop: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}>Coba Gratis</span>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 10 }}>1 workspace · 1 anggota · akses terbatas</span>
        </div>
        <Link
          href="/login"
          style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a73e8', textDecoration: 'none', padding: '7px 16px', border: '1.5px solid #1a73e8', borderRadius: 8 }}
        >
          Mulai Gratis →
        </Link>
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: '#94a3b8' }}>
        Sudah beli di Scalev?{' '}
        <Link href="/login" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>
          Cek email & masuk di sini
        </Link>
      </p>

      {/* Trust badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
        {['Bayar sekali, akses selamanya', 'Akses otomatis via email', 'Tanpa subscription tersembunyi'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
