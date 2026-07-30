import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pembayaran Berhasil — KreaFlow' }

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f8fafc; }
  .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
  .card { background: #fff; border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 4px 40px rgba(15,23,42,0.08); }
  .icon { width: 64px; height: 64px; border-radius: 50%; background: #f0fdf4; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
  .title { font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 10px; }
  .sub { font-size: 0.9rem; color: #64748b; line-height: 1.65; margin-bottom: 32px; }
  .btn { display: inline-block; background: #1a73e8; color: #fff; padding: 13px 28px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; text-decoration: none; transition: background 0.15s; }
  .btn:hover { background: #1557b0; }
  .note { margin-top: 20px; font-size: 0.78rem; color: #94a3b8; }
`

export default function PaymentSuccessPage() {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <div className="card">
          <div className="icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="title">Pembayaran Berhasil!</h1>
          <p className="sub">
            Akun KreaFlow kamu sudah aktif. Selamat datang di Lifetime Deal — sekarang kamu punya akses penuh ke semua fitur selamanya.
          </p>
          <Link href="/sprints" className="btn">Mulai Pakai KreaFlow →</Link>
          <p className="note">Konfirmasi aktivasi dikirim ke email kamu</p>
        </div>
      </div>
    </div>
  )
}
