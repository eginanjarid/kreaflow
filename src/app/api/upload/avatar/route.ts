import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'File wajib diisi' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Ukuran maksimal 2MB' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'png'
  const path = `avatars/${user.id}-${Date.now()}.${ext}`

  const supabase = createServiceClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('branding')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('branding').getPublicUrl(path)
  const internalUrl = process.env.SUPABASE_INTERNAL_URL
  const publicUrl = internalUrl
    ? data.publicUrl.replace(internalUrl, process.env.NEXT_PUBLIC_SUPABASE_URL!)
    : data.publicUrl
  return NextResponse.json({ url: publicUrl })
}
