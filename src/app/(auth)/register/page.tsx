'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputStyle = {
  width: '100%', background: '#f3f4f6', border: '1.5px solid transparent', borderRadius: 10,
  padding: '11px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
}

const BRAND_TYPES = [
  { id: 'creator', label: 'Creator', desc: 'Konten kreator / personal brand', color: '#1a73e8' },
  { id: 'affiliate', label: 'Affiliate', desc: 'Affiliator produk & komisi', color: '#059669' },
  { id: 'business', label: 'Business', desc: 'Brand toko / perusahaan', color: '#7c3aed' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nama: '', email: '', password: '', workspace: '', brand_type: 'creator' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState('')
  const [isInvite, setIsInvite] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const redirect = p.get('redirect') || ''
    const emailParam = p.get('email') || ''
    setRedirectTo(redirect)
    setIsInvite(redirect.includes('/invite/'))
    if (emailParam) setForm(f => ({ ...f, email: emailParam }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isInvite && !form.workspace.trim()) { setError('Nama Brand / Workspace wajib diisi'); return }
    setLoading(true)
    setError('')
    try {
      const body = isInvite
        ? { nama: form.nama, email: form.email, password: form.password }
        : form
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal daftar')

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok) throw new Error(loginData.error || 'Gagal masuk')

      router.push(redirectTo || '/upgrade')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal daftar')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(26,115,232,0.3)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#111827' }}>KreaFlow</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          {isInvite ? 'Buat akun untuk bergabung dengan tim' : 'Buat akun dan mulai kelola konten tim kamu'}
        </p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.08)' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', color: '#dc2626', fontSize: '0.83rem', marginBottom: 20, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 6, fontWeight: 600 }}>Nama Lengkap</label>
            <input type="text" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama kamu" required autoFocus style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 6, fontWeight: 600 }}>
              Email {isInvite && <span style={{ color: '#7c3aed', fontWeight: 400 }}>· harus sesuai invite</span>}
            </label>
            {isInvite ? (
              <div style={{ position: 'relative' }}>
                <input type="email" value={form.email} readOnly style={{ ...inputStyle, background: '#f0ebff', border: '1.5px solid #c4b5fd', color: '#5b21b6', cursor: 'not-allowed', paddingRight: 36 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#7c3aed' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </span>
              </div>
            ) : (
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@kamu.com" required style={inputStyle} />
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 6, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 karakter"
                required minLength={8}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, display: 'flex', alignItems: 'center' }}>
                {showPw
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {!isInvite && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 6, fontWeight: 600 }}>Nama Brand / Workspace</label>
                <input type="text" value={form.workspace} onChange={e => setForm(f => ({ ...f, workspace: e.target.value }))} placeholder="Contoh: Toko Kopi Pak Budi" style={inputStyle} />
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Bisa diubah kapan saja di Settings</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 8, fontWeight: 600 }}>Tipe Brand Kamu</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {BRAND_TYPES.map(bt => (
                    <label key={bt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1.5px solid ${form.brand_type === bt.id ? bt.color : '#e5eaf2'}`, borderRadius: 9, cursor: 'pointer', background: form.brand_type === bt.id ? `${bt.color}0d` : '#fff', transition: 'all 0.12s' }}>
                      <input type="radio" name="brand_type" value={bt.id} checked={form.brand_type === bt.id} onChange={() => setForm(f => ({ ...f, brand_type: bt.id }))} style={{ accentColor: bt.color, width: 14, height: 14, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: form.brand_type === bt.id ? bt.color : '#374151' }}>{bt.label}</span>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: 8 }}>{bt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, background: loading ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', letterSpacing: '-0.1px' }}
          >
            {loading ? 'Membuat akun...' : 'Buat Akun →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.83rem', color: '#6b7280' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>Masuk di sini</Link>
        </p>
      </div>

      {!isInvite && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20 }}>
          {['Bayar sekali', 'Akses selamanya', 'Mulai dari Rp99k'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
