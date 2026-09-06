import Link from 'next/link'
import { HELP_TOPICS } from './content'

function groupTopics() {
  const groups: { name: string; items: typeof HELP_TOPICS }[] = []
  for (const topic of HELP_TOPICS) {
    let g = groups.find(g => g.name === topic.group)
    if (!g) { g = { name: topic.group, items: [] }; groups.push(g) }
    g.items.push(topic)
  }
  return groups
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const groups = groupTopics()

  return (
    <div className="main-content-inner" style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div className="kf-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Panduan Pengguna</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Semua yang perlu kamu tahu untuk mulai pakai KreaFlow.</p>
        </div>
      </div>

      {/* Mobile: horizontal topic chips */}
      <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {HELP_TOPICS.map(t => (
          <Link
            key={t.slug}
            href={`/help/${t.slug}`}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
              background: 'var(--surface-2)', color: 'var(--text-muted)', textDecoration: 'none',
              border: '1px solid var(--border)', whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }} className="kf-help-grid">
        <nav className="card-sm" style={{ padding: 12, position: 'sticky', top: 20 }}>
          {groups.map(g => (
            <div key={g.name} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px', marginBottom: 6 }}>
                {g.name}
              </div>
              {g.items.map(t => (
                <Link
                  key={t.slug}
                  href={`/help/${t.slug}`}
                  style={{
                    display: 'block', padding: '7px 10px', borderRadius: 8, fontSize: '0.84rem',
                    fontWeight: 500, color: 'var(--text)', textDecoration: 'none', marginBottom: 1,
                  }}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="card" style={{ minWidth: 0 }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .kf-help-grid { grid-template-columns: 1fr !important; }
          .kf-help-grid nav { display: none !important; }
        }
        @media (min-width: 769px) {
          .kf-tabs-scroll { display: none !important; }
        }
      `}</style>
    </div>
  )
}
