import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-callback-token')
  if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (body.status !== 'PAID') {
    return NextResponse.json({ received: true })
  }

  // external_id format: kreaflow-{workspace_id}-{timestamp}
  const parts = (body.external_id as string).split('-')
  // workspace_id is UUID: parts[1]-[2]-[3]-[4]-[5]
  const workspaceId = parts.slice(1, -1).join('-')

  if (!workspaceId) {
    return NextResponse.json({ error: 'Invalid external_id' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin
    .from('kf_workspaces')
    .update({ plan: 'lifetime' })
    .eq('id', workspaceId)

  if (error) {
    console.error('Webhook update error:', error)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  console.log(`✓ Workspace ${workspaceId} activated: lifetime (invoice ${body.id})`)
  return NextResponse.json({ success: true })
}
