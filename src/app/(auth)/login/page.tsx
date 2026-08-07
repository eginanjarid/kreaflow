'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const inputStyle = {
  width: '100%', background: '#f3f4f6', border: '1.5px solid transparent', borderRadius: 10,
  padding: '11px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [emailParam, setEmailParam] = useState('')

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const em = p.get('email') || ''
    if (em) setEmail(em)
    setEmailParam(em)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const redirectParam = new URLSearchParams(window.location.search).get('redirect')
    const redirectTo = `${window.location.origin}/auth/callback${redirectParam ? `?next=${encodeURIComponent(redirectParam)}` : ''}`

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
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
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Masuk ke akun kamu</p>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.08)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(26,115,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: 8 }}>Cek emailmu!</div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Link masuk sudah dikirim ke <strong style={{ color: '#111827' }}>{email}</strong>.<br />
              Klik link di email untuk masuk — tanpa password.
            </p>
            <button onClick={() => setSent(false)} style={{ marginTop: 20, background: 'transparent', border: 'none', color: '#1a73e8', fontSize: '0.83rem', cursor: 'pointer', fontWeight: 600 }}>
              Kirim ulang ke email lain
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', color: '#dc2626', fontSize: '0.83rem', marginBottom: 20, fontWeight: 500 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', marginBottom: 6, fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  required
                  autoFocus={!emailParam}
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: 4, background: loading ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', letterSpacing: '-0.1px' }}
              >
                {loading ? 'Mengirim...' : 'Kirim Link Masuk →'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: '#9ca3af' }}>
              Kami kirimkan link login — tanpa password.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
