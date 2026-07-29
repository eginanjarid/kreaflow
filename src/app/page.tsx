import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #fff; color: #111827; -webkit-font-smoothing: antialiased; }

  /* NAV */
  .lp-nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; }
  .lp-nav-inner { max-width: 1140px; margin: 0 auto; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .lp-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .lp-logo-mark { width: 32px; height: 32px; border-radius: 9px; background: #1a73e8; display: flex; align-items: center; justify-content: center; }
  .lp-logo-name { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.4px; color: #111827; }
  .lp-logo-name span { color: #1a73e8; }
  .lp-nav-right { display: flex; align-items: center; gap: 8px; }
  .lp-nav-login { padding: 8px 16px; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: #6b7280; text-decoration: none; transition: color 0.15s; }
  .lp-nav-login:hover { color: #111827; }
  .lp-nav-cta { padding: 9px 20px; border-radius: 8px; background: #1a73e8; color: #fff; font-size: 0.875rem; font-weight: 600; text-decoration: none; transition: background 0.15s; display: inline-block; }
  .lp-nav-cta:hover { background: #1557b0; }

  /* HERO */
  .lp-hero { max-width: 1140px; margin: 0 auto; padding: 88px 28px 72px; text-align: center; }
  .lp-hero-label { display: inline-flex; align-items: center; gap: 7px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 20px; padding: 5px 14px; font-size: 0.8rem; font-weight: 600; color: #1d4ed8; margin-bottom: 28px; }
  .lp-hero-label-dot { width: 6px; height: 6px; border-radius: 50%; background: #1a73e8; }
  .lp-hero-h1 { font-size: clamp(2.4rem, 5vw, 3.8rem); font-weight: 900; line-height: 1.1; letter-spacing: -2px; color: #0f172a; margin-bottom: 20px; }
  .lp-hero-h1 em { font-style: normal; color: #1a73e8; }
  .lp-hero-sub { font-size: 1.1rem; color: #64748b; max-width: 520px; margin: 0 auto 40px; line-height: 1.7; font-weight: 400; }
  .lp-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
  .lp-btn-primary { padding: 13px 28px; border-radius: 9px; background: #1a73e8; color: #fff; font-size: 0.95rem; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.15s, transform 0.15s; box-shadow: 0 2px 8px rgba(26,115,232,0.25); }
  .lp-btn-primary:hover { background: #1557b0; transform: translateY(-1px); }
  .lp-btn-secondary { padding: 13px 28px; border-radius: 9px; border: 1.5px solid #e2e8f0; color: #374151; font-size: 0.95rem; font-weight: 600; text-decoration: none; display: inline-block; transition: border-color 0.15s; background: #fff; }
  .lp-btn-secondary:hover { border-color: #cbd5e1; }
  .lp-hero-note { font-size: 0.78rem; color: #94a3b8; }

  /* MOCKUP */
  .lp-mockup { max-width: 900px; margin: 52px auto 0; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 60px rgba(15,23,42,0.1), 0 4px 16px rgba(15,23,42,0.06); }
  .lp-mockup-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 16px; display: flex; align-items: center; gap: 12px; }
  .lp-mockup-dots { display: flex; gap: 5px; }
  .lp-mockup-dot { width: 9px; height: 9px; border-radius: 50%; }
  .lp-mockup-url { flex: 1; max-width: 220px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 5px; height: 22px; display: flex; align-items: center; justify-content: center; }
  .lp-mockup-url span { font-size: 0.65rem; color: #94a3b8; }
  .lp-mockup-body { display: flex; background: #f5f7fb; min-height: 260px; }
  .lp-mockup-sidebar { width: 140px; flex-shrink: 0; background: #fff; border-right: 1px solid #f1f5f9; padding: 14px 10px; }
  .lp-mockup-sidebar-logo { display: flex; align-items: center; gap: 6px; padding: 0 6px; margin-bottom: 14px; }
  .lp-mockup-sidebar-item { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 7px; margin-bottom: 2px; font-size: 0.72rem; color: #94a3b8; }
  .lp-mockup-sidebar-item.active { background: #eff6ff; color: #1a73e8; font-weight: 600; }
  .lp-mockup-main { flex: 1; padding: 18px 20px; min-width: 0; }
  .lp-mockup-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .lp-mockup-title { font-size: 0.78rem; font-weight: 700; color: #1e293b; }
  .lp-mockup-btn { background: #1a73e8; color: #fff; font-size: 0.65rem; font-weight: 600; border-radius: 5px; padding: 4px 10px; }
  .lp-mockup-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 10px; padding: 11px 13px; margin-bottom: 7px; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .lp-mockup-card-title { flex: 1; font-size: 0.74rem; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lp-mockup-badge { font-size: 0.62rem; padding: 2px 7px; border-radius: 5px; font-weight: 600; white-space: nowrap; }

  /* STATS BAR */
  .lp-stats { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
  .lp-stats-inner { max-width: 1140px; margin: 0 auto; padding: 0 28px; display: flex; align-items: stretch; }
  .lp-stat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; border-right: 1px solid #f1f5f9; text-align: center; }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-num { font-size: 1.6rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; line-height: 1; margin-bottom: 4px; }
  .lp-stat-label { font-size: 0.78rem; color: #94a3b8; font-weight: 500; }

  /* SECTION COMMON */
  .lp-section { max-width: 1140px; margin: 0 auto; padding: 88px 28px; }
  .lp-section-alt { background: #f8fafc; }
  .lp-section-alt-inner { max-width: 1140px; margin: 0 auto; padding: 88px 28px; }
  .lp-section-head { text-align: center; margin-bottom: 56px; }
  .lp-eyebrow { display: inline-block; font-size: 0.72rem; font-weight: 800; color: #1a73e8; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
  .lp-h2 { font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; letter-spacing: -1px; color: #0f172a; margin-bottom: 12px; }
  .lp-section-sub { font-size: 0.95rem; color: #64748b; max-width: 460px; margin: 0 auto; line-height: 1.65; }

  /* VALUE PROPS */
  .lp-values { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: #f1f5f9; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; }
  .lp-value { background: #fff; padding: 36px 32px; }
  .lp-value-icon { width: 46px; height: 46px; border-radius: 12px; background: #eff6ff; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; color: #1a73e8; }
  .lp-value-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
  .lp-value-desc { font-size: 0.875rem; color: #64748b; line-height: 1.65; }

  /* MODULES GRID */
  .lp-modules { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .lp-module { background: #fff; border: 1.5px solid #f1f5f9; border-radius: 12px; padding: 20px 18px; transition: border-color 0.2s, box-shadow 0.2s; }
  .lp-module:hover { border-color: #bfdbfe; box-shadow: 0 4px 16px rgba(26,115,232,0.08); }
  .lp-module-icon { color: #1a73e8; margin-bottom: 12px; }
  .lp-module-name { font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
  .lp-module-desc { font-size: 0.78rem; color: #94a3b8; line-height: 1.55; }

  /* STEPS */
  .lp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; }
  .lp-steps::before { content: ''; position: absolute; top: 22px; left: calc(12.5% + 22px); right: calc(12.5% + 22px); height: 1px; background: #e2e8f0; z-index: 0; }
  .lp-step { text-align: center; padding: 0 20px; position: relative; z-index: 1; }
  .lp-step-num { width: 44px; height: 44px; border-radius: 50%; background: #fff; border: 2px solid #1a73e8; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 0.8rem; font-weight: 800; color: #1a73e8; position: relative; z-index: 1; }
  .lp-step-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .lp-step-desc { font-size: 0.82rem; color: #64748b; line-height: 1.6; }

  /* FOR WHO */
  .lp-forwho { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .lp-forwho-card { background: #fff; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 30px; }
  .lp-forwho-icon { width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .lp-forwho-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
  .lp-forwho-list { display: flex; flex-direction: column; gap: 10px; }
  .lp-forwho-item { display: flex; gap: 8px; align-items: flex-start; font-size: 0.84rem; color: #475569; line-height: 1.5; }
  .lp-forwho-check { flex-shrink: 0; font-size: 0.85rem; margin-top: 1px; }

  /* PRICING */
  .lp-pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 780px; margin: 0 auto; }
  .lp-pricing-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 34px; position: relative; }
  .lp-pricing-featured { border-color: #1a73e8; box-shadow: 0 0 0 4px rgba(26,115,232,0.06); }
  .lp-pricing-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #1a73e8; border-radius: 20px; padding: 3px 16px; font-size: 0.68rem; font-weight: 800; color: #fff; letter-spacing: 0.06em; white-space: nowrap; }
  .lp-pricing-tier { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; color: #94a3b8; }
  .lp-pricing-price { font-size: 2.6rem; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; line-height: 1; }
  .lp-pricing-period { font-size: 0.9rem; color: #94a3b8; font-weight: 400; }
  .lp-pricing-original { font-size: 0.9rem; color: #cbd5e1; text-decoration: line-through; margin-bottom: 4px; }
  .lp-pricing-note { font-size: 0.8rem; color: #94a3b8; margin: 8px 0 24px; }
  .lp-pricing-divider { height: 1px; background: #f1f5f9; margin-bottom: 20px; }
  .lp-pricing-feats { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .lp-pricing-feat { display: flex; gap: 8px; align-items: flex-start; font-size: 0.84rem; color: #374151; }
  .lp-pricing-feat-check { flex-shrink: 0; font-size: 0.85rem; }
  .lp-pricing-cta { display: block; text-align: center; padding: 13px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; text-decoration: none; transition: background 0.15s; }
  .lp-pricing-cta-blue { background: #1a73e8; color: #fff; }
  .lp-pricing-cta-blue:hover { background: #1557b0; }
  .lp-pricing-cta-ghost { border: 1.5px solid #f1f5f9; color: #94a3b8; cursor: default; }
  .lp-pricing-bottom { text-align: center; margin-top: 22px; font-size: 0.78rem; color: #cbd5e1; }

  /* CTA */
  .lp-cta { background: #0f172a; }
  .lp-cta-inner { max-width: 1140px; margin: 0 auto; padding: 88px 28px; text-align: center; }
  .lp-cta-h2 { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 900; letter-spacing: -1px; color: #fff; margin-bottom: 14px; }
  .lp-cta-h2 em { font-style: normal; color: #60a5fa; }
  .lp-cta-sub { color: #64748b; font-size: 0.95rem; margin-bottom: 36px; }
  .lp-cta-note { font-size: 0.76rem; color: #334155; margin-top: 14px; }

  /* FOOTER */
  .lp-footer { border-top: 1px solid #f1f5f9; }
  .lp-footer-inner { max-width: 1140px; margin: 0 auto; padding: 28px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .lp-footer-brand { display: flex; align-items: center; gap: 8px; }
  .lp-footer-mark { width: 24px; height: 24px; border-radius: 7px; background: #1a73e8; display: flex; align-items: center; justify-content: center; }
  .lp-footer-name { font-size: 0.88rem; font-weight: 700; color: #374151; }
  .lp-footer-sep { width: 3px; height: 3px; border-radius: 50%; background: #e2e8f0; }
  .lp-footer-by { font-size: 0.8rem; color: #94a3b8; }
  .lp-footer-copy { font-size: 0.76rem; color: #cbd5e1; }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .lp-values { grid-template-columns: 1fr; }
    .lp-modules { grid-template-columns: repeat(2, 1fr); }
    .lp-steps { grid-template-columns: repeat(2, 1fr); gap: 36px; }
    .lp-steps::before { display: none; }
    .lp-step { text-align: left; display: flex; gap: 14px; align-items: flex-start; }
    .lp-step-num { flex-shrink: 0; margin: 0; }
    .lp-forwho { grid-template-columns: 1fr; }
    .lp-pricing-grid { grid-template-columns: 1fr; }
    .lp-stats-inner { flex-wrap: wrap; }
    .lp-stat { flex: 0 0 50%; border-right: none; border-bottom: 1px solid #f1f5f9; }
  }
  @media (max-width: 640px) {
    .lp-nav-inner { padding: 0 16px; }
    .lp-hero { padding: 64px 20px 56px; }
    .lp-hero-h1 { letter-spacing: -1.5px; }
    .lp-section { padding: 64px 20px; }
    .lp-section-alt-inner { padding: 64px 20px; }
    .lp-modules { grid-template-columns: 1fr; }
    .lp-steps { grid-template-columns: 1fr; }
    .lp-stat { flex: 0 0 100%; }
    .lp-mockup-sidebar { display: none; }
  }
`

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/brand')

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-mark">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="lp-logo-name"><span>Krea</span>Flow</span>
          </Link>
          <div className="lp-nav-right">
            <Link href="/login" className="lp-nav-login">Masuk</Link>
            <Link href="/register" className="lp-nav-cta">Coba Gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-label">
          <span className="lp-hero-label-dot" />
          Khusus Creator & Affiliator Indonesia
        </div>
        <h1 className="lp-hero-h1">
          Workflow konten dari<br />
          ide sampai <em>publikasi</em>—<br />
          satu platform, terstruktur.
        </h1>
        <p className="lp-hero-sub">
          Brand, konten, jadwal, dan performa — semua terhubung dalam satu alur kerja. Tidak perlu pindah-pindah tools lagi.
        </p>
        <div className="lp-hero-actions">
          <Link href="/register" className="lp-btn-primary">Mulai Gratis →</Link>
          <Link href="/login" className="lp-btn-secondary">Sudah punya akun</Link>
        </div>
        <p className="lp-hero-note">Tanpa kartu kredit · Akun langsung aktif</p>

        {/* App mockup */}
        <div className="lp-mockup">
          <div className="lp-mockup-bar">
            <div className="lp-mockup-dots">
              {['#ff5f57','#febc2e','#28c840'].map(c => (
                <div key={c} className="lp-mockup-dot" style={{ background: c }} />
              ))}
            </div>
            <div className="lp-mockup-url"><span>kreaflow.id/library</span></div>
          </div>
          <div className="lp-mockup-body">
            <div className="lp-mockup-sidebar">
              <div className="lp-mockup-sidebar-logo">
                <div style={{ width: 20, height: 20, borderRadius: 5, background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b' }}>KreaFlow</span>
              </div>
              {[
                { name: 'Brand', active: false },
                { name: 'Catalog', active: false },
                { name: 'Sprint', active: false },
                { name: 'Plan', active: false },
                { name: 'Library', active: true },
                { name: 'Studio', active: false },
                { name: 'Calendar', active: false },
              ].map(item => (
                <div key={item.name} className={`lp-mockup-sidebar-item${item.active ? ' active' : ''}`}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.active ? '#1a73e8' : '#e2e8f0', flexShrink: 0 }} />
                  {item.name}
                </div>
              ))}
            </div>
            <div className="lp-mockup-main">
              <div className="lp-mockup-topbar">
                <span className="lp-mockup-title">Library — Bank Konten</span>
                <div className="lp-mockup-btn">+ Tambah</div>
              </div>
              {[
                { title: '5 Hook TikTok untuk Produk Skincare', status: 'Siap', statusColor: '#15803d', statusBg: '#f0fdf4', platform: 'TikTok' },
                { title: 'Review Jujur Serum Vitamin C — Naskah Review', status: 'Draft', statusColor: '#92400e', statusBg: '#fffbeb', platform: 'Instagram' },
                { title: 'Cara Dapat Komisi Affiliate Tanpa Modal', status: 'Selesai', statusColor: '#1d4ed8', statusBg: '#eff6ff', platform: 'YouTube' },
              ].map((item, i) => (
                <div key={i} className="lp-mockup-card">
                  <div className="lp-mockup-card-title">{item.title}</div>
                  <span className="lp-mockup-badge" style={{ color: item.statusColor, background: item.statusBg }}>{item.status}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{item.platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="lp-stats">
        <div className="lp-stats-inner">
          {[
            { num: '10', label: 'Modul terintegrasi' },
            { num: '1', label: 'Platform cukup' },
            { num: '∞', label: 'Workspace & konten' },
            { num: 'Rp149k', label: 'Akses seumur hidup' },
          ].map(s => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* VALUE PROPS */}
      <section className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Mengapa KreaFlow</span>
          <h2 className="lp-h2">Satu platform, workflow penuh</h2>
          <p className="lp-section-sub">Dirancang agar kamu tidak perlu pindah-pindah tools hanya untuk mengelola konten sosial media.</p>
        </div>
        <div className="lp-values">
          <div className="lp-value">
            <div className="lp-value-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div className="lp-value-title">End-to-end dalam satu alur</div>
            <div className="lp-value-desc">Dari membangun brand, menyusun konten, menjadwalkan, hingga mengevaluasi performa — semuanya terhubung. Tidak ada data yang terpencar di berbagai tools.</div>
          </div>
          <div className="lp-value">
            <div className="lp-value-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <div className="lp-value-title">Terstruktur, bukan sekadar tools</div>
            <div className="lp-value-desc">KreaFlow bukan kumpulan fitur lepas. Setiap modul dirancang mengikuti alur kerja nyata creator — dari riset hingga publikasi hingga analitik.</div>
          </div>
          <div className="lp-value">
            <div className="lp-value-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div className="lp-value-title">Harga sekali, bukan langganan</div>
            <div className="lp-value-desc">Bayar sekali, pakai selamanya. Tidak ada biaya bulanan yang menggerogoti penghasilan. Lifetime deal hanya tersedia selama masa launch.</div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <div className="lp-section-alt">
        <div className="lp-section-alt-inner">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Modul</span>
            <h2 className="lp-h2">10 modul, satu platform</h2>
            <p className="lp-section-sub">Setiap modul dirancang untuk satu tahap spesifik dalam alur kerja konten kamu.</p>
          </div>
          <div className="lp-modules">
            {[
              { name: 'Brand', desc: 'Identitas, niche & content pillars', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg> },
              { name: 'Catalog', desc: 'Database produk & komisi affiliate', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg> },
              { name: 'Sprint', desc: 'Kanban produksi konten', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
              { name: 'Plan', desc: 'Rencana & script per platform', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
              { name: 'Library', desc: 'Bank konten siap pakai', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg> },
              { name: 'Studio', desc: 'Preview format visual konten', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg> },
              { name: 'Calendar', desc: 'Jadwal konten per platform', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { name: 'Tracker', desc: 'Pantau performa per platform', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { name: 'Budget', desc: 'Keuangan & saldo bersih sosmed', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
              { name: 'Insights', desc: 'Analitik & ringkasan performa', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            ].map(m => (
              <div key={m.name} className="lp-module">
                <div className="lp-module-icon">{m.icon}</div>
                <div className="lp-module-name">{m.name}</div>
                <div className="lp-module-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Cara Kerja</span>
          <h2 className="lp-h2">4 langkah, konten terpublikasi</h2>
          <p className="lp-section-sub">Workflow yang mengikuti cara kerja creator & affiliator Indonesia sesungguhnya.</p>
        </div>
        <div className="lp-steps">
          {[
            { n: '1', title: 'Setup Brand', desc: 'Isi identitas, tentukan niche, bangun content pillars dan bio per platform.' },
            { n: '2', title: 'Isi Catalog', desc: 'Tambah produk affiliate atau produk sendiri lengkap dengan komisi dan link.' },
            { n: '3', title: 'Produksi Konten', desc: 'Susun di Plan, simpan ke Library, produksi visual di Studio.' },
            { n: '4', title: 'Kelola & Evaluasi', desc: 'Atur Sprint & Calendar, pantau performa di Tracker dan Insights.' },
          ].map(s => (
            <div key={s.n} className="lp-step">
              <div className="lp-step-num">{s.n}</div>
              <div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOR WHO */}
      <div className="lp-section-alt">
        <div className="lp-section-alt-inner">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Untuk Siapa</span>
            <h2 className="lp-h2">Dibangun untuk kamu</h2>
            <p className="lp-section-sub">KreaFlow menjawab kebutuhan nyata tiga jenis pengguna di ekosistem konten Indonesia.</p>
          </div>
          <div className="lp-forwho">
            {[
              {
                title: 'Content Creator',
                iconBg: '#eff6ff', iconColor: '#1a73e8', checkColor: '#1a73e8',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg>,
                items: ['Bangun brand yang konsisten di semua platform', 'Kelola jadwal konten multi-platform', 'Sprint produksi konten terstruktur', 'Evaluasi performa & perbaiki strategi'],
              },
              {
                title: 'Affiliator',
                iconBg: '#f0fdf4', iconColor: '#15803d', checkColor: '#15803d',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
                items: ['Database produk affiliate terorganisir', 'Hitung potensi komisi per produk', 'Sprint produksi konten promosi', 'Lacak performa & keuangan affiliate'],
              },
              {
                title: 'Brand & SMM Agency',
                iconBg: '#fffbeb', iconColor: '#b45309', checkColor: '#b45309',
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                items: ['Kelola multiple brand dalam satu akun', 'Kolaborasi tim dalam workspace bersama', 'Budget & laporan keuangan sosmed', 'Insights performa brand keseluruhan'],
              },
            ].map(f => (
              <div key={f.title} className="lp-forwho-card">
                <div className="lp-forwho-icon" style={{ background: f.iconBg, color: f.iconColor }}>{f.icon}</div>
                <div className="lp-forwho-title">{f.title}</div>
                <div className="lp-forwho-list">
                  {f.items.map(item => (
                    <div key={item} className="lp-forwho-item">
                      <span className="lp-forwho-check" style={{ color: f.checkColor }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <section className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Harga</span>
          <h2 className="lp-h2">Transparan, tanpa kejutan</h2>
          <p className="lp-section-sub">Bayar sekali, akses selamanya. Tidak ada biaya berlangganan bulanan.</p>
        </div>
        <div className="lp-pricing-grid">
          {/* Lifetime */}
          <div className="lp-pricing-card lp-pricing-featured">
            <div className="lp-pricing-badge">LAUNCH OFFER</div>
            <div className="lp-pricing-tier" style={{ color: '#1a73e8' }}>Lifetime Deal</div>
            <div className="lp-pricing-original">Rp299.000</div>
            <div className="lp-pricing-price" style={{ color: '#1a73e8' }}>Rp149.000</div>
            <div className="lp-pricing-note">Bayar sekali · Akses selamanya · Termasuk semua update</div>
            <div className="lp-pricing-divider" />
            <div className="lp-pricing-feats">
              {[
                'Semua 10 modul lengkap',
                'Unlimited workspace',
                'Unlimited konten & jadwal manual',
                'Brand, Sprint, Plan, Library, Studio',
                'Tracker, Budget & Insights',
                'Semua update fitur ke depan',
              ].map(f => (
                <div key={f} className="lp-pricing-feat">
                  <span className="lp-pricing-feat-check" style={{ color: '#1a73e8' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <Link href="/register" className="lp-pricing-cta lp-pricing-cta-blue">Beli Lifetime Deal →</Link>
          </div>

          {/* Pro Add-on */}
          <div className="lp-pricing-card">
            <div className="lp-pricing-tier">Pro Add-on</div>
            <div className="lp-pricing-price">Rp49.000<span className="lp-pricing-period">/bln</span></div>
            <div className="lp-pricing-note">Perlu paket Lifetime terlebih dahulu</div>
            <div className="lp-pricing-divider" />
            <div className="lp-pricing-feats">
              {[
                'Auto-schedule posting ke sosmed',
                'TikTok, Instagram, Facebook, YouTube',
                'Queue & publish otomatis',
                'Notifikasi status setiap posting',
                'Analitik jadwal & engagement',
              ].map(f => (
                <div key={f} className="lp-pricing-feat">
                  <span className="lp-pricing-feat-check" style={{ color: '#94a3b8' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
            <div className="lp-pricing-cta lp-pricing-cta-ghost">Segera Hadir</div>
          </div>
        </div>
        <p className="lp-pricing-bottom">Harga lifetime hanya untuk masa launch · Dapat berubah kapan saja</p>
      </section>

      {/* CTA */}
      <div className="lp-cta">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-h2">Mulai kelola konten<br />dengan <em>lebih terstruktur.</em></h2>
          <p className="lp-cta-sub">Bergabung bersama creator & affiliator Indonesia yang sudah pakai KreaFlow.</p>
          <Link href="/register" className="lp-btn-primary" style={{ fontSize: '1rem', padding: '14px 36px' }}>
            Daftar Sekarang — Gratis
          </Link>
          <p className="lp-cta-note">Tanpa kartu kredit · Akun langsung aktif</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-footer-mark">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="lp-footer-name">KreaFlow</span>
            <span className="lp-footer-sep" />
            <span className="lp-footer-by">by TUAS DIGITAL</span>
          </div>
          <span className="lp-footer-copy">© 2026 KreaFlow · kreaflow.id</span>
        </div>
      </footer>
    </div>
  )
}
