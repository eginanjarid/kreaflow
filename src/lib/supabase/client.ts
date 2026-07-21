import { createBrowserClient } from '@supabase/ssr'

// Browser requests go through Next.js rewrite proxy (/supabase → api-sf.tuasdigital.com)
// so the browser never directly contacts the self-hosted Supabase URL
const BROWSER_SUPABASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/supabase`
    : process.env.NEXT_PUBLIC_SUPABASE_URL!

export function createClient() {
  return createBrowserClient(
    BROWSER_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
