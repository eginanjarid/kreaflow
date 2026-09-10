import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Semua nilai plan yang sudah bayar dan punya akses penuh
// 'trial' ikut disini karena selama masih aktif dia dapat akses penuh juga —
// expiry-nya di-enforce lewat downgrade proaktif (lihat getServerContext), bukan cek tanggal di sini
export const PAID_PLANS = ['lifetime', 'basic', 'pro', 'agency', 'bulanan', 'trial'] as const
export type PlanId = typeof PAID_PLANS[number]

// Lama trial gratis dalam hari
export const TRIAL_DAYS = 7

export function isPaidPlan(plan: string | null | undefined): boolean {
  return PAID_PLANS.includes((plan ?? '') as PlanId)
}

export function isPlanExpired(plan: string | null | undefined, expiresAt: string | null | undefined): boolean {
  if (plan !== 'bulanan') return false
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// Label yang ditampilkan ke user berdasarkan plan id
export const PLAN_LABELS: Record<string, string> = {
  lifetime: 'Lifetime',
  basic:    'Basic Lifetime',
  pro:      'Pro Lifetime',
  agency:   'Agency Lifetime',
  bulanan:  'Bulanan',
  trial:    'Trial',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveWorkspaceId(supabase: any, userId: string): Promise<string | null> {
  const { data: rows } = await supabase
    .from('kf_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (!rows?.length) return null

  const cookieStore = await cookies()
  const cookieWsId = cookieStore.get('selected_workspace_id')?.value
  if (cookieWsId && rows.some((r: { workspace_id: string }) => r.workspace_id === cookieWsId)) {
    return cookieWsId
  }

  if (rows.length === 1) return rows[0].workspace_id as string
  const wsIds = rows.map((r: { workspace_id: string }) => r.workspace_id)
  const { data: wsData } = await supabase.from('kf_workspaces').select('id, plan').in('id', wsIds)
  // Pilih workspace lifetime terlebih dahulu (bukan bulanan)
  const preferredId = wsData?.find((w: { id: string; plan: string }) =>
    ['lifetime', 'basic', 'pro', 'agency'].includes(w.plan)
  )?.id
  return preferredId || rows[0].workspace_id as string
}

export async function getWorkspace() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) redirect('/login')

  return { supabase, user, wsId }
}

export async function getWorkspaceWithPlanGuard() {
  const { supabase, user, wsId } = await getWorkspace()

  const { data: ws } = await supabase
    .from('kf_workspaces')
    .select('plan, plan_expires_at')
    .eq('id', wsId)
    .maybeSingle()

  if (!isPaidPlan(ws?.plan) || isPlanExpired(ws?.plan, ws?.plan_expires_at)) redirect('/upgrade')

  return { supabase, user, wsId }
}

export async function getWorkspaceWithBrandGuard() {
  const { supabase, user, wsId } = await getWorkspaceWithPlanGuard()

  const [{ data: wsInfo }, { data: brand }] = await Promise.all([
    supabase.from('kf_workspaces').select('brand_type').eq('id', wsId).maybeSingle(),
    supabase.from('kf_brand_profiles').select('niche, affiliate_micro_niche, biz_nama_brand, biz_kategori').eq('workspace_id', wsId).maybeSingle(),
  ])

  const brandIncomplete = wsInfo?.brand_type === 'business'
    ? (!brand?.biz_nama_brand && !brand?.biz_kategori)
    : (!brand?.niche && !brand?.affiliate_micro_niche)
  if (brandIncomplete) redirect('/brand?setup=1')

  return { supabase, user, wsId }
}
