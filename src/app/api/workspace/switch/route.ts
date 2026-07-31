import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspace_id } = await req.json()
  if (!workspace_id) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const { data: member } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const res = NextResponse.json({ success: true })
  res.cookies.set('selected_workspace_id', workspace_id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
