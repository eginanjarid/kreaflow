'use client'

type PlanEntry = { assigned_naskah: string | null; plan_started_at: string | null; plan_completed_at: string | null }
type StudioEntry = { assigned_produksi: string | null; studio_started_at: string | null; studio_completed_at: string | null }
type TaskEntry = { assigned_to: string | null; started_at: string | null; completed_at: string | null; nama: string }

function diffHours(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 3600000
  return diff > 0 && diff < 168 ? diff : null // ignore >7 days (likely stale/test data)
}

function shortName(email: string | null): string {
  if (!email) return '?'
  return email.split('@')[0]
}

function fmtHours(h: number): string {
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
  // Collect all people
  const allPeople = new Set<string>()
  planEntries.forEach(e => { if (e.assigned_naskah) allPeople.add(e.assigned_naskah) })
  studioEntries.forEach(e => { if (e.assigned_produksi) allPeople.add(e.assigned_produksi) })
  taskEntries.forEach(e => { if (e.assigned_to) allPeople.add(e.assigned_to) })

  if (allPeople.size === 0) return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', padding: '24px 24px' }}>
      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem', marginBottom: 4 }}>Laporan Kecepatan Tim</div>
      <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 8 }}>Belum ada data. Mulai kerjakan task dan konten untuk melihat laporan ini.</div>
    </div>
  )

  // Per-person stats
  const stats = Array.from(allPeople).map(person => {
    const planDone = planEntries.filter(e => e.assigned_naskah === person && e.plan_completed_at)
    const planHours = planDone.map(e => diffHours(e.plan_started_at, e.plan_completed_at)).filter((h): h is number => h !== null)
    const planAvg = planHours.length > 0 ? planHours.reduce((a, b) => a + b, 0) / planHours.length : null

    const studioDone = studioEntries.filter(e => e.assigned_produksi === person && e.studio_completed_at)
    const studioHours = studioDone.map(e => diffHours(e.studio_started_at, e.studio_completed_at)).filter((h): h is number => h !== null)
    const studioAvg = studioHours.length > 0 ? studioHours.reduce((a, b) => a + b, 0) / studioHours.length : null

    const taskDone = taskEntries.filter(e => e.assigned_to === person && e.completed_at)
    const taskHours = taskDone.map(e => diffHours(e.started_at, e.completed_at)).filter((h): h is number => h !== null)
    const taskAvg = taskHours.length > 0 ? taskHours.reduce((a, b) => a + b, 0) / taskHours.length : null

    const totalDone = planDone.length + studioDone.length + taskDone.length
    return { person, planDone: planDone.length, planAvg, studioDone: studioDone.length, studioAvg, taskDone: taskDone.length, taskAvg, totalDone }
  }).sort((a, b) => b.totalDone - a.totalDone)

  // Daily chart: last 7 days, total completions per day
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }

  const dailyCounts = days.map(day => {
    const planCount = planEntries.filter(e => e.plan_completed_at?.slice(0, 10) === day).length
    const studioCount = studioEntries.filter(e => e.studio_completed_at?.slice(0, 10) === day).length
    const taskCount = taskEntries.filter(e => e.completed_at?.slice(0, 10) === day).length
    return { day, planCount, studioCount, taskCount, total: planCount + studioCount + taskCount }
  })

  const maxTotal = Math.max(...dailyCounts.map(d => d.total), 1)

  const CARD = { background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
      {/* Daily bar chart */}
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem', marginBottom: 16 }}>Pekerjaan Selesai — 7 Hari Terakhir</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {dailyCounts.map(({ day, planCount, studioCount, taskCount, total }) => {
            const barH = Math.max(4, Math.round((total / maxTotal) * 84))
            const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
            const isToday = day === new Date().toISOString().slice(0, 10)
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {total > 0 && (
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#6b7280' }}>{total}</div>
                )}
                <div style={{ width: '100%', height: barH, borderRadius: '4px 4px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', gap: 0, background: total === 0 ? '#f3f4f6' : 'transparent' }}>
                  {total > 0 && <>
                    {taskCount > 0 && <div style={{ background: '#6366f1', height: `${Math.round(taskCount / total * 100)}%` }} />}
                    {studioCount > 0 && <div style={{ background: '#7c3aed', height: `${Math.round(studioCount / total * 100)}%` }} />}
                    {planCount > 0 && <div style={{ background: '#1a73e8', height: `${Math.round(planCount / total * 100)}%` }} />}
                  </>}
                </div>
                <div style={{ fontSize: '0.58rem', color: isToday ? '#1a73e8' : '#9ca3af', fontWeight: isToday ? 700 : 400, textAlign: 'center', lineHeight: 1.2 }}>{dayLabel}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
          {[
            { color: '#1a73e8', label: 'Naskah (Plan)' },
            { color: '#7c3aed', label: 'Produksi (Studio)' },
            { color: '#6366f1', label: 'Tasks' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-person stats */}
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem', marginBottom: 14 }}>Kecepatan per Anggota</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 100px)', gap: 8, padding: '6px 8px', borderBottom: '2px solid #f3f4f6', marginBottom: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anggota</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Plan</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Studio</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Tasks</span>
          </div>
          {stats.map(s => (
            <div key={s.person} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 100px)', gap: 8, padding: '10px 8px', borderBottom: '1px solid #f9fafb', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{shortName(s.person).slice(0, 2).toUpperCase()}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(s.person)}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                {s.planDone > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a73e8' }}>{s.planDone}x</div>
                    {s.planAvg != null && <div style={{ fontSize: '0.62rem', color: '#9ca3af' }}>~{fmtHours(s.planAvg)}</div>}
                  </div>
                ) : <span style={{ color: '#e5e7eb', fontSize: '0.75rem' }}>—</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                {s.studioDone > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed' }}>{s.studioDone}x</div>
                    {s.studioAvg != null && <div style={{ fontSize: '0.62rem', color: '#9ca3af' }}>~{fmtHours(s.studioAvg)}</div>}
                  </div>
                ) : <span style={{ color: '#e5e7eb', fontSize: '0.75rem' }}>—</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                {s.taskDone > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1' }}>{s.taskDone}x</div>
                    {s.taskAvg != null && <div style={{ fontSize: '0.62rem', color: '#9ca3af' }}>~{fmtHours(s.taskAvg)}</div>}
                  </div>
                ) : <span style={{ color: '#e5e7eb', fontSize: '0.75rem' }}>—</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.68rem', color: '#9ca3af' }}>
          Durasi rata-rata dihitung dari mulai dikerjakan hingga selesai. Data accumulate seiring waktu.
        </div>
      </div>
    </div>
  )
}
