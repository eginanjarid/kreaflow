import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveWorkspaceId } from '@/lib/workspace'

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folder')
  if (!folderId) return NextResponse.json({ error: 'folder required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wsId = await resolveWorkspaceId(supabase, user.id)
  if (!wsId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { data: ws } = await supabase.from('kf_workspaces').select('google_drive_api_key').eq('id', wsId).single()
  const apiKey = (ws?.google_drive_api_key as string | null) || process.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Google Drive API key belum dikonfigurasi. Buka Settings → Integrasi untuk menambahkan.' }, { status: 503 })

  const q = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`)
  const fields = encodeURIComponent('files(id,name,mimeType)')
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=name&key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ error: err.error?.message || 'Drive API error' }, { status: res.status })
  }

  const data = await res.json()
  const files: { id: string; name: string }[] = data.files || []

  return NextResponse.json({
    files: files.map(f => ({
      id: f.id,
      name: f.name,
      url: `https://drive.google.com/file/d/${f.id}/view`,
      thumbnail: `https://drive.google.com/thumbnail?id=${f.id}&sz=w800`,
    }))
  })
}
