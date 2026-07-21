import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { nama, email, password, workspace } = await req.json()
    if (!nama || !email || !password || !workspace) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { nama },
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const userId = authData.user.id

    // Create workspace
    const { data: ws, error: wsError } = await supabase
      .from('kf_workspaces')
      .insert({ name: workspace, owner_id: userId, plan: 'free' })
      .select('id').single()
    if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 })

    // Add as owner member
    await supabase.from('kf_workspace_members').insert({
      workspace_id: ws.id, user_id: userId, role: 'owner'
    })

    return NextResponse.json({ success: true, workspace_id: ws.id })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
