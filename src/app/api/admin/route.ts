import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const SUPER_ADMINS = ['eginanjarism@gmail.com']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !SUPER_ADMINS.includes(user.email!)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, userId, plan, workspaceId, password } = await req.json()
  const admin = createAdmin(process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (action === 'plan') {
    if (workspaceId) await admin.from('kf_workspaces').update({ plan }).eq('id', workspaceId)
    return NextResponse.json({ success: true })
  }

  if (action === 'password') {
    if (!password || password.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    const { error } = await admin.auth.admin.updateUserById(userId, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
