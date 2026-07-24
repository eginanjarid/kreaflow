import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import TasksModule from './TasksModule'

export default async function TasksPage() {
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

  const wsId = member.workspace_id

  const [{ data: tasks }, { data: products }, { data: brand }] = await Promise.all([
    supabase.from('kf_tasks').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }),
    supabase.from('kf_products').select('id,nama,platform_affiliate,kategori').eq('workspace_id', wsId).eq('is_active', true),
    supabase.from('kf_brand_profiles').select('affiliate_content_pillars,niche').eq('workspace_id', wsId).maybeSingle(),
  ])

  return (
    <Suspense>
      <TasksModule
        initialTasks={tasks || []}
        workspaceId={wsId}
        products={products || []}
        contentPillars={brand?.affiliate_content_pillars || ''}
      />
    </Suspense>
  )
}
