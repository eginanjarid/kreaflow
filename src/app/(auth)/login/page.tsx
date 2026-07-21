'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Login gagal'); setLoading(false); return }
    router.push('/brand')
    router.refresh()
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#f1f5f9' }}>KreaFlow</span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Masuk ke akun kamu</p>
      </div>

      <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, padding: '32px 28px' }}>
        {error && (
          <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem', marginBottom: 20 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@kamu.com" required autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: 8, background: loading ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s' }}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: '#94a3b8' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: '#A78BFA', textDecoration: 'none', fontWeight: 500 }}>Daftar sekarang</Link>
        </p>
      </div>
    </div>
  )
}
