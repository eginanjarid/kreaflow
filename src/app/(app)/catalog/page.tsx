import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import CatalogModule from './CatalogModule'

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')
  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const [{ data: products }, { data: workspace }, { data: brandProfile }] = await Promise.all([
    supabase.from('kf_products').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('kf_workspaces').select('brand_type').eq('id', wsId).single(),
    supabase.from('kf_brand_profiles').select('affiliate_kategori_fokus, affiliate_platforms').eq('workspace_id', wsId).maybeSingle(),
  ])

  const brandType = (workspace?.brand_type as string | null) ?? 'creator'
  const modes = brandType === 'affiliate' ? ['affiliate'] : ['creator']
  const { setup } = await searchParams

  return (
    <>
      {setup === '1' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 18px', margin: '16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
            Tambahkan minimal 1 produk di Catalog terlebih dahulu sebelum menggunakan Sprint, Plan, Studio, dan Calendar.
          </span>
        </div>
      )}
      <CatalogModule
        initialProducts={products || []}
        workspaceId={wsId}
        modes={modes}
        affiliateKategori={(brandProfile?.affiliate_kategori_fokus as string[] | null) || []}
        affiliatePlatforms={(brandProfile?.affiliate_platforms as string[] | null) || []}
      />
    </>
  )
}
