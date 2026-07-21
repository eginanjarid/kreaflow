import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return NextResponse.json({ error: 'AI key belum dikonfigurasi' }, { status: 503 })

  const { idea } = await req.json()

  const systemPrompt = `Kamu adalah copywriter konten sosial media Indonesia yang ahli dalam membuat konten yang viral dan convert. Buat konten yang natural, tidak kaku, dan sesuai bahasa target audiens Indonesia.`

  const userMessage = `Buat script konten untuk:
- Judul/Topik: ${idea.judul}
- Format: ${idea.format || 'Video Pendek'}
- Formula: ${idea.formula || 'Hook-Story-Offer'}
- Platform: ${(idea.platform || []).join(', ') || 'TikTok'}
- Produk: ${idea.product_id ? 'ada produk terkait' : 'tidak ada produk'}
- Prompt tambahan: ${idea.prompt_script || '-'}

Jawab dalam format JSON:
{
  "hook": "<pembuka 1-2 kalimat yang langsung menarik, bikin orang stop scroll>",
  "body": "<isi konten 3-5 paragraf pendek>",
  "cta": "<call to action yang jelas dan action-oriented>",
  "script": "<script lengkap siap baca/rekam, format visual-friendly dengan baris baru untuk setiap bagian>",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
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
    return NextResponse.json({ error: 'Parse error', raw: content }, { status: 500 })
  }
}
