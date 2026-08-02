import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspaceId } from '@/lib/workspace'

const TIERS = {
  starter: { amount: 99000, label: 'KreaFlow Starter — 1 Workspace', maxWorkspaces: 1 },
  pro:     { amount: 199000, label: 'KreaFlow Pro — 4 Workspace', maxWorkspaces: 4 },
  agency:  { amount: 399000, label: 'KreaFlow Agency — 10 Workspace', maxWorkspaces: 10 },
  addon:   { amount: 49000, label: 'KreaFlow Add-on — +1 Workspace', maxWorkspaces: 1 },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const tier = (body.tier as string) || 'starter'
    if (!TIERS[tier as keyof typeof TIERS]) {
      return NextResponse.json({ error: 'Tier tidak valid' }, { status: 400 })
    }

    const wsId = await resolveWorkspaceId(supabase, user.id)
    if (!wsId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: ws } = await supabase.from('kf_workspaces').select('plan, name').eq('id', wsId).single()

    // For addon, user must already have lifetime
    if (tier === 'addon' && ws?.plan !== 'lifetime') {
      return NextResponse.json({ error: 'Add-on hanya untuk akun yang sudah aktif' }, { status: 400 })
    }

    const cfg = TIERS[tier as keyof typeof TIERS]
    const externalId = `kreaflow-${tier}-${wsId}-${Date.now()}`
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
        amount: cfg.amount,
        description: cfg.label,
        invoice_duration: 86400,
        customer: { email: user.email, given_names: userName },
        success_redirect_url: `${appUrl}/payment/success`,
        failure_redirect_url: `${appUrl}/upgrade?failed=1`,
        currency: 'IDR',
        items: [{ name: cfg.label, quantity: 1, price: cfg.amount, category: 'Software' }],
        fees: [],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Xendit error:', err)
      return NextResponse.json({ error: 'Gagal membuat invoice' }, { status: 500 })
    }

    const invoice = await response.json()
    return NextResponse.json({ invoice_url: invoice.invoice_url, id: invoice.id })
  } catch (e) {
    console.error('create-invoice error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
