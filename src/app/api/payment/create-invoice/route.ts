import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { resolveWorkspaceId } from '@/lib/workspace'
import { fetchPricingConfig } from '@/lib/pricing'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const tierId = (body.tier as string) || 'pro'
    const couponCode = ((body.couponCode as string) || '').toUpperCase().trim()

    const admin = createAdmin(
      process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const pricing = await fetchPricingConfig(admin)

    // Build tier map from DB pricing
    const tierMap: Record<string, { amount: number; label: string; plan: string }> = {}
    for (const t of pricing.tiers) {
      tierMap[t.id] = {
        amount: t.price,
        label: `KreaFlow ${t.name} — ${t.maxWorkspaces} Workspace`,
        plan: t.isMonthly ? 'monthly' : 'lifetime',
      }
    }
    tierMap['addon'] = { amount: pricing.addonWs, label: 'KreaFlow Add-on — +1 Workspace', plan: 'addon' }
    // Legacy tier ID compatibility
    if (!tierMap['starter'] && tierMap['bulanan']) tierMap['starter'] = tierMap['bulanan']

    const tierCfg = tierMap[tierId]
    if (!tierCfg) return NextResponse.json({ error: 'Tier tidak valid' }, { status: 400 })

    const wsId = await resolveWorkspaceId(supabase, user.id)
    if (!wsId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: ws } = await supabase.from('kf_workspaces').select('plan, name').eq('id', wsId).single()
    if (tierId === 'addon' && ws?.plan !== 'lifetime') {
      return NextResponse.json({ error: 'Add-on hanya untuk akun yang sudah aktif' }, { status: 400 })
    }

    // Validate coupon
    let discountAmount = 0
    let finalCouponCode: string | null = null

    if (couponCode) {
      const { data: coupon } = await admin.from('kf_coupons')
        .select('*').eq('code', couponCode).eq('is_active', true).single()

      const valid = coupon
        && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
        && (!coupon.max_uses || coupon.used_count < coupon.max_uses)
        && (!coupon.applicable_tiers || coupon.applicable_tiers.includes(tierId))

      if (valid) {
        discountAmount = coupon.type === 'percent'
          ? Math.floor(tierCfg.amount * coupon.value / 100)
          : Math.min(coupon.value as number, tierCfg.amount - 1000)
        finalCouponCode = couponCode
      }
    }

    const finalAmount = Math.max(1000, tierCfg.amount - discountAmount)
    const externalId = `kreaflow-${tierId}-${wsId}-${Date.now()}`
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
    const userName = (user.user_metadata?.nama as string) || user.email || 'KreaFlow User'

    if (!process.env.XENDIT_SECRET_KEY) {
      return NextResponse.json({ error: 'Pembayaran belum aktif. Hubungi admin di hello@kreaflow.id untuk aktivasi manual.' }, { status: 503 })
    }

    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: finalAmount,
        description: tierCfg.label + (finalCouponCode ? ` [${finalCouponCode}]` : ''),
        invoice_duration: 86400,
        customer: { email: user.email, given_names: userName },
        success_redirect_url: `${appUrl}/payment/success`,
        failure_redirect_url: `${appUrl}/upgrade?failed=1`,
        currency: 'IDR',
        items: [{ name: tierCfg.label, quantity: 1, price: finalAmount, category: 'Software' }],
        fees: [],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Xendit error:', err)
      return NextResponse.json({ error: 'Gagal membuat invoice' }, { status: 500 })
    }

    const invoice = await response.json()

    // Log pending transaction
    await admin.from('kf_transactions').insert({
      external_id: externalId,
      workspace_id: wsId,
      user_email: user.email,
      tier: tierId,
      amount_original: tierCfg.amount,
      amount_paid: finalAmount,
      coupon_code: finalCouponCode,
      discount_amount: discountAmount,
      status: 'pending',
      xendit_invoice_id: invoice.id,
    })

    return NextResponse.json({ invoice_url: invoice.invoice_url, id: invoice.id })
  } catch (e) {
    console.error('create-invoice error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
