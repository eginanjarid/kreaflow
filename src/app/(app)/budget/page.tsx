import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetModule from './BudgetModule'

export default async function BudgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('kf_workspace_members').select('workspace_id')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(1).single()
  if (!member) redirect('/login')

  const { data: transactions } = await supabase
    .from('kf_transactions').select('*')
    .eq('workspace_id', member.workspace_id)
    .order('tanggal', { ascending: false })

  return <BudgetModule initialTx={transactions || []} workspaceId={member.workspace_id} />
}
