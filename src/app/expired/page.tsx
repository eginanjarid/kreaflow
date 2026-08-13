import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Akses Berakhir — KreaFlow' }

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f8fafc; }
  .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
  .card { background: #fff; border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 4px 40px rgba(15,23,42,0.08); }
  .icon { width: 64px; height: 64px; border-radius: 50%; background: #fff7ed; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
  .title { font-size: 1.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 10px; }
  .sub { font-size: 0.9rem; color: #64748b; line-height: 1.65; margin-bottom: 28px; }
  .btn { display: block; padding: 14px 20px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; text-decoration: none; text-align: center; background: #1a73e8; color: #fff; margin-bottom: 10px; }
  .note { font-size: 0.78rem; color: #94a3b8; }
  .note a { color: #1a73e8; text-decoration: none; }
`

export default function ExpiredPage() {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <div className="card">
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>KreaFlow</span>
          </div>
          <div className="icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="title">Akses Berakhir</h1>
          <p className="sub">
            Akses KreaFlow kamu sudah tidak aktif. Dapatkan akses Lifetime untuk pakai selamanya tanpa batas.
          </p>
          <a href="https://kreaflow.id/lp" className="btn">
            Beli KreaFlow Lifetime — Rp149.000 →
          </a>
          <p className="note">
            Sudah bayar? Email ke{' '}
            <a href="mailto:support@tuasdigital.com">support@tuasdigital.com</a>
            {' '}untuk aktivasi manual.
          </p>
        </div>
      </div>
    </div>
  )
}
