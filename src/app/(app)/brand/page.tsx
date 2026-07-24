import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BrandModule from './BrandModule'

export default async function BrandPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) redirect('/login')

  const [{ data: profile }, { data: workspace }, { data: akun }] = await Promise.all([
    supabase.from('kf_brand_profiles').select('*').eq('workspace_id', member.workspace_id).maybeSingle(),
    supabase.from('kf_workspaces').select('modes').eq('id', member.workspace_id).single(),
    supabase.from('kf_accounts').select('id, platform, handle, nama').eq('workspace_id', member.workspace_id).order('created_at'),
  ])

  const modes = (workspace?.modes as string[] | null) ?? ['creator']

  return (
    <BrandModule
      initialProfile={profile}
      workspaceId={member.workspace_id}
      modes={modes}
      initialAkun={(akun || []).map(a => ({ id: a.id as string, platform: a.platform as string, handle: a.handle as string, nama: a.nama as string }))}
    />
  )
}
