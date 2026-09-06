export type PricingTier = {
  id: string
  name: string
  price: number
  maxWorkspaces: number
  isMonthly: boolean
  highlight: boolean
  badge: string | null
  features: string[]
  checkout_url?: string
}

export type PricingConfig = {
  tiers: PricingTier[]
  addonWs: number
  addonSchedule: number
}

export const DEFAULT_PRICING: PricingConfig = {
  tiers: [
    {
      id: 'pro',
      name: 'Pro Lifetime',
      price: 199000,
      maxWorkspaces: 3,
      isMonthly: false,
      highlight: false,
      badge: null,
      features: [
        '3 Workspace / Brand',
        '1 owner + 5 anggota tim',
        'Semua modul lengkap',
        'Sprint, Plan, Library, Studio, Calendar',
        'Tracker, Budget, Insights',
        'Unlimited konten & jadwal',
        'Update fitur selamanya',
      ],
    },
  ],
  addonWs: 49000,
  addonSchedule: 49000,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchPricingConfig(admin: any): Promise<PricingConfig> {
  try {
    const { data } = await admin.from('kf_app_settings').select('value').eq('key', 'pricing').single()
    if (data?.value) return data.value as PricingConfig
  } catch {
    // table may not exist yet — fall back to defaults
  }
  return DEFAULT_PRICING
}
