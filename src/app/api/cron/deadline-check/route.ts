import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Step ID → notification type mapping
const STEP_NOTIF_TYPE: Record<string, string> = {
  naskah: 'naskah', caption: 'naskah', rundown: 'naskah',
  desain: 'produksi', take_vid: 'produksi', shooting: 'produksi',
  editing: 'produksi', thumbnail: 'produksi', review: 'produksi',
  schedule: 'schedule', live: 'schedule',
}

const STEP_NAMA: Record<string, string> = {
  naskah: 'Buat Naskah', desain: 'Desain', take_vid: 'Take Video',
  shooting: 'Shooting', editing: 'Editing', caption: 'Caption',
  thumbnail: 'Thumbnail', review: 'Review', rundown: 'Rundown',
  schedule: 'Schedule', live: 'Live',
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Get all sprints with step_config that are still active
  const { data: sprints } = await supabase
    .from('kf_sprints')
    .select('id, workspace_id, nama, end_date, step_config')
    .gte('end_date', todayStr)
    .not('step_config', 'is', null)

  if (!sprints || sprints.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, notified: 0 })
  }

  const sprintIds = sprints.map((s: { id: unknown }) => s.id as string)

  // Get all content items with tanggal_tayang in these sprints
  const { data: contents } = await supabase
    .from('kf_content_ideas')
    .select('id, sprint_id, judul, tanggal_tayang, status')
    .in('sprint_id', sprintIds)
    .not('tanggal_tayang', 'is', null)
    .neq('status', 'Tayang')

  if (!contents || contents.length === 0) {
    return NextResponse.json({ ok: true, checked: sprints.length, notified: 0 })
  }

  // Group content by sprint_id
  const contentBySprint: Record<string, typeof contents> = {}
  for (const c of contents) {
    const sid = c.sprint_id as string
    if (!contentBySprint[sid]) contentBySprint[sid] = []
    contentBySprint[sid].push(c)
  }

  // Build notifications to insert
  type NotifRow = {
    workspace_id: string
    type: string
    title: string
    message: string
  }
  const toInsert: NotifRow[] = []

  for (const sprint of sprints) {
    const sprintContents = contentBySprint[sprint.id as string] || []
    if (sprintContents.length === 0) continue

    const stepConfig = sprint.step_config as Array<{ id: string; daysBefore: number; memberName: string; memberId?: string }>
    if (!Array.isArray(stepConfig)) continue

    // Group hits: step_id → { count, memberName }
    const stepHits: Record<string, { count: number; memberName: string }> = {}

    for (const step of stepConfig) {
      if (!step.id || typeof step.daysBefore !== 'number') continue
      let count = 0

      for (const item of sprintContents) {
        if (!item.tanggal_tayang) continue
        const tayang = new Date(item.tanggal_tayang as string + 'T00:00:00')
        tayang.setDate(tayang.getDate() - step.daysBefore)
        const dl = `${tayang.getFullYear()}-${String(tayang.getMonth() + 1).padStart(2, '0')}-${String(tayang.getDate()).padStart(2, '0')}`
        if (dl === todayStr) count++
      }

      if (count > 0) {
        stepHits[step.id] = { count, memberName: step.memberName || '' }
      }
    }

    if (Object.keys(stepHits).length === 0) continue

    // Dedup: skip if we already sent deadline notifs for this sprint today
    const { data: existing } = await supabase
      .from('kf_notifications')
      .select('id')
      .eq('workspace_id', sprint.workspace_id as string)
      .eq('type', 'deadline')
      .gte('created_at', todayStr + 'T00:00:00')
      .like('title', `%${sprint.nama}%`)
      .limit(1)

    if (existing && existing.length > 0) continue

    // One notification per sprint summarising all steps due today
    const stepLines = Object.entries(stepHits)
      .map(([sid, { count, memberName }]) => {
        const nama = STEP_NAMA[sid] || sid
        return memberName ? `• ${nama}: ${count} konten (${memberName})` : `• ${nama}: ${count} konten`
      })
      .join('\n')

    toInsert.push({
      workspace_id: sprint.workspace_id as string,
      type: 'deadline',
      title: `Deadline Hari Ini — ${sprint.nama as string}`,
      message: `Step yang jatuh tempo hari ini:\n${stepLines}\n\nBuka Sprint untuk detail progress.`,
    })
  }

  if (toInsert.length > 0) {
    await supabase.from('kf_notifications').insert(toInsert)
  }

  return NextResponse.json({ ok: true, checked: sprints.length, notified: toInsert.length })
}
