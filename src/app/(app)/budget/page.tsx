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
  const { data: wsData } = await supabase.from('kf_workspaces').select('plan').eq('id', wsId).maybeSingle()
  if (wsData?.plan !== 'lifetime') redirect('/upgrade')

  const { data: transactions } = await supabase
    .from('kf_transactions').select('*')
    .eq('workspace_id', wsId)
    .order('tanggal', { ascending: false })

  return <BudgetModule initialTx={transactions || []} workspaceId={wsId} />
}
