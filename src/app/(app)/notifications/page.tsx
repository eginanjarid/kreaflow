import { isPaidPlan } from '@/lib/workspace'
import { redirect } from 'next/navigation'
import { getServerContext } from '@/lib/server-context'
import { canAccess } from '@/lib/jabatan-access'
import NotificationsModule from './NotificationsModule'

const JABATAN_NOTIF_TYPES: Record<string, string[]> = {
  'Copywriter':   ['naskah', 'deadline'],
  'Videografer':  ['produksi', 'deadline'],
  'Editor':       ['produksi', 'deadline'],
  'Desainer':     ['produksi', 'deadline'],
  'Admin Sosmed': ['schedule', 'deadline'],
  'Social Media Specialist': ['schedule', 'deadline'],
  'Art Director': ['naskah', 'produksi', 'deadline'],
}

export default async function NotificationsPage() {
  const { supabase, wsId, role, jabatan } = await getServerContext()
  const { data: wsData } = await supabase.from('kf_workspaces').select('plan, brand_type').eq('id', wsId).maybeSingle()
  if (!isPaidPlan(wsData?.plan)) redirect('/upgrade')

  const { data: brand } = await supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle()
  const brandIncomplete = wsData?.brand_type === 'business' ? (!brand?.biz_nama_brand && !brand?.biz_kategori) : (!brand?.niche && !brand?.affiliate_micro_niche)
  if (brandIncomplete && canAccess(role, jabatan, 'brand')) redirect('/brand?setup=1')

  const allowedTypes = (role === 'owner' || role === 'admin') ? null : (JABATAN_NOTIF_TYPES[jabatan] ?? null)

  let q = supabase
    .from('kf_notifications')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (allowedTypes) q = q.in('type', allowedTypes)

  const { data: notifications } = await q

  return <NotificationsModule initialNotifs={notifications || []} workspaceId={wsId} />
}
