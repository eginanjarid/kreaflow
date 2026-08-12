import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get('folder')
  if (!folderId) return NextResponse.json({ error: 'folder required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Google Drive API key not configured' }, { status: 503 })

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
