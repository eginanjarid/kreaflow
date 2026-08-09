'use client'

type PlanEntry = { assigned_naskah: string | null; plan_started_at: string | null; plan_completed_at: string | null }
type StudioEntry = { assigned_produksi: string | null; studio_started_at: string | null; studio_completed_at: string | null }
type TaskEntry = { assigned_to: string | null; started_at: string | null; completed_at: string | null; nama: string }

function diffHours(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 3600000
  return diff > 0 && diff < 168 ? diff : null
}

function shortName(email: string | null): string {
  if (!email) return '?'
  return email.split('@')[0]
}

function fmtDur(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`
  return `${h.toFixed(1)}j`
}

export default function WorkReportModule({
  planEntries, studioEntries, taskEntries
}: {
  planEntries: PlanEntry[]
  studioEntries: StudioEntry[]
  taskEntries: TaskEntry[]
}) {
  const CARD = { background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)' }

  // Daily chart — last 7 days
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  }
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const dailyCounts = days.map(day => {
    const p = planEntries.filter(e => e.plan_completed_at?.slice(0, 10) === day).length
    const s = studioEntries.filter(e => e.studio_completed_at?.slice(0, 10) === day).length
    const t = taskEntries.filter(e => e.completed_at?.slice(0, 10) === day).length
    return { day, p, s, t, total: p + s + t }
  })
  const maxTotal = Math.max(...dailyCounts.map(d => d.total), 1)
  const totalAllTime = planEntries.length + studioEntries.length + taskEntries.length

  // Per-person stats
  const allPeople = new Set<string>()
  planEntries.forEach(e => { if (e.assigned_naskah) allPeople.add(e.assigned_naskah) })
  studioEntries.forEach(e => { if (e.assigned_produksi) allPeople.add(e.assigned_produksi) })
  taskEntries.forEach(e => { if (e.assigned_to) allPeople.add(e.assigned_to) })

  const stats = Array.from(allPeople).map(person => {
    const pd = planEntries.filter(e => e.assigned_naskah === person && e.plan_completed_at)
    const ph = pd.map(e => diffHours(e.plan_started_at, e.plan_completed_at)).filter((h): h is number => h !== null)
    const sd = studioEntries.filter(e => e.assigned_produksi === person && e.studio_completed_at)
    const sh = sd.map(e => diffHours(e.studio_started_at, e.studio_completed_at)).filter((h): h is number => h !== null)
    const td = taskEntries.filter(e => e.assigned_to === person && e.completed_at)
    const th = td.map(e => diffHours(e.started_at, e.completed_at)).filter((h): h is number => h !== null)
    const totalDone = pd.length + sd.length + td.length
    const allHours = [...ph, ...sh, ...th]
    const avgAll = allHours.length > 0 ? allHours.reduce((a, b) => a + b, 0) / allHours.length : null
    return { person, pd: pd.length, ph: ph.length > 0 ? ph.reduce((a,b)=>a+b,0)/ph.length : null, sd: sd.length, sh: sh.length > 0 ? sh.reduce((a,b)=>a+b,0)/sh.length : null, td: td.length, th: th.length > 0 ? th.reduce((a,b)=>a+b,0)/th.length : null, totalDone, avgAll }
  }).sort((a, b) => b.totalDone - a.totalDone)

  return (
    <div style={{ ...CARD, padding: '20px 22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>Laporan Kecepatan Tim</div>
        <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>7 hari terakhir</span>
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72, marginBottom: 6 }}>
        {dailyCounts.map(({ day, p, s, t, total }) => {
          const barH = total === 0 ? 4 : Math.max(8, Math.round((total / maxTotal) * 60))
          const isToday = day === todayStr
          const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' })
          return (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              {total > 0 && <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#6b7280' }}>{total}</span>}
              <div style={{ width: '100%', height: barH, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', background: total === 0 ? '#f3f4f6' : 'transparent' }}>
                {total > 0 && <>
                  {t > 0 && <div style={{ background: '#6366f1', height: `${Math.round(t/total*100)}%` }} />}
                  {s > 0 && <div style={{ background: '#7c3aed', height: `${Math.round(s/total*100)}%` }} />}
                  {p > 0 && <div style={{ background: '#1a73e8', height: `${Math.round(p/total*100)}%` }} />}
                </>}
              </div>
              <span style={{ fontSize: '0.55rem', color: isToday ? '#1a73e8' : '#c4c4c4', fontWeight: isToday ? 700 : 400 }}>{dayLabel}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[{ color: '#1a73e8', label: 'Plan' }, { color: '#7c3aed', label: 'Studio' }, { color: '#6366f1', label: 'Tasks' }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 1.5, background: l.color, display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #f3f4f6', marginBottom: 14 }} />

      {/* Per-person table or empty state */}
      {allPeople.size === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Belum ada data kecepatan</div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Data masuk setelah tim mulai dan selesaikan pekerjaan</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Kecepatan per Anggota · {totalAllTime} selesai total
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.map(s => (
              <div key={s.person} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f9fafb', borderRadius: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#374151' }}>{shortName(s.person).slice(0, 2).toUpperCase()}</span>
                </div>
                <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(s.person)}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {s.pd > 0 && <span style={{ fontSize: '0.65rem', background: 'rgba(26,115,232,0.1)', color: '#1a73e8', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>P {s.pd}x{s.ph != null ? ` ~${fmtDur(s.ph)}` : ''}</span>}
                  {s.sd > 0 && <span style={{ fontSize: '0.65rem', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>S {s.sd}x{s.sh != null ? ` ~${fmtDur(s.sh)}` : ''}</span>}
                  {s.td > 0 && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>T {s.td}x{s.th != null ? ` ~${fmtDur(s.th)}` : ''}</span>}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#111827', minWidth: 24, textAlign: 'right', flexShrink: 0 }}>{s.totalDone}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
