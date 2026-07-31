import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await supabase
      .from('kf_workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    if (!member) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

    const { data: ws } = await supabase
      .from('kf_workspaces')
      .select('plan, name')
      .eq('id', member.workspace_id)
      .single()

    if (ws?.plan === 'lifetime') {
      return NextResponse.json({ error: 'Akun sudah aktif Lifetime' }, { status: 400 })
    }

    const externalId = `kreaflow-${member.workspace_id}-${Date.now()}`
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
        amount: 149000,
        description: 'KreaFlow Lifetime Deal — akses selamanya ke semua fitur',
        invoice_duration: 86400,
        customer: {
          email: user.email,
          given_names: userName,
        },
        success_redirect_url: `${appUrl}/payment/success`,
        failure_redirect_url: `${appUrl}/upgrade?failed=1`,
        currency: 'IDR',
        items: [{
          name: 'KreaFlow Lifetime Deal',
          quantity: 1,
          price: 149000,
          category: 'Software',
        }],
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
