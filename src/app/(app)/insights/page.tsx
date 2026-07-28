import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const wsId = member.workspace_id

  const today = new Date().toISOString().slice(0, 10)
  const [{ data: metrics }, { data: ideas }, { data: products }, { data: transactions }, { data: todayEntries }, { data: overdueTasks }, { data: workspace }] = await Promise.all([
    supabase.from('kf_monthly_metrics').select('*').eq('workspace_id', wsId),
    supabase.from('kf_content_ideas').select('status, platform').eq('workspace_id', wsId),
    supabase.from('kf_products').select('is_active, tipe_produk, platform_affiliate, komisi_tipe, komisi_nilai, harga').eq('workspace_id', wsId),
    supabase.from('kf_transactions').select('tipe, jumlah').eq('workspace_id', wsId),
    supabase.from('kf_calendar_entries').select('id, platform, status').eq('workspace_id', wsId).gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`),
    supabase.from('kf_tasks').select('id, nama').eq('workspace_id', wsId).lt('due_date', today).lt('percent_complete', 100),
    supabase.from('kf_workspaces').select('modes').eq('id', wsId).single(),
  ])

  const modes = (workspace?.modes as string[]) || ['creator']
  const isAffiliate = modes.includes('affiliate')

  const pemasukan = (transactions || []).filter(t => t.tipe === 'Pemasukan').reduce((s, t) => s + Number(t.jumlah), 0)
  const pengeluaran = (transactions || []).filter(t => t.tipe === 'Pengeluaran').reduce((s, t) => s + Number(t.jumlah), 0)

  const totalImpresi = (metrics || []).reduce((s, m) => s + (m.impressions || 0), 0)
  const totalFollowerGrowth = (metrics || []).reduce((s, m) => s + (m.follower_growth || 0), 0)
  const totalKonversi = (metrics || []).reduce((s, m) => s + (m.conversions || 0), 0)

  const affiliateProducts = (products || []).filter(p => p.tipe_produk === 'Affiliate')
  const totalKomisiPotensial = affiliateProducts.reduce((s, p) => {
    if (!p.harga || !p.komisi_nilai) return s
    if (p.komisi_tipe === 'persen') return s + (Number(p.harga) * Number(p.komisi_nilai) / 100)
    return s + Number(p.komisi_nilai)
  }, 0)

  const affiliateByPlatform = affiliateProducts.reduce<Record<string, number>>((acc, p) => {
    const pl = p.platform_affiliate || 'Lainnya'
    acc[pl] = (acc[pl] || 0) + 1
    return acc
  }, {})

  const statCards = [
    { label: 'Total Konten', value: (ideas || []).length, sub: `${(ideas || []).filter(c => c.status === 'Posted').length} sudah posting` },
    { label: 'Total Produk', value: (products || []).length, sub: `${(products || []).filter(p => p.is_active).length} aktif` },
    { label: 'Total Impressi', value: totalImpresi.toLocaleString('id-ID'), sub: 'dari semua platform' },
    { label: 'Follower Growth', value: `+${totalFollowerGrowth.toLocaleString('id-ID')}`, sub: 'total pertumbuhan' },
    { label: 'Konversi', value: totalKonversi.toLocaleString('id-ID'), sub: 'total order/klik' },
    { label: 'Net Revenue', value: `Rp ${Math.abs(pemasukan - pengeluaran).toLocaleString('id-ID')}`, sub: pemasukan >= pengeluaran ? 'profit' : 'rugi' },
  ]

  const contentByStatus = ['Draft', 'Ready', 'Scheduled', 'Posted'].map(s => ({
    status: s,
    count: (ideas || []).filter(c => c.status === s).length,
  }))

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2a3547', marginBottom: 6 }}>Insights</h1>
        <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Overview performa brand dan konten kamu</p>
      </div>

      {/* Today Alerts */}
      {((todayEntries?.length ?? 0) > 0 || (overdueTasks?.length ?? 0) > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {(todayEntries?.length ?? 0) > 0 && (
            <div style={{ background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.1rem' }}>📅</span>
              <div>
                <span style={{ color: '#42a5f5', fontWeight: 600, fontSize: '0.875rem' }}>Hari ini ada {todayEntries!.length} konten dijadwalkan</span>
                <span style={{ color: '#5a6a85', fontSize: '0.8rem' }}> — {todayEntries!.map(e => e.platform).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</span>
              </div>
              <a href="/calendar" style={{ marginLeft: 'auto', color: '#1a73e8', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Lihat Calendar →</a>
            </div>
          )}
          {(overdueTasks?.length ?? 0) > 0 && (
            <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div>
                <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.875rem' }}>{overdueTasks!.length} task overdue</span>
                <span style={{ color: '#5a6a85', fontSize: '0.8rem' }}> — segera selesaikan</span>
              </div>
              <a href="/tasks" style={{ marginLeft: 'auto', color: '#f87171', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Lihat Tasks →</a>
            </div>
          )}
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: '#fff', boxShadow: '0 4px 24px rgba(42,53,71,0.08)', borderRadius: 20, padding: '18px 20px' }}>
            <div style={{ fontSize: '0.72rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2a3547', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#5a6a85' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Affiliate Stats — hanya tampil jika mode affiliate aktif */}
      {isAffiliate && (
        <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 18, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: '1rem' }}>🔗</span>
            <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.9rem' }}>Affiliate Performance</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: affiliateProducts.length > 0 ? 18 : 0 }}>
            <div style={{ background: '#fff', border: '1px solid #1f2e28', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Produk Affiliate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>{affiliateProducts.length}</div>
              <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>{affiliateProducts.filter(p => p.is_active).length} aktif</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #1f2e28', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Potensi Komisi</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>Rp {totalKomisiPotensial.toLocaleString('id-ID')}</div>
              <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>per transaksi</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #1f2e28', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Platform</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>{Object.keys(affiliateByPlatform).length}</div>
              <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>{Object.keys(affiliateByPlatform).slice(0, 2).join(', ') || '—'}</div>
            </div>
          </div>
          {Object.keys(affiliateByPlatform).length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Breakdown per Platform</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(affiliateByPlatform).sort((a, b) => b[1] - a[1]).map(([pl, count]) => (
                  <div key={pl} style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', color: '#34d399', fontWeight: 500 }}>
                    {pl} <span style={{ opacity: 0.6 }}>({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {affiliateProducts.length === 0 && (
            <p style={{ fontSize: '0.82rem', color: '#5a6a85', margin: 0 }}>Belum ada produk affiliate. Tambahkan di <a href="/catalog" style={{ color: '#34d399', textDecoration: 'none' }}>Catalog →</a></p>
          )}
        </div>
      )}

      {/* Content Status + Finance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', boxShadow: '0 4px 24px rgba(42,53,71,0.08)', borderRadius: 20, padding: '20px' }}>
          <div style={{ fontWeight: 600, color: '#2a3547', marginBottom: 16, fontSize: '0.9rem' }}>Status Konten di Library</div>
          {contentByStatus.map(({ status, count }) => {
            const total = (ideas || []).length || 1
            const pct = Math.round((count / total) * 100)
            const colors: Record<string, string> = { Draft: '#475569', Ready: '#86efac', Scheduled: '#93c5fd', Posted: '#42a5f5' }
            return (
              <div key={status} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', color: colors[status], fontWeight: 500 }}>{status}</span>
                  <span style={{ fontSize: '0.8rem', color: '#5a6a85' }}>{count}</span>
                </div>
                <div style={{ height: 6, background: '#f8fafc', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: colors[status], borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: '#fff', boxShadow: '0 4px 24px rgba(42,53,71,0.08)', borderRadius: 20, padding: '20px' }}>
          <div style={{ fontWeight: 600, color: '#2a3547', marginBottom: 16, fontSize: '0.9rem' }}>Ringkasan Keuangan</div>
          {[
            { label: 'Total Pemasukan', value: `Rp ${pemasukan.toLocaleString('id-ID')}`, color: '#86efac' },
            { label: 'Total Pengeluaran', value: `Rp ${pengeluaran.toLocaleString('id-ID')}`, color: '#f87171' },
            { label: 'Saldo Bersih', value: `Rp ${Math.abs(pemasukan - pengeluaran).toLocaleString('id-ID')}`, color: pemasukan >= pengeluaran ? '#42a5f5' : '#f87171' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5eaf2' }}>
              <span style={{ fontSize: '0.82rem', color: '#5a6a85' }}>{item.label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color }}>{item.value}</span>
            </div>
          ))}
          {(metrics || []).length === 0 && (ideas || []).length === 0 && (
            <p style={{ fontSize: '0.82rem', color: '#5a6a85', marginTop: 12 }}>Mulai isi data di Tracker dan Budget untuk melihat analytics di sini.</p>
          )}
        </div>
      </div>
    </div>
  )
}
