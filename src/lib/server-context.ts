import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspaceId } from '@/lib/workspace'

// getSession() reads from cookie without network call — works with internal Supabase URL
// getUser() makes HTTP request to verify JWT which fails with localhost issuer mismatch
export const getServerContext = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, session.user.id)
  if (!wsId) redirect('/login')

  return { supabase, user: session.user, wsId }
})
