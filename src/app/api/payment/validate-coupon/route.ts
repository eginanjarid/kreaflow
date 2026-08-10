import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code, tier, originalAmount } = await req.json()
  if (!code || !tier || !originalAmount) return NextResponse.json({ valid: false, error: 'Data tidak lengkap' })

  const admin = createAdmin(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: coupon } = await admin.from('kf_coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!coupon) return NextResponse.json({ valid: false, error: 'Kupon tidak ditemukan atau tidak aktif' })
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return NextResponse.json({ valid: false, error: 'Kupon sudah kadaluarsa' })
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return NextResponse.json({ valid: false, error: 'Kupon sudah habis digunakan' })
  if (coupon.applicable_tiers && !coupon.applicable_tiers.includes(tier)) return NextResponse.json({ valid: false, error: 'Kupon tidak berlaku untuk paket ini' })

  let discountAmount = 0
  if (coupon.type === 'percent') {
    discountAmount = Math.floor(originalAmount * coupon.value / 100)
  } else {
    discountAmount = Math.min(coupon.value, originalAmount - 1000)
  }

  const finalAmount = originalAmount - discountAmount

  return NextResponse.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
    discountAmount,
    finalAmount,
  })
}
