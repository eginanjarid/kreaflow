import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const CSS = `
  @keyframes aurora-1 {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
    50% { transform: translate(60px, -40px) scale(1.15); opacity: 0.35; }
  }
  @keyframes aurora-2 {
    0%, 100% { transform: translate(0, 0) scale(1.1); opacity: 0.4; }
    50% { transform: translate(-50px, 60px) scale(0.9); opacity: 0.55; }
  }
  @keyframes aurora-3 {
    0%, 100% { transform: translate(0, 0) scale(0.95); opacity: 0.3; }
    60% { transform: translate(40px, 30px) scale(1.1); opacity: 0.45; }
  }
  @keyframes float-badge {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(26,115,232,0.3); }
    50% { box-shadow: 0 0 40px rgba(26,115,232,0.5); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .kf-lp-root { background: #05050a; min-height: 100vh; color: #f1f5f9; font-family: system-ui,-apple-system,sans-serif; }

  /* Navbar */
  .kf-lp-nav { position: sticky; top: 0; z-index: 100; padding: 0 24px; background: rgba(5,5,10,0.7); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .kf-lp-nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 62px; }
  .kf-lp-logo { display: flex; align-items: center; gap: 10px; }
  .kf-lp-logo-icon { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, #1a73e8, #60a5fa); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(26,115,232,0.35); }
  .kf-lp-logo-text { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.5px; }
  .kf-lp-nav-actions { display: flex; align-items: center; gap: 10px; }
  .kf-lp-btn-ghost { padding: 7px 16px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08); color: #64748b; font-size: 0.84rem; font-weight: 500; text-decoration: none; transition: border-color 0.2s, color 0.2s; background: transparent; }
  .kf-lp-btn-ghost:hover { border-color: rgba(26,115,232,0.4); color: #94a3b8; }
  .kf-lp-btn-primary { padding: 8px 18px; border-radius: 9px; background: linear-gradient(135deg, #1a73e8, #3b82f6); color: #fff; font-size: 0.84rem; font-weight: 700; text-decoration: none; box-shadow: 0 4px 16px rgba(26,115,232,0.3); transition: transform 0.15s, box-shadow 0.15s; display: inline-block; }
  .kf-lp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(26,115,232,0.4); }

  /* Hero */
  .kf-lp-hero { position: relative; overflow: hidden; text-align: center; padding: 110px 24px 90px; max-width: 1100px; margin: 0 auto; }
  .kf-aurora { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
  .kf-aurora-blob { position: absolute; border-radius: 50%; filter: blur(80px); }
  .kf-aurora-1 { width: 500px; height: 500px; top: -100px; left: 50%; transform: translateX(-60%); background: radial-gradient(circle, rgba(26,115,232,0.35) 0%, transparent 70%); animation: aurora-1 8s ease-in-out infinite; }
  .kf-aurora-2 { width: 400px; height: 400px; top: 50px; right: 0; background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%); animation: aurora-2 10s ease-in-out infinite; }
  .kf-aurora-3 { width: 350px; height: 350px; bottom: 0; left: 0; background: radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%); animation: aurora-3 7s ease-in-out infinite; }
  .kf-hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(26,115,232,0.1); border: 1px solid rgba(26,115,232,0.22); border-radius: 20px; padding: 5px 14px 5px 10px; font-size: 0.76rem; color: #60a5fa; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 28px; position: relative; z-index: 1; }
  .kf-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #1a73e8; box-shadow: 0 0 6px #1a73e8; }
  .kf-hero-h1 { font-size: clamp(2.6rem, 5.5vw, 4.2rem); font-weight: 900; line-height: 1.05; letter-spacing: -2px; margin: 0 0 22px; position: relative; z-index: 1; }
  .kf-hero-gradient { background: linear-gradient(135deg, #1a73e8 0%, #60a5fa 50%, #a78bfa 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s linear infinite; }
  .kf-hero-sub { font-size: 1.05rem; color: #475569; max-width: 520px; margin: 0 auto 40px; line-height: 1.7; position: relative; z-index: 1; }
  .kf-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
  .kf-hero-cta-main { padding: 14px 32px; border-radius: 11px; background: linear-gradient(135deg, #1a73e8, #3b82f6); color: #fff; font-size: 0.95rem; font-weight: 700; text-decoration: none; box-shadow: 0 8px 32px rgba(26,115,232,0.35); animation: pulse-glow 3s ease-in-out infinite; transition: transform 0.15s; display: inline-block; }
  .kf-hero-cta-main:hover { transform: translateY(-2px); }
  .kf-hero-cta-sec { padding: 14px 28px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.95rem; font-weight: 600; text-decoration: none; background: rgba(255,255,255,0.03); backdrop-filter: blur(8px); display: inline-block; }
  .kf-hero-note { font-size: 0.75rem; color: #1f2a3c; margin-top: 14px; position: relative; z-index: 1; }

  /* Stats bar */
  .kf-stats-bar { border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.02); padding: 18px 24px; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .kf-stats-bar::-webkit-scrollbar { display: none; }
  .kf-stats-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 0; justify-content: center; }
  .kf-stat-item { display: flex; align-items: center; gap: 8px; padding: 0 28px; }
  .kf-stat-item + .kf-stat-item { border-left: 1px solid rgba(255,255,255,0.06); }
  .kf-stat-num { font-size: 1.1rem; font-weight: 900; color: #1a73e8; letter-spacing: -0.5px; }
  .kf-stat-label { font-size: 0.78rem; color: #334155; font-weight: 500; }

  /* Section common */
  .kf-lp-section { max-width: 1100px; margin: 0 auto; padding: 88px 24px; }
  .kf-section-header { text-align: center; margin-bottom: 56px; }
  .kf-section-eyebrow { display: inline-block; font-size: 0.72rem; font-weight: 800; color: #1a73e8; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
  .kf-section-h2 { font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 900; letter-spacing: -1px; margin: 0 0 12px; }
  .kf-section-sub { color: #475569; font-size: 0.95rem; max-width: 480px; margin: 0 auto; line-height: 1.6; }

  /* Bento grid */
  .kf-bento { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: auto; gap: 12px; }
  .kf-bento-card { background: linear-gradient(145deg, #0d1117, #0a0d14); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; transition: border-color 0.25s, transform 0.25s; cursor: default; }
  .kf-bento-card:hover { border-color: rgba(26,115,232,0.3); transform: translateY(-2px); }
  .kf-bento-lg { grid-column: span 2; grid-row: span 2; }
  .kf-bento-md { grid-column: span 2; }
  .kf-bento-sm { grid-column: span 1; }
  .kf-bento-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(26,115,232,0.1); border: 1px solid rgba(26,115,232,0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #1a73e8; }
  .kf-bento-name { font-weight: 800; color: #e2e8f0; margin-bottom: 8px; font-size: 0.95rem; }
  .kf-bento-desc { font-size: 0.82rem; color: #334155; line-height: 1.6; }
  .kf-bento-lg .kf-bento-icon { width: 52px; height: 52px; border-radius: 14px; margin-bottom: 20px; }
  .kf-bento-lg .kf-bento-name { font-size: 1.15rem; margin-bottom: 10px; }
  .kf-bento-lg .kf-bento-desc { font-size: 0.88rem; }

  /* Steps */
  .kf-steps { background: rgba(255,255,255,0.015); border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 88px 24px; }
  .kf-steps-inner { max-width: 1100px; margin: 0 auto; }
  .kf-steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; }
  .kf-steps-grid::before { content: ''; position: absolute; top: 23px; left: calc(12.5% + 20px); right: calc(12.5% + 20px); height: 1px; background: linear-gradient(90deg, transparent, rgba(26,115,232,0.3), rgba(26,115,232,0.3), transparent); z-index: 0; }
  .kf-step { text-align: center; padding: 0 16px; position: relative; z-index: 1; }
  .kf-step-num { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #1a73e8, #3b82f6); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; font-size: 0.82rem; font-weight: 900; color: #fff; box-shadow: 0 4px 16px rgba(26,115,232,0.3); }
  .kf-step-title { font-weight: 800; color: #e2e8f0; font-size: 0.95rem; margin-bottom: 8px; }
  .kf-step-desc { font-size: 0.81rem; color: #334155; line-height: 1.6; }

  /* For who */
  .kf-forwho-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .kf-forwho-card { background: linear-gradient(145deg, #0d1117, #0a0d14); border-radius: 18px; padding: 30px; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.25s, border-color 0.25s; }
  .kf-forwho-card:hover { transform: translateY(-3px); }
  .kf-forwho-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .kf-forwho-title { font-weight: 800; font-size: 1rem; color: #e2e8f0; margin-bottom: 16px; }
  .kf-forwho-list { display: flex; flex-direction: column; gap: 10px; }
  .kf-forwho-item { display: flex; gap: 9px; align-items: flex-start; font-size: 0.83rem; color: #334155; line-height: 1.5; }
  .kf-forwho-check { flex-shrink: 0; margin-top: 1px; font-size: 0.85rem; }

  /* Pricing */
  .kf-pricing-bg { background: rgba(255,255,255,0.015); border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 88px 24px; }
  .kf-pricing-inner { max-width: 800px; margin: 0 auto; }
  .kf-pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .kf-pricing-card { background: linear-gradient(145deg, #0d1117, #0a0d14); border-radius: 20px; padding: 34px; border: 1px solid rgba(255,255,255,0.06); position: relative; }
  .kf-pricing-card-featured { border-color: rgba(26,115,232,0.35); box-shadow: 0 0 60px rgba(26,115,232,0.08), inset 0 1px 0 rgba(26,115,232,0.1); }
  .kf-pricing-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #1a73e8, #3b82f6); border-radius: 20px; padding: 4px 16px; font-size: 0.68rem; font-weight: 800; color: #fff; letter-spacing: 0.06em; white-space: nowrap; }
  .kf-pricing-tier { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
  .kf-pricing-price { font-size: 2.6rem; font-weight: 900; color: #f1f5f9; letter-spacing: -1px; line-height: 1; margin-bottom: 4px; }
  .kf-pricing-price-period { font-size: 0.85rem; color: #334155; vertical-align: middle; font-weight: 400; }
  .kf-pricing-note { font-size: 0.8rem; color: #1f2937; margin-bottom: 24px; }
  .kf-pricing-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .kf-pricing-feat { display: flex; gap: 8px; align-items: flex-start; font-size: 0.83rem; color: #334155; }
  .kf-pricing-feat-check { flex-shrink: 0; font-size: 0.85rem; }
  .kf-pricing-cta-main { display: block; text-align: center; padding: 13px; border-radius: 11px; background: linear-gradient(135deg, #1a73e8, #3b82f6); color: #fff; font-size: 0.88rem; font-weight: 700; text-decoration: none; box-shadow: 0 6px 20px rgba(26,115,232,0.3); transition: transform 0.15s, box-shadow 0.15s; }
  .kf-pricing-cta-main:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(26,115,232,0.4); }
  .kf-pricing-cta-ghost { display: block; text-align: center; padding: 13px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.07); color: #334155; font-size: 0.88rem; font-weight: 600; cursor: default; }
  .kf-pricing-disclaimer { text-align: center; font-size: 0.78rem; color: #1a2035; margin-top: 26px; }

  /* CTA section */
  .kf-cta-section { max-width: 1100px; margin: 0 auto; padding: 88px 24px; text-align: center; }
  .kf-cta-box { position: relative; border-radius: 24px; padding: 64px 40px; overflow: hidden; background: linear-gradient(145deg, #080c14, #0d1117); border: 1px solid rgba(26,115,232,0.2); }
  .kf-cta-box::before { content: ''; position: absolute; inset: -1px; border-radius: 24px; background: linear-gradient(135deg, rgba(26,115,232,0.3), transparent 50%, rgba(99,102,241,0.2)); z-index: 0; pointer-events: none; }
  .kf-cta-box-inner { position: relative; z-index: 1; }
  .kf-cta-box-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(26,115,232,0.12) 0%, transparent 70%); pointer-events: none; }
  .kf-cta-h2 { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 900; letter-spacing: -1px; margin: 0 0 16px; }
  .kf-cta-sub { color: #475569; font-size: 0.95rem; margin-bottom: 36px; }
  .kf-cta-btn { padding: 15px 40px; border-radius: 11px; background: linear-gradient(135deg, #1a73e8, #3b82f6); color: #fff; font-size: 1rem; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 8px 32px rgba(26,115,232,0.35); transition: transform 0.15s; }
  .kf-cta-btn:hover { transform: translateY(-2px); }
  .kf-cta-note { font-size: 0.76rem; color: #1a2035; margin-top: 14px; }

  /* Footer */
  .kf-lp-footer { border-top: 1px solid rgba(255,255,255,0.04); padding: 32px 24px; }
  .kf-lp-footer-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .kf-lp-footer-brand { display: flex; align-items: center; gap: 8px; }
  .kf-lp-footer-copy { font-size: 0.76rem; color: #1f2937; }

  /* Responsive */
  @media (max-width: 768px) {
    .kf-lp-hero { padding: 80px 20px 64px; }
    .kf-hero-h1 { letter-spacing: -1px; }
    .kf-bento { grid-template-columns: repeat(2, 1fr); }
    .kf-bento-lg { grid-column: span 2; grid-row: span 1; }
    .kf-bento-sm { grid-column: span 1; }
    .kf-steps-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; }
    .kf-steps-grid::before { display: none; }
    .kf-step { text-align: left; display: flex; align-items: flex-start; gap: 14px; }
    .kf-step-num { flex-shrink: 0; margin: 0; }
    .kf-forwho-grid { grid-template-columns: 1fr; }
    .kf-pricing-grid { grid-template-columns: 1fr; }
    .kf-stats-inner { justify-content: flex-start; }
    .kf-cta-box { padding: 44px 24px; }
  }
  @media (max-width: 480px) {
    .kf-bento { grid-template-columns: 1fr; }
    .kf-bento-lg, .kf-bento-md, .kf-bento-sm { grid-column: span 1; }
    .kf-steps-grid { grid-template-columns: 1fr; }
  }
`

