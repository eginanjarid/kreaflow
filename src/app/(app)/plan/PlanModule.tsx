'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STEP_ICON_MAP } from '@/components/ui/Icons'

const TIPE_KONTEN = ['Video Pendek', 'Reels', 'Carousel', 'Story', 'Live', 'Long Video', 'Thread']

type TaskSnap = { id: string; nama: string; due_date: string; percent_complete: number; priority: string }

type BrandSnap = {
  niche?: string; micro_niche?: string; premis?: string; tone_of_voice?: string
  target_audiens?: string; platform_utama?: string; affiliate_tipe?: string
  affiliate_kategori_fokus?: string[]; affiliate_positioning?: string
  affiliate_promo_style?: string; affiliate_content_pillars?: string; affiliate_micro_niche?: string
} | null

type Product = {
  id: string; nama: string; kategori?: string; tipe_produk?: string
  platform_affiliate?: string; harga_normal?: number
  komisi_tipe?: string; komisi_nilai?: number; deskripsi?: string
}

type NaskahForm = {
  platform: string; tipe_konten: string; pillar: string; hook_angle: string
  product_id: string; konteks: string; jumlah_varian: string
}

type AffNaskahForm = {
  product_id: string
  deskripsi_produk: string
  usp: string
  formula_copywriting: string
  niche_produk: string
  target_audiens: string
  gender: string
  target_durasi: string
  cta_style: string
  fokus_konversi: string
  visual_hook: string
  platform: string
  tipe_konten: string
  jumlah_varian: string
  konteks: string
}

const TABS_BASE = [
  { id: 'naskah', label: 'Naskah Generator' },
]

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

