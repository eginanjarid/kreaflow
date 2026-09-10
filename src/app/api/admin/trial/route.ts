import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin } from '@/lib/super-admins'

const SETTINGS_KEY = 'trial_settings'

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return (await isSuperAdmin(user.email!)) ? user : null
}

// GET — status toggle trial saat ini
export async function GET() {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const admin = adminClient()
  const { data } = await admin.from('kf_app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  const enabled = (data?.value as { enabled?: boolean } | null)?.enabled === true
  return NextResponse.json({ enabled })
}

// PATCH — nyalain/matiin trial
export async function PATCH(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { enabled } = await req.json()
  if (typeof enabled !== 'boolean') return NextResponse.json({ error: 'enabled wajib boolean' }, { status: 400 })

  const admin = adminClient()
  await admin.from('kf_app_settings').upsert(
    { key: SETTINGS_KEY, value: { enabled }, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return NextResponse.json({ success: true })
}
