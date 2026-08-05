import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess, firstAccessibleRoute } from '@/lib/jabatan-access'
import BudgetModule from './BudgetModule'

export default async function BudgetPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  if (!canAccess(role, jabatan, 'budget')) redirect(firstAccessibleRoute(role, jabatan))

  const { data: wsData } = await supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const brandType = (wsData?.brand_type as string | null) ?? 'creator'
  const isAffiliate = brandType === 'affiliate'

  const { data: transactions } = await supabase
    .from('kf_transactions').select('*')
    .eq('workspace_id', wsId)
    .order('tanggal', { ascending: false })

  return <BudgetModule initialTx={transactions || []} workspaceId={wsId} isAffiliate={isAffiliate} />
}
