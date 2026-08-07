'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle = {
  width: '100%', background: '#f3f4f6', border: '1.5px solid transparent', borderRadius: 10,
  padding: '11px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none',
  boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/sprints')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const em = p.get('email') || ''
    const redirect = p.get('redirect') || '/sprints'
    if (em) setEmail(em)
    setRedirectTo(redirect)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const callbackUrl = `${window.location.origin}/auth/callback${redirectTo !== '/sprints' ? `?next=${encodeURIComponent(redirectTo)}` : ''}`
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo: callbackUrl }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Gagal mengirim. Coba lagi.')
      setLoading(false)
      return
    }
    setSent(true)
    setOtp(['', '', '', '', '', ''])
    setOtpError('')
    setLoading(false)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  function handleOtpInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) otpRefs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = otp.join('')
    if (token.length < 6) { setOtpError('Masukkan 6 digit kode'); return }
    setOtpLoading(true)
    setOtpError('')

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
    const data = await res.json()

    if (!res.ok) {
      setOtpError(data.error || 'Kode salah atau expired.')
      setOtpLoading(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
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
        {!sent ? (
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
                  autoFocus
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ marginTop: 4, background: loading ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
                {loading ? 'Mengirim...' : 'Kirim Link Masuk →'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: '#9ca3af' }}>
              Kami kirimkan link login — tanpa password.
            </p>
          </>
        ) : (
          <>
            {/* Sent state — email icon + info */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(26,115,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: 6 }}>Cek emailmu!</div>
              <p style={{ color: '#6b7280', fontSize: '0.83rem', lineHeight: 1.6 }}>
                Kami kirim ke <strong style={{ color: '#111827' }}>{email}</strong><br />
                Klik link di email <strong>atau</strong> masukkan kode di bawah.
              </p>
            </div>

            {/* OTP input */}
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#374151', fontWeight: 600, textAlign: 'center' }}>Kode 6 Digit</label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{ width: 44, height: 52, textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, background: '#f3f4f6', border: `2px solid ${digit ? '#1a73e8' : '#e5e7eb'}`, borderRadius: 10, outline: 'none', color: '#111827', transition: 'border-color 0.15s' }}
                  />
                ))}
              </div>
              {otpError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.8rem', textAlign: 'center' }}>
                  {otpError}
                </div>
              )}
              <button type="submit" disabled={otpLoading || otp.join('').length < 6}
                style={{ background: otpLoading || otp.join('').length < 6 ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: otpLoading || otp.join('').length < 6 ? 'not-allowed' : 'pointer' }}>
                {otpLoading ? 'Memverifikasi...' : 'Masuk dengan Kode →'}
              </button>
            </form>

            <button onClick={() => { setSent(false); setOtp(['', '', '', '', '', '']); setOtpError('') }}
              style={{ display: 'block', width: '100%', marginTop: 14, background: 'transparent', border: 'none', color: '#1a73e8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, textAlign: 'center' }}>
              Kirim ulang ke email lain
            </button>
          </>
        )}
      </div>
    </div>
  )
}
