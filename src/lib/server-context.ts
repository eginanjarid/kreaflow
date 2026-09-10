import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
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

  // Trial expiry: downgrade proaktif di satu titik terpusat ini (dipanggil semua
  // halaman (app)/*) supaya isPaidPlan(wsData?.plan) di tiap page.tsx otomatis
  // benar tanpa perlu diubah satu-satu — lihat [[feedback-kreaflow-page-guards]]
  const { data: trialCheck } = await supabase
    .from('kf_workspaces')
    .select('plan, trial_expires_at')
    .eq('id', wsId)
    .maybeSingle()

  if (trialCheck?.plan === 'trial' && trialCheck.trial_expires_at && new Date(trialCheck.trial_expires_at) < new Date()) {
    const admin = createAdmin(
      process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('kf_workspaces').update({ plan: 'free' }).eq('id', wsId)
  }

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
