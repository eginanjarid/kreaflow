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

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isSuperAdmin(user.email!))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()
  const { data, error } = await admin.from('kf_coupons').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupons: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isSuperAdmin(user.email!))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { code, type, value, maxUses, applicableTiers, expiresAt } = body

  if (!code || !type || !value) return NextResponse.json({ error: 'code, type, value wajib diisi' }, { status: 400 })
  if (!['percent', 'fixed'].includes(type)) return NextResponse.json({ error: 'type harus percent atau fixed' }, { status: 400 })
  if (type === 'percent' && (value < 1 || value > 100)) return NextResponse.json({ error: 'Persentase harus 1-100' }, { status: 400 })

  const admin = adminClient()
  const { data, error } = await admin.from('kf_coupons').insert({
    code: code.toUpperCase().trim(),
    type,
    value: parseInt(value),
    max_uses: maxUses ? parseInt(maxUses) : null,
    applicable_tiers: applicableTiers?.length ? applicableTiers : null,
    expires_at: expiresAt || null,
    created_by: user.email,
  }).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kode kupon sudah ada' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ coupon: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isSuperAdmin(user.email!))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

  const admin = adminClient()
  const { error } = await admin.from('kf_coupons').update({ is_active }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isSuperAdmin(user.email!))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

  const admin = adminClient()
  const { error } = await admin.from('kf_coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
