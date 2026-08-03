import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isGodAdmin } from '@/lib/super-admins'

function getAdmin() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireGodAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isGodAdmin(user.email!)) return null
  return user
}

export async function GET() {
  const user = await requireGodAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data, error } = await admin.from('kf_super_admins').select('email, added_by, created_at').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const user = await requireGodAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
  if (isGodAdmin(email)) return NextResponse.json({ error: 'Email ini tidak bisa ditambahkan' }, { status: 400 })

  const admin = getAdmin()
  const { error } = await admin.from('kf_super_admins').insert({ email: email.toLowerCase().trim(), added_by: user.email! })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await requireGodAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
  if (isGodAdmin(email)) return NextResponse.json({ error: 'God admin tidak bisa dihapus' }, { status: 400 })

  const admin = getAdmin()
  const { error } = await admin.from('kf_super_admins').delete().eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
