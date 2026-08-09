'use client'

type PlanEntry = { assigned_naskah: string | null; plan_started_at: string | null; plan_completed_at: string | null }
type StudioEntry = { assigned_produksi: string | null; studio_started_at: string | null; studio_completed_at: string | null }
type TaskEntry = { assigned_to: string | null; started_at: string | null; completed_at: string | null; nama: string }
type CalendarEntry = { assigned_calendar: string | null; calendar_started_at: string | null; calendar_completed_at: string | null }

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

const MODULES = [
  { key: 'p', label: 'Naskah', color: '#1a73e8' },
  { key: 's', label: 'Studio', color: '#7c3aed' },
  { key: 't', label: 'Tasks',  color: '#6366f1' },
  { key: 'c', label: 'Tayang', color: '#059669' },
] as const

const BADGES = [
  { emoji: '🔥', label: 'On Fire!', color: '#f97316', anim: 'kf-flame' },
  { emoji: '⭐', label: 'Bintang',  color: '#eab308', anim: 'kf-star'  },
  { emoji: '🎯', label: 'Solid',    color: '#8b5cf6', anim: ''         },
]

export default function WorkReportModule({ planEntries, studioEntries, taskEntries, calendarEntries }: {
  planEntries: PlanEntry[]
  studioEntries: StudioEntry[]
  taskEntries: TaskEntry[]
  calendarEntries: CalendarEntry[]
}) {
  const CARD = { background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)' }

  // 7-day chart
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  }
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const dailyCounts = days.map(day => {
    const p = planEntries.filter(e => e.plan_completed_at?.slice(0, 10) === day).length
    const s = studioEntries.filter(e => e.studio_completed_at?.slice(0, 10) === day).length
    const t = taskEntries.filter(e => e.completed_at?.slice(0, 10) === day).length
    const c = calendarEntries.filter(e => e.calendar_completed_at?.slice(0, 10) === day).length
    return { day, p, s, t, c, total: p + s + t + c }
  })
  const maxTotal = Math.max(...dailyCounts.map(d => d.total), 1)
  const totalCalPosted = calendarEntries.length

  // Per-person
  const allPeople = new Set<string>()
  planEntries.forEach(e => { if (e.assigned_naskah) allPeople.add(e.assigned_naskah) })
  studioEntries.forEach(e => { if (e.assigned_produksi) allPeople.add(e.assigned_produksi) })
  taskEntries.forEach(e => { if (e.assigned_to) allPeople.add(e.assigned_to) })
  calendarEntries.forEach(e => { if (e.assigned_calendar) allPeople.add(e.assigned_calendar) })

  const stats = Array.from(allPeople).map(person => {
    const pd = planEntries.filter(e => e.assigned_naskah === person && e.plan_completed_at)
    const ph = pd.map(e => diffHours(e.plan_started_at, e.plan_completed_at)).filter((h): h is number => h !== null)
    const sd = studioEntries.filter(e => e.assigned_produksi === person && e.studio_completed_at)
    const sh = sd.map(e => diffHours(e.studio_started_at, e.studio_completed_at)).filter((h): h is number => h !== null)
    const td = taskEntries.filter(e => e.assigned_to === person && e.completed_at)
    const th = td.map(e => diffHours(e.started_at, e.completed_at)).filter((h): h is number => h !== null)
    const cd = calendarEntries.filter(e => e.assigned_calendar === person && e.calendar_completed_at)
    const ch = cd.map(e => diffHours(e.calendar_started_at, e.calendar_completed_at)).filter((h): h is number => h !== null)
    const totalDone = pd.length + sd.length + td.length + cd.length
    return {
      person,
      p: pd.length, ph: ph.length > 0 ? ph.reduce((a,b)=>a+b,0)/ph.length : null,
      s: sd.length, sh: sh.length > 0 ? sh.reduce((a,b)=>a+b,0)/sh.length : null,
      t: td.length, th: th.length > 0 ? th.reduce((a,b)=>a+b,0)/th.length : null,
      c: cd.length, ch: ch.length > 0 ? ch.reduce((a,b)=>a+b,0)/ch.length : null,
      totalDone,
    }
  }).sort((a, b) => b.totalDone - a.totalDone)

  const maxPersonTotal = Math.max(...stats.map(s => s.totalDone), 1)

  return (
    <div style={{ ...CARD, padding: '20px 22px' }}>
      <style>{`
        @keyframes kf-flame {
          0%,100% { transform: scale(1) rotate(-4deg); }
          50%      { transform: scale(1.25) rotate(4deg); }
        }
        @keyframes kf-star {
          0%,100% { transform: scale(1) rotate(0deg); opacity:1; }
          50%      { transform: scale(1.2) rotate(20deg); opacity:0.85; }
        }
        .kf-flame { animation: kf-flame 0.9s ease-in-out infinite; display:inline-block; }
        .kf-star  { animation: kf-star  1.4s ease-in-out infinite; display:inline-block; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.92rem' }}>Aktivitas Tim</div>
        <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>7 hari terakhir</span>
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 72, marginBottom: 6 }}>
        {dailyCounts.map(({ day, p, s, t, c, total }) => {
          const barH = total === 0 ? 4 : Math.max(8, Math.round((total / maxTotal) * 60))
          const isToday = day === todayStr
          const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' })
          return (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              {total > 0 && <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#6b7280' }}>{total}</span>}
              <div style={{ width: '100%', height: barH, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', background: total === 0 ? '#f3f4f6' : 'transparent' }}>
                {total > 0 && <>
                  {c > 0 && <div style={{ background: '#059669', height: `${Math.round(c/total*100)}%` }} />}
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {MODULES.map(m => (
          <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 1.5, background: m.color, display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{m.label}</span>
          </div>
        ))}
      </div>

      {totalCalPosted > 0 && (
        <div style={{ fontSize: '0.65rem', color: '#6b7280', background: 'rgba(5,150,105,0.07)', borderRadius: 8, padding: '5px 10px', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, color: '#059669' }}>{totalCalPosted} konten tayang</span> di periode ini
        </div>
      )}

      <div style={{ borderTop: '1px solid #f3f4f6', marginBottom: 14 }} />

      {/* Per-person */}
      {allPeople.size === 0 ? (
        <div style={{ textAlign: 'center', padding: '14px 0' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>Belum ada aktivitas tim</div>
          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Data masuk setelah tim mulai dan selesaikan pekerjaan</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Per Anggota · {stats.reduce((a,b) => a + b.totalDone, 0)} aktivitas selesai
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.map((s, rank) => {
              const badge = rank < BADGES.length ? BADGES[rank] : null
              const modules = [
                { key: 'p', count: s.p, avg: s.ph, color: '#1a73e8', label: 'Naskah' },
                { key: 's', count: s.s, avg: s.sh, color: '#7c3aed', label: 'Studio' },
                { key: 't', count: s.t, avg: s.th, color: '#6366f1', label: 'Tasks' },
                { key: 'c', count: s.c, avg: s.ch, color: '#059669', label: 'Tayang' },
              ].filter(m => m.count > 0)

              return (
                <div key={s.person} style={{ background: rank === 0 ? 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(234,179,8,0.04))' : '#f9fafb', border: rank === 0 ? '1.5px solid rgba(249,115,22,0.2)' : '1.5px solid transparent', borderRadius: 12, padding: '12px 14px' }}>
                  {/* Top row: avatar + name + badge + total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: rank === 0 ? 'linear-gradient(135deg,#f97316,#eab308)' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: rank === 0 ? '#fff' : '#374151' }}>{shortName(s.person).slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(s.person)}</span>
                        {badge && (
                          <span className={badge.anim} title={badge.label} style={{ fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>{badge.emoji}</span>
                        )}
                      </div>
                      {rank === 0 && (
                        <div style={{ fontSize: '0.6rem', color: '#f97316', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Top Performer</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: rank === 0 ? '#f97316' : '#374151', lineHeight: 1 }}>{s.totalDone}</div>
                      <div style={{ fontSize: '0.58rem', color: '#9ca3af' }}>aktivitas</div>
                    </div>
                  </div>

                  {/* Mini stacked bar */}
                  <div style={{ height: 6, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
                    {modules.map(m => (
                      <div key={m.key} style={{ background: m.color, width: `${Math.round(m.count / s.totalDone * 100)}%`, transition: 'width 0.4s' }} />
                    ))}
                  </div>

                  {/* Module breakdown labels */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {modules.map(m => (
                      <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 1.5, background: m.color, display: 'block', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                          {m.label}: <span style={{ fontWeight: 700, color: '#374151' }}>{m.count}x</span>
                          {m.avg != null && <span style={{ color: '#9ca3af' }}> ~{fmtDur(m.avg)}</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar vs top */}
                  {rank > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(s.totalDone / maxPersonTotal * 100)}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: '0.58rem', color: '#9ca3af', marginTop: 3 }}>{Math.round(s.totalDone / maxPersonTotal * 100)}% dari top performer</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
