import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import LandingContent from './LandingContent'
import { fetchPricingConfig } from '@/lib/pricing'

export default async function LandingPage() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/sprints')
  } catch { /* expired/invalid token — stay on landing */ }

  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const pricing = await fetchPricingConfig(admin)

  return <LandingContent pricing={pricing} />
}
