import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BRAND_TYPE_MODES: Record<string, string[]> = {
  creator: ['creator'],
  affiliate: ['affiliate'],
  business: ['creator'],
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, brand_type } = await req.json()
  if (!name || !brand_type) return NextResponse.json({ error: 'name dan brand_type wajib diisi' }, { status: 400 })

  const modes = BRAND_TYPE_MODES[brand_type] || ['creator']

  const { data: ws, error } = await supabase
    .from('kf_workspaces')
    .insert({ name, owner_id: user.id, plan: 'free', brand_type, modes })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('kf_workspace_members').insert({
    workspace_id: ws.id, user_id: user.id, role: 'owner',
  })

  const res = NextResponse.json({ success: true, workspace_id: ws.id })
  res.cookies.set('selected_workspace_id', ws.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
