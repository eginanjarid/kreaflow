import { createClient as createAdmin } from '@supabase/supabase-js'

export const GOD_ADMIN = 'eginanjarism@gmail.com'

export async function isSuperAdmin(email: string): Promise<boolean> {
  if (email === GOD_ADMIN) return true
  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await admin.from('kf_super_admins').select('email').eq('email', email).maybeSingle()
  return !!data
}

export function isGodAdmin(email: string): boolean {
  return email === GOD_ADMIN
}
