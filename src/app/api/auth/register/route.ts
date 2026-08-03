import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BRAND_TYPE_MODES: Record<string, string[]> = {
  creator: ['creator'],
  affiliate: ['affiliate'],
  business: ['creator'],
}

export async function POST(req: NextRequest) {
  try {
    const { nama, email, password, workspace, brand_type = 'creator' } = await req.json()
    if (!nama || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password,
      user_metadata: { nama },
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const userId = authData.user.id

    // Kalau invite flow (workspace tidak dikirim), skip buat workspace
    if (!workspace) {
      return NextResponse.json({ success: true })
    }

    const modes = BRAND_TYPE_MODES[brand_type] || ['creator']

    const { data: ws, error: wsError } = await supabase
      .from('kf_workspaces')
      .insert({ name: workspace, owner_id: userId, plan: 'free', brand_type, modes })
      .select('id').single()
    if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 })

    await supabase.from('kf_workspace_members').insert({
      workspace_id: ws.id, user_id: userId, role: 'owner'
    })

    return NextResponse.json({ success: true, workspace_id: ws.id })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
