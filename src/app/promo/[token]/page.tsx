'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const PLAN_FEATURES: Record<string, string[]> = {
  bulanan:  ['1 Workspace / Brand', '1 owner + 4 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal'],
  basic:    ['2 Workspace / Brand', '1 owner + 4 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'],
  pro:      ['4 Workspace / Brand', '1 owner + 5 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'],
  agency:   ['10 Workspace / Brand', '1 owner + 10 anggota tim', 'Semua modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'],
}

type TokenInfo = { valid: boolean; plan?: string; plan_name?: string; label?: string; remaining?: number | null; reason?: string; starts_at?: string }

export default function PromoPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(({ token: t }) => {
      const tok = t.toUpperCase()
      setToken(tok)
      fetch(`/api/promo?token=${tok}`)
        .then(r => r.json())
        .then(setInfo)
    })
  }, [params])

  async function claim(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal klaim')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal klaim')
    } finally {
      setLoading(false)
    }
  }

  if (!info) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef3ff' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1a73e8', borderTop: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const features = PLAN_FEATURES[info.plan || 'basic'] || PLAN_FEATURES.basic

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eef3ff 0%, #f8fafc 60%, #f0fdf4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.5s ease both' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(26,115,232,0.3)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>KreaFlow</span>
          </div>
        </div>

        {/* Invalid */}
        {!info.valid && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.09)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {info.reason === 'notyet' ? '🗓️' : info.reason === 'expired' ? '⏰' : info.reason === 'maxed' ? '🔒' : '❌'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: 8 }}>
              {info.reason === 'expired' ? 'Promo sudah berakhir'
                : info.reason === 'maxed' ? 'Kuota promo sudah habis'
                : info.reason === 'notyet' ? 'Promo belum dimulai'
                : 'Link tidak valid'}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
              {info.reason === 'expired' ? 'Promo ini sudah tidak berlaku.'
                : info.reason === 'maxed' ? 'Semua slot promo sudah diambil.'
                : info.reason === 'notyet' ? `Promo ini baru bisa diklaim mulai ${info.starts_at ? new Date(info.starts_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : ''}.`
                : 'Link yang kamu gunakan tidak ditemukan atau sudah tidak aktif.'}
            </p>
            <Link href="/login" style={{ display: 'inline-block', padding: '11px 24px', background: '#1a73e8', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem' }}>
              Masuk ke KreaFlow →
            </Link>
          </div>
        )}

        {/* Valid + Success */}
        {info.valid && success && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.09)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: 8 }}>Berhasil! Cek email kamu</div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Link masuk sudah dikirim ke <strong style={{ color: '#0f172a' }}>{email}</strong>.<br />
              Klik link di email untuk mulai pakai KreaFlow.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 16 }}>Tidak ada email? Cek folder Spam atau Promosi.</p>
          </div>
        )}

        {/* Valid + Form */}
        {info.valid && !success && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '4px 14px', marginBottom: 14 }}>
                <span style={{ fontSize: '1rem' }}>🎁</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', letterSpacing: '0.5px' }}>AKSES GRATIS</span>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#0f172a', marginBottom: 4 }}>{info.plan_name}</div>
              {info.remaining !== null && info.remaining !== undefined && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Sisa {info.remaining} slot lagi</div>
              )}
            </div>

            {/* Features */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
              {features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: '0.8rem', color: '#374151' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Form */}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', color: '#dc2626', fontSize: '0.8rem', marginBottom: 16, fontWeight: 500 }}>
                {error}
              </div>
            )}
            <form onSubmit={claim} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 6, fontWeight: 600 }}>Email kamu</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@kamu.com"
                  required
                  autoFocus
                  style={{ width: '100%', background: '#f3f4f6', border: '1.5px solid transparent', borderRadius: 10, padding: '11px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ background: loading ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Memproses...' : 'Klaim Akses Sekarang →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.78rem', color: '#94a3b8' }}>
              Sudah punya akun?{' '}
              <Link href="/login" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>Masuk di sini</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