function SprintBanner({ tasks, productName }: { tasks: TaskSnap[]; productName: string }) {
  const sprintTasks = tasks
    .filter(t => t.nama.includes(' — ') && t.nama.endsWith('— ' + productName))
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
  if (sprintTasks.length === 0) return null

  const done = sprintTasks.filter(t => t.percent_complete === 100).length
  const total = sprintTasks.length
  const pct = Math.round((done / total) * 100)

  return (
    <div style={{ background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 10, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a73e8', letterSpacing: '0.05em' }}>SPRINT AKTIF — {productName}</span>
        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{done}/{total} selesai · {pct}%</span>
      </div>
      <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2, marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #1a73e8, #42a5f5)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {sprintTasks.map(t => {
          const rawStep = t.nama.split(' —')[0].trim()
          const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
          const p = t.percent_complete || 0
          const dot = p === 100 ? '●' : p > 0 ? '◑' : '○'
          const dotColor = p === 100 ? '#059669' : p > 0 ? '#d97706' : '#6b7280'
          const dateStr = t.due_date ? t.due_date.slice(5).replace('-', '/') : ''
          return (
            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#f3f4f6', border: 'none', color: '#6b7280' }}>
              <span style={{ color: dotColor }}>{dot}</span>
              <span>{stepName}</span>
              {dateStr && <span style={{ color: '#6b7280' }}>{dateStr}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

type SprintDraft = { id: string; judul: string; product_id: string; sprint_id: string }
type QueueItem = { id: string; judul: string; status: 'Draft' | 'Revisi'; product_id: string; sprint_id: string | null; sprint_nama: string | null; format: string | null; platform: string[]; assigned_naskah: string | null; script: string | null; tanggal_tayang: string | null; jam_tayang: string | null }

export default function PlanModule({ workspaceId, brandProfile, products, modes, tasks = [], queue = [], pillars = [] }: {
  workspaceId: string
  brandProfile: BrandSnap
  products: Product[]
  modes: string[]
  tasks?: TaskSnap[]
  queue?: QueueItem[]
  pillars?: { id: string; nama: string }[]
}) {
  const isAffiliate = modes.includes('affiliate')
  const TABS = TABS_BASE
  const [tab, setTab] = useState('naskah')

  // Derive sprintDrafts (for existing form-link logic) from queue
  const sprintDrafts: SprintDraft[] = queue
    .filter(q => q.status === 'Draft' && q.sprint_id)
    .map(q => ({ id: q.id, judul: q.judul, product_id: q.product_id, sprint_id: q.sprint_id! }))

  const [activeQueueId, setActiveQueueId] = useState<string | null>(null)
  const [localQueue, setLocalQueue] = useState<QueueItem[]>(queue)
  useEffect(() => { setLocalQueue(queue) }, [queue])
  const sprintLockedItem = activeQueueId ? localQueue.find(q => q.id === activeQueueId && q.sprint_id) ?? null : null

  function removeFromQueue(id: string | null) {
    if (!id) return
    setLocalQueue(prev => prev.filter(q => q.id !== id))
    setActiveQueueId(null)
  }

  // Naskah Generator state
  const emptyNaskah: NaskahForm = { platform: brandProfile?.platform_utama || 'TikTok', tipe_konten: 'Video Pendek', pillar: '', hook_angle: '', product_id: '', konteks: '', jumlah_varian: '3' }
  const [naskahMode, setNaskahMode] = useState<'creator' | 'affiliate'>(isAffiliate ? 'affiliate' : 'creator')
  const [naskahForm, setNaskahForm] = useState<NaskahForm>(emptyNaskah)
  const [aiModal, setAiModal] = useState<{ prompt: string; label?: string } | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)
  const [savedToLibrary, setSavedToLibrary] = useState(false)
  const [generatedNaskah, setGeneratedNaskah] = useState('')
  const naskahRef = useRef<HTMLTextAreaElement>(null)

  // Affiliate naskah state
  const emptyAffNaskah: AffNaskahForm = {
    product_id: '',
    deskripsi_produk: '',
    usp: '',
    formula_copywriting: 'AIDA',
    niche_produk: brandProfile?.affiliate_kategori_fokus?.[0] || '',
    target_audiens: 'Millennial (25-35)',
    gender: 'Semua',
    target_durasi: '30-40 detik (Optimal)',
    cta_style: 'Checkout Kiri Bawah',
    fokus_konversi: 'Benefit Only',
    visual_hook: 'Talking Head',
    platform: brandProfile?.platform_utama || 'TikTok',
    tipe_konten: 'Video Pendek',
    jumlah_varian: '3',
    konteks: '',
  }
  const [affForm, setAffForm] = useState<AffNaskahForm>(emptyAffNaskah)
  const [affLeftTab, setAffLeftTab] = useState<'produk' | 'config'>('produk')
  const [affAiModal, setAffAiModal] = useState<{ prompt: string; label?: string } | null>(null)
  const [affPromptCopied, setAffPromptCopied] = useState(false)
  const affNaskahRef = useRef<HTMLTextAreaElement>(null)
  const [affNaskah, setAffNaskah] = useState('')
  const [affSavedToLibrary, setAffSavedToLibrary] = useState(false)
  const [affProdSteps, setAffProdSteps] = useState<Record<string, boolean>>({})
  function toggleProdStep(id: string) { setAffProdSteps(prev => ({ ...prev, [id]: !prev[id] })) }

  const [sprintLinkModal, setSprintLinkModal] = useState<{
    draft: SprintDraft; naskah: string; judul: string; productId: string
    platform: string; tipe: string; mode: 'affiliate' | 'creator'
  } | null>(null)
  const [sprintLinkSaving, setSprintLinkSaving] = useState(false)

  function setNF(key: keyof NaskahForm, val: string) { setNaskahForm(f => ({ ...f, [key]: val })) }
  function setAFF(key: keyof AffNaskahForm, val: string) { setAffForm(f => ({ ...f, [key]: val })) }

  function selectQueueItem(item: QueueItem) {
    // Toggle deselect
    if (activeQueueId === item.id) { setActiveQueueId(null); return }
    setActiveQueueId(item.id)
    const pillarName = item.judul.split(' — ')[0]

    if (!isAffiliate || item.status === 'Revisi') {
      setNaskahMode('creator')
      setNF('pillar', pillarName)
      if (item.format) setNF('tipe_konten', item.format)
      if (item.platform.length > 0) setNF('platform', item.platform[0])
      if (item.product_id) setNF('product_id', item.product_id)
      if (item.status === 'Revisi' && item.script) {
        setGeneratedNaskah(`[REVISI — edit naskah lama di bawah ini]\n\n${item.script}`)
      } else if (item.status !== 'Revisi') {
        setGeneratedNaskah('')
      }
    } else {
      setNaskahMode('affiliate')
      if (item.product_id) {
        const prod = products.find(p => p.id === item.product_id)
        setAffForm(f => ({ ...f, product_id: item.product_id, deskripsi_produk: prod?.deskripsi || f.deskripsi_produk, niche_produk: prod?.kategori || f.niche_produk }))
      }
      if (item.format) setAFF('tipe_konten', item.format)
      if (item.platform.length > 0) setAFF('platform', item.platform[0])
      if ((item.status as string) === 'Revisi' && item.script) {
        setAffNaskah(`[REVISI — edit naskah lama di bawah ini]\n\n${item.script}`)
      } else if ((item.status as string) !== 'Revisi') {
        setAffNaskah('')
      }
    }
  }

  function buildNaskahPrompt(): string {
    const brand = brandProfile
    const niche = brand?.niche || '[belum diisi di Brand]'
    const premis = brand?.premis || '-'
    const tone = brand?.tone_of_voice || 'Friendly'
    const audiens = brand?.target_audiens || '-'
    const platform = naskahForm.platform
    const tipe = naskahForm.tipe_konten
    const pillar = naskahForm.pillar || '-'
    const hookAngle = naskahForm.hook_angle || '-'
    const konteks = naskahForm.konteks || '-'
    const selectedProduct = products.find(p => p.id === naskahForm.product_id)

    let productSection = ''
    if (selectedProduct) {
      productSection = `
PRODUK YANG DIPROMOSIKAN
Nama: ${selectedProduct.nama}
Kategori: ${selectedProduct.kategori || '-'}
Harga: Rp ${selectedProduct.harga_normal?.toLocaleString('id-ID') || '-'}
Platform affiliate: ${selectedProduct.platform_affiliate || '-'}
Komisi: ${selectedProduct.komisi_nilai}${selectedProduct.komisi_tipe === 'persen' ? '%' : ' (flat)'}
Deskripsi: ${selectedProduct.deskripsi || '-'}
`
    }

    const affiliateContext = isAffiliate && brand?.affiliate_tipe
      ? `\nTipe akun: ${brand.affiliate_tipe === 'store' ? 'Niche Store' : 'Personal Brand Affiliator'}\nPositioning: ${brand.affiliate_positioning || '-'}\nStyle promosi: ${brand.affiliate_promo_style || '-'}`
      : ''

    const varian = parseInt(naskahForm.jumlah_varian) || 3
    const isCarousel = tipe === 'Carousel'

    const brandBlock = `DATA BRAND
Niche: ${niche}
Premis: ${premis}
Tone of voice: ${tone}
Target audiens: ${audiens}${affiliateContext}

SPESIFIKASI KONTEN
Platform: ${platform}
Format: ${tipe}
Pillar konten: ${pillar}
Hook angle yang diinginkan: ${hookAngle}
Konteks tambahan: ${konteks}
${productSection}`

    if (isCarousel) {
      const slideCount = Math.max(varian, 4)
      return `Kamu adalah copywriter konten carousel media sosial Indonesia yang ahli membuat slide yang stop-scroll dan mudah di-swipe sampai habis.

Buat 1 carousel LENGKAP dengan ${slideCount} slide. Setiap slide harus ringkas (maks 15 kata headline, 2–3 kalimat copy) tapi powerful.

---

${brandBlock}
---

OUTPUT FORMAT — tulis persis seperti ini untuk SETIAP slide:

${'═'.repeat(50)}
SLIDE [N] — [FUNGSI SLIDE]
${'═'.repeat(50)}

📌 HEADLINE
[Teks utama slide — bold, singkat, langsung ke poin]

✍️ COPY
[2–3 kalimat pendukung — sesuai tone brand]

🎨 ARAHAN VISUAL
[Deskripsi desain: warna dominan, elemen grafis, mood, layout]

---

Struktur slide yang WAJIB diikuti:
• Slide 1 = HOOK — bikin orang berhenti scroll, timbulkan rasa penasaran
• Slide 2 hingga ${slideCount - 1} = ISI — poin per poin, satu poin satu slide
• Slide ${slideCount} = CTA — ajakan yang jelas dan natural${selectedProduct ? `, promosikan ${selectedProduct.nama} secara natural` : ''}

Setelah semua slide, tambahkan:

📝 CAPTION SIAP POSTING
[Caption dengan emoji sesuai tone + ajakan swipe — langsung bisa dipaste]

#️⃣ HASHTAG
[10–15 hashtag: mix niche + broad + trending ${platform}]

Tulis copy yang terasa natural, bukan template kaku. Bahasa sehari-hari Indonesia.`
    }

    return `Kamu adalah scriptwriter konten media sosial Indonesia yang spesialis membuat naskah dengan hook kuat, natural, dan convert.

Buat ${varian} varian naskah LENGKAP. Setiap varian harus BERBEDA secara hook, angle, dan pendekatan cerita — bukan parafrase.

---

${brandBlock}
---

OUTPUT FORMAT — tulis persis seperti ini untuk SETIAP varian:

${'═'.repeat(50)}
VARIAN [N] — [nama angle/hook]
${'═'.repeat(50)}

🎬 VISUAL HOOK (0:00–0:03)
[Deskripsi visual pembuka — apa yang terlihat di layar]

🗣️ HOOK VERBAL
[Kalimat pembuka yang diucapkan — harus bikin stop scroll]

📜 NASKAH LENGKAP
[Script dengan timestamp. Tulis persis seperti yang akan diucapkan/ditampilkan.${selectedProduct ? ' Sebutkan produk secara natural, bukan hard selling.' : ''}]

📣 CTA
[1 CTA yang natural untuk ${platform}]

📝 CAPTION SIAP POSTING
[Caption dengan emoji sesuai tone — langsung bisa dipaste]

#️⃣ HASHTAG
[10–15 hashtag: mix niche + broad + trending ${platform}]

---

Setelah semua varian, tambahkan:

💡 TIPS EKSEKUSI
2–3 tips teknis untuk ${platform} (durasi ideal, transisi, timing upload)

Tulis naskah yang terasa seperti manusia, bukan iklan. Bahasa sehari-hari Indonesia.`
  }

  function buildUSPPrompt(): string {
    const selectedProduct = products.find(p => p.id === affForm.product_id)
    const nama = selectedProduct?.nama || 'Produk'
    const deskripsi = affForm.deskripsi_produk || '[paste deskripsi produk]'
    const kategori = selectedProduct?.kategori || brandProfile?.affiliate_kategori_fokus?.join(', ') || '-'
    return `Kamu adalah product analyst yang spesialis menganalisis produk untuk keperluan konten affiliate Indonesia.

Analisis produk berikut dan berikan USP-nya saja.

---

PRODUK
Nama: ${nama}
Kategori: ${kategori}
Deskripsi/spesifikasi:
${deskripsi}

---

OUTPUT YANG DIBUTUHKAN:

▸ USP (Unique Selling Proposition)
Tulis 3-5 poin USP terkuat produk ini — bukan sekadar fitur, tapi manfaat nyata yang bikin produk ini layak direkomendasiin ke calon pembeli.

Format: poin bernomor, singkat, langsung ke manfaat. Bahasa Indonesia yang natural.`
  }

  function buildAffNaskahPrompt(): string {
    const selectedProduct = products.find(p => p.id === affForm.product_id)
    const nama = selectedProduct?.nama || '[nama produk]'
    const harga = selectedProduct?.harga_normal ? `Rp ${selectedProduct.harga_normal.toLocaleString('id-ID')}` : '-'
    const platformAffiliate = selectedProduct?.platform_affiliate || '-'
    const brand = brandProfile
    const niche = brand?.niche || affForm.niche_produk || '-'
    const tone = brand?.tone_of_voice || 'Friendly, relate'
    const positioning = brand?.affiliate_positioning || '-'
    const promoStyle = brand?.affiliate_promo_style || '-'
    const varian = parseInt(affForm.jumlah_varian) || 3

    const formulaGuide: Record<string, string> = {
      'AIDA': 'Attention → Interest → Desire → Action',
      'PAS': 'Problem → Agitate → Solution',
      'PASTOR': 'Problem → Amplify → Story → Transformation → Offer → Response',
      'BAB': 'Before → After → Bridge',
      'FAB': 'Feature → Advantage → Benefit',
      '4Ps': 'Picture → Promise → Prove → Push',
      'QUEST': 'Qualify → Understand → Educate → Stimulate → Transition',
    }
    const formulaDesc = formulaGuide[affForm.formula_copywriting] || affForm.formula_copywriting

    return `Kamu adalah scriptwriter konten affiliate Indonesia kelas A — spesialis menghasilkan naskah yang terasa natural, trustworthy, dan memiliki conversion rate tinggi. Bukan iklan. Bukan endorse kaku. Rekomendasi teman yang kebetulan pakai produknya.

---

PROFIL AFFILIATOR
Niche: ${niche}
Tone of voice: ${tone}
Positioning: ${positioning}
Style promosi: ${promoStyle}

---

PRODUK YANG DIPROMOSIKAN
Nama: ${nama}
Harga: ${harga}
Platform affiliate: ${platformAffiliate}

HASIL ANALISIS USP (dari langkah sebelumnya):
${affForm.usp || '[Isi USP hasil analisis terlebih dahulu]'}

---

SPESIFIKASI PRODUKSI

Formula Copywriting: ${affForm.formula_copywriting} (${formulaDesc})
Platform: ${affForm.platform}
Format konten: ${affForm.tipe_konten}
Target audiens: ${affForm.target_audiens}
Gender target: ${affForm.gender}
Target durasi: ${affForm.target_durasi}
Niche/Kategori: ${affForm.niche_produk || niche}
Style CTA: ${affForm.cta_style}
Fokus konversi / Trigger utama: ${affForm.fokus_konversi}
Strategi visual hook: ${affForm.visual_hook}
${affForm.konteks ? `Konteks tambahan: ${affForm.konteks}` : ''}

---

INSTRUKSI OUTPUT:

Buat ${varian} varian naskah lengkap. Masing-masing varian harus BERBEDA secara hook, angle, dan story — bukan cuma parafrase.

Untuk setiap varian, format seperti ini:

═══════════════════════════════
VARIAN [N] — [Nama angle/hook]
═══════════════════════════════

🎬 VISUAL HOOK
[Deskripsi visual yang menarik perhatian dalam 3 detik pertama menggunakan strategi: ${affForm.visual_hook}]

🗣️ HOOK VERBAL
[Kalimat pembuka yang terucap — harus bikin orang BERHENTI scroll. Pakai formula ${affForm.formula_copywriting}.]

📜 NASKAH LENGKAP
[Script dalam bentuk paragraf/alur narasi — TANPA timestamp. Alur: Hook → Bangun interest (sebut produk secara natural, bukan di awal) → Proof/testimoni singkat → Handle objection natural → CTA. Panjang script menyesuaikan target durasi ${affForm.target_durasi}.]

Catatan script:
- Gunakan bahasa ${tone.toLowerCase()} yang sesuai untuk ${affForm.target_audiens} (${affForm.gender})
- Jangan sebut harga di awal — build value dulu
- Handle objection yang mungkin muncul secara natural
- Trigger utama yang harus muncul: ${affForm.fokus_konversi}

📣 CTA (${affForm.cta_style})
[Kalimat CTA yang natural, tidak memaksa, sesuai platform ${affForm.platform}]

📝 CAPTION SIAP POSTING
[Dengan emoji yang sesuai tone, panjang sesuai ${affForm.platform}, masukkan 1 selling point utama]

#️⃣ HASHTAG
[15 hashtag — mix: produk spesifik + niche + broad + trending ${affForm.platform}]

---

SETELAH SEMUA VARIAN, tambahkan seksi:

🎯 REKOMENDASI VARIAN TERKUAT
Sebutkan varian mana yang paling potensial convert untuk target ${affForm.target_audiens} di ${affForm.platform}, dan kenapa.

💡 TIPS PRODUKSI
3 tips teknis untuk mengeksekusi konten ini di ${affForm.platform} (durasi aktual, kapan sebut produk, gesture/ekspresi, dll)

---

Ingat: naskah harus terasa seperti teman yang excited share temuan bagus, bukan sales pitch. Gunakan bahasa sehari-hari Indonesia yang relate untuk ${affForm.target_audiens}.`
  }

  async function _doInsertNaskah(
    naskah: string, judul: string, productId: string | null,
    platform: string, tipe: string, mode: 'affiliate' | 'creator',
    tanggal_tayang?: string | null, jam_tayang?: string | null
  ) {
    const supabase = createClient()
    const { data: inserted, error: err } = await supabase.from('kf_content_ideas').insert({
      workspace_id: workspaceId,
      judul,
      platform: [platform],
      format: tipe,
      script: naskah,
      status: 'Naskah Siap',
      product_id: productId || null,
      tanggal_tayang: tanggal_tayang || null,
      jam_tayang: jam_tayang || null,
    }).select('id').single()
    if (!err && inserted) {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'produksi',
        title: `Mulai Produksi — ${judul}`,
        message: `Naskah sudah siap. Buka Studio untuk mulai desain/produksi.`,
        content_idea_id: inserted.id,
      })
      removeFromQueue(activeQueueId)
      if (mode === 'affiliate') {
        setAffSavedToLibrary(true)
        setTimeout(() => setAffSavedToLibrary(false), 3000)
      } else {
        setSavedToLibrary(true)
        setTimeout(() => setSavedToLibrary(false), 3000)
      }
      if (productId) {
        const selectedProduct = products.find(p => p.id === productId)
        if (selectedProduct) {
          const naskahTask = tasks.find(t =>
            t.nama.includes(' — ') && t.nama.endsWith('— ' + selectedProduct.nama) && t.nama.toLowerCase().includes('naskah')
          )
          if (naskahTask && naskahTask.percent_complete < 100) {
            await supabase.from('kf_tasks').update({ percent_complete: 100 }).eq('id', naskahTask.id)
          }
        }
      }
    }
  }

  async function saveAffToLibrary() {
    if (!affNaskah.trim()) return
    setAffSavedToLibrary(false)
    const selectedProduct = products.find(p => p.id === affForm.product_id)
    const judul = `[Affiliate] ${selectedProduct?.nama || 'Produk'} — ${affForm.platform} — ${new Date().toLocaleDateString('id-ID')}`
    const activeItem = activeQueueId ? localQueue.find(q => q.id === activeQueueId) : null
    const matchingDraft = affForm.product_id ? sprintDrafts.find(d => d.product_id === affForm.product_id) : null
    if (matchingDraft) {
      setSprintLinkModal({ draft: matchingDraft, naskah: affNaskah, judul, productId: affForm.product_id, platform: affForm.platform, tipe: affForm.tipe_konten, mode: 'affiliate' })
      return
    }
    await _doInsertNaskah(affNaskah, judul, affForm.product_id, affForm.platform, affForm.tipe_konten, 'affiliate', activeItem?.tanggal_tayang, activeItem?.jam_tayang)
  }

  async function saveToLibrary() {
    if (!generatedNaskah.trim()) return
    setSavedToLibrary(false)
    const judul = `[${naskahForm.platform}] ${naskahForm.pillar || naskahForm.tipe_konten} — ${new Date().toLocaleDateString('id-ID')}`
    const activeItem = activeQueueId ? localQueue.find(q => q.id === activeQueueId) : null
    const matchingDraft = naskahForm.product_id
      ? sprintDrafts.find(d => d.product_id === naskahForm.product_id)
      : naskahForm.pillar
        ? sprintDrafts.find(d => !d.product_id && d.judul.startsWith(naskahForm.pillar))
        : null
    if (matchingDraft) {
      setSprintLinkModal({ draft: matchingDraft, naskah: generatedNaskah, judul, productId: naskahForm.product_id, platform: naskahForm.platform, tipe: naskahForm.tipe_konten, mode: 'creator' })
      return
    }
    await _doInsertNaskah(generatedNaskah, judul, naskahForm.product_id, naskahForm.platform, naskahForm.tipe_konten, 'creator', activeItem?.tanggal_tayang, activeItem?.jam_tayang)
  }

  async function confirmSprintUpdate() {
    if (!sprintLinkModal) return
    setSprintLinkSaving(true)
    const { draft, naskah, mode } = sprintLinkModal
    const supabase = createClient()
    await supabase.from('kf_content_ideas').update({ script: naskah, status: 'Naskah Siap', judul: sprintLinkModal.judul }).eq('id', draft.id)
    await supabase.from('kf_notifications').insert({
      workspace_id: workspaceId,
      type: 'produksi',
      title: `Naskah Siap — ${sprintLinkModal.judul}`,
      message: `Naskah selesai dibuat. Lanjut ke Take Video / Produksi di Studio.`,
      content_idea_id: draft.id,
    })
    setSprintLinkSaving(false)
    setSprintLinkModal(null)
    removeFromQueue(activeQueueId)
    if (mode === 'affiliate') { setAffSavedToLibrary(true); setTimeout(() => setAffSavedToLibrary(false), 3000) }
    else { setSavedToLibrary(true); setTimeout(() => setSavedToLibrary(false), 3000) }
  }

  async function confirmSaveNew() {
    if (!sprintLinkModal) return
    setSprintLinkSaving(true)
    const { naskah, judul, productId, platform, tipe, mode } = sprintLinkModal
    const activeItem = activeQueueId ? localQueue.find(q => q.id === activeQueueId) : null
    setSprintLinkModal(null)
    setSprintLinkSaving(false)
    await _doInsertNaskah(naskah, judul, productId, platform, tipe, mode, activeItem?.tanggal_tayang, activeItem?.jam_tayang)
  }

  function copyPrompt(prompt: string) {
    navigator.clipboard.writeText(prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }


  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Plan</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Buat naskah & skrip konten dengan bantuan AI</p>
      </div>

      {/* Tabs */}
      <div className="kf-tabs-wrap">
        <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #f3f4f6' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #1a73e8' : '2px solid transparent', color: tab === t.id ? '#1a73e8' : '#6b7280', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Naskah Generator ── */}
      {tab === 'naskah' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!brandProfile?.niche && !brandProfile?.affiliate_micro_niche && (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#d97706' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Lengkapi modul <a href="/brand" style={{ color: '#d97706', fontWeight: 700 }}>Brand</a> dulu agar prompt AI lebih akurat dan sesuai identitas kamu.
            </div>
          )}

          {/* ── Antrian Naskah ── */}
          {localQueue.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.875rem' }}>Antrian Naskah</span>
                  <span style={{ background: '#1a73e8', color: '#fff', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{localQueue.length}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Klik untuk isi form otomatis</span>
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {localQueue.map(item => {
                  const isRevisi = item.status === 'Revisi'
                  const isActive = activeQueueId === item.id
                  const parts = item.judul.split(' — ')
                  const pillarName = parts[0]
                  const contentLabel = parts[1] || null
                  return (
                    <button key={item.id} type="button" onClick={() => selectQueueItem(item)}
                      style={{ flexShrink: 0, width: 180, textAlign: 'left', background: isActive ? (isRevisi ? 'rgba(220,38,38,0.06)' : 'rgba(26,115,232,0.06)') : '#f9fafb', border: `1.5px solid ${isActive ? (isRevisi ? '#dc2626' : '#1a73e8') : '#f3f4f6'}`, borderRadius: 12, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: isRevisi ? 'rgba(220,38,38,0.1)' : 'rgba(26,115,232,0.1)', color: isRevisi ? '#dc2626' : '#1a73e8' }}>
                          {isRevisi ? 'REVISI' : 'DRAFT'}
                        </span>
                        {item.format && <span style={{ fontSize: '0.58rem', color: '#6b7280', background: '#f3f4f6', borderRadius: 3, padding: '1px 5px' }}>{item.format}</span>}
                      </div>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.judul}>
                        {pillarName}
                      </div>
                      {contentLabel && (
                        <div style={{ fontSize: '0.72rem', color: '#1a73e8', fontWeight: 600, marginBottom: 3 }}>
                          {contentLabel}
                        </div>
                      )}
                      {item.tanggal_tayang && (
                        <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span>{new Date(item.tanggal_tayang + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{item.jam_tayang ? ` ${item.jam_tayang}` : ''}</span>
                        </div>
                      )}
                      {item.sprint_nama && (
                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.sprint_nama}
                        </div>
                      )}
                      {item.assigned_naskah && (
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.assigned_naskah}</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {localQueue.length === 0 ? (
            <div style={{ background: '#f9fafb', border: '1.5px dashed #e5e7eb', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              </div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginBottom: 6 }}>Belum ada antrian naskah</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 20 }}>Semua naskah dimulai dari Sprint. Buat sprint dan assign konten untuk mulai.</div>
              <a href="/sprints" style={{ display: 'inline-block', background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                Buat Sprint
              </a>
            </div>
          ) : !activeQueueId ? (
            <div style={{ background: '#f9fafb', border: '1.5px dashed #e5e7eb', borderRadius: 16, padding: '36px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginBottom: 6 }}>Pilih konten dari antrian di atas</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Klik salah satu kartu untuk auto-isi form sesuai brief sprint</div>
            </div>
          ) : (
          <>

          {/* ── CREATOR FLOW ── */}
          {naskahMode === 'creator' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Form kiri */}
              <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Sprint Brief Banner */}
                {sprintLockedItem ? (
                  <div style={{ background: 'rgba(26,115,232,0.05)', border: '1px solid rgba(26,115,232,0.18)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1a73e8', letterSpacing: '0.05em' }}>BRIEF SPRINT — {sprintLockedItem.sprint_nama}</span>
                      <button type="button" onClick={() => setActiveQueueId(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#374151', background: '#f3f4f6', borderRadius: 6, padding: '3px 8px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        {sprintLockedItem.judul.split(' — ')[0]}
                      </span>
                      {sprintLockedItem.format && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#374151', background: '#f3f4f6', borderRadius: 6, padding: '3px 8px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                        {sprintLockedItem.format}
                      </span>}
                      {sprintLockedItem.platform.map(p => (
                        <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#1a73e8', background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 6, padding: '3px 8px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                          {p}
                        </span>
                      ))}
                      {sprintLockedItem.assigned_naskah && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#374151', background: '#f3f4f6', borderRadius: 6, padding: '3px 8px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {sprintLockedItem.assigned_naskah}
                      </span>}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: 8 }}>Pilar, format & platform sudah dikunci dari sprint. Kamu hanya perlu isi hook angle & konteks.</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>Konfigurasi Naskah</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Isi detail konten → Generate → paste hasil AI di kanan</div>
                  </div>
                )}

                {!sprintLockedItem && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Platform</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['TikTok', 'Instagram', 'YouTube', 'Facebook', 'LinkedIn'].map(pl => (
                        <button key={pl} type="button" onClick={() => setNF('platform', pl)}
                          style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${naskahForm.platform === pl ? '#1a73e8' : 'transparent'}`, background: naskahForm.platform === pl ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: naskahForm.platform === pl ? '#1a73e8' : '#6b7280', fontSize: '0.78rem', cursor: 'pointer', fontWeight: naskahForm.platform === pl ? 600 : 400 }}>
                          {pl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!sprintLockedItem && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Format Konten</label>
                    <select style={fieldStyle({ fontSize: '0.82rem' })} value={naskahForm.tipe_konten} onChange={e => setNF('tipe_konten', e.target.value)}>
                      {['Video Pendek', 'Reels', 'Carousel', 'Story', 'Live Script', 'Long Video', 'Thread/Caption'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
                    Pillar / Tema Konten
                    {sprintLockedItem && <span style={{ marginLeft: 6, fontSize: '0.62rem', color: '#1a73e8', background: 'rgba(26,115,232,0.08)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>DIKUNCI SPRINT</span>}
                  </label>
                  {!sprintLockedItem && (pillars.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {pillars.map(p => {
                        const isSelected = naskahForm.pillar === p.nama
                        const hasSprintSlot = sprintDrafts.some(d => !d.product_id && d.judul.startsWith(p.nama))
                        return (
                          <button key={p.id} type="button" onClick={() => setNF('pillar', isSelected ? '' : p.nama)}
                            style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${isSelected ? '#059669' : 'transparent'}`, background: isSelected ? 'rgba(52,211,153,0.1)' : '#f3f4f6', color: isSelected ? '#059669' : '#374151', fontSize: '0.78rem', cursor: 'pointer', fontWeight: isSelected ? 600 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {p.nama}
                            {hasSprintSlot && <span style={{ fontSize: '0.6rem', background: '#1a73e8', color: '#fff', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>Sprint</span>}
                          </button>
                        )
                      })}
                    </div>
                  ) : brandProfile?.affiliate_content_pillars ? (
                    <div style={{ marginBottom: 8 }}>
                      {brandProfile.affiliate_content_pillars.split('\n').filter(l => l.trim()).slice(0, 6).map((line, i) => {
                        const label = line.replace(/^\d+\.\s*/, '').split('—')[0].trim()
                        return (
                          <button key={i} type="button" onClick={() => setNF('pillar', label)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', marginBottom: 4, borderRadius: 7, border: `1px solid ${naskahForm.pillar === label ? '#059669' : 'transparent'}`, background: naskahForm.pillar === label ? 'rgba(52,211,153,0.1)' : '#f3f4f6', color: naskahForm.pillar === label ? '#059669' : '#6b7280', fontSize: '0.78rem', cursor: 'pointer' }}>
                            {line.replace(/^\d+\.\s*/, '')}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#d97706', background: 'rgba(245,158,11,0.07)', borderRadius: 7, padding: '8px 12px', marginBottom: 8 }}>
                      Belum ada pilar konten. <a href="/brand?tab=pillars" style={{ color: '#d97706', fontWeight: 700 }}>Buat di Brand → Content Pillars →</a>
                    </div>
                  ))}
                  {sprintLockedItem ? (
                    <div style={{ background: '#f3f4f6', borderRadius: 10, padding: '10px 14px', fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                      {naskahForm.pillar}
                    </div>
                  ) : (
                    <>
                      <input style={fieldStyle({ fontSize: '0.82rem' })} value={naskahForm.pillar} onChange={e => setNF('pillar', e.target.value)} placeholder="atau ketik tema bebas..." />
                      {(() => {
                        const matchingDraft = naskahForm.pillar
                          ? sprintDrafts.find(d => !d.product_id && d.judul.startsWith(naskahForm.pillar))
                          : null
                        if (!matchingDraft) return null
                        return (
                          <div style={{ marginTop: 8, background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            Slot sprint aktif: <strong>{matchingDraft.judul}</strong> — naskah ini bisa di-link saat disimpan
                          </div>
                        )
                      })()}
                    </>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Hook Angle</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Shock/Surprised', 'Problem-first', 'Result-first', 'Story', 'Question', 'Warning', 'Comparison', 'Social proof'].map(h => (
                      <button key={h} type="button" onClick={() => setNF('hook_angle', naskahForm.hook_angle === h ? '' : h)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${naskahForm.hook_angle === h ? '#1a73e8' : 'transparent'}`, background: naskahForm.hook_angle === h ? 'rgba(26,115,232,0.12)' : '#f3f4f6', color: naskahForm.hook_angle === h ? '#1a73e8' : '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {isAffiliate && products.filter(p => p.tipe_produk === 'Affiliate').length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Produk Affiliate <span style={{ color: '#6b7280', fontWeight: 400 }}>(opsional)</span></label>
                    <select style={fieldStyle({ fontSize: '0.82rem' })} value={naskahForm.product_id} onChange={e => setNF('product_id', e.target.value)}>
                      <option value="">— Tanpa produk spesifik —</option>
                      {products.filter(p => p.tipe_produk === 'Affiliate').map(p => (
                        <option key={p.id} value={p.id}>{p.nama} {p.platform_affiliate ? `(${p.platform_affiliate})` : ''}</option>
                      ))}
                    </select>
                    {naskahForm.product_id && (() => {
                      const prod = products.find(p => p.id === naskahForm.product_id)
                      return prod ? <SprintBanner tasks={tasks} productName={prod.nama} /> : null
                    })()}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Konteks Tambahan <span style={{ color: '#6b7280', fontWeight: 400 }}>(opsional)</span></label>
                  <textarea style={fieldStyle({ height: 70, resize: 'none', fontSize: '0.82rem' })} value={naskahForm.konteks} onChange={e => setNF('konteks', e.target.value)} placeholder="cth: konten untuk moment lebaran, target ibu-ibu, durasi maks 30 detik..." />
                </div>

                {brandProfile?.niche && (
                  <div style={{ background: '#f9fafb', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.7 }}>
                    <div style={{ color: '#9ca3af', fontWeight: 600, marginBottom: 4, fontSize: '0.65rem', letterSpacing: '0.04em' }}>Brand context</div>
                    <div>Niche: <span style={{ color: '#6b7280' }}>{brandProfile.niche}</span></div>
                    {brandProfile.tone_of_voice && <div>Tone: <span style={{ color: '#6b7280' }}>{brandProfile.tone_of_voice}</span></div>}
                    {brandProfile.target_audiens && <div>Audiens: <span style={{ color: '#6b7280' }}>{brandProfile.target_audiens}</span></div>}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
                    {naskahForm.tipe_konten === 'Carousel' ? 'Jumlah Slide' : 'Jumlah Varian Naskah'}
                  </label>
                  <input type="number" style={fieldStyle({ fontSize: '0.9rem', textAlign: 'center' as const })} value={naskahForm.jumlah_varian} onChange={e => setNF('jumlah_varian', e.target.value)} min="1" max="20" />
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                    {naskahForm.tipe_konten === 'Carousel' ? 'Jumlah slide carousel. Min 4: 1 hook + isi + 1 CTA. Rekomendasi: 7–10.' : 'Setiap varian punya hook, angle & story berbeda. Tiap varian langsung bisa di-copy-paste ke Library.'}
                  </div>
                </div>

                <button type="button" onClick={() => setAiModal({ prompt: buildNaskahPrompt() })}
                  style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Generate Naskah dengan AI
                </button>
              </div>

              {/* Output kanan */}
              <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Hasil Naskah</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Paste hasil dari AI di sini</div>
                  </div>
                  {generatedNaskah && (
                    <button type="button" onClick={saveToLibrary}
                      style={{ background: savedToLibrary ? 'rgba(52,211,153,0.15)' : 'rgba(26,115,232,0.12)', border: `1px solid ${savedToLibrary ? '#059669' : '#1a73e8'}`, borderRadius: 8, padding: '7px 14px', color: savedToLibrary ? '#059669' : '#1a73e8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      {savedToLibrary ? '✓ Tersimpan di Library' : 'Simpan ke Library'}
                    </button>
                  )}
                </div>
                <textarea
                  ref={naskahRef}
                  style={fieldStyle({ flex: 1, minHeight: 480, resize: 'none', fontSize: '0.82rem', lineHeight: '1.7', fontFamily: 'inherit' })}
                  value={generatedNaskah}
                  onChange={e => setGeneratedNaskah(e.target.value)}
                  placeholder={'Klik "Generate Naskah dengan AI" → pilih AI favorit → paste hasilnya di sini.\n\nAtau ketik langsung jika sudah punya drafnya.'}
                />
                {generatedNaskah && (
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{generatedNaskah.length} karakter · {generatedNaskah.split(/\s+/).filter(Boolean).length} kata</div>
                )}
              </div>
            </div>
          )}

          {/* ── AFFILIATE FLOW ── */}
          {naskahMode === 'affiliate' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

              {/* LEFT — Config */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Tabbed config card */}
              <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, overflow: 'hidden' }}>

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                  {([
                    { id: 'produk', label: 'Data Produk', color: '#ec4899', step: '01' },
                    { id: 'config', label: 'Konfigurasi', color: '#0284c7', step: '02' },
                  ] as const).map(t => (
                    <button key={t.id} type="button" onClick={() => setAffLeftTab(t.id)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 16px', background: 'transparent', border: 'none', borderBottom: affLeftTab === t.id ? `2px solid ${t.color}` : '2px solid transparent', color: affLeftTab === t.id ? t.color : '#6b7280', fontSize: '0.875rem', fontWeight: affLeftTab === t.id ? 700 : 500, cursor: 'pointer', marginBottom: -1 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, background: affLeftTab === t.id ? t.color + '15' : '#f3f4f6', color: affLeftTab === t.id ? t.color : '#9ca3af', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.05em' }}>{t.step}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* STEP 01 — Data Produk */}
                {affLeftTab === 'produk' && (
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Pilih dari katalog */}
                  {products.length > 0 ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Pilih dari Katalog <span style={{ color: '#6b7280', fontWeight: 400 }}>(auto-isi deskripsi)</span></label>
                      <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.product_id} onChange={e => {
                        const pid = e.target.value
                        const prod = products.find(p => p.id === pid)
                        setAffForm(f => ({ ...f, product_id: pid, deskripsi_produk: prod?.deskripsi || f.deskripsi_produk, niche_produk: prod?.kategori || f.niche_produk }))
                      }}>
                        <option value="">— Pilih produk dari katalog —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nama}{p.platform_affiliate ? ` (${p.platform_affiliate})` : ''}{!p.deskripsi ? ' (*)' : ''}</option>)}
                      </select>
                      {products.some(p => !p.deskripsi) && (
                        <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: 4 }}>Produk bertanda (*) belum ada deskripsi — lengkapi di <a href="/catalog" style={{ color: '#d97706', fontWeight: 700 }}>Katalog</a> agar auto-isi berfungsi.</div>
                      )}
                      {affForm.product_id && (() => {
                        const prod = products.find(p => p.id === affForm.product_id)
                        return prod ? <SprintBanner tasks={tasks} productName={prod.nama} /> : null
                      })()}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#d97706' }}>
                      Belum ada produk di katalog. <a href="/catalog" style={{ color: '#d97706', fontWeight: 700 }}>Tambah produk →</a> Pastikan isi kolom Deskripsi agar bisa auto-fill di sini.
                    </div>
                  )}

                  {/* Deskripsi produk */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Deskripsi Produk (Input)</label>
                    <textarea
                      style={fieldStyle({ minHeight: 140, resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.7 })}
                      value={affForm.deskripsi_produk}
                      onChange={e => setAFF('deskripsi_produk', e.target.value)}
                      placeholder={'Paste detail produk di sini... (Contoh: Serum Vitamin C 20ml, mencerahkan dalam 7 hari, aman untuk bumil, tekstur cair, harga Rp 89.000, beli di Shopee...)'}
                    />
                  </div>

                  {/* Generate USP button */}
                  <button type="button" onClick={() => setAffAiModal({ prompt: buildUSPPrompt(), label: 'Analisis USP Produk' })}
                    style={{ background: '#ec4899', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    GENERATE USP (AI ANALYSIS)
                  </button>

                  {/* USP result paste area */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Hasil Analisis USP <span style={{ color: '#6b7280', fontWeight: 400 }}>(paste dari AI)</span></label>
                    <textarea
                      style={fieldStyle({ minHeight: 140, resize: 'vertical', fontSize: '0.82rem', lineHeight: 1.7, border: `1px solid ${affForm.usp ? '#ec489940' : 'transparent'}`, color: affForm.usp ? '#111827' : '#6b7280' })}
                      value={affForm.usp}
                      onChange={e => setAFF('usp', e.target.value)}
                      placeholder={'Paste hasil analisis USP dari AI di sini...\n\nContoh:\n1. Belajar 3 bahasa sejak dini (Indonesia, Inggris, Mandarin)\n2. Belajar sambil bermain dengan suara interaktif\n3. ...'}
                    />
                  </div>
                  <button type="button" onClick={() => setAffLeftTab('config')}
                    style={{ background: '#0284c7', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    Lanjut ke Konfigurasi
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
                )}

                {/* STEP 02 — Konfigurasi */}
                {affLeftTab === 'config' && (
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Formula Copywriting */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Formula Copywriting</label>
                    <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.formula_copywriting} onChange={e => setAFF('formula_copywriting', e.target.value)}>
                      {[
                        'AIDA (Attention, Interest, Desire, Action)',
                        'PAS (Problem, Agitate, Solution)',
                        'PASTOR (Problem, Amplify, Story, Transformation, Offer, Response)',
                        'BAB (Before, After, Bridge)',
                        'FAB (Feature, Advantage, Benefit)',
                        '4Ps (Picture, Promise, Prove, Push)',
                        'QUEST (Qualify, Understand, Educate, Stimulate, Transition)',
                      ].map(f => {
                        const key = f.split(' ')[0]
                        return <option key={key} value={key}>{f}</option>
                      })}
                    </select>
                  </div>

                  {/* Niche Produk — locked from Brand */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Niche Produk</label>
                    <div style={{ ...fieldStyle({ fontSize: '0.85rem' }), color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{affForm.niche_produk || brandProfile?.affiliate_kategori_fokus?.[0] || '-'}</span>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>dari Brand</span>
                    </div>
                  </div>

                  {/* Target Audiens + Gender */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      {(() => {
                        const AUDIENS_PRESETS = ['Gen Z (17-24)', 'Millennial (25-35)', 'Gen X (36-50)', 'Semua Usia', 'Remaja (< 17)', 'Senior (50+)', 'Ibu Rumah Tangga', 'Profesional Muda', 'Pelajar/Mahasiswa']
                        const isCustom = affForm.target_audiens !== '' && !AUDIENS_PRESETS.includes(affForm.target_audiens)
                        return <>
                          <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Target Audiens</label>
                          <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.target_audiens} onChange={e => setAFF('target_audiens', e.target.value)}>
                            {AUDIENS_PRESETS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <input style={fieldStyle({ fontSize: '0.78rem', marginTop: 6, color: isCustom ? '#111827' : '#6b7280' })} value={isCustom ? affForm.target_audiens : ''} onChange={e => setAFF('target_audiens', e.target.value)} placeholder="ketik segmen spesifik..." />
                        </>
                      })()}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Gender</label>
                      <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.gender} onChange={e => setAFF('gender', e.target.value)}>
                        {['Semua', 'Wanita', 'Pria'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Target Durasi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Target Durasi</label>
                    <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.target_durasi} onChange={e => setAFF('target_durasi', e.target.value)}>
                      {['15-20 detik (Quick Hook)', '30-40 detik (Optimal)', '45-60 detik (Standard)', '60-90 detik (Detail)', '90 detik+ (Deep Story)'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Style CTA */}
                  {(() => {
                    const CTA_PRESETS = ['Checkout Kiri Bawah', 'Klik Link Bio', 'Cek di Marketplace', 'DM Admin', 'Save & Share dulu', 'Soft Recommend (no hard sell)', 'Comment "INFO" untuk link', 'Follow untuk info lebih']
                    const isCustom = affForm.cta_style !== '' && !CTA_PRESETS.includes(affForm.cta_style)
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Style CTA</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.cta_style} onChange={e => setAFF('cta_style', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {CTA_PRESETS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustom ? '#111827' : '#6b7280' })} value={isCustom ? affForm.cta_style : ''} onChange={e => setAFF('cta_style', e.target.value)} placeholder="atau ketik style CTA kustom..." />
                      </div>
                    )
                  })()}

                  {/* Fokus Konversi */}
                  {(() => {
                    const KONVERSI_PRESETS = ['Benefit Only', 'Urgency/FOMO (stok terbatas, promo habis)', 'Social Proof (testimoni, rating)', 'Before-After Transformation', 'Pain Point → Solution', 'Price Value (mahal di luar, murah di sini)', 'Exclusivity (susah dicari)', 'Curiosity Gap (penasarin dulu)']
                    const isCustom = affForm.fokus_konversi !== '' && !KONVERSI_PRESETS.includes(affForm.fokus_konversi)
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Fokus Konversi</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.fokus_konversi} onChange={e => setAFF('fokus_konversi', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {KONVERSI_PRESETS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustom ? '#111827' : '#6b7280' })} value={isCustom ? affForm.fokus_konversi : ''} onChange={e => setAFF('fokus_konversi', e.target.value)} placeholder="atau ketik trigger kustom..." />
                      </div>
                    )
                  })()}

                  {/* Visual Hook Strategy */}
                  {(() => {
                    const VISUAL_PRESETS = ['Talking Head (muka depan kamera)', 'Demo Produk (tampilkan produk langsung)', 'Text Overlay (teks di layar)', 'POV / First Person', 'Audio Driven (suara dominan)', 'B-Roll dengan Voiceover', 'Before-After Visual', 'Reaction Video', 'Unboxing']
                    const isCustom = affForm.visual_hook !== '' && !VISUAL_PRESETS.includes(affForm.visual_hook)
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Visual Hook</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.visual_hook} onChange={e => setAFF('visual_hook', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {VISUAL_PRESETS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustom ? '#111827' : '#6b7280' })} value={isCustom ? affForm.visual_hook : ''} onChange={e => setAFF('visual_hook', e.target.value)} placeholder="atau ketik strategi visual kustom..." />
                      </div>
                    )
                  })()}

                  {/* Platform + Format — locked from Brand & Sprint */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Platform</label>
                      <div style={{ ...fieldStyle({ fontSize: '0.85rem' }), color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{affForm.platform || brandProfile?.platform_utama || 'TikTok'}</span>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>dari Brand</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Format Konten</label>
                      <div style={{ ...fieldStyle({ fontSize: '0.85rem' }), color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{affForm.tipe_konten || 'Video Pendek'}</span>
                        <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 600 }}>dari Sprint</span>
                      </div>
                    </div>
                  </div>

                  {/* Konteks tambahan */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Konteks Tambahan <span style={{ color: '#6b7280', fontWeight: 400 }}>(opsional)</span></label>
                    <textarea style={fieldStyle({ height: 70, resize: 'none', fontSize: '0.82rem' })} value={affForm.konteks} onChange={e => setAFF('konteks', e.target.value)} placeholder="cth: momen harbolnas, buat campaign ramadan, target ibu-ibu yang suka masak..." />
                  </div>

                  {/* Jumlah Varian — free input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Jumlah Varian Naskah</label>
                    <input type="number" style={fieldStyle({ fontSize: '0.9rem', textAlign: 'center' as const })} value={affForm.jumlah_varian} onChange={e => setAFF('jumlah_varian', e.target.value)} min="1" max="20" placeholder="3" />
                    <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>Tiap varian punya hook, angle, dan story yang berbeda. Rekomendasi: 2-3.</div>
                  </div>

                  {/* Compile Scripts button */}
                  <button type="button" onClick={() => setAffAiModal({ prompt: buildAffNaskahPrompt(), label: 'Compile Scripts' })}
                    style={{ background: '#6366f1', border: 'none', borderRadius: 10, padding: '14px 20px', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: '1.1rem' }}></span> COMPILE SCRIPTS
                  </button>
                </div>
                )}

              </div>{/* END tabbed card */}

              </div>{/* END LEFT column */}

              {/* RIGHT — Output */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Output hasil naskah */}
              <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: '22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2 }}>Hasil Naskah</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Paste hasil dari AI di sini, lalu simpan ke Library</div>
                  </div>
                  {affNaskah && (
                    <button type="button" onClick={saveAffToLibrary}
                      style={{ background: affSavedToLibrary ? '#059669' : '#6366f1', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      {affSavedToLibrary ? '✓ Tersimpan di Library' : 'Simpan ke Library'}
                    </button>
                  )}
                </div>
                <textarea
                  ref={affNaskahRef}
                  style={fieldStyle({ minHeight: 480, resize: 'none', fontSize: '0.82rem', lineHeight: '1.7', fontFamily: 'inherit' })}
                  value={affNaskah}
                  onChange={e => setAffNaskah(e.target.value)}
                  placeholder={'Klik "COMPILE SCRIPTS" → pilih AI favorit → paste hasilnya di sini.\n\nAI akan memberikan:\n• Hook options (visual + verbal)\n• Naskah lengkap dengan timestamp\n• Variasi CTA\n• Caption siap posting\n• Hashtag\n• Rekomendasi varian terkuat'}
                />
                {affNaskah && (
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{affNaskah.length} karakter · {affNaskah.split(/\s+/).filter(Boolean).length} kata</div>
                )}
              </div>

              {/* STEP 03 — Alur Produksi (muncul setelah naskah diisi) */}
              {affNaskah.trim() && (() => {
                const PROD_STEPS = [
                  { id: 'naskah', label: 'Naskah / Script', icon: 'naskah', desc: 'Naskah sudah siap', autoCheck: true },
                  { id: 'take_video', label: 'Take Video', icon: 'take_video', desc: 'Rekam video utama sesuai naskah' },
                  { id: 'broll_vo', label: 'B-roll / Voice Over', icon: 'broll_vo', desc: 'Opsional — tambahan visual atau dubbing', optional: true },
                  { id: 'editing', label: 'Editing', icon: 'editing', desc: 'Edit, potong, tambah teks & musik' },
                  { id: 'schedule', label: 'Schedule Post', icon: 'schedule', desc: 'Jadwalkan posting di waktu terbaik' },
                ]
                return (
                  <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f3f4f6', background: 'rgba(52,211,153,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 4, height: 22, borderRadius: 2, background: '#059669' }} />
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: '1.05rem' }}>Alur Produksi</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: 5, padding: '3px 10px', letterSpacing: '0.08em' }}>STEP 03</span>
                    </div>
                    <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>Centang setiap step yang sudah selesai — pantau progress konten ini di Library.</div>
                      {PROD_STEPS.map((step, i) => {
                        const done = step.autoCheck || !!affProdSteps[step.id]
                        return (
                          <div key={step.id} onClick={() => !step.autoCheck && toggleProdStep(step.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: done ? 'rgba(16,185,129,0.06)' : '#f3f4f6', border: `1px solid ${done ? '#34d39925' : 'transparent'}`, cursor: step.autoCheck ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                            {/* step number / check */}
                            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#059669' : '#e5e7eb', transition: 'background 0.2s' }}>
                              {done ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700 }}>{i + 1}</span>
                              )}
                            </div>
                            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: '#6b7280' }}>{STEP_ICON_MAP[step.icon] || null}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: done ? '#059669' : '#6b7280', fontSize: '0.875rem' }}>
                                {step.label}
                                {step.optional && <span style={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>(opsional)</span>}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{step.desc}</div>
                            </div>
                            {i < PROD_STEPS.length - 1 && !step.autoCheck && (
                              <div style={{ fontSize: '0.7rem', color: done ? '#34d39960' : '#d1d5db', flexShrink: 0 }}>
                                {done ? 'Done ✓' : 'Tap'}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                        {affSavedToLibrary ? (
                          <div style={{ flex: 1, background: 'rgba(52,211,153,0.08)', border: '1px solid #34d39930', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>✓ Tersimpan di Library</span>
                            <a href="/library" style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Lihat di Library
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                            </a>
                          </div>
                        ) : (
                          <button type="button" onClick={saveAffToLibrary} style={{ flex: 1, background: '#059669', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            Simpan ke Library & Mulai Produksi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              </div>{/* END RIGHT column */}
            </div>
          )}
          </>
          )}{/* END empty-state ternary */}
        </div>
      )}


      {/* AI Picker Modal — Affiliate */}
      {affAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) { setAffAiModal(null) } }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>{affAiModal.label || 'Compile Scripts'}</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>Pilih AI, paste hasilnya di kolom output</div>
              </div>
              <button type="button" onClick={() => setAffAiModal(null)} style={{ width: 30, height: 30, background: '#f3f4f6', border: 'none', borderRadius: 8, color: '#6b7280', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'ChatGPT', desc: 'OpenAI GPT-4o', abbr: 'GPT', color: '#10b981', url: `https://chatgpt.com/?q=${encodeURIComponent(affAiModal.prompt)}` },
                { label: 'Claude', desc: 'Anthropic Claude', abbr: 'Cl', color: '#d97706', url: `https://claude.ai/new?q=${encodeURIComponent(affAiModal.prompt)}` },
                { label: 'Gemini', desc: 'Google Gemini', abbr: 'Gm', color: '#1a73e8', url: `https://gemini.google.com/app?q=${encodeURIComponent(affAiModal.prompt)}` },
                { label: 'DeepSeek', desc: 'DeepSeek R1', abbr: 'DS', color: '#8b5cf6', url: `https://chat.deepseek.com/?q=${encodeURIComponent(affAiModal.prompt)}` },
              ].map(ai => (
                <a key={ai.label} href={ai.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: '#f9fafb', textDecoration: 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: ai.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: ai.color, letterSpacing: '-0.2px' }}>{ai.abbr}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{ai.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{ai.desc}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
            <div style={{ height: 12 }} />
          </div>
        </div>
      )}

      {/* AI Picker Modal */}
      {aiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) { setAiModal(null) } }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>Generate Naskah</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>Pilih AI, paste hasilnya di kolom kanan</div>
              </div>
              <button type="button" onClick={() => setAiModal(null)} style={{ width: 30, height: 30, background: '#f3f4f6', border: 'none', borderRadius: 8, color: '#6b7280', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'ChatGPT', desc: 'OpenAI GPT-4o', abbr: 'GPT', color: '#10b981', url: `https://chatgpt.com/?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'Claude', desc: 'Anthropic Claude', abbr: 'Cl', color: '#d97706', url: `https://claude.ai/new?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'Gemini', desc: 'Google Gemini', abbr: 'Gm', color: '#1a73e8', url: `https://gemini.google.com/app?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'DeepSeek', desc: 'DeepSeek R1', abbr: 'DS', color: '#8b5cf6', url: `https://chat.deepseek.com/?q=${encodeURIComponent(aiModal.prompt)}` },
              ].map(ai => (
                <a key={ai.label} href={ai.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: '#f9fafb', textDecoration: 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: ai.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: ai.color, letterSpacing: '-0.2px' }}>{ai.abbr}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{ai.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>{ai.desc}</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
            <div style={{ height: 12 }} />
          </div>
        </div>
      )}

      {/* ── Sprint Link Modal ── */}
      {sprintLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>Slot Sprint Tersedia</div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.5 }}>
              Ada slot konten di Sprint aktif untuk produk ini:
              <br />
              <span style={{ color: '#1a73e8', fontWeight: 600 }}>&ldquo;{sprintLinkModal.draft.judul}&rdquo;</span>
              <br /><br />
              Naskah ini akan disimpan ke Library dan slot sprint tersebut akan diupdate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={confirmSprintUpdate}
                disabled={sprintLinkSaving}
                style={{ background: '#1a73e8', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.9rem', padding: '12px 0', cursor: sprintLinkSaving ? 'default' : 'pointer', opacity: sprintLinkSaving ? 0.6 : 1 }}
              >
                {sprintLinkSaving ? 'Menyimpan...' : '✓ Simpan ke Library'}
              </button>
              <button
                onClick={() => setSprintLinkModal(null)}
                disabled={sprintLinkSaving}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', padding: '6px 0' }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
