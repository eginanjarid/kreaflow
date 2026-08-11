import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.OPENROUTER_API_KEY
  if (!key) return NextResponse.json({ error: 'AI key belum dikonfigurasi' }, { status: 503 })

  const { judul, notes, platform } = await req.json()
  if (!judul) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })

  const platformStr = Array.isArray(platform) ? platform.join(', ') : (platform || 'TikTok')

  const prompt = `Kamu adalah content strategist Indonesia yang ahli membuat konten viral di media sosial.

Dari ide kasar berikut, kembangkan menjadi 4 angle konten yang berbeda dan siap diproduksi:

Ide: "${judul}"
Catatan: ${notes || '-'}
Platform target: ${platformStr}

Setiap angle harus punya sudut pandang yang BERBEDA (misal: edukasi, hiburan, kontroversi, personal story, behind the scenes, dll).

Format JSON:
{
  "angles": [
    {
      "judul": "<judul konten yang menarik>",
      "hook": "<kalimat pembuka yang bikin stop scroll, 1-2 kalimat>",
      "angle_type": "<tipe: Edukasi/Hiburan/Kontroversi/Personal Story/Tutorial/Inspirasi/dll>"
    }
  ]
}`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return NextResponse.json({ error: 'No response' }, { status: 500 })

  try {
    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }
}
