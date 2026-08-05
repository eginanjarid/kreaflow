import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!OPENROUTER_KEY) {
    return NextResponse.json({ error: 'AI key belum dikonfigurasi' }, { status: 503 })
  }

  const { prompt, profile } = await req.json()

  let systemPrompt = ''
  let userMessage = ''

  if (prompt === 'niche-hunt') {
    systemPrompt = `Kamu adalah AI konsultan niche content creator Indonesia. Analisis input dari user dan berikan rekomendasi niche yang spesifik dan relevan.`
    userMessage = `Berdasarkan data berikut, berikan rekomendasi:
- Yang disukai: ${profile.suka}
- Yang bisa dilakukan: ${profile.bisa}
- Yang dibutuhkan orang: ${profile.dibutuhkan}
- Peluang penghasilan: ${profile.peluang}

Jawab HANYA dalam format JSON:
{"result": ["<niche>", "<kategori>", "<micro_niche>", "<nama_akun_rekomendasi>"]}`
  } else if (prompt === 'origin-story') {
    systemPrompt = `Kamu adalah storyteller brand Indonesia. Buat premis brand story yang menarik dan autentik.`
    userMessage = `Buat premis brand story berdasarkan:
- Kelebihan: ${profile.kelebihan}
- Kelemahan: ${profile.kelemahan}
- Peluang: ${profile.peluang_brand}
- Tantangan: ${profile.tantangan}

Jawab HANYA dalam format JSON:
{"result": ["<premis brand story 3-4 kalimat yang powerful>"]}`
  } else if (prompt === 'bio-studio') {
    systemPrompt = `Kamu adalah copywriter sosial media Indonesia. Buat bio yang menarik, singkat, dan sesuai karakter tiap platform.`
    userMessage = `Buat bio untuk semua platform berdasarkan:
- Niche: ${profile.niche}
- Micro-niche: ${profile.micro_niche}
- Tone of Voice: ${profile.tone_of_voice}
- Target Audiens: ${profile.target_audiens}
- Tujuan: ${profile.tujuan_konten}

Jawab HANYA dalam format JSON:
{"result": ["<bio TikTok max 80 char>", "<bio Instagram max 150 char>", "<bio YouTube About max 200 char>", "<bio LinkedIn max 200 char>", "<bio Facebook max 255 char>"]}`
  } else if (prompt === 'content-pillars') {
    systemPrompt = `Kamu adalah content strategist Indonesia. Buat pilar konten yang relevan dengan niche dan audiens.`
    userMessage = `Buat 5-7 content pillars berdasarkan:
- Niche: ${profile.niche}
- Platform: ${profile.platform_utama}
- Target Audiens: ${profile.target_audiens}
- Tujuan Konten: ${profile.tujuan_konten}
- Tone: ${profile.tone_of_voice}

Jawab HANYA dalam format JSON:
{"pillars": [{"nama": "<nama pillar>", "hashtag_set": "#tag1 #tag2 #tag3 #tag4 #tag5"}, ...]}`
  } else {
    return NextResponse.json({ error: 'Invalid prompt type' }, { status: 400 })
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
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

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 })
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) return NextResponse.json({ error: 'No response from AI' }, { status: 500 })

  try {
    const parsed = JSON.parse(content)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response', raw: content }, { status: 500 })
  }
}
