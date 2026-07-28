import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const MODULES = [
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`, name: 'Brand', desc: 'Bangun identitas brand lengkap — niche, origin story, content pillars, bio AI' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`, name: 'Catalog', desc: 'Database produk affiliate & produk sendiri dengan info komisi & link' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`, name: 'Plan', desc: 'Generate script konten & naskah affiliate dengan AI sesuai formula' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`, name: 'Library', desc: 'Bank ide konten + produksi script AI dari pillar atau produk' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, name: 'Calendar', desc: 'Jadwal konten visual per platform, pantau slot posting bulanan' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, name: 'Tracker', desc: 'Input & pantau performa bulanan per platform dalam satu tempat' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`, name: 'Insights', desc: 'Analitik overview — konten, keuangan, produk, dan performa' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`, name: 'Budget', desc: 'Catat pemasukan & pengeluaran sosmed, hitung saldo bersih' },
  { icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, name: 'Tasks', desc: 'Action items dari evaluasi, lengkap dengan sprint & deadline' },
]

const STEPS = [
  { n: '01', title: 'Setup Brand', desc: 'Isi identitas akun, temukan niche, bangun content pillars & bio AI' },
  { n: '02', title: 'Isi Catalog', desc: 'Tambah produk affiliate atau produk sendiri yang mau dipromosikan' },
  { n: '03', title: 'Produksi Konten', desc: 'Generate script & naskah AI dari Plan, simpan ke Library' },
  { n: '04', title: 'Jadwalkan & Pantau', desc: 'Atur Calendar, track performa di Tracker & Insights' },
]

const PRICING = [
  {
    name: 'Solo', price: 'Rp99.000', period: '/bln',
    color: '#7C3AED', border: 'rgba(124,58,237,0.3)',
    features: ['1 workspace', '1 user', '50 konten/bln', 'AI 100x/bln', 'Semua 9 modul'],
  },
  {
    name: 'Pro', price: 'Rp199.000', period: '/bln',
    color: '#A78BFA', border: 'rgba(167,139,250,0.5)',
    popular: true,
    features: ['3 workspace', '1 user', 'Unlimited konten', 'AI unlimited', 'Semua 9 modul'],
  },
  {
    name: 'Team', price: 'Rp399.000', period: '/bln',
    color: '#34d399', border: 'rgba(52,211,153,0.3)',
    features: ['5 workspace', '5 user', 'Unlimited konten', 'AI unlimited', 'Semua 9 modul'],
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/brand')

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#f1f5f9' }}>KreaFlow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #2a2a2a', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', background: 'transparent' }}>
              Masuk
            </Link>
            <Link href="/register" style={{ padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', border: 'none' }}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: '0.78rem', color: '#A78BFA', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>
          Platform SMM untuk Creator & Affiliator Indonesia
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 20, margin: '0 0 20px' }}>
          Alur kreasi kontenmu,{' '}
          <span style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            dari ide sampai posting.
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          KreaFlow menggabungkan Brand, AI content generation, Calendar, Tracker, dan Insights dalam satu platform — khusus untuk content creator dan affiliator Indonesia.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ padding: '13px 28px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Mulai Sekarang →
          </Link>
          <Link href="/login" style={{ padding: '13px 28px', borderRadius: 10, border: '1px solid #2a2a2a', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 600, textDecoration: 'none', display: 'inline-block', background: '#111' }}>
            Sudah punya akun
          </Link>
        </div>

        {/* App preview mockup */}
        <div style={{ marginTop: 60, background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, padding: '20px 24px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 140, flexShrink: 0 }}>
              {MODULES.slice(0, 6).map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, marginBottom: 2, background: m.name === 'Library' ? 'rgba(124,58,237,0.15)' : 'transparent', border: m.name === 'Library' ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent' }}>
                  <span style={{ fontSize: '0.85rem' }}>{m.icon}</span>
                  <span style={{ fontSize: '0.78rem', color: m.name === 'Library' ? '#A78BFA' : '#64748b', fontWeight: m.name === 'Library' ? 600 : 400 }}>{m.name}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Library — Bank Konten</div>
              {[
                { title: '5 Hook TikTok untuk Produk Skincare', status: 'Ready', platform: 'TikTok' },
                { title: 'Review Jujur Serum Vitamin C — Script AI', status: 'Draft', platform: 'Instagram' },
                { title: 'Cara Dapat Komisi Affiliate Tanpa Modal', status: 'Scheduled', platform: 'YouTube' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: '#0d0d0d', border: '1px solid #1f1f1f', marginBottom: 6 }}>
                  <div style={{ flex: 1, fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: item.status === 'Ready' ? 'rgba(134,239,172,0.1)' : item.status === 'Scheduled' ? 'rgba(147,197,253,0.1)' : 'rgba(71,85,105,0.2)', color: item.status === 'Ready' ? '#86efac' : item.status === 'Scheduled' ? '#93c5fd' : '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.status}</span>
                  <span style={{ fontSize: '0.68rem', color: '#475569', whiteSpace: 'nowrap' }}>{item.platform}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>9 Modul Lengkap</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Semua yang kamu butuhkan untuk manajemen konten sosial media</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {MODULES.map(m => (
            <div key={m.name} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{m.icon}</div>
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{m.name}</div>
              <div style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>Cara Kerjanya</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>4 langkah dari setup sampai konten terpublikasi</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: 20, left: 'calc(100% - 10px)', width: 20, height: 1, background: '#2a2a2a', display: 'none' }} />
                )}
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#7C3AED', letterSpacing: '0.1em', marginBottom: 10 }}>STEP {s.n}</div>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>Untuk Siapa?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#111', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: '28px' }}>
            <div style={{ marginBottom: 14, color: '#1a73e8' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h5M17 12h5"/></svg></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#A78BFA', marginBottom: 10 }}>Content Creator</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Bangun identitas brand yang kuat', 'Generate script konten dengan AI', 'Jadwalkan konten multi-platform', 'Evaluasi performa & perbaiki strategi'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#7C3AED', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#111', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '28px' }}>
            <div style={{ marginBottom: 14, color: '#34d399' }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#34d399', marginBottom: 10 }}>Affiliator</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Database produk affiliate terorganisir', 'Generate naskah review & promo AI', 'Hitung potensi komisi per produk', 'Sprint produksi konten affiliate'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10 }}>Harga</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Pilih paket yang sesuai kebutuhan kamu</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 860, margin: '0 auto' }}>
            {PRICING.map(p => (
              <div key={p.name} style={{ background: '#111', border: `1px solid ${p.border}`, borderRadius: 16, padding: '28px', position: 'relative' }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', borderRadius: 10, padding: '3px 12px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>PALING POPULER</div>
                )}
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: p.color, marginBottom: 6 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 20 }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f1f5f9' }}>{p.price}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: p.color, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 9, background: p.popular ? `linear-gradient(135deg, #7C3AED, #A78BFA)` : 'transparent', border: p.popular ? 'none' : `1px solid ${p.border}`, color: p.popular ? '#fff' : p.color, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Pilih {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 16 }}>
          Siap kelola konten lebih{' '}
          <span style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            terstruktur?
          </span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: 32 }}>
          Bergabung dengan creator & affiliator yang sudah pakai KreaFlow
        </p>
        <Link href="/register" style={{ padding: '14px 32px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
          Daftar Sekarang — Gratis
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1a1a1a', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.9rem' }}>KreaFlow</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#475569' }}>© 2026 KreaFlow · TUAS DIGITAL · kreaflow.id</p>
      </footer>
    </div>
  )
}
