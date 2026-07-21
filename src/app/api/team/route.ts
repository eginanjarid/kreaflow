import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function adminClient() {
  return createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getCallerRole(userId: string, workspaceId: string): Promise<string | null> {
  const admin = adminClient()
  const { data } = await admin.from('kf_workspace_members').select('role').eq('user_id', userId).eq('workspace_id', workspaceId).single()
  return (data as { role: string } | null)?.role ?? null
}

// POST /api/team — invite member
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, email, role = 'member' } = await req.json()
  if (!workspaceId || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const callerRole = await getCallerRole(user.id, workspaceId)
  if (!callerRole || callerRole === 'member') return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 })

  const admin = adminClient()

  // Check if already member
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const targetUser = authUsers?.users.find(u => u.email === email.toLowerCase().trim())
  if (targetUser) {
    const { data: alreadyMember } = await admin.from('kf_workspace_members')
      .select('id').eq('workspace_id', workspaceId).eq('user_id', targetUser.id).single()
    if (alreadyMember) return NextResponse.json({ error: 'User sudah jadi member' }, { status: 400 })
  }

  // Delete existing pending invite for same email+workspace
  await admin.from('kf_invites').delete().eq('workspace_id', workspaceId).eq('email', email.toLowerCase().trim()).is('accepted_at', null)

  // Create invite
  const { data: invite, error } = await admin.from('kf_invites').insert({
    workspace_id: workspaceId,
    email: email.toLowerCase().trim(),
    role,
    invited_by: user.id,
  }).select('token').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${(invite as { token: string }).token}`
  return NextResponse.json({ token: (invite as { token: string }).token, url: inviteUrl })
}

// DELETE /api/team — remove member
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, memberId } = await req.json()
  const callerRole = await getCallerRole(user.id, workspaceId)
  if (!callerRole || callerRole === 'member') return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 })

  const admin = adminClient()
  const { data: target } = await admin.from('kf_workspace_members').select('role').eq('id', memberId).single()
  if ((target as { role: string } | null)?.role === 'owner') return NextResponse.json({ error: 'Tidak bisa remove owner' }, { status: 400 })

  await admin.from('kf_workspace_members').delete().eq('id', memberId).eq('workspace_id', workspaceId)
  return NextResponse.json({ success: true })
}

// PATCH /api/team — change role
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId, memberId, role } = await req.json()
  const callerRole = await getCallerRole(user.id, workspaceId)
  if (callerRole !== 'owner') return NextResponse.json({ error: 'Hanya owner yang bisa ubah role' }, { status: 403 })

  const admin = adminClient()
  const { data: target } = await admin.from('kf_workspace_members').select('role').eq('id', memberId).single()
  if ((target as { role: string } | null)?.role === 'owner') return NextResponse.json({ error: 'Tidak bisa ubah role owner' }, { status: 400 })

  await admin.from('kf_workspace_members').update({ role }).eq('id', memberId).eq('workspace_id', workspaceId)
  return NextResponse.json({ success: true })
}
