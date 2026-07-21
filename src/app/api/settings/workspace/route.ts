import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, updates } = await req.json()
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId wajib diisi' }, { status: 400 })

  // Verify user is a member of this workspace
  const { data: member } = await supabaseUser
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .single()

  if (!member) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('kf_workspaces').update(updates).eq('id', workspaceId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
