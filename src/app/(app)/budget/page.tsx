import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resolveWorkspaceId } from '@/lib/workspace'
import BudgetModule from './BudgetModule'

export default async function BudgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')
  const [{ data: wsData }, { data: wsType }] = await Promise.all([
    supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle(),
    supabase.from('kf_workspaces').select('brand_type').eq('id', wsId).single(),
  ])
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const brandType = (wsType?.brand_type as string | null) ?? 'creator'
  const isAffiliate = brandType === 'affiliate'

  const { data: transactions } = await supabase
    .from('kf_transactions').select('*')
    .eq('workspace_id', wsId)
    .order('tanggal', { ascending: false })

  return <BudgetModule initialTx={transactions || []} workspaceId={wsId} isAffiliate={isAffiliate} />
}
