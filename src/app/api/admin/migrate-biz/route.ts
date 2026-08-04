import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isGodAdmin } from '@/lib/super-admins'

// One-time migration: add biz_* columns to kf_brand_profiles
// Hit GET /api/admin/migrate-biz while logged in as god admin
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isGodAdmin(user.email!)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if column already exists by trying to select it
  const { error: checkErr } = await admin
    .from('kf_brand_profiles')
    .select('biz_nama_brand')
    .limit(1)

  if (!checkErr) {
    return NextResponse.json({ ok: true, message: 'Columns already exist — nothing to do.' })
  }

  // Column missing — run migration via RPC if available
  const { error: rpcErr } = await admin.rpc('exec_sql', {
    sql: `
      ALTER TABLE kf_brand_profiles
        ADD COLUMN IF NOT EXISTS biz_nama_brand TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_kategori TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_tagline TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_usp TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_visi TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_misi TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_target_pasar TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_produk_unggulan TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_kompetitor TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_keunggulan TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_platform_konten TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_tipe_konten TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_tone TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS biz_bio_options JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS biz_cta TEXT DEFAULT '';
    `
  })

  if (rpcErr) {
    return NextResponse.json({
      ok: false,
      error: rpcErr.message,
      hint: 'SSH to VPS and run the SQL manually. See response body for the SQL.',
      sql: `ALTER TABLE kf_brand_profiles ADD COLUMN IF NOT EXISTS biz_nama_brand TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_kategori TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_tagline TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_usp TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_visi TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_misi TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_target_pasar TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_produk_unggulan TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_kompetitor TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_keunggulan TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_platform_konten TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_tipe_konten TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_tone TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS biz_bio_options JSONB DEFAULT '[]'::jsonb, ADD COLUMN IF NOT EXISTS biz_cta TEXT DEFAULT '';`
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Migration complete!' })
}