const MODULES = [
  {
    name: 'Brand', size: 'lg',
    desc: 'Bangun identitas brand yang kuat — tentukan niche, content pillars, tone of voice, dan bio untuk setiap platform sosial media kamu.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  },
  {
    name: 'Catalog', size: 'sm',
    desc: 'Database produk affiliate dan produk sendiri lengkap dengan komisi dan link.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>,
  },
  {
    name: 'Sprint', size: 'sm',
    desc: 'Kanban board untuk manajemen proyek konten — plan, progress, selesai.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  },
  {
    name: 'Plan', size: 'md',
    desc: 'Susun rencana konten per platform dengan template terstruktur dan script siap produksi.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  {
    name: 'Library', size: 'md',
    desc: 'Bank konten siap pakai — simpan script, ide, referensi, dan aset dalam satu tempat.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  },
  {
    name: 'Studio', size: 'md',
    desc: 'Produksi konten visual dengan preview format untuk IG, TikTok, dan platform lainnya.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg>,
  },
  {
    name: 'Calendar', size: 'sm',
    desc: 'Jadwal konten visual — pantau slot posting mingguan & bulanan.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    name: 'Tracker', size: 'sm',
    desc: 'Input & pantau performa konten per platform dalam satu dashboard.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    name: 'Budget', size: 'sm',
    desc: 'Catat pemasukan & pengeluaran, hitung saldo bersih aktivitas sosmed.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    name: 'Insights', size: 'sm',
    desc: 'Analitik overview — ringkasan konten, performa, dan keuangan.',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
]

const STEPS = [
  { n: '01', title: 'Setup Brand', desc: 'Isi identitas, tentukan niche, bangun content pillars dan bio per platform' },
  { n: '02', title: 'Isi Catalog', desc: 'Tambah produk affiliate atau produk sendiri yang akan dipromosikan' },
  { n: '03', title: 'Produksi Konten', desc: 'Susun di Plan, simpan ke Library, produksi visual di Studio' },
  { n: '04', title: 'Kelola & Pantau', desc: 'Atur Sprint & Calendar, evaluasi di Tracker dan Insights' },
]

const FOR_WHO = [
  {
    title: 'Content Creator',
    iconColor: '#1a73e8',
    iconBg: 'rgba(26,115,232,0.1)',
    border: 'rgba(26,115,232,0.15)',
    checkColor: '#1a73e8',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg>,
    items: ['Bangun identitas brand yang konsisten', 'Kelola jadwal konten multi-platform', 'Sprint produksi konten terstruktur', 'Evaluasi performa & perbaiki strategi'],
  },
  {
    title: 'Affiliator',
    iconColor: '#10b981',
    iconBg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.12)',
    checkColor: '#10b981',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    items: ['Database produk affiliate terorganisir', 'Hitung potensi komisi per produk', 'Sprint produksi konten promosi', 'Lacak performa & keuangan affiliate'],
  },
  {
    title: 'Brand / SMM',
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.12)',
    checkColor: '#f59e0b',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    items: ['Kelola multiple brand dalam satu akun', 'Kolaborasi tim dengan workspace bersama', 'Budget & laporan keuangan sosmed', 'Insights performa brand keseluruhan'],
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/brand')

  return (
    <div className="kf-lp-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Navbar */}
      <nav className="kf-lp-nav">
        <div className="kf-lp-nav-inner">
          <div className="kf-lp-logo">
            <div className="kf-lp-logo-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="kf-lp-logo-text">
              <span style={{ color: '#1a73e8' }}>Krea</span><span style={{ color: '#f1f5f9' }}>Flow</span>
            </span>
          </div>
          <div className="kf-lp-nav-actions">
            <Link href="/login" className="kf-lp-btn-ghost">Masuk</Link>
            <Link href="/register" className="kf-lp-btn-primary">Coba Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div className="kf-aurora">
          <div className="kf-aurora-blob kf-aurora-1" />
          <div className="kf-aurora-blob kf-aurora-2" />
          <div className="kf-aurora-blob kf-aurora-3" />
        </div>
        <section className="kf-lp-hero">
          <div className="kf-hero-badge">
            <span className="kf-hero-badge-dot" />
            Platform SMM #1 untuk Creator & Affiliator Indonesia
          </div>
          <h1 className="kf-hero-h1">
            Dari ide sampai posting,<br />
            <span className="kf-hero-gradient">dalam satu alur kerja.</span>
          </h1>
          <p className="kf-hero-sub">
            KreaFlow menyatukan Brand, Catalog, Sprint, Plan, Library, Studio, dan Calendar — workflow konten end-to-end tanpa pindah-pindah tools.
          </p>
          <div className="kf-hero-ctas">
            <Link href="/register" className="kf-hero-cta-main">Mulai Sekarang →</Link>
            <Link href="/login" className="kf-hero-cta-sec">Sudah punya akun</Link>
          </div>
          <p className="kf-hero-note">Daftar gratis · Tanpa kartu kredit · Akun langsung aktif</p>

          {/* App mockup */}
          <div style={{ marginTop: 60, background: 'linear-gradient(145deg, #0a0d14, #07090f)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden', maxWidth: 820, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 32px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(26,115,232,0.08)', position: 'relative', zIndex: 1 }}>
            {/* Browser chrome */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 5, height: 20, maxWidth: 200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.6rem', color: '#1f2937' }}>kreaflow.id/library</span>
              </div>
            </div>
            {/* App content */}
            <div style={{ display: 'flex', minHeight: 220 }}>
              {/* Sidebar */}
              <div style={{ width: 120, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.04)', padding: '12px 8px', background: 'rgba(0,0,0,0.2)' }}>
                {['Brand','Catalog','Sprint','Plan','Library','Studio'].map(name => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 7, marginBottom: 2, background: name === 'Library' ? 'rgba(26,115,232,0.12)' : 'transparent', border: name === 'Library' ? '1px solid rgba(26,115,232,0.2)' : '1px solid transparent' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: name === 'Library' ? '#1a73e8' : '#1f2a3c', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.72rem', color: name === 'Library' ? '#60a5fa' : '#1f2937', fontWeight: name === 'Library' ? 700 : 400 }}>{name}</span>
                  </div>
                ))}
              </div>
              {/* Main */}
              <div style={{ flex: 1, padding: '16px 18px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: '0.65rem', color: '#1f2937', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Library — Bank Konten</span>
                  <div style={{ background: 'rgba(26,115,232,0.15)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 5, padding: '2px 8px', fontSize: '0.6rem', color: '#60a5fa', fontWeight: 700 }}>+ Tambah</div>
                </div>
                {[
                  { title: '5 Hook TikTok untuk Produk Skincare', status: 'Ready', platform: 'TikTok', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                  { title: 'Review Jujur Serum Vitamin C', status: 'Draft', platform: 'Instagram', color: '#475569', bg: 'rgba(71,85,105,0.1)' },
                  { title: 'Cara Dapat Komisi Affiliate Tanpa Modal', status: 'Selesai', platform: 'YouTube', color: '#1a73e8', bg: 'rgba(26,115,232,0.08)' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 5 }}>
                    <div style={{ flex: 1, fontSize: '0.73rem', color: '#94a3b8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: 6, background: item.bg, color: item.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.status}</span>
                    <span style={{ fontSize: '0.62rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{item.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Stats bar */}
      <div className="kf-stats-bar">
        <div className="kf-stats-inner">
          {[
            { num: '10', label: 'Modul Lengkap' },
            { num: '1', label: 'Platform Terintegrasi' },
            { num: '∞', label: 'Workspace' },
            { num: '100%', label: 'Workflow End-to-End' },
            { num: 'IDR', label: 'Harga Lokal' },
          ].map(s => (
            <div key={s.label} className="kf-stat-item">
              <span className="kf-stat-num">{s.num}</span>
              <span className="kf-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modules bento */}
      <section className="kf-lp-section">
        <div className="kf-section-header">
          <span className="kf-section-eyebrow">Fitur</span>
          <h2 className="kf-section-h2">10 Modul dalam Satu Platform</h2>
          <p className="kf-section-sub">Semua yang kamu butuhkan untuk workflow konten — dari brand building sampai evaluasi performa.</p>
        </div>
        <div className="kf-bento">
          {MODULES.map(m => (
            <div
              key={m.name}
              className={`kf-bento-card ${m.size === 'lg' ? 'kf-bento-lg' : m.size === 'md' ? 'kf-bento-md' : 'kf-bento-sm'}`}
            >
              <div className="kf-bento-icon">{m.icon}</div>
              <div className="kf-bento-name">{m.name}</div>
              <div className="kf-bento-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <div className="kf-steps">
        <div className="kf-steps-inner">
          <div className="kf-section-header">
            <span className="kf-section-eyebrow">Cara Kerja</span>
            <h2 className="kf-section-h2">4 Langkah, Konten Terpublikasi</h2>
            <p className="kf-section-sub">Workflow yang sudah dirancang khusus untuk creator dan affiliator Indonesia.</p>
          </div>
          <div className="kf-steps-grid">
            {STEPS.map(s => (
              <div key={s.n} className="kf-step">
                <div className="kf-step-num">{s.n}</div>
                <div>
                  <div className="kf-step-title">{s.title}</div>
                  <div className="kf-step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For who */}
      <section className="kf-lp-section">
        <div className="kf-section-header">
          <span className="kf-section-eyebrow">Untuk Siapa</span>
          <h2 className="kf-section-h2">Dirancang untuk Kamu</h2>
          <p className="kf-section-sub">KreaFlow menjawab kebutuhan nyata creator, affiliator, dan brand di Indonesia.</p>
        </div>
        <div className="kf-forwho-grid">
          {FOR_WHO.map(f => (
            <div key={f.title} className="kf-forwho-card" style={{ borderColor: f.border }}>
              <div className="kf-forwho-icon-wrap" style={{ background: f.iconBg, color: f.iconColor }}>{f.icon}</div>
              <div className="kf-forwho-title">{f.title}</div>
              <div className="kf-forwho-list">
                {f.items.map(item => (
                  <div key={item} className="kf-forwho-item">
                    <span className="kf-forwho-check" style={{ color: f.checkColor }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <div className="kf-pricing-bg">
        <div className="kf-pricing-inner">
          <div className="kf-section-header">
            <span className="kf-section-eyebrow">Harga</span>
            <h2 className="kf-section-h2">Transparan, Tanpa Kejutan</h2>
            <p className="kf-section-sub">Bayar sekali, pakai selamanya. Tanpa biaya berlangganan yang membebani.</p>
          </div>
          <div className="kf-pricing-grid">

            {/* Lifetime */}
            <div className="kf-pricing-card kf-pricing-card-featured">
              <div className="kf-pricing-badge">LAUNCH OFFER</div>
              <div className="kf-pricing-tier" style={{ color: '#1a73e8' }}>Lifetime Deal</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '1rem', color: '#1f2937', textDecoration: 'line-through' }}>Rp299.000</span>
              </div>
              <div className="kf-pricing-price">Rp149.000</div>
              <div className="kf-pricing-note">Bayar sekali · Akses selamanya</div>
              <div className="kf-pricing-features">
                {['Semua 10 modul lengkap','Unlimited workspace','Unlimited konten & jadwal manual','Brand, Sprint, Plan, Library, Studio','Tracker, Budget & Insights','Update fitur selamanya'].map(f => (
                  <div key={f} className="kf-pricing-feat">
                    <span className="kf-pricing-feat-check" style={{ color: '#1a73e8' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/register" className="kf-pricing-cta-main">Beli Lifetime Deal →</Link>
            </div>

            {/* Pro Add-on */}
            <div className="kf-pricing-card">
              <div className="kf-pricing-tier" style={{ color: '#f59e0b' }}>Pro Add-on</div>
              <div className="kf-pricing-price">
                Rp49.000<span className="kf-pricing-price-period">/bulan</span>
              </div>
              <div className="kf-pricing-note">Perlu paket Lifetime · Tambah kapan saja</div>
              <div className="kf-pricing-features">
                {['Auto-schedule posting ke sosmed','TikTok, Instagram, Facebook, YouTube','Queue & publish otomatis','Notifikasi status setiap posting','Analitik jadwal & engagement dasar'].map(f => (
                  <div key={f} className="kf-pricing-feat">
                    <span className="kf-pricing-feat-check" style={{ color: '#f59e0b' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="kf-pricing-cta-ghost">Segera Hadir</div>
            </div>

          </div>
          <p className="kf-pricing-disclaimer">Harga lifetime hanya untuk masa launch · Dapat naik kapan saja tanpa pemberitahuan</p>
        </div>
      </div>

      {/* CTA */}
      <section className="kf-cta-section">
        <div className="kf-cta-box">
          <div className="kf-cta-box-glow" />
          <div className="kf-cta-box-inner">
            <span className="kf-section-eyebrow" style={{ display: 'block', marginBottom: 16 }}>Mulai Tanpa Risiko</span>
            <h2 className="kf-cta-h2">
              Siap kelola konten{' '}
              <span className="kf-hero-gradient">lebih terstruktur?</span>
            </h2>
            <p className="kf-cta-sub">Bergabung bersama creator & affiliator Indonesia yang sudah pakai KreaFlow.</p>
            <Link href="/register" className="kf-cta-btn">Daftar Sekarang — Gratis</Link>
            <p className="kf-cta-note">Tanpa kartu kredit · Akun langsung aktif</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="kf-lp-footer">
        <div className="kf-lp-footer-inner">
          <div className="kf-lp-footer-brand">
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #1a73e8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>KreaFlow</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#1f2937', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', color: '#1f2937' }}>by TUAS DIGITAL</span>
          </div>
          <p className="kf-lp-footer-copy">© 2026 KreaFlow · kreaflow.id</p>
        </div>
      </footer>

    </div>
  )
}
