import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspace_id } = await req.json()
  if (!workspace_id) return NextResponse.json({ error: 'workspace_id wajib diisi' }, { status: 400 })

  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hanya owner/admin workspace ini yang boleh hapus
  const { data: membership } = await admin
    .from('kf_workspace_members')
    .select('role')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return NextResponse.json({ error: 'Kamu tidak punya izin menghapus workspace ini' }, { status: 403 })
  }

  // Jangan sampai user kehabisan workspace
  const { data: allMemberships } = await admin
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)

  if ((allMemberships?.length ?? 0) <= 1) {
    return NextResponse.json({ error: 'Tidak bisa menghapus satu-satunya workspace kamu' }, { status: 400 })
  }

  // Hapus data terkait dulu (urutan: yang paling bergantung duluan) sebelum workspace-nya sendiri
  await admin.from('kf_calendar_entries').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_notifications').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_content_ideas').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_tasks').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_sprints').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_products').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_accounts').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_brand_profiles').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_transactions').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_monthly_metrics').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_plan_platforms').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_campaigns').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_invites').delete().eq('workspace_id', workspace_id)
  await admin.from('kf_workspace_members').delete().eq('workspace_id', workspace_id)

  const { error } = await admin.from('kf_workspaces').delete().eq('id', workspace_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Kalau yang dihapus adalah workspace aktif, pindahkan ke workspace lain yang tersisa
  const cookieStore = await cookies()
  const currentWsId = cookieStore.get('selected_workspace_id')?.value
  let switchedTo: string | null = null
  if (currentWsId === workspace_id) {
    switchedTo = allMemberships?.find(m => m.workspace_id !== workspace_id)?.workspace_id || null
  }

  const res = NextResponse.json({ success: true, switched_to: switchedTo })
  if (switchedTo) {
    res.cookies.set('selected_workspace_id', switchedTo, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
    })
  }
  return res
}
