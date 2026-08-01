import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import BrandModule from './BrandModule'

export default async function BrandPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')

  const { data: wsCheck } = await supabase.from('kf_workspaces').select('plan, modes, brand_type').eq('id', wsId).single()
  if (wsCheck?.plan !== 'lifetime') redirect('/upgrade')

  const [{ data: profile }, { data: akun }] = await Promise.all([
    supabase.from('kf_brand_profiles').select('*').eq('workspace_id', wsId).maybeSingle(),
    supabase.from('kf_accounts').select('id, platform, handle, nama').eq('workspace_id', wsId).order('created_at'),
  ])

  // Derive modes from brand_type (source of truth) — don't trust stale modes column
  const brandType = (wsCheck?.brand_type as string | null) ?? 'creator'
  const modes = brandType === 'affiliate' ? ['affiliate'] : ['creator']
  const { setup } = await searchParams

  return (
    <>
      {setup === '1' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 18px', margin: '16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
            Lengkapi Brand terlebih dahulu — isi minimal Niche untuk mulai menggunakan Sprint, Plan, Studio, dan Calendar.
          </span>
        </div>
      )}
      <BrandModule
        initialProfile={profile}
        workspaceId={wsId}
        modes={modes}
        initialAkun={(akun || []).map(a => ({ id: a.id as string, platform: a.platform as string, handle: a.handle as string, nama: a.nama as string }))}
      />
    </>
  )
}
