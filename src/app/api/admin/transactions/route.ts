import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin } from '@/lib/super-admins'

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isSuperAdmin(user.email!))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || ''
  const tier = url.searchParams.get('tier') || ''
  const days = parseInt(url.searchParams.get('days') || '90')

  const admin = adminClient()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  let query = admin.from('kf_transactions')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500)

  if (status) query = query.eq('status', status)
  if (tier) query = query.eq('tier', tier)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const transactions = (data || []).map(t => ({
    ...t,
    amount_original: t.amount_original ?? 0,
    amount_paid: t.amount_paid ?? 0,
    discount_amount: t.discount_amount ?? 0,
  }))
  return NextResponse.json({ transactions })
}
