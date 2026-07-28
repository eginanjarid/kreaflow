'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type PlatformPlan = {
  id?: string
  workspace_id: string
  platform: string
  is_active: boolean
  tujuan: string
  target_followers: number | string
  target_reach: number | string
  frekuensi_per_minggu: number | string
  waktu_terbaik: string[]
  tipe_konten_prioritas: string
}

type Campaign = {
  id?: string
  workspace_id: string
  nama: string
  platforms: string[]
  tanggal_mulai: string
  tanggal_selesai: string
  tujuan: string
  budget: number | string
  status: string
}

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee', 'LinkedIn']
const TUJUAN = ['Meningkatkan Penjualan', 'Brand Awareness', 'Engagement', 'Followers Growth']
const TIPE_KONTEN = ['Video Pendek', 'Reels', 'Carousel', 'Story', 'Live', 'Long Video', 'Thread']
const CAMPAIGN_STATUS = ['Planning', 'Active', 'Completed', 'Cancelled']
const WAKTU = ['06:00', '07:00', '08:00', '09:00', '11:00', '12:00', '13:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

type TaskSnap = { id: string; nama: string; due_date: string; percent_complete: number; priority: string }

type BrandSnap = {
  niche?: string; micro_niche?: string; premis?: string; tone_of_voice?: string
  target_audiens?: string; platform_utama?: string; affiliate_tipe?: string
  affiliate_kategori_fokus?: string[]; affiliate_positioning?: string
  affiliate_promo_style?: string; affiliate_content_pillars?: string
} | null

type Product = {
  id: string; nama: string; kategori?: string; tipe_produk?: string
  platform_affiliate?: string; harga_normal?: number
  komisi_tipe?: string; komisi_nilai?: number; deskripsi?: string
}

type NaskahForm = {
  platform: string; tipe_konten: string; pillar: string; hook_angle: string
  product_id: string; konteks: string
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
  { id: 'platforms', label: 'Platform Strategy' },
  { id: 'campaigns', label: 'Campaign Planner' },
]

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}
function emptyPlatform(wsId: string, platform: string): PlatformPlan {
  return { workspace_id: wsId, platform, is_active: false, tujuan: '', target_followers: '', target_reach: '', frekuensi_per_minggu: '', waktu_terbaik: [], tipe_konten_prioritas: '' }
}
function emptyCampaign(wsId: string): Campaign {
  return { workspace_id: wsId, nama: '', platforms: [], tanggal_mulai: '', tanggal_selesai: '', tujuan: '', budget: '', status: 'Planning' }
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
        <span style={{ fontSize: '0.7rem', color: '#5a6a85' }}>{done}/{total} selesai · {pct}%</span>
      </div>
      <div style={{ height: 3, background: '#e5eaf2', borderRadius: 2, marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #1a73e8, #42a5f5)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {sprintTasks.map(t => {
          const rawStep = t.nama.split(' —')[0].trim()
          const stepName = rawStep.replace(/^\p{Emoji}\s*/u, '')
          const p = t.percent_complete || 0
          const dot = p === 100 ? '●' : p > 0 ? '◑' : '○'
          const dotColor = p === 100 ? '#86efac' : p > 0 ? '#fbbf24' : '#64748b'
          const dateStr = t.due_date ? t.due_date.slice(5).replace('-', '/') : ''
          return (
            <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85' }}>
              <span style={{ color: dotColor }}>{dot}</span>
              <span>{stepName}</span>
              {dateStr && <span style={{ color: '#5a6a85' }}>{dateStr}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

type SprintDraft = { id: string; judul: string; product_id: string; sprint_id: string }

export default function PlanModule({ initialPlatforms, initialCampaigns, workspaceId, brandProfile, products, modes, tasks = [], sprintDrafts = [] }: {
  initialPlatforms: PlatformPlan[]
  initialCampaigns: Campaign[]
  workspaceId: string
  brandProfile: BrandSnap
  products: Product[]
  modes: string[]
  tasks?: TaskSnap[]
  sprintDrafts?: SprintDraft[]
}) {
  const isAffiliate = modes.includes('affiliate')
  const TABS = TABS_BASE
  const [tab, setTab] = useState('naskah')
  const [platforms, setPlatforms] = useState<PlatformPlan[]>(
    PLATFORMS.map(p => initialPlatforms.find(x => x.platform === p) || emptyPlatform(workspaceId, p))
  )
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [saving, setSaving] = useState<string | null>(null)
  const [savedPlatform, setSavedPlatform] = useState<string | null>(null)
  const [modal, setModal] = useState<{ open: boolean; campaign: Campaign } | null>(null)
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [error, setError] = useState('')

  // Naskah Generator state
  const emptyNaskah: NaskahForm = { platform: brandProfile?.platform_utama || 'TikTok', tipe_konten: 'Video Pendek', pillar: '', hook_angle: '', product_id: '', konteks: '' }
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
  const [affStep, setAffStep] = useState<'produk' | 'usp' | 'config' | 'naskah'>('produk')
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

    return `Kamu adalah scriptwriter konten media sosial Indonesia yang spesialis membuat naskah yang hook kuat, natural, dan convert.

Buat naskah lengkap untuk 1 konten. Jawab dalam Bahasa Indonesia yang sesuai tone dan platform.

---

DATA BRAND
Niche: ${niche}
Premis: ${premis}
Tone of voice: ${tone}
Target audiens: ${audiens}${affiliateContext}

SPESIFIKASI KONTEN
Platform: ${platform}
Format: ${tipe}
Pillar konten: ${pillar}
Hook angle: ${hookAngle}
Konteks tambahan: ${konteks}
${productSection}
---

OUTPUT YANG DIBUTUHKAN:

▸ HOOK (3-5 detik pertama)
3 variasi hook — pilih yang paling kuat. Format per variasi: [Visual] + [Teks/Voiceover]

▸ BODY SCRIPT
Naskah lengkap dengan timestamp (misal 0:03 - 0:15). Tulis persis seperti yang akan diucapkan/ditampilkan.
${selectedProduct ? 'Sebutkan nama produk secara natural, bukan hard selling.' : ''}

▸ CTA (Call to Action)
2 variasi CTA yang natural untuk ${platform}

▸ CAPTION
Caption siap posting dengan emoji yang sesuai tone

▸ HASHTAG
10-15 hashtag relevan (mix: niche + broad + trending ${platform})

▸ TIPS EKSEKUSI
2-3 tips teknis untuk membuat konten ini perform di ${platform} (durasi, transisi, dll)

---

Tulis naskah yang terasa manusiawi, bukan seperti iklan.`
  }

  function buildUSPPrompt(): string {
    const selectedProduct = products.find(p => p.id === affForm.product_id)
    const nama = selectedProduct?.nama || 'Produk'
    const deskripsi = affForm.deskripsi_produk || '[paste deskripsi produk]'
    const kategori = selectedProduct?.kategori || brandProfile?.affiliate_kategori_fokus?.join(', ') || '-'
    return `Kamu adalah product analyst dan marketing strategist yang spesialis menganalisis produk untuk keperluan konten affiliate Indonesia.

Analisis produk berikut dan berikan output yang bisa langsung dipakai untuk membuat konten.

---

PRODUK
Nama: ${nama}
Kategori: ${kategori}
Deskripsi/spesifikasi:
${deskripsi}

---

OUTPUT YANG DIBUTUHKAN:

▸ USP (Unique Selling Proposition)
3-5 poin USP terkuat produk ini — apa yang bikin produk ini layak direkomendasiin, bukan sekadar fitur tapi manfaat nyata untuk pembeli

▸ PAIN POINTS YANG DISELESAIKAN
3-4 masalah nyata yang dialami calon pembeli yang diselesaikan produk ini — pakai bahasa yang relate

▸ TARGET SEGMEN
Siapa yang paling cocok beli produk ini? (usia, gender, situasi, behavior) — spesifik, bukan generik

▸ ANGLE PROMOSI TERKUAT
3 angle konten yang paling potensial untuk produk ini (masing-masing 1 kalimat konsep)

▸ OBJECTION HANDLING
2-3 keberatan umum calon pembeli + cara handle natural di konten (bukan hard sell)

▸ KATA KUNCI EMOSIONAL
10 kata/frasa yang trigger emotion calon pembeli untuk kategori produk ini

---

Format: per seksi, singkat, langsung ke poin. Bahasa Indonesia yang natural.`
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

🎬 VISUAL HOOK (0:00-0:03)
[Deskripsi visual yang menarik perhatian dalam 3 detik pertama menggunakan strategi: ${affForm.visual_hook}]

🗣️ HOOK VERBAL (0:00-0:03)
[Kalimat pembuka yang terucap — harus bikin orang BERHENTI scroll. Pakai formula ${affForm.formula_copywriting}.]

📜 NASKAH LENGKAP
[Script dengan timestamp, sesuai ${affForm.target_durasi}. Format:
- 0:00-0:03 Hook
- 0:03-... Body (bangun interest/desire, sebutkan produk secara natural, bukan di detik pertama)
- ...  Proof/testimoni pendek / objection handle
- Akhir: CTA]

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
    platform: string, tipe: string, mode: 'affiliate' | 'creator'
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
    }).select('id').single()
    if (!err && inserted) {
      await supabase.from('kf_notifications').insert({
        workspace_id: workspaceId,
        type: 'produksi',
        title: `Mulai Produksi — ${judul}`,
        message: `Naskah sudah siap. Buka Studio untuk mulai desain/produksi.`,
        content_idea_id: inserted.id,
      })
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
    const matchingDraft = affForm.product_id ? sprintDrafts.find(d => d.product_id === affForm.product_id) : null
    if (matchingDraft) {
      setSprintLinkModal({ draft: matchingDraft, naskah: affNaskah, judul, productId: affForm.product_id, platform: affForm.platform, tipe: affForm.tipe_konten, mode: 'affiliate' })
      return
    }
    await _doInsertNaskah(affNaskah, judul, affForm.product_id, affForm.platform, affForm.tipe_konten, 'affiliate')
  }

  async function saveToLibrary() {
    if (!generatedNaskah.trim()) return
    setSavedToLibrary(false)
    const judul = `[${naskahForm.platform}] ${naskahForm.pillar || naskahForm.tipe_konten} — ${new Date().toLocaleDateString('id-ID')}`
    const matchingDraft = naskahForm.product_id ? sprintDrafts.find(d => d.product_id === naskahForm.product_id) : null
    if (matchingDraft) {
      setSprintLinkModal({ draft: matchingDraft, naskah: generatedNaskah, judul, productId: naskahForm.product_id, platform: naskahForm.platform, tipe: naskahForm.tipe_konten, mode: 'creator' })
      return
    }
    await _doInsertNaskah(generatedNaskah, judul, naskahForm.product_id, naskahForm.platform, naskahForm.tipe_konten, 'creator')
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
      title: `📝 Naskah Siap — ${sprintLinkModal.judul}`,
      message: `Naskah selesai dibuat. Lanjut ke Take Video / Produksi di Studio.`,
      content_idea_id: draft.id,
    })
    setSprintLinkSaving(false)
    setSprintLinkModal(null)
    if (mode === 'affiliate') { setAffSavedToLibrary(true); setTimeout(() => setAffSavedToLibrary(false), 3000) }
    else { setSavedToLibrary(true); setTimeout(() => setSavedToLibrary(false), 3000) }
  }

  async function confirmSaveNew() {
    if (!sprintLinkModal) return
    setSprintLinkSaving(true)
    const { naskah, judul, productId, platform, tipe, mode } = sprintLinkModal
    setSprintLinkModal(null)
    setSprintLinkSaving(false)
    await _doInsertNaskah(naskah, judul, productId, platform, tipe, mode)
  }

  function copyPrompt(prompt: string) {
    navigator.clipboard.writeText(prompt)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  function setPlatformField(platform: string, key: keyof PlatformPlan, value: string | boolean | number | string[]) {
    setPlatforms(prev => prev.map(p => p.platform === platform ? { ...p, [key]: value } : p))
  }

  function toggleWaktu(platform: string, time: string) {
    const p = platforms.find(x => x.platform === platform)
    if (!p) return
    const curr = p.waktu_terbaik || []
    setPlatformField(platform, 'waktu_terbaik', curr.includes(time) ? curr.filter(t => t !== time) : [...curr, time])
  }

  async function savePlatform(platform: string) {
    setSaving(platform)
    const supabase = createClient()
    const p = platforms.find(x => x.platform === platform)!
    const payload = {
      ...p,
      workspace_id: workspaceId,
      target_followers: Number(p.target_followers) || 0,
      target_reach: Number(p.target_reach) || 0,
      frekuensi_per_minggu: Number(p.frekuensi_per_minggu) || 0,
    }
    if (p.id) {
      await supabase.from('kf_plan_platforms').update(payload).eq('id', p.id)
    } else {
      const { data } = await supabase.from('kf_plan_platforms').insert(payload).select('id').single()
      if (data) setPlatformField(platform, 'id', data.id)
    }
    setSaving(null)
    setSavedPlatform(platform)
    setTimeout(() => setSavedPlatform(null), 2000)
  }

  function openAddCampaign() { setModal({ open: true, campaign: emptyCampaign(workspaceId) }); setError('') }
  function openEditCampaign(c: Campaign) { setModal({ open: true, campaign: { ...c } }); setError('') }
  function closeModal() { setModal(null) }
  function setCampField(key: keyof Campaign, value: string | string[] | number) { setModal(m => m ? { ...m, campaign: { ...m.campaign, [key]: value } } : m) }
  function togglePlatform(p: string) {
    if (!modal) return
    const curr = modal.campaign.platforms
    setCampField('platforms', curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p])
  }

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    setSavingCampaign(true)
    setError('')
    const supabase = createClient()
    const c = { ...modal.campaign, workspace_id: workspaceId, budget: Number(modal.campaign.budget) || 0 }
    if (c.id) {
      const { error: err } = await supabase.from('kf_campaigns').update(c).eq('id', c.id)
      if (err) { setError(err.message); setSavingCampaign(false); return }
      setCampaigns(prev => prev.map(x => x.id === c.id ? c : x))
    } else {
      const { data, error: err } = await supabase.from('kf_campaigns').insert(c).select('id').single()
      if (err) { setError(err.message); setSavingCampaign(false); return }
      setCampaigns(prev => [{ ...c, id: data.id }, ...prev])
    }
    setSavingCampaign(false)
    closeModal()
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Hapus campaign ini?')) return
    const supabase = createClient()
    await supabase.from('kf_campaigns').delete().eq('id', id)
    setCampaigns(prev => prev.filter(x => x.id !== id))
  }

  const STATUS_COLOR: Record<string, string> = { Planning: '#93c5fd', Active: '#86efac', Completed: '#42a5f5', Cancelled: '#5a6a85' }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#2a3547', letterSpacing: '-0.5px', marginBottom: 6 }}>Plan</h1>
        <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Strategi platform dan rencana campaign konten kamu</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #e5eaf2' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #1a73e8' : '2px solid transparent', color: tab === t.id ? '#1a73e8' : '#5a6a85', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Naskah Generator ── */}
      {tab === 'naskah' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!brandProfile?.niche && (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Lengkapi modul <a href="/brand" style={{ color: '#f59e0b', fontWeight: 700 }}>Brand</a> dulu agar prompt AI lebih akurat dan sesuai identitas kamu.
            </div>
          )}

          {/* Mode switcher — hanya tampil kalau isAffiliate */}
          {isAffiliate && (
            <div style={{ display: 'flex', gap: 0, background: '#fff', border: '1px solid #e5eaf2', borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' }}>
              {[{ id: 'creator', label: 'Creator' }, { id: 'affiliate', label: 'Affiliator' }].map(m => (
                <button key={m.id} type="button" onClick={() => setNaskahMode(m.id as 'creator' | 'affiliate')}
                  style={{ padding: '9px 22px', border: 'none', background: naskahMode === m.id ? 'linear-gradient(135deg, #1a73e8, #42a5f5)' : 'transparent', color: naskahMode === m.id ? '#fff' : '#64748b', fontSize: '0.85rem', fontWeight: naskahMode === m.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* ── CREATOR FLOW ── */}
          {naskahMode === 'creator' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Form kiri */}
              <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#2a3547', marginBottom: 4 }}>Konfigurasi Naskah</div>
                  <div style={{ fontSize: '0.78rem', color: '#5a6a85' }}>Isi detail konten → Generate → paste hasil AI di kanan</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Platform</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['TikTok', 'Instagram', 'YouTube', 'Facebook', 'LinkedIn'].map(pl => (
                      <button key={pl} type="button" onClick={() => setNF('platform', pl)}
                        style={{ padding: '6px 12px', borderRadius: 7, border: `1px solid ${naskahForm.platform === pl ? '#1a73e8' : '#e5eaf2'}`, background: naskahForm.platform === pl ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: naskahForm.platform === pl ? '#42a5f5' : '#64748b', fontSize: '0.78rem', cursor: 'pointer', fontWeight: naskahForm.platform === pl ? 600 : 400 }}>
                        {pl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Format Konten</label>
                  <select style={fieldStyle({ fontSize: '0.82rem' })} value={naskahForm.tipe_konten} onChange={e => setNF('tipe_konten', e.target.value)}>
                    {['Video Pendek', 'Reels', 'Carousel', 'Story', 'Live Script', 'Long Video', 'Thread/Caption'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Pillar / Tema Konten</label>
                  {brandProfile?.affiliate_content_pillars ? (
                    <div style={{ marginBottom: 8 }}>
                      {brandProfile.affiliate_content_pillars.split('\n').filter(l => l.trim()).slice(0, 6).map((line, i) => {
                        const label = line.replace(/^\d+\.\s*/, '').split('—')[0].trim()
                        return (
                          <button key={i} type="button" onClick={() => setNF('pillar', label)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', marginBottom: 4, borderRadius: 7, border: `1px solid ${naskahForm.pillar === label ? '#34d399' : '#e5eaf2'}`, background: naskahForm.pillar === label ? 'rgba(52,211,153,0.1)' : '#f1f5f9', color: naskahForm.pillar === label ? '#34d399' : '#64748b', fontSize: '0.78rem', cursor: 'pointer' }}>
                            {line.replace(/^\d+\.\s*/, '')}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                  <input style={fieldStyle({ fontSize: '0.82rem' })} value={naskahForm.pillar} onChange={e => setNF('pillar', e.target.value)} placeholder="atau ketik tema bebas..." />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Hook Angle</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Shock/Surprised', 'Problem-first', 'Result-first', 'Story', 'Question', 'Warning', 'Comparison', 'Social proof'].map(h => (
                      <button key={h} type="button" onClick={() => setNF('hook_angle', naskahForm.hook_angle === h ? '' : h)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${naskahForm.hook_angle === h ? '#1a73e8' : '#e5eaf2'}`, background: naskahForm.hook_angle === h ? 'rgba(26,115,232,0.12)' : '#f1f5f9', color: naskahForm.hook_angle === h ? '#42a5f5' : '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {isAffiliate && products.filter(p => p.tipe_produk === 'Affiliate').length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Produk Affiliate <span style={{ color: '#5a6a85', fontWeight: 400 }}>(opsional)</span></label>
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
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600 }}>Konteks Tambahan <span style={{ color: '#5a6a85', fontWeight: 400 }}>(opsional)</span></label>
                  <textarea style={fieldStyle({ height: 70, resize: 'none', fontSize: '0.82rem' })} value={naskahForm.konteks} onChange={e => setNF('konteks', e.target.value)} placeholder="cth: konten untuk moment lebaran, target ibu-ibu, durasi maks 30 detik..." />
                </div>

                {brandProfile?.niche && (
                  <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 14px', fontSize: '0.72rem', color: '#5a6a85', lineHeight: 1.7 }}>
                    <div style={{ color: '#5a6a85', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Brand context</div>
                    <div>Niche: <span style={{ color: '#5a6a85' }}>{brandProfile.niche}</span></div>
                    {brandProfile.tone_of_voice && <div>Tone: <span style={{ color: '#5a6a85' }}>{brandProfile.tone_of_voice}</span></div>}
                    {brandProfile.target_audiens && <div>Audiens: <span style={{ color: '#5a6a85' }}>{brandProfile.target_audiens}</span></div>}
                  </div>
                )}

                <button type="button" onClick={() => setAiModal({ prompt: buildNaskahPrompt() })}
                  style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Generate Naskah dengan AI
                </button>
              </div>

              {/* Output kanan */}
              <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#2a3547', marginBottom: 2 }}>Hasil Naskah</div>
                    <div style={{ fontSize: '0.78rem', color: '#5a6a85' }}>Paste hasil dari AI di sini</div>
                  </div>
                  {generatedNaskah && (
                    <button type="button" onClick={saveToLibrary}
                      style={{ background: savedToLibrary ? 'rgba(52,211,153,0.15)' : 'rgba(26,115,232,0.12)', border: `1px solid ${savedToLibrary ? '#34d399' : '#1a73e8'}`, borderRadius: 8, padding: '7px 14px', color: savedToLibrary ? '#34d399' : '#42a5f5', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      {savedToLibrary ? '✓ Tersimpan di Library' : '💾 Simpan ke Library'}
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
                  <div style={{ fontSize: '0.7rem', color: '#5a6a85' }}>{generatedNaskah.length} karakter · {generatedNaskah.split(/\s+/).filter(Boolean).length} kata</div>
                )}
              </div>
            </div>
          )}

          {/* ── AFFILIATE FLOW ── */}
          {naskahMode === 'affiliate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>

              {/* STEP 01 — Data Produk */}
              <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e5eaf2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 22, borderRadius: 2, background: '#ec4899' }} />
                    <span style={{ fontWeight: 700, color: '#2a3547', fontSize: '1.05rem' }}>Data Produk</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5a6a85', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 5, padding: '3px 10px', letterSpacing: '0.08em' }}>STEP 01</span>
                </div>
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Pilih dari katalog */}
                  {products.length > 0 ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pilih dari Katalog <span style={{ color: '#5a6a85', fontWeight: 400, textTransform: 'none' }}>(auto-isi deskripsi)</span></label>
                      <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.product_id} onChange={e => {
                        const pid = e.target.value
                        const prod = products.find(p => p.id === pid)
                        setAffForm(f => ({ ...f, product_id: pid, deskripsi_produk: prod?.deskripsi || f.deskripsi_produk, niche_produk: prod?.kategori || f.niche_produk }))
                      }}>
                        <option value="">— Pilih produk dari katalog —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nama}{p.platform_affiliate ? ` (${p.platform_affiliate})` : ''}{!p.deskripsi ? ' (*)' : ''}</option>)}
                      </select>
                      {products.some(p => !p.deskripsi) && (
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 4 }}>Produk bertanda (*) belum ada deskripsi — lengkapi di <a href="/catalog" style={{ color: '#f59e0b', fontWeight: 700 }}>Katalog</a> agar auto-isi berfungsi.</div>
                      )}
                      {affForm.product_id && (() => {
                        const prod = products.find(p => p.id === affForm.product_id)
                        return prod ? <SprintBanner tasks={tasks} productName={prod.nama} /> : null
                      })()}
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b' }}>
                      Belum ada produk di katalog. <a href="/catalog" style={{ color: '#f59e0b', fontWeight: 700 }}>Tambah produk →</a> Pastikan isi kolom Deskripsi agar bisa auto-fill di sini.
                    </div>
                  )}

                  {/* Deskripsi produk */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deskripsi Produk (Input)</label>
                    <textarea
                      style={fieldStyle({ minHeight: 140, resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.7 })}
                      value={affForm.deskripsi_produk}
                      onChange={e => setAFF('deskripsi_produk', e.target.value)}
                      placeholder={'Paste detail produk di sini... (Contoh: Serum Vitamin C 20ml, mencerahkan dalam 7 hari, aman untuk bumil, tekstur cair, harga Rp 89.000, beli di Shopee...)'}
                    />
                  </div>

                  {/* Generate USP button */}
                  <button type="button" onClick={() => setAffAiModal({ prompt: buildUSPPrompt(), label: 'Analisis USP Produk' })}
                    style={{ background: 'transparent', border: '1px solid #ec4899', borderRadius: 20, padding: '14px 20px', color: '#ec4899', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}>
                    GENERATE USP (AI ANALYSIS)
                  </button>

                  {/* USP result paste area */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasil Analisis USP <span style={{ color: '#5a6a85', fontWeight: 400, textTransform: 'none' }}>(paste dari AI)</span></label>
                    <textarea
                      style={fieldStyle({ minHeight: 140, resize: 'vertical', fontSize: '0.82rem', lineHeight: 1.7, border: `1px solid ${affForm.usp ? '#ec489940' : '#e5eaf2'}`, color: affForm.usp ? '#2a3547' : '#5a6a85' })}
                      value={affForm.usp}
                      onChange={e => setAFF('usp', e.target.value)}
                      placeholder={'Paste hasil analisis USP dari AI di sini...\n\nHasil akan mencakup: USP, pain points, target segmen, angle promosi, objection handling, kata kunci emosional'}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 02 — Konfigurasi */}
              <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e5eaf2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 22, borderRadius: 2, background: '#38bdf8' }} />
                    <span style={{ fontWeight: 700, color: '#2a3547', fontSize: '1.05rem' }}>Konfigurasi</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5a6a85', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 5, padding: '3px 10px', letterSpacing: '0.08em' }}>STEP 02</span>
                </div>
                <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Formula Copywriting */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formula Copywriting</label>
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

                  {/* Niche Produk */}
                  {(() => {
                    const NICHE_PRESETS = ['Kecantikan & Skincare', 'Fashion & Style', 'Kesehatan & Suplemen', 'Makanan & Minuman', 'Peralatan Rumah', 'Gadget & Elektronik', 'Mainan Anak', 'Olahraga & Fitness', 'Otomotif', 'Buku & Edukasi', 'Bisnis & Produktivitas', 'Perawatan Bayi', 'Travel & Outdoor', 'Hewan Peliharaan', ...(brandProfile?.affiliate_kategori_fokus || [])]
                    const isCustomNiche = affForm.niche_produk !== '' && !NICHE_PRESETS.includes(affForm.niche_produk)
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niche Produk</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustomNiche ? '' : affForm.niche_produk} onChange={e => setAFF('niche_produk', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {NICHE_PRESETS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustomNiche ? '#2a3547' : '#5a6a85' })} value={isCustomNiche ? affForm.niche_produk : ''} onChange={e => setAFF('niche_produk', e.target.value)} placeholder="atau ketik niche kustom sendiri..." />
                      </div>
                    )
                  })()}

                  {/* Target Audiens + Gender */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      {(() => {
                        const AUDIENS_PRESETS = ['Gen Z (17-24)', 'Millennial (25-35)', 'Gen X (36-50)', 'Semua Usia', 'Remaja (< 17)', 'Senior (50+)', 'Ibu Rumah Tangga', 'Profesional Muda', 'Pelajar/Mahasiswa']
                        const isCustom = affForm.target_audiens !== '' && !AUDIENS_PRESETS.includes(affForm.target_audiens)
                        return <>
                          <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Audiens</label>
                          <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.target_audiens} onChange={e => setAFF('target_audiens', e.target.value)}>
                            {AUDIENS_PRESETS.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <input style={fieldStyle({ fontSize: '0.78rem', marginTop: 6, color: isCustom ? '#2a3547' : '#5a6a85' })} value={isCustom ? affForm.target_audiens : ''} onChange={e => setAFF('target_audiens', e.target.value)} placeholder="ketik segmen spesifik..." />
                        </>
                      })()}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</label>
                      <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.gender} onChange={e => setAFF('gender', e.target.value)}>
                        {['Semua', 'Wanita', 'Pria'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Target Durasi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Durasi</label>
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
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Style Call to Action</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.cta_style} onChange={e => setAFF('cta_style', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {CTA_PRESETS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustom ? '#2a3547' : '#5a6a85' })} value={isCustom ? affForm.cta_style : ''} onChange={e => setAFF('cta_style', e.target.value)} placeholder="atau ketik style CTA kustom..." />
                      </div>
                    )
                  })()}

                  {/* Fokus Konversi */}
                  {(() => {
                    const KONVERSI_PRESETS = ['Benefit Only', 'Urgency/FOMO (stok terbatas, promo habis)', 'Social Proof (testimoni, rating)', 'Before-After Transformation', 'Pain Point → Solution', 'Price Value (mahal di luar, murah di sini)', 'Exclusivity (susah dicari)', 'Curiosity Gap (penasarin dulu)']
                    const isCustom = affForm.fokus_konversi !== '' && !KONVERSI_PRESETS.includes(affForm.fokus_konversi)
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fokus Konversi (Trigger)</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.fokus_konversi} onChange={e => setAFF('fokus_konversi', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {KONVERSI_PRESETS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustom ? '#2a3547' : '#5a6a85' })} value={isCustom ? affForm.fokus_konversi : ''} onChange={e => setAFF('fokus_konversi', e.target.value)} placeholder="atau ketik trigger kustom..." />
                      </div>
                    )
                  })()}

                  {/* Visual Hook Strategy */}
                  {(() => {
                    const VISUAL_PRESETS = ['Talking Head (muka depan kamera)', 'Demo Produk (tampilkan produk langsung)', 'Text Overlay (teks di layar)', 'POV / First Person', 'Audio Driven (suara dominan)', 'B-Roll dengan Voiceover', 'Before-After Visual', 'Reaction Video', 'Unboxing']
                    const isCustom = affForm.visual_hook !== '' && !VISUAL_PRESETS.includes(affForm.visual_hook)
                    return (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual Hook Strategy</label>
                        <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.visual_hook} onChange={e => setAFF('visual_hook', e.target.value)}>
                          <option value="">— Pilih dari daftar —</option>
                          {VISUAL_PRESETS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <input style={fieldStyle({ fontSize: '0.8rem', marginTop: 6, color: isCustom ? '#2a3547' : '#5a6a85' })} value={isCustom ? affForm.visual_hook : ''} onChange={e => setAFF('visual_hook', e.target.value)} placeholder="atau ketik strategi visual kustom..." />
                      </div>
                    )
                  })()}

                  {/* Platform + Format */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</label>
                      <select style={fieldStyle({ fontSize: '0.85rem' })} value={affForm.platform} onChange={e => setAFF('platform', e.target.value)}>
                        {['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee Video', 'LinkedIn'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      {(() => {
                        const FORMAT_PRESETS = ['Video Pendek', 'Reels', 'Story', 'Live Script', 'Thread/Caption', 'Carousel']
                        const isCustom = affForm.tipe_konten !== '' && !FORMAT_PRESETS.includes(affForm.tipe_konten)
                        return <>
                          <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format Konten</label>
                          <select style={fieldStyle({ fontSize: '0.85rem' })} value={isCustom ? '' : affForm.tipe_konten} onChange={e => setAFF('tipe_konten', e.target.value)}>
                            <option value="">— Pilih —</option>
                            {FORMAT_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <input style={fieldStyle({ fontSize: '0.78rem', marginTop: 6, color: isCustom ? '#2a3547' : '#5a6a85' })} value={isCustom ? affForm.tipe_konten : ''} onChange={e => setAFF('tipe_konten', e.target.value)} placeholder="atau format kustom..." />
                        </>
                      })()}
                    </div>
                  </div>

                  {/* Konteks tambahan */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Konteks Tambahan <span style={{ color: '#5a6a85', fontWeight: 400, textTransform: 'none' }}>(opsional)</span></label>
                    <textarea style={fieldStyle({ height: 70, resize: 'none', fontSize: '0.82rem' })} value={affForm.konteks} onChange={e => setAFF('konteks', e.target.value)} placeholder="cth: momen harbolnas, buat campaign ramadan, target ibu-ibu yang suka masak..." />
                  </div>

                  {/* Jumlah Varian — free input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jumlah Varian Naskah</label>
                    <input type="number" style={fieldStyle({ fontSize: '0.9rem', textAlign: 'center' as const })} value={affForm.jumlah_varian} onChange={e => setAFF('jumlah_varian', e.target.value)} min="1" max="20" placeholder="3" />
                    <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginTop: 4 }}>Tiap varian punya hook, angle, dan story yang berbeda. Rekomendasi: 2-3.</div>
                  </div>

                  {/* Compile Scripts button */}
                  <button type="button" onClick={() => setAffAiModal({ prompt: buildAffNaskahPrompt(), label: 'Compile Scripts' })}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 20, padding: '16px 20px', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: '1.1rem' }}>⚗️</span> COMPILE SCRIPTS
                  </button>
                </div>
              </div>

              {/* Output hasil naskah */}
              <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#2a3547', marginBottom: 2 }}>Hasil Naskah</div>
                    <div style={{ fontSize: '0.78rem', color: '#5a6a85' }}>Paste hasil dari AI di sini, lalu simpan ke Library</div>
                  </div>
                  {affNaskah && (
                    <button type="button" onClick={saveAffToLibrary}
                      style={{ background: affSavedToLibrary ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.12)', border: `1px solid ${affSavedToLibrary ? '#34d399' : '#6366f1'}`, borderRadius: 8, padding: '7px 14px', color: affSavedToLibrary ? '#34d399' : '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      {affSavedToLibrary ? '✓ Tersimpan di Library' : '💾 Simpan ke Library'}
                    </button>
                  )}
                </div>
                <textarea
                  ref={affNaskahRef}
                  style={fieldStyle({ minHeight: 360, resize: 'none', fontSize: '0.82rem', lineHeight: '1.7', fontFamily: 'inherit' })}
                  value={affNaskah}
                  onChange={e => setAffNaskah(e.target.value)}
                  placeholder={'Klik "COMPILE SCRIPTS" → pilih AI favorit → paste hasilnya di sini.\n\nAI akan memberikan:\n• Hook options (visual + verbal)\n• Naskah lengkap dengan timestamp\n• Variasi CTA\n• Caption siap posting\n• Hashtag\n• Rekomendasi varian terkuat'}
                />
                {affNaskah && (
                  <div style={{ fontSize: '0.7rem', color: '#5a6a85' }}>{affNaskah.length} karakter · {affNaskah.split(/\s+/).filter(Boolean).length} kata</div>
                )}
              </div>

              {/* STEP 03 — Alur Produksi (muncul setelah naskah diisi) */}
              {affNaskah.trim() && (() => {
                const PROD_STEPS = [
                  { id: 'naskah', label: 'Naskah / Script', icon: '📝', desc: 'Naskah sudah siap', autoCheck: true },
                  { id: 'take_video', label: 'Take Video', icon: '🎬', desc: 'Rekam video utama sesuai naskah' },
                  { id: 'broll_vo', label: 'B-roll / Voice Over', icon: '🎥', desc: 'Opsional — tambahan visual atau dubbing', optional: true },
                  { id: 'editing', label: 'Editing', icon: '✂️', desc: 'Edit, potong, tambah teks & musik' },
                  { id: 'schedule', label: 'Schedule Post', icon: '📅', desc: 'Jadwalkan posting di waktu terbaik' },
                ]
                return (
                  <div style={{ background: '#fff', border: '1px solid #1e3a2f', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #e5eaf2', background: 'rgba(52,211,153,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 4, height: 22, borderRadius: 2, background: '#34d399' }} />
                        <span style={{ fontWeight: 700, color: '#2a3547', fontSize: '1.05rem' }}>Alur Produksi</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5a6a85', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 5, padding: '3px 10px', letterSpacing: '0.08em' }}>STEP 03</span>
                    </div>
                    <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6 }}>Centang setiap step yang sudah selesai — pantau progress konten ini di Library.</div>
                      {PROD_STEPS.map((step, i) => {
                        const done = step.autoCheck || !!affProdSteps[step.id]
                        return (
                          <div key={step.id} onClick={() => !step.autoCheck && toggleProdStep(step.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: done ? 'rgba(52,211,153,0.06)' : '#f1f5f9', border: `1px solid ${done ? '#34d39920' : '#e5eaf2'}`, cursor: step.autoCheck ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                            {/* step number / check */}
                            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#34d399' : '#e5eaf2', transition: 'background 0.2s' }}>
                              {done ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <span style={{ fontSize: '0.65rem', color: '#5a6a85', fontWeight: 700 }}>{i + 1}</span>
                              )}
                            </div>
                            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{step.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: done ? '#34d399' : '#94a3b8', fontSize: '0.875rem' }}>
                                {step.label}
                                {step.optional && <span style={{ fontSize: '0.68rem', color: '#5a6a85', fontWeight: 400, marginLeft: 6 }}>(opsional)</span>}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>{step.desc}</div>
                            </div>
                            {i < PROD_STEPS.length - 1 && !step.autoCheck && (
                              <div style={{ fontSize: '0.7rem', color: done ? '#34d39960' : '#e5eaf2', flexShrink: 0 }}>
                                {done ? 'Done ✓' : 'Tap'}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                        {affSavedToLibrary ? (
                          <div style={{ flex: 1, background: 'rgba(52,211,153,0.08)', border: '1px solid #34d39930', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>✓ Tersimpan di Library</span>
                            <a href="/library" style={{ fontSize: '0.78rem', color: '#5a6a85', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Lihat di Library
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                            </a>
                          </div>
                        ) : (
                          <button type="button" onClick={saveAffToLibrary} style={{ flex: 1, background: 'linear-gradient(135deg, #059669, #34d399)', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            💾 Simpan ke Library & Mulai Produksi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Platform Strategy */}
      {tab === 'platforms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {platforms.map(p => (
            <div key={p.platform} style={{ background: '#fff', border: `1px solid ${p.is_active ? 'rgba(26,115,232,0.3)' : '#e5eaf2'}`, borderRadius: 20, overflow: 'hidden' }}>
              {/* Platform Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: p.is_active ? '1px solid #e5eaf2' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, color: p.is_active ? '#2a3547' : '#5a6a85', fontSize: '0.95rem' }}>{p.platform}</span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, color: p.is_active ? '#86efac' : '#5a6a85', background: p.is_active ? 'rgba(134,239,172,0.1)' : '#f1f5f9', fontWeight: 600 }}>
                    {p.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.8rem', color: '#5a6a85' }}>{p.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  <div onClick={() => setPlatformField(p.platform, 'is_active', !p.is_active)}
                    style={{ width: 36, height: 20, borderRadius: 10, background: p.is_active ? '#1a73e8' : '#e5eaf2', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: p.is_active ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                </label>
              </div>

              {p.is_active && (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tujuan Platform</label>
                      <select style={{ ...fieldStyle(), cursor: 'pointer', fontSize: '0.8rem' }} value={p.tujuan} onChange={e => setPlatformField(p.platform, 'tujuan', e.target.value)}>
                        <option value="">Pilih tujuan</option>
                        {TUJUAN.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Target Followers</label>
                      <input type="number" style={fieldStyle({ fontSize: '0.8rem' })} value={p.target_followers} onChange={e => setPlatformField(p.platform, 'target_followers', e.target.value)} placeholder="10000" min="0" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Target Reach/bulan</label>
                      <input type="number" style={fieldStyle({ fontSize: '0.8rem' })} value={p.target_reach} onChange={e => setPlatformField(p.platform, 'target_reach', e.target.value)} placeholder="50000" min="0" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Posting/minggu</label>
                      <input type="number" style={fieldStyle({ fontSize: '0.8rem' })} value={p.frekuensi_per_minggu} onChange={e => setPlatformField(p.platform, 'frekuensi_per_minggu', e.target.value)} placeholder="5" min="1" max="21" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tipe Konten Prioritas</label>
                      <select style={{ ...fieldStyle(), cursor: 'pointer', fontSize: '0.8rem' }} value={p.tipe_konten_prioritas} onChange={e => setPlatformField(p.platform, 'tipe_konten_prioritas', e.target.value)}>
                        <option value="">Pilih tipe</option>
                        {TIPE_KONTEN.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#5a6a85', marginBottom: 8, fontWeight: 500 }}>Waktu Terbaik Posting</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {WAKTU.map(t => (
                        <button key={t} type="button" onClick={() => toggleWaktu(p.platform, t)}
                          style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, border: p.waktu_terbaik?.includes(t) ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: p.waktu_terbaik?.includes(t) ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: p.waktu_terbaik?.includes(t) ? '#42a5f5' : '#5a6a85', cursor: 'pointer' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => savePlatform(p.platform)} disabled={saving === p.platform}
                      style={{ background: savedPlatform === p.platform ? '#166534' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}>
                      {saving === p.platform ? 'Menyimpan...' : savedPlatform === p.platform ? '✓ Tersimpan' : 'Simpan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Campaign Planner */}
      {tab === 'campaigns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={openAddCampaign} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              + Tambah Campaign
            </button>
          </div>
          {campaigns.length === 0 ? (
            <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: 48, textAlign: 'center', color: '#5a6a85' }}>
              <div style={{ marginBottom: 12, color: '#c8d1e0' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
              <div style={{ fontWeight: 600, color: '#5a6a85', marginBottom: 6 }}>Belum ada campaign</div>
              <div style={{ fontSize: '0.85rem', marginBottom: 20 }}>Rencanakan campaign promo, kolaborasi, atau event khusus</div>
              <button onClick={openAddCampaign} style={{ background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                + Buat Campaign Pertama
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campaigns.map(c => (
                <div key={c.id} style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.9rem' }}>{c.nama}</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, color: STATUS_COLOR[c.status], background: `${STATUS_COLOR[c.status]}18`, fontWeight: 600 }}>{c.status}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginBottom: 6 }}>
                        {c.tanggal_mulai} → {c.tanggal_selesai || '?'} · {c.tujuan}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(c.platforms || []).map(p => <span key={p} style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#1a73e8', background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.2)' }}>{p}</span>)}
                        {Number(c.budget) > 0 && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 3, color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>Budget: Rp {Number(c.budget).toLocaleString('id-ID')}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEditCampaign(c)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid #1a73e8', borderRadius: 7, padding: '5px 10px', color: '#42a5f5', fontSize: '0.75rem', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteCampaign(c.id!)} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 7, padding: '5px 8px', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaign Modal */}
      {modal?.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2a3547' }}>{modal.campaign.id ? 'Edit Campaign' : 'Tambah Campaign'}</h2>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={saveCampaign} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Nama Campaign *</label>
                <input style={fieldStyle()} value={modal.campaign.nama} onChange={e => setCampField('nama', e.target.value)} placeholder="Harbolnas, Ramadan, Kolaborasi Brand..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Mulai</label>
                  <input type="date" style={fieldStyle()} value={modal.campaign.tanggal_mulai} onChange={e => setCampField('tanggal_mulai', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Selesai</label>
                  <input type="date" style={fieldStyle()} value={modal.campaign.tanggal_selesai} onChange={e => setCampField('tanggal_selesai', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Tujuan</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.campaign.tujuan ?? ''} onChange={e => setCampField('tujuan', e.target.value)}>
                    <option value="">Pilih tujuan</option>
                    {TUJUAN.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Status</label>
                  <select style={{ ...fieldStyle(), cursor: 'pointer' }} value={modal.campaign.status ?? 'Planning'} onChange={e => setCampField('status', e.target.value)}>
                    {CAMPAIGN_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Budget (Rp)</label>
                  <input type="number" style={fieldStyle()} value={modal.campaign.budget} onChange={e => setCampField('budget', e.target.value)} placeholder="0" min="0" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 8, fontWeight: 500 }}>Platform</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 500, border: modal.campaign.platforms.includes(p) ? '1px solid #1a73e8' : '1px solid #2a2a2a', background: modal.campaign.platforms.includes(p) ? 'rgba(26,115,232,0.15)' : '#f1f5f9', color: modal.campaign.platforms.includes(p) ? '#42a5f5' : '#64748b', cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '10px 20px', color: '#5a6a85', fontSize: '0.875rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={savingCampaign} style={{ background: savingCampaign ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: savingCampaign ? 'not-allowed' : 'pointer' }}>
                  {savingCampaign ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Picker Modal — Affiliate */}
      {affAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) { setAffAiModal(null); setAffPromptCopied(false) } }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '1.15rem', marginBottom: 6 }}>{affAiModal.label || '⚗️ Compile Scripts'}</div>
                <div style={{ fontSize: '0.82rem', color: '#5a6a85' }}>Pilih AI — prompt langsung terisi, paste hasilnya di kolom output</div>
              </div>
              <button type="button" onClick={() => { setAffAiModal(null); setAffPromptCopied(false) }} style={{ background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'ChatGPT', desc: 'OpenAI GPT-4o', icon: '🤖', color: '#10b981', url: `https://chatgpt.com/?q=${encodeURIComponent(affAiModal.prompt)}` },
                { label: 'Claude', desc: 'Anthropic Claude', icon: '✦', color: '#d97706', url: `https://claude.ai/new?q=${encodeURIComponent(affAiModal.prompt)}` },
                { label: 'Gemini', desc: 'Google Gemini', icon: '♊', color: '#3b82f6', url: `https://gemini.google.com/app?q=${encodeURIComponent(affAiModal.prompt)}` },
                { label: 'DeepSeek', desc: 'DeepSeek R1', icon: '🔮', color: '#8b5cf6', url: `https://chat.deepseek.com/?q=${encodeURIComponent(affAiModal.prompt)}` },
              ].map(ai => (
                <a key={ai.label} href={ai.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 20, border: `1px solid ${ai.color}30`, background: `${ai.color}08`, textDecoration: 'none' }}>
                  <span style={{ fontSize: '1.5rem', width: 32, textAlign: 'center', flexShrink: 0 }}>{ai.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: ai.color, fontSize: '0.95rem' }}>{ai.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#5a6a85', marginTop: 1 }}>{ai.desc}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ai.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
            <button type="button" onClick={() => { navigator.clipboard.writeText(affAiModal.prompt); setAffPromptCopied(true); setTimeout(() => setAffPromptCopied(false), 2000) }}
              style={{ background: 'transparent', border: 'none', color: affPromptCopied ? '#34d399' : '#5a6a85', fontSize: '0.78rem', cursor: 'pointer', padding: 0, textAlign: 'center' }}>
              {affPromptCopied ? '✓ Prompt berhasil dicopy!' : 'atau copy prompt manual →'}
            </button>
          </div>
        </div>
      )}

      {/* AI Picker Modal */}
      {aiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) { setAiModal(null); setPromptCopied(false) } }}>
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, width: '100%', maxWidth: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#2a3547', fontSize: '1.15rem', marginBottom: 6 }}>Generate Naskah</div>
                <div style={{ fontSize: '0.82rem', color: '#5a6a85' }}>Pilih AI — prompt langsung terisi, paste hasilnya di kolom kanan</div>
              </div>
              <button type="button" onClick={() => { setAiModal(null); setPromptCopied(false) }} style={{ background: '#f8fafc', border: '1px solid #e5eaf2', color: '#5a6a85', fontSize: '1rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'ChatGPT', desc: 'OpenAI GPT-4o', icon: '🤖', color: '#10b981', url: `https://chatgpt.com/?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'Claude', desc: 'Anthropic Claude', icon: '✦', color: '#d97706', url: `https://claude.ai/new?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'Gemini', desc: 'Google Gemini', icon: '♊', color: '#3b82f6', url: `https://gemini.google.com/app?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'DeepSeek', desc: 'DeepSeek R1', icon: '🔮', color: '#8b5cf6', url: `https://chat.deepseek.com/?q=${encodeURIComponent(aiModal.prompt)}` },
              ].map(ai => (
                <a key={ai.label} href={ai.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 20, border: `1px solid ${ai.color}30`, background: `${ai.color}08`, textDecoration: 'none' }}>
                  <span style={{ fontSize: '1.5rem', width: 32, textAlign: 'center', flexShrink: 0 }}>{ai.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: ai.color, fontSize: '0.95rem' }}>{ai.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#5a6a85', marginTop: 1 }}>{ai.desc}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ai.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
            <button type="button" onClick={() => copyPrompt(aiModal.prompt)}
              style={{ background: 'transparent', border: 'none', color: promptCopied ? '#34d399' : '#5a6a85', fontSize: '0.78rem', cursor: 'pointer', padding: 0, textAlign: 'center' }}>
              {promptCopied ? '✓ Prompt berhasil dicopy!' : 'atau copy prompt manual →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Sprint Link Modal ── */}
      {sprintLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2a3547', marginBottom: 8 }}>Slot Sprint Tersedia</div>
            <p style={{ color: '#5a6a85', fontSize: '0.875rem', marginBottom: 16, lineHeight: 1.5 }}>
              Ada slot konten di Sprint aktif untuk produk ini:
              <br />
              <span style={{ color: '#42a5f5', fontWeight: 600 }}>&ldquo;{sprintLinkModal.draft.judul}&rdquo;</span>
              <br /><br />
              Mau update slot sprint itu dengan naskah ini, atau simpan sebagai konten baru terpisah?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={confirmSprintUpdate}
                disabled={sprintLinkSaving}
                style={{ background: '#1a73e8', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.9rem', padding: '12px 0', cursor: sprintLinkSaving ? 'default' : 'pointer', opacity: sprintLinkSaving ? 0.6 : 1 }}
              >
                {sprintLinkSaving ? 'Menyimpan...' : '✓ Update Slot Sprint'}
              </button>
              <button
                onClick={confirmSaveNew}
                disabled={sprintLinkSaving}
                style={{ background: '#f1f5f9', border: '1px solid #e5eaf2', borderRadius: 10, color: '#5a6a85', fontWeight: 600, fontSize: '0.9rem', padding: '12px 0', cursor: sprintLinkSaving ? 'default' : 'pointer' }}
              >
                Simpan Sebagai Konten Baru
              </button>
              <button
                onClick={() => setSprintLinkModal(null)}
                disabled={sprintLinkSaving}
                style={{ background: 'transparent', border: 'none', color: '#5a6a85', fontSize: '0.8rem', cursor: 'pointer', padding: '6px 0' }}
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
