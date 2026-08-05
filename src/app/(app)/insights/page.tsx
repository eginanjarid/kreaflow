import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'

export default async function DashboardPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'insights')) redirect(firstAccessibleRoute(role, jabatan))

  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: wsData },
    { data: ideas },
    { data: products },
    { data: transactions },
    { data: todayEntries },
    { data: overdueTasks },
    { data: activeSprints },
    { data: recentIdeas },
  ] = await Promise.all([
    supabase.from('kf_workspaces').select('plan, name').eq('id', wsId).maybeSingle(),
    supabase.from('kf_content_ideas').select('id, status, platform, sprint_id').eq('workspace_id', wsId),
    supabase.from('kf_products').select('is_active').eq('workspace_id', wsId),
    supabase.from('kf_transactions').select('tipe, jumlah').eq('workspace_id', wsId),
    supabase.from('kf_calendar_entries').select('id, platform, status, scheduled_at')
      .eq('workspace_id', wsId)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .order('scheduled_at'),
    supabase.from('kf_tasks').select('id, nama')
      .eq('workspace_id', wsId)
      .lt('due_date', today)
      .lt('percent_complete', 100)
      .limit(5),
    supabase.from('kf_sprints').select('id, nama, start_date, end_date, target_konten')
      .eq('workspace_id', wsId)
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(1),
    supabase.from('kf_content_ideas').select('id, judul, status, platform, created_at')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const workspaceName = wsData?.name || 'KreaFlow'

  const allIdeas = ideas || []
  const activeSprint = (activeSprints || [])[0] || null

  const sprintContents = activeSprint ? allIdeas.filter(c => c.sprint_id === activeSprint.id) : []
  const sprintDone  = sprintContents.filter(c => c.status === 'Tayang' || c.status === 'Posted').length
  const sprintInProg = sprintContents.filter(c => !['Draft', 'Tayang', 'Posted'].includes(c.status)).length
  const sprintTodo  = Math.max(0, sprintContents.length - sprintDone - sprintInProg)
  const sprintPct   = sprintContents.length > 0 ? Math.round(sprintDone / sprintContents.length * 100) : 0

  const pemasukan  = (transactions || []).filter(t => t.tipe === 'Pemasukan').reduce((s, t) => s + Number(t.jumlah), 0)
  const pengeluaran = (transactions || []).filter(t => t.tipe === 'Pengeluaran').reduce((s, t) => s + Number(t.jumlah), 0)
  const saldo = pemasukan - pengeluaran

  const totalIdeas  = allIdeas.length
  const draftCount  = allIdeas.filter(c => c.status === 'Draft').length
  const progCount   = allIdeas.filter(c => !['Draft', 'Tayang', 'Posted'].includes(c.status)).length
  const tayangCount = allIdeas.filter(c => c.status === 'Tayang' || c.status === 'Posted').length
  const produkAktif = (products || []).filter(p => p.is_active).length

  const hora = new Date().getHours()
  const greeting = hora < 12 ? 'Selamat pagi' : hora < 17 ? 'Selamat siang' : 'Selamat malam'

  const PLATFORM_COLORS: Record<string, string> = {
    TikTok: '#111827', Instagram: '#e1306c', YouTube: '#dc2626',
    Facebook: '#1877f2', Shopee: '#ee4d2d', Twitter: '#1d9bf0',
  }

  const STATUS_COLORS: Record<string, string> = {
    Draft: '#9ca3af', 'Naskah Siap': '#d97706', Produksi: '#1a73e8',
    'Siap Tayang': '#7c3aed', Terjadwal: '#0284c7', Tayang: '#059669', Posted: '#059669',
  }

  const kpis = [
    {
      label: 'Total Konten',
      value: totalIdeas,
      sub: `${tayangCount} sudah tayang`,
      color: '#1a73e8',
      bg: 'rgba(26,115,232,0.08)',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      label: 'Produk Aktif',
      value: produkAktif,
      sub: `${(products || []).length} total produk`,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.08)',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
      label: 'Jadwal Hari Ini',
      value: (todayEntries || []).length,
      sub: (todayEntries || []).length > 0
        ? [...new Set((todayEntries || []).map(e => e.platform))].join(' · ')
        : 'Tidak ada jadwal',
      color: '#059669',
      bg: 'rgba(5,150,105,0.08)',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Saldo Bersih',
      value: `Rp ${Math.abs(saldo).toLocaleString('id-ID')}`,
      sub: saldo >= 0 ? 'net profit' : 'net deficit',
      color: saldo >= 0 ? '#059669' : '#dc2626',
      bg: saldo >= 0 ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ]

  const CARD = { background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)' }

  return (
    <div>
      <style>{`
        .kf-quickaction:hover { background: #f3f4f6 !important; }
        .kf-recent-row:hover { background: #f9fafb !important; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
            {greeting}, {workspaceName}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            {(overdueTasks?.length ?? 0) > 0 && (
              <span style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 700, padding: '1px 8px', borderRadius: 20, fontSize: '0.7rem' }}>
                {overdueTasks!.length} overdue
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/sprints" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a73e8', borderRadius: 10, padding: '9px 16px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Sprint Board
          </a>
          <a href="/plan" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '9px 16px', color: '#374151', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Konten Baru
          </a>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={k.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={k.icon}/></svg>
              </div>
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main 2-col grid ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Active Sprint card */}
          {activeSprint ? (
            <div style={{ ...CARD, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 9px', borderRadius: 20 }}>SPRINT AKTIF</span>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem', marginTop: 8, letterSpacing: '-0.2px' }}>{activeSprint.nama}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 3 }}>
                    {new Date(activeSprint.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {' – '}
                    {new Date(activeSprint.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {activeSprint.target_konten ? ` · Target ${activeSprint.target_konten} konten` : ''}
                  </div>
                </div>
                <a href="/sprints" style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>Lihat Board →</a>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{sprintDone} dari {sprintContents.length} konten selesai</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: sprintPct === 100 ? '#059669' : '#1a73e8' }}>{sprintPct}%</span>
                </div>
                <div style={{ height: 8, background: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${sprintPct}%`, background: sprintPct === 100 ? '#059669' : 'linear-gradient(90deg,#1a73e8,#3b82f6)', borderRadius: 8 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Todo', count: sprintTodo, color: '#9ca3af', bg: '#f9fafb' },
                  { label: 'In Progress', count: sprintInProg, color: '#d97706', bg: 'rgba(217,119,6,0.05)' },
                  { label: 'Tayang', count: sprintDone, color: '#059669', bg: 'rgba(5,150,105,0.05)' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ ...CARD, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>Tidak ada sprint aktif minggu ini</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>Buat sprint baru untuk mulai mengatur konten</div>
                </div>
                <a href="/sprints" style={{ flexShrink: 0, background: '#1a73e8', borderRadius: 10, padding: '8px 16px', color: '#fff', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
                  + Sprint Baru
                </a>
              </div>
            </div>
          )}

          {/* Content Pipeline */}
          <div style={{ ...CARD, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>Pipeline Konten</div>
              <a href="/library" style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>Library →</a>
            </div>

            {totalIdeas > 0 ? (
              <>
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 20, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 14 }}>
                  {[
                    { count: draftCount, color: '#d1d5db' },
                    { count: progCount, color: '#1a73e8' },
                    { count: tayangCount, color: '#059669' },
                  ].map((s, i) => s.count > 0 ? (
                    <div key={i} style={{ height: '100%', width: `${Math.round(s.count / totalIdeas * 100)}%`, background: s.color, borderRadius: 20 }} />
                  ) : null)}
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[
                    { label: 'Draft', count: draftCount, color: '#9ca3af' },
                    { label: 'In Progress', count: progCount, color: '#1a73e8' },
                    { label: 'Tayang', count: tayangCount, color: '#059669' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'block' }} />
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.label}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#9ca3af', fontSize: '0.82rem' }}>
                Belum ada konten.{' '}
                <a href="/plan" style={{ color: '#1a73e8', textDecoration: 'none', fontWeight: 600 }}>Buat sekarang →</a>
              </div>
            )}
          </div>

          {/* Recent Content */}
          {(recentIdeas || []).length > 0 && (
            <div style={{ ...CARD, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>Konten Terbaru</div>
                <a href="/library" style={{ fontSize: '0.75rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>Semua →</a>
              </div>
              <div>
                {(recentIdeas || []).map((idea, i) => {
                  const sc = STATUS_COLORS[idea.status] || '#9ca3af'
                  return (
                    <div key={idea.id} className="kf-recent-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', borderBottom: i < (recentIdeas || []).length - 1 ? '1px solid #f3f4f6' : 'none', borderRadius: 8, cursor: 'default' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0, display: 'block' }} />
                      <span style={{ flex: 1, fontSize: '0.82rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{idea.judul || '(tanpa judul)'}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sc + '18', color: sc, flexShrink: 0 }}>{idea.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Today's Schedule */}
          <div style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>Jadwal Hari Ini</div>
              <a href="/calendar" style={{ fontSize: '0.72rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>Calendar →</a>
            </div>
            {(todayEntries || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '22px 0', color: '#9ca3af', fontSize: '0.78rem' }}>
                Tidak ada konten dijadwalkan hari ini
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {(todayEntries || []).map(e => {
                  const timeStr = e.scheduled_at
                    ? new Date(e.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'
                  const platColor = PLATFORM_COLORS[e.platform] || '#6b7280'
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f9fafb', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', minWidth: 34, flexShrink: 0 }}>{timeStr}</span>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: platColor, flexShrink: 0, display: 'block' }} />
                      <span style={{ fontSize: '0.78rem', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.platform}</span>
                      <span style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: 20, background: e.status === 'Posted' ? '#dcfce7' : '#f3f4f6', color: e.status === 'Posted' ? '#15803d' : '#6b7280', fontWeight: 600, flexShrink: 0 }}>{e.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          {(overdueTasks?.length ?? 0) > 0 && (
            <div style={{ ...CARD, padding: '18px 20px', borderLeft: '3px solid #dc2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.88rem' }}>
                  Overdue ({overdueTasks!.length})
                </div>
                <a href="/tasks" style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, textDecoration: 'none' }}>Lihat Semua →</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {overdueTasks!.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.78rem', color: '#374151' }}>
                    <svg style={{ flexShrink: 0, marginTop: 1 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.nama}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem', marginBottom: 10 }}>Menu Cepat</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { href: '/plan',    label: 'Buat Naskah Baru',  color: '#1a73e8', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                { href: '/studio',  label: 'Studio Produksi',   color: '#7c3aed', icon: 'M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                { href: '/calendar',label: 'Jadwal Konten',     color: '#059669', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { href: '/catalog', label: 'Katalog Produk',    color: '#d97706', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                { href: '/tracker', label: 'Tracker Metrics',   color: '#0284c7', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              ].map(a => (
                <a key={a.href} href={a.href} className="kf-quickaction"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, textDecoration: 'none', color: '#374151' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: a.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon}/></svg>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{a.label}</span>
                  <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Finance summary */}
          <div style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem' }}>Keuangan</div>
              <a href="/budget" style={{ fontSize: '0.72rem', color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>Detail →</a>
            </div>
            {[
              { label: 'Pemasukan', value: `Rp ${pemasukan.toLocaleString('id-ID')}`, color: '#059669' },
              { label: 'Pengeluaran', value: `Rp ${pengeluaran.toLocaleString('id-ID')}`, color: '#dc2626' },
              { label: 'Saldo', value: `${saldo < 0 ? '-' : ''}Rp ${Math.abs(saldo).toLocaleString('id-ID')}`, color: saldo >= 0 ? '#1a73e8' : '#dc2626' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
