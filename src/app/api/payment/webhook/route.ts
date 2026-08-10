import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

type TierCfg = { maxWs: number; plan: string }

const TIER_MAP: Record<string, TierCfg> = {
  // Current tier IDs
  bulanan:  { maxWs: 1,  plan: 'monthly'  },
  basic:    { maxWs: 2,  plan: 'lifetime' },
  pro:      { maxWs: 4,  plan: 'lifetime' },
  agency:   { maxWs: 10, plan: 'lifetime' },
  // Legacy
  starter:  { maxWs: 1,  plan: 'lifetime' },
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-callback-token')
  if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  if (body.status !== 'PAID') {
    // Log failed/expired status too
    if (['EXPIRED', 'FAILED'].includes(body.status)) {
      const externalId = body.external_id as string
      const admin = createAdmin(
        process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await admin.from('kf_transactions').update({ status: 'failed' }).eq('external_id', externalId)
    }
    return NextResponse.json({ received: true })
  }

  const externalId = body.external_id as string
  const parts = externalId.split('-')

  let tier = 'pro'
  let workspaceId: string

  const knownTiers = Object.keys(TIER_MAP).concat(['addon'])
  if (knownTiers.includes(parts[1])) {
    tier = parts[1]
    workspaceId = parts.slice(2, -1).join('-')
  } else {
    // Legacy format: kreaflow-{uuid}-{timestamp}
    tier = 'starter'
    workspaceId = parts.slice(1, -1).join('-')
  }

  if (!workspaceId) return NextResponse.json({ error: 'Invalid external_id' }, { status: 400 })

  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const paidAt = new Date().toISOString()

  if (tier === 'addon') {
    const { data: ws } = await admin.from('kf_workspaces').select('max_workspaces').eq('id', workspaceId).single()
    const currentMax = (ws?.max_workspaces as number) || 1
    await admin.from('kf_workspaces').update({ max_workspaces: currentMax + 1 }).eq('id', workspaceId)
    console.log(`✓ Addon: workspace ${workspaceId} max_workspaces → ${currentMax + 1}`)
  } else {
    const cfg = TIER_MAP[tier] || TIER_MAP['pro']
    const updatePayload: Record<string, unknown> = {
      plan: cfg.plan,
      max_workspaces: cfg.maxWs,
    }
    if (cfg.plan === 'monthly') {
      updatePayload.plan_expires_at = new Date(Date.now() + 30 * 86400000).toISOString()
    }
    await admin.from('kf_workspaces').update(updatePayload).eq('id', workspaceId)
    console.log(`✓ Activated: workspace ${workspaceId} → ${cfg.plan}/${tier} maxWs=${cfg.maxWs}`)
  }

  // Update transaction status + mark coupon as used
  const { data: tx } = await admin.from('kf_transactions')
    .update({ status: 'paid', paid_at: paidAt })
    .eq('external_id', externalId)
    .select('coupon_code, amount_paid')
    .single()

  if (tx?.coupon_code) {
    const { data: cpn } = await admin.from('kf_coupons').select('used_count').eq('code', tx.coupon_code).single()
    if (cpn) {
      await admin.from('kf_coupons').update({ used_count: (cpn.used_count as number) + 1 }).eq('code', tx.coupon_code)
    }
  }

  return NextResponse.json({ success: true })
}
