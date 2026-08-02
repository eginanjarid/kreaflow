import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const TIER_LIMITS: Record<string, number> = {
  starter: 1,
  pro: 4,
  agency: 10,
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-callback-token')
  if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (body.status !== 'PAID') return NextResponse.json({ received: true })

  const externalId = body.external_id as string
  const parts = externalId.split('-')

  const knownTiers = ['starter', 'pro', 'agency', 'addon']
  let tier = 'starter'
  let workspaceId: string

  if (knownTiers.includes(parts[1])) {
    // New format: kreaflow-{tier}-{uuid}-{timestamp}
    tier = parts[1]
    workspaceId = parts.slice(2, -1).join('-')
  } else {
    // Legacy format: kreaflow-{uuid}-{timestamp}
    workspaceId = parts.slice(1, -1).join('-')
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'Invalid external_id' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (tier === 'addon') {
    // Increment max_workspaces by 1
    const { data: ws } = await admin.from('kf_workspaces').select('max_workspaces').eq('id', workspaceId).single()
    const currentMax = (ws?.max_workspaces as number) || 1
    const { error } = await admin.from('kf_workspaces').update({ max_workspaces: currentMax + 1 }).eq('id', workspaceId)
    if (error) { console.error('Webhook addon error:', error); return NextResponse.json({ error: 'DB update failed' }, { status: 500 }) }
    console.log(`✓ Workspace ${workspaceId} addon: max_workspaces → ${currentMax + 1}`)
  } else {
    const maxWs = TIER_LIMITS[tier] || 1
    const { error } = await admin.from('kf_workspaces').update({ plan: 'lifetime', max_workspaces: maxWs }).eq('id', workspaceId)
    if (error) { console.error('Webhook update error:', error); return NextResponse.json({ error: 'DB update failed' }, { status: 500 }) }
    console.log(`✓ Workspace ${workspaceId} activated: lifetime/${tier} max_workspaces=${maxWs}`)
  }

  return NextResponse.json({ success: true })
}
