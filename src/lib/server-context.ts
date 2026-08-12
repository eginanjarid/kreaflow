import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspaceId } from '@/lib/workspace'

// Cached per-request: layout + page share one result, no duplicate DB calls
export const getServerContext = cache(async () => {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // refresh_token_not_found or other auth errors — clear session
    redirect('/auth/logout')
  }
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')

  const { data: membership } = await supabase
    .from('kf_workspace_members')
    .select('role, jabatan')
    .eq('workspace_id', wsId)
    .eq('user_id', user.id)
    .maybeSingle()

  const role = (membership?.role as string) || 'owner'
  const jabatan = (membership?.jabatan as string) || ''

  return { supabase, user, wsId, role, jabatan }
})
