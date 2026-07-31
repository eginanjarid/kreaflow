import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BrandModule from './BrandModule'

export default async function BrandPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
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

  const { data: wsCheck } = await supabase.from('kf_workspaces').select('plan, modes').eq('id', member.workspace_id).single()
  if (wsCheck?.plan !== 'lifetime') redirect('/upgrade')

  const [{ data: profile }, { data: akun }] = await Promise.all([
    supabase.from('kf_brand_profiles').select('*').eq('workspace_id', member.workspace_id).maybeSingle(),
    supabase.from('kf_accounts').select('id, platform, handle, nama').eq('workspace_id', member.workspace_id).order('created_at'),
  ])

  const modes = (wsCheck?.modes as string[] | null) ?? ['creator']
  const { setup } = await searchParams

  return (
    <>
      {setup === '1' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 18px', margin: '16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1rem' }}>⚡</span>
          <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
            Lengkapi Brand terlebih dahulu — isi minimal Niche untuk mulai menggunakan Sprint, Plan, Studio, dan Calendar.
          </span>
        </div>
      )}
      <BrandModule
        initialProfile={profile}
        workspaceId={member.workspace_id}
        modes={modes}
        initialAkun={(akun || []).map(a => ({ id: a.id as string, platform: a.platform as string, handle: a.handle as string, nama: a.nama as string }))}
      />
    </>
  )
}
