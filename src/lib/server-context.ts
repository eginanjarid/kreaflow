import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspaceId } from '@/lib/workspace'

// Cached per-request: layout + page share one result, no duplicate DB calls
export const getServerContext = cache(async () => {
  const { appendFileSync } = require('fs')
  appendFileSync('/tmp/kreaflow-debug.log', `[${new Date().toISOString()}] getServerContext called\n`)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { appendFileSync('/tmp/kreaflow-debug.log', '[getServerContext] no user → redirect\n'); redirect('/login') }

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
