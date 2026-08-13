import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { isSuperAdmin } from '@/lib/super-admins'

export type PromoLink = {
  id: string
  token: string
  label: string
  plan: string
  max_uses: number | null
  claimed_emails: string[]
  active: boolean
  starts_at: string | null
  expires_at: string | null
  value: number | null
  created_at: string
}

const SETTINGS_KEY = 'promo_links'

function adminClient() {
  return createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return (await isSuperAdmin(user.email!)) ? user : null
}

async function loadLinks(admin: ReturnType<typeof adminClient>): Promise<PromoLink[]> {
  const { data } = await admin.from('kf_app_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  return (data?.value as PromoLink[]) || []
}

async function saveLinks(admin: ReturnType<typeof adminClient>, links: PromoLink[]) {
  await admin.from('kf_app_settings').upsert(
    { key: SETTINGS_KEY, value: links, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// GET — list all promo links
export async function GET() {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const admin = adminClient()
  const links = await loadLinks(admin)
  return NextResponse.json({ links })
}

// POST — create new promo link
export async function POST(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { token, label, plan = 'basic', max_uses, starts_at, expires_at, value } = await req.json()

  const admin = adminClient()
  const links = await loadLinks(admin)

  const finalToken = (token || generateToken()).toUpperCase().replace(/\s/g, '')
  if (links.find(l => l.token === finalToken)) {
    return NextResponse.json({ error: 'Token sudah dipakai, coba token lain' }, { status: 400 })
  }

  const newLink: PromoLink = {
    id: crypto.randomUUID(),
    token: finalToken,
    label: label || finalToken,
    plan,
    max_uses: max_uses ? parseInt(max_uses) : null,
    claimed_emails: [],
    active: true,
    starts_at: starts_at || null,
    expires_at: expires_at || null,
    value: value ? parseInt(value) : null,
    created_at: new Date().toISOString(),
  }

  links.unshift(newLink)
  await saveLinks(admin, links)

  return NextResponse.json({ success: true, link: newLink })
}

// PATCH — toggle active atau update link
export async function PATCH(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, active, max_uses, starts_at, expires_at } = await req.json()
  const admin = adminClient()
  const links = await loadLinks(admin)

  const idx = links.findIndex(l => l.id === id)
  if (idx === -1) return NextResponse.json({ error: 'Link tidak ditemukan' }, { status: 404 })

  if (typeof active === 'boolean') links[idx].active = active
  if (max_uses !== undefined) links[idx].max_uses = max_uses ? parseInt(max_uses) : null
  if (starts_at !== undefined) links[idx].starts_at = starts_at || null
  if (expires_at !== undefined) links[idx].expires_at = expires_at || null

  await saveLinks(admin, links)
  return NextResponse.json({ success: true })
}

// DELETE — hapus promo link
export async function DELETE(req: NextRequest) {
  const caller = await requireSuperAdmin()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await req.json()
  const admin = adminClient()
  const links = await loadLinks(admin)
  await saveLinks(admin, links.filter(l => l.id !== id))
  return NextResponse.json({ success: true })
}
