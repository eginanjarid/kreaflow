'use client'

import { useEffect } from 'react'

declare global { interface Window { fbq?: (...args: unknown[]) => void } }
const track = (event: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) window.fbq('track', event, params)
}

// ── Ganti dengan URL checkout Scalev masing-masing plan ─────────────────────
const SCALEV = {
  bulanan: 'https://scalev.id/#', // TODO: isi link Scalev bulanan
  basic:   'https://scalev.id/#', // TODO: isi link Scalev basic lifetime
  pro:     'https://scalev.id/#', // TODO: isi link Scalev pro lifetime
  agency:  'https://scalev.id/#', // TODO: isi link Scalev agency lifetime
}
// ────────────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #fff; color: #0f172a; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

  /* NAV */
  .lp-nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; padding: 0 20px; height: 58px; display: flex; align-items: center; justify-content: space-between; }
  .lp-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .lp-logo-mark { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg,#1a73e8,#42a5f5); display: flex; align-items: center; justify-content: center; }
  .lp-logo-name { font-size: 1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
  .lp-nav-cta { background: #1a73e8; color: #fff; font-size: 0.8rem; font-weight: 700; padding: 9px 18px; border-radius: 8px; text-decoration: none; white-space: nowrap; }

  /* HERO */
  .lp-hero { background: #eef3ff; text-align: center; padding: 48px 20px 40px; border-bottom: 1px solid #e2eaf8; }
  .lp-badge { display: inline-block; background: linear-gradient(90deg,#1a73e8,#42a5f5); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 20px; }
  .lp-hero h1 { font-size: 28px; font-weight: 900; line-height: 1.25; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.5px; }
  .lp-hero h1 span { background: linear-gradient(135deg,#1a73e8,#7c3aed,#0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .lp-hero p { font-size: 14px; color: #64748b; line-height: 1.7; max-width: 340px; margin: 0 auto 28px; }
  .lp-cta-main { display: block; width: 100%; max-width: 320px; margin: 0 auto; background: #1a73e8; color: #fff; font-size: 15px; font-weight: 800; padding: 16px 20px; border-radius: 12px; text-decoration: none; text-align: center; box-shadow: 0 4px 20px rgba(26,115,232,0.3); }
  .lp-cta-sub { font-size: 11px; color: #94a3b8; margin-top: 10px; }

  /* STATS */
  .lp-stats { display: flex; justify-content: space-around; padding: 20px; border-bottom: 1px solid #f1f5f9; background: #fff; }
  .lp-stat { text-align: center; }
  .lp-stat-num { font-size: 22px; font-weight: 900; color: #1a73e8; letter-spacing: -0.5px; }
  .lp-stat-label { font-size: 10px; color: #94a3b8; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

  /* SECTION */
  .lp-section { padding: 40px 20px; }
  .lp-section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #1a73e8; margin-bottom: 8px; text-align: center; }
  .lp-section-title { font-size: 22px; font-weight: 900; text-align: center; line-height: 1.3; margin-bottom: 8px; color: #0f172a; letter-spacing: -0.3px; }
  .lp-section-sub { font-size: 14px; color: #64748b; text-align: center; line-height: 1.7; margin-bottom: 28px; }

  /* PAIN */
  .lp-pain { background: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 36px 20px; }
  .lp-pain-item { display: flex; align-items: flex-start; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .lp-pain-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
  .lp-pain-text h4 { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .lp-pain-text p { font-size: 12px; color: #64748b; line-height: 1.6; }

  /* FEATURE CARDS */
  .lp-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 18px; margin-bottom: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); position: relative; overflow: hidden; }
  .lp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg,#1a73e8,#42a5f5,#7c3aed); }
  .lp-card-num { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: #eef3ff; color: #1a73e8; font-size: 12px; font-weight: 800; margin-bottom: 12px; }
  .lp-card h3 { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .lp-card p { font-size: 13px; color: #64748b; line-height: 1.6; }
  .lp-card-highlight { margin-top: 12px; background: #eef3ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #1a73e8; font-weight: 600; }

  /* COMPARE */
  .lp-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px; }
  .lp-compare-col { border-radius: 12px; padding: 16px 14px; }
  .lp-compare-col.bad { background: #fff5f5; border: 1px solid #fecaca; }
  .lp-compare-col.good { background: #eff6ff; border: 1px solid #bfdbfe; }
  .lp-compare-col h4 { font-size: 11px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .lp-compare-col.bad h4 { color: #ef4444; }
  .lp-compare-col.good h4 { color: #1a73e8; }
  .lp-compare-item { display: flex; align-items: flex-start; gap: 7px; font-size: 11px; color: #64748b; margin-bottom: 8px; line-height: 1.5; }
  .lp-compare-dot { width: 15px; height: 15px; border-radius: 50%; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 800; }
  .bad .lp-compare-dot { background: #fee2e2; color: #ef4444; }
  .good .lp-compare-dot { background: #dbeafe; color: #1a73e8; }

  /* STEPS */
  .lp-step { display: flex; gap: 16px; margin-bottom: 24px; align-items: flex-start; }
  .lp-step-num { width: 36px; height: 36px; border-radius: 10px; background: #1a73e8; color: #fff; font-size: 15px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-step-content h4 { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .lp-step-content p { font-size: 13px; color: #64748b; line-height: 1.6; }

  /* PRICING */
  .lp-pricing { background: #f8fafc; padding: 40px 20px; border-top: 1px solid #f1f5f9; }
  .lp-price-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); position: relative; overflow: hidden; }
  .lp-price-card.highlight { border-color: #1a73e8; box-shadow: 0 4px 20px rgba(26,115,232,0.15); }
  .lp-price-card.highlight::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg,#1a73e8,#42a5f5); }
  .lp-price-badge { display: inline-block; background: #1a73e8; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; margin-bottom: 12px; }
  .lp-price-name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .lp-price-old { font-size: 12px; color: #94a3b8; text-decoration: line-through; margin-bottom: 2px; }
  .lp-price-amount { font-size: 32px; font-weight: 900; color: #1a73e8; letter-spacing: -1px; line-height: 1; margin-bottom: 2px; }
  .lp-price-period { font-size: 11px; color: #94a3b8; margin-bottom: 16px; }
  .lp-price-features { margin-bottom: 20px; }
  .lp-price-feature { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; margin-bottom: 8px; }
  .lp-price-feature span:first-child { color: #1a73e8; font-size: 14px; font-weight: 700; }
  .lp-price-cta { display: block; text-align: center; background: #1a73e8; color: #fff; font-size: 14px; font-weight: 800; padding: 14px; border-radius: 10px; text-decoration: none; }
  .lp-price-cta.outline { background: transparent; border: 1.5px solid #e2e8f0; color: #64748b; }

  /* TESTIMONIALS */
  .lp-testi { background: #eef3ff; border-top: 1px solid #e2eaf8; border-bottom: 1px solid #e2eaf8; padding: 36px 20px; }
  .lp-testi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .lp-stars { color: #f59e0b; font-size: 13px; margin-bottom: 8px; }
  .lp-testi-card p { font-size: 13px; color: #374151; line-height: 1.7; font-style: italic; margin-bottom: 12px; }
  .lp-testi-author { display: flex; align-items: center; gap: 10px; }
  .lp-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#1a73e8,#42a5f5); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0; }
  .lp-author-name { font-size: 13px; font-weight: 700; color: #0f172a; }
  .lp-author-role { font-size: 11px; color: #94a3b8; }

  /* FAQ */
  .lp-faq-item { border-bottom: 1px solid #f1f5f9; padding: 16px 0; }
  .lp-faq-q { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .lp-faq-a { font-size: 13px; color: #64748b; line-height: 1.7; }

  /* FINAL CTA */
  .lp-final { background: #eef3ff; padding: 48px 20px; text-align: center; border-top: 1px solid #e2eaf8; }
  .lp-final h2 { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 10px; letter-spacing: -0.3px; line-height: 1.3; }
  .lp-final p { font-size: 14px; color: #64748b; margin-bottom: 28px; line-height: 1.6; }
  .lp-urgency { display: inline-block; background: #fff3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 14px; font-size: 12px; color: #92400e; font-weight: 600; margin-bottom: 20px; }

  /* FOOTER */
  .lp-footer { background: #0f172a; padding: 24px 20px; text-align: center; }
  .lp-footer p { font-size: 11px; color: #475569; }
  .lp-footer a { color: #64748b; text-decoration: none; }
`

const FEATURES = [
  { num: '01', title: 'Brand Studio', desc: 'Bangun identitas brand dari nol — nama, tagline, USP, target pasar, bio, color palette. AI bantu generate semua dalam hitungan detik.', highlight: 'Siapkan fondasi sebelum posting pertama' },
  { num: '02', title: 'Sprint Planning', desc: 'Jadwal konten mingguan yang terstruktur. Drag-and-drop, assign ke tim, track progress — semua di satu papan kanban.', highlight: 'Tidak ada lagi "besok posting apa"' },
  { num: '03', title: 'Content Library', desc: 'Simpan semua ide, draft, referensi di satu tempat. Filter by platform, format, atau status produksi.', highlight: 'Nol ide yang hilang, semua terorganisir' },
  { num: '04', title: 'Studio Caption AI', desc: 'Generate caption siap posting dengan tone yang sesuai brand kamu. Input konteks, output langsung ke clipboard.', highlight: 'Caption 30 detik, bukan 30 menit' },
  { num: '05', title: 'Content Calendar', desc: 'Visual kalender bulanan untuk semua platform. Lihat sekaligus jadwal TikTok, Instagram, dan YouTube dalam satu view.', highlight: 'Konsisten itu terlihat dari kalender yang penuh' },
  { num: '06', title: 'Tracker & Budget', desc: 'Monitor performa konten, catat pengeluaran produksi, dan lacak ROI konten kamu per bulan.', highlight: 'Tahu mana konten yang worth it' },
]

export default function LpContent() {
  useEffect(() => {
    track('ViewContent', { content_name: 'KreaFlow LP', content_category: 'SaaS' })
  }, [])

  const handleCta = () => track('Lead', { content_name: 'KreaFlow LP CTA' })
  const handlePricing = (plan: string) => track('InitiateCheckout', { content_name: plan, currency: 'IDR' })

  return (
    <div className="lp">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <a href="https://kreaflow.id" className="lp-logo">
          <div className="lp-logo-mark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="lp-logo-name">KreaFlow</span>
        </a>
        <a href="https://kreaflow.id/login" className="lp-nav-cta" onClick={handleCta}>Masuk →</a>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-badge">🔥 LIFETIME DEAL · HARGA TERBATAS</div>
        <h1>Berhenti Pusing<br />Soal Konten.<br /><span>KreaFlow Urus Semua.</span></h1>
        <p>Satu platform end-to-end untuk kreator, UMKM, dan affiliator Indonesia — dari riset brand sampai jadwal posting, tanpa pindah-pindah tools.</p>
        <a href={SCALEV.basic} className="lp-cta-main" onClick={handleCta}>Ambil Lifetime Deal Sekarang →</a>
        <p className="lp-cta-sub">✓ Sekali bayar &nbsp;·&nbsp; ✓ Setup 5 menit &nbsp;·&nbsp; ✓ Akses selamanya</p>
      </section>

      {/* STATS */}
      <div className="lp-stats">
        <div className="lp-stat"><div className="lp-stat-num">6+</div><div className="lp-stat-label">Modul Lengkap</div></div>
        <div className="lp-stat"><div className="lp-stat-num">1</div><div className="lp-stat-label">Platform Terpadu</div></div>
        <div className="lp-stat"><div className="lp-stat-num">0</div><div className="lp-stat-label">Tools Tambahan</div></div>
      </div>

      {/* PAIN */}
      <section className="lp-pain">
        <p className="lp-section-label">Masalah</p>
        <h2 className="lp-section-title">Familiar dengan ini?</h2>
        <p className="lp-section-sub">Kalau kamu pernah merasakan salah satu dari ini, KreaFlow dibuat untuk kamu.</p>
        {[
          { icon: '😩', title: 'Bingung mau posting apa hari ini', desc: 'Buka HP, scroll sebentar, tutup lagi. Tidak ada ide. Padahal deadline konten sudah mepet.' },
          { icon: '🔀', title: 'Tools terpisah yang tidak nyambung', desc: 'Notion buat planning, Canva buat desain, ChatGPT buat caption, Google Sheet buat jadwal. Ribet dan tidak efisien.' },
          { icon: '📉', title: 'Konten tidak konsisten, follower stagnan', desc: 'Seminggu aktif, dua minggu hilang. Algoritma tidak sayang, pertumbuhan stuck di tempat.' },
          { icon: '💸', title: 'Bayar banyak tools, hasilnya biasa aja', desc: 'Subscription sana-sini tapi tidak ada yang integrate satu sama lain. Buang uang dan buang waktu.' },
        ].map((item, i) => (
          <div key={i} className="lp-pain-item">
            <span className="lp-pain-icon">{item.icon}</span>
            <div className="lp-pain-text"><h4>{item.title}</h4><p>{item.desc}</p></div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="lp-section">
        <p className="lp-section-label">Solusi</p>
        <h2 className="lp-section-title">Semua yang kamu butuhkan,<br />dalam satu alur</h2>
        <p className="lp-section-sub">KreaFlow punya 6 modul yang saling terhubung — dari bangun brand sampai jadwal posting.</p>
        {FEATURES.map((f) => (
          <div key={f.num} className="lp-card">
            <div className="lp-card-num">{f.num}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="lp-card-highlight">✦ {f.highlight}</div>
          </div>
        ))}
      </section>

      {/* COMPARE */}
      <section className="lp-pain">
        <p className="lp-section-label">Perbandingan</p>
        <h2 className="lp-section-title">Sebelum vs Sesudah KreaFlow</h2>
        <div className="lp-compare">
          <div className="lp-compare-col bad">
            <h4>❌ Tanpa KreaFlow</h4>
            {['Pindah-pindah 5+ tools','Alur tidak jelas','Konten tidak konsisten','Ide sering hilang','Banyak bayar tools','Tim susah koordinasi'].map((t, i) => (
              <div key={i} className="lp-compare-item"><span className="lp-compare-dot">✕</span>{t}</div>
            ))}
          </div>
          <div className="lp-compare-col good">
            <h4>✓ Dengan KreaFlow</h4>
            {['Satu platform beres','Alur Brand→Sprint→Post','Jadwal terstruktur','Library ide terpusat','Lifetime sekali bayar','Tim dalam 1 workspace'].map((t, i) => (
              <div key={i} className="lp-compare-item"><span className="lp-compare-dot">✓</span>{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section">
        <p className="lp-section-label">Cara Kerja</p>
        <h2 className="lp-section-title">Mulai dalam 4 langkah</h2>
        <p className="lp-section-sub">Setup sekali, jalankan selamanya.</p>
        {[
          { title: 'Bangun Brand Identity', desc: 'Isi profil bisnis kamu — nama, kategori, USP, target pasar. AI bantu generate tagline dan bio siap pakai.' },
          { title: 'Rencanakan Sprint Konten', desc: 'Buat jadwal konten mingguan. Tentukan topik, format, dan platform untuk setiap hari.' },
          { title: 'Produksi di Studio', desc: 'Generate caption dengan AI, simpan di Library, dan review sebelum publish.' },
          { title: 'Publish & Track', desc: 'Lihat semua konten di Calendar, monitor performa, dan terus optimalkan strategi.' },
        ].map((s, i) => (
          <div key={i} className="lp-step">
            <div className="lp-step-num">{i + 1}</div>
            <div className="lp-step-content"><h4>{s.title}</h4><p>{s.desc}</p></div>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section className="lp-pricing">
        <p className="lp-section-label">Harga</p>
        <h2 className="lp-section-title">Mulai dari Rp99k/Bulan,<br />atau Lifetime Sekali Bayar</h2>
        <p className="lp-section-sub">Pilih yang paling cocok — berlangganan bulanan atau hemat lebih dengan lifetime deal.</p>

        {/* Bulanan */}
        <div className="lp-price-card">
          <div className="lp-price-name">Bulanan</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span className="lp-price-amount">Rp99.000</span>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>/bulan</span>
          </div>
          <div className="lp-price-period">Berlangganan · Bisa cancel kapan saja</div>
          <div className="lp-price-features">
            {['1 Workspace / Brand','1 owner + 4 anggota tim','Semua modul lengkap','Unlimited konten & jadwal','Bisa upgrade ke lifetime kapan saja'].map((f, i) => (
              <div key={i} className="lp-price-feature"><span>✓</span><span>{f}</span></div>
            ))}
          </div>
          <a href={SCALEV.bulanan} className="lp-price-cta outline" onClick={() => handlePricing('Bulanan')}>Coba Bulanan Dulu</a>
        </div>

        {/* Basic Lifetime — PALING POPULER */}
        <div className="lp-price-card highlight">
          <div className="lp-price-badge">PALING POPULER</div>
          <div className="lp-price-name">Basic Lifetime</div>
          <div className="lp-price-amount">Rp149.000</div>
          <div className="lp-price-period">Bayar sekali · Lifetime · 2 workspace</div>
          <div className="lp-price-features">
            {['2 Workspace / Brand','1 owner + 4 anggota tim','Semua modul lengkap','Unlimited konten & jadwal','Update fitur selamanya','Lebih hemat dari 2 bulan berlangganan'].map((f, i) => (
              <div key={i} className="lp-price-feature"><span>✓</span><span style={i === 5 ? { color: '#1a73e8', fontWeight: 700 } : {}}>{f}</span></div>
            ))}
          </div>
          <a href={SCALEV.basic} className="lp-price-cta" onClick={() => handlePricing('Basic')}>Ambil Basic Sekarang →</a>
        </div>

        {/* Pro Lifetime */}
        <div className="lp-price-card">
          <div className="lp-price-name">Pro Lifetime</div>
          <div className="lp-price-amount">Rp199.000</div>
          <div className="lp-price-period">Bayar sekali · Lifetime · 4 workspace</div>
          <div className="lp-price-features">
            {['4 Workspace / Brand','1 owner + 5 anggota tim','Semua modul lengkap','Unlimited konten & jadwal','Update fitur selamanya'].map((f, i) => (
              <div key={i} className="lp-price-feature"><span>✓</span><span>{f}</span></div>
            ))}
          </div>
          <a href={SCALEV.pro} className="lp-price-cta outline" onClick={() => handlePricing('Pro')}>Mulai dengan Pro</a>
        </div>

        {/* Agency Lifetime */}
        <div className="lp-price-card">
          <div className="lp-price-name">Agency Lifetime</div>
          <div className="lp-price-amount">Rp399.000</div>
          <div className="lp-price-period">Bayar sekali · Lifetime · 10 workspace</div>
          <div className="lp-price-features">
            {['10 Workspace / Brand','1 owner + 10 anggota tim','Semua modul lengkap','Unlimited konten & jadwal','Update fitur selamanya'].map((f, i) => (
              <div key={i} className="lp-price-feature"><span>✓</span><span>{f}</span></div>
            ))}
          </div>
          <a href={SCALEV.agency} className="lp-price-cta outline" onClick={() => handlePricing('Agency')}>Mulai dengan Agency</a>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>+ Rp49.000 per workspace tambahan kapan saja</p>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-testi">
        <p className="lp-section-label">Testimoni</p>
        <h2 className="lp-section-title">Kata mereka yang<br />sudah pakai KreaFlow</h2>
        <div style={{ marginTop: '24px' }}>
          {[
            { text: 'Akhirnya ada platform konten yang beneran ngerti kebutuhan kreator Indonesia. Dari brand identity sampai caption, semua ada. Gak perlu bolak-balik tools lagi.', name: 'Rizky A.', role: 'Content Creator · 45K Followers', init: 'R' },
            { text: 'Sebagai pemilik UMKM yang manage konten sendiri, KreaFlow ngebantu banget. Sprint planning bikin gue jauh lebih konsisten dan gak kehabisan ide lagi.', name: 'Sari M.', role: 'Owner UMKM Fashion', init: 'S' },
            { text: 'Buat affiliator kayak gue, fitur Brand + Library + Studio itu combo maut. Bisa manage beberapa niche sekaligus dengan workspace berbeda.', name: 'Dimas P.', role: 'TikTok Affiliator · 120K', init: 'D' },
          ].map((t, i) => (
            <div key={i} className="lp-testi-card">
              <div className="lp-stars">★★★★★</div>
              <p>&ldquo;{t.text}&rdquo;</p>
              <div className="lp-testi-author">
                <div className="lp-avatar">{t.init}</div>
                <div><div className="lp-author-name">{t.name}</div><div className="lp-author-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section">
        <p className="lp-section-label">FAQ</p>
        <h2 className="lp-section-title">Pertanyaan yang sering ditanya</h2>
        <div style={{ marginTop: '24px' }}>
          {[
            { q: 'Lifetime deal artinya apa?', a: 'Bayar sekali, pakai selamanya. Tidak ada biaya bulanan atau tahunan. Kamu juga dapat semua update fitur baru secara gratis.' },
            { q: 'Apakah bisa untuk tim?', a: 'Bisa. Basic support 4 anggota, Pro 5 anggota, Agency 10 anggota per workspace. Kamu bisa assign role berbeda ke setiap member.' },
            { q: 'Apakah ada free trial?', a: 'Tidak ada free trial — KreaFlow langsung bisa dipakai setelah beli. Harga lifetime-nya sudah sangat terjangkau untuk akses selamanya.' },
            { q: 'Cocok untuk jenis bisnis apa?', a: 'KreaFlow cocok untuk kreator konten, pemilik UMKM, affiliator TikTok Shop, dan agensi digital yang butuh manage konten untuk beberapa klien sekaligus.' },
            { q: 'Bagaimana kalau butuh workspace lebih?', a: 'Bisa tambah workspace extra seharga Rp49.000 per workspace kapan saja, tanpa perlu ganti paket.' },
          ].map((item, i) => (
            <div key={i} className="lp-faq-item">
              <div className="lp-faq-q">{item.q}</div>
              <div className="lp-faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-final">
        <div className="lp-urgency">🔥 Harga lifetime ini tidak akan bertahan selamanya</div>
        <h2>Mulai Sekarang,<br />Sebelum Harga Naik</h2>
        <p>Bergabung dengan kreator, UMKM, dan affiliator Indonesia yang sudah pakai KreaFlow untuk konten yang lebih konsisten dan efisien.</p>
        <a href={SCALEV.basic} className="lp-cta-main" style={{ maxWidth: 320, margin: '0 auto 12px' }} onClick={handleCta}>Ambil Lifetime Deal Sekarang →</a>
        <p className="lp-cta-sub">✓ Setup 5 menit &nbsp;·&nbsp; ✓ Tanpa kartu kredit &nbsp;·&nbsp; ✓ Akses langsung</p>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <p>© 2026 KreaFlow &nbsp;·&nbsp; <a href="https://kreaflow.id/privacy">Privacy</a> &nbsp;·&nbsp; <a href="https://kreaflow.id/terms">Terms</a> &nbsp;·&nbsp; Produk oleh <a href="#">Tuas Digital</a></p>
      </footer>
    </div>
  )
}
