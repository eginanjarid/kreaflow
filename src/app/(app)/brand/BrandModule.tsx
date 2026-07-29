'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type BrandProfile = {
  id?: string
  workspace_id: string
  nama_akun: string
  platform_utama: string
  gaya_konten: string
  tipe_konten: string
  target_audiens: string
  tujuan_konten: string
  tone_of_voice: string
  suka: string
  bisa: string
  dibutuhkan: string
  peluang: string
  niche: string
  kategori: string
  micro_niche: string
  nama_akun_rekomendasi: string
  kelebihan: string
  kelemahan: string
  peluang_brand: string
  tantangan: string
  premis: string
  bio_tiktok: string
  bio_instagram: string
  bio_youtube: string
  bio_linkedin: string
  bio_facebook: string
  logo_main_url: string
  color_palette: string[]
  typography: string
  niche_options: NicheOption[]
  premis_options: PremisOption[]
  bio_options: BioOptions
  // Affiliator Brand fields
  affiliate_tipe: string
  affiliate_target_buyer: string
  affiliate_kategori_fokus: string[]
  affiliate_platforms: string[]
  affiliate_nama_options: AffNamaOption[]
  affiliate_tagline: string
  affiliate_positioning_statement: string
  affiliate_positioning: string
  affiliate_trust_builder: string
  affiliate_promo_style: string
  affiliate_hook_style: string
  affiliate_content_pillars: string
  affiliate_disclosure: string
  affiliate_bio_options: BioOption[]
}

type NicheOption = {
  id: string
  niche: string
  kategori: string
  micro_niche: string
  nama_akun: string
  is_primary: boolean
}

type PremisOption = {
  id: string
  teks: string
  format: string
  is_primary: boolean
}

type BioOption = { id: string; teks: string; is_primary: boolean }
type BioOptions = { tiktok?: BioOption[]; instagram?: BioOption[]; youtube?: BioOption[]; linkedin?: BioOption[]; facebook?: BioOption[] }
type AffNamaOption = { id: string; nama: string; alasan: string; is_primary: boolean }

const TABS_BASE = [
  { id: 'overview', label: 'Frekuensi', affiliateOnly: false },
  { id: 'identity', label: 'Account Identity', affiliateOnly: false },
  { id: 'niche', label: 'Niche Hunt', affiliateOnly: false },
  { id: 'story', label: 'Origin Story', affiliateOnly: false },
  { id: 'pillars', label: 'Content Pillars', affiliateOnly: false },
  { id: 'bio', label: 'Bio Studio', affiliateOnly: false },
  { id: 'visual', label: 'Brand Identity', affiliateOnly: false },
  { id: 'akun', label: 'Akun Sosial', affiliateOnly: false },
  { id: 'affiliate', label: 'Affiliator Brand', affiliateOnly: true },
]

const PLATFORMS_SOSMED = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee', 'Twitter/X', 'LinkedIn']
const MAX_AKUN = 10

type SosmedAkun = { id: string; platform: string; handle: string; nama: string }

const FREQ_LEVELS = [
  { id: 1, icon: 'ghost', name: 'Ghost', tagline: 'Kamu ada, tapi belum ada yang tahu.', desc: 'Brand kamu masih invisible. Orang tidak bisa menemukan, memahami, atau mengikutimu di mana pun.', color: '#6b7280', glow: 'rgba(71,85,105,0.3)' },
  { id: 2, icon: 'noise', name: 'Noise', tagline: 'Ada sinyal, tapi masih penuh gangguan.', desc: 'Kamu mulai aktif, tapi konten dan pesan kamu belum jelas. Audiens bingung kamu ini siapa dan ngomong apa.', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  { id: 3, name: 'Signal', tagline: 'Frekuensimu mulai tertangkap.', desc: 'Kamu sudah punya arah dan niche yang jelas. Orang mulai bisa "membaca" kamu dan tahu kamu ahli di bidang apa.', color: '#0284c7', glow: 'rgba(56,189,248,0.3)', icon: 'signal' },
  { id: 4, name: 'On Air', tagline: 'Siaran resmi dimulai.', desc: 'Brand kamu sudah live dan konsisten. Ada audiens yang actively menunggu kontenmu dan mempercayai kamu.', color: '#059669', glow: 'rgba(52,211,153,0.3)', icon: 'on-air' },
  { id: 5, name: 'Broadcast', tagline: 'Sinyalmu menjangkau jauh.', desc: 'Kamu sudah punya komunitas solid. Kontenmu dishare, dibahas, dan kamu jadi referensi di niche-mu.', color: '#a78bfa', glow: 'rgba(66,165,245,0.3)', icon: 'broadcast' },
  { id: 6, name: 'Icon Frequency', tagline: 'Frekuensimu tidak bisa diabaikan.', desc: 'Nama kamu IS the brand. Kamu sudah jadi simbol di niche-mu — orang sebut topiknya, mereka pikirin kamu.', color: '#f9a8d4', glow: 'rgba(249,168,212,0.4)', icon: 'icon-freq' },
]

const FREQ_CHECKS = [
  { key: 'nama_akun', label: 'Nama Akun', tab: 'identity' },
  { key: 'platform_utama', label: 'Platform Utama', tab: 'identity' },
  { key: 'gaya_konten', label: 'Gaya Konten', tab: 'identity' },
  { key: 'target_audiens', label: 'Target Audiens', tab: 'identity' },
  { key: 'tone_of_voice', label: 'Tone of Voice', tab: 'identity' },
  { key: 'suka', label: 'Apa yang Kamu Suka', tab: 'niche' },
  { key: 'bisa', label: 'Apa yang Kamu Bisa', tab: 'niche' },
  { key: 'dibutuhkan', label: 'Apa yang Dibutuhkan Orang', tab: 'niche' },
  { key: 'peluang', label: 'Peluang Penghasilan', tab: 'niche' },
  { key: 'niche', label: 'Niche Teridentifikasi', tab: 'niche' },
  { key: 'kategori', label: 'Kategori Konten', tab: 'niche' },
  { key: 'micro_niche', label: 'Micro-niche', tab: 'niche' },
  { key: 'kelebihan', label: 'Kelebihan Brand', tab: 'story' },
  { key: 'kelemahan', label: 'Kelemahan Brand', tab: 'story' },
  { key: 'premis', label: 'Origin Story / Premis', tab: 'story' },
  { key: 'bio_instagram', label: 'Bio Sosmed (minimal 1)', tab: 'bio' },
  { key: 'color_palette', label: 'Color Palette Brand', tab: 'visual' },
] as const

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']
const GAYA = ['Santai', 'Lucu', 'Edukatif', 'Profesional', 'Emosional']
const TIPE = ['Review', 'Story Telling', 'Tutorial', 'Tips & Tricks', 'Testimoni']
const AUDIENS = ['Remaja', 'Dewasa Muda', 'Profesional', 'Ibu Rumah Tangga', 'Pebisnis Online', 'Pencari Cuan']
const TUJUAN = ['Meningkatkan Penjualan', 'Klik Link', 'Engagement', 'Brand Awareness']
const TONE = ['Friendly', 'Profesional', 'Santai', 'Serius', 'Lucu', 'Emosional']

function MultiSelect({ label, options, value, onChange }: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  const selected = value ? value.split(',').filter(Boolean) : []
  function toggle(opt: string) {
    const next = selected.includes(opt)
      ? selected.filter(x => x !== opt)
      : [...selected, opt]
    onChange(next.join(','))
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
              border: selected.includes(opt) ? '1px solid #1a73e8' : 'none',
              background: selected.includes(opt) ? 'rgba(26,115,232,0.10)' : '#f3f4f6',
              color: selected.includes(opt) ? '#1a73e8' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SingleSelect({ label, options, value, onChange }: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500,
              border: value === opt ? '1px solid #1a73e8' : 'none',
              background: value === opt ? 'rgba(26,115,232,0.10)' : '#f3f4f6',
              color: value === opt ? '#1a73e8' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function fieldStyle(extra?: object) {
  return {
    width: '100%', background: '#f3f4f6', border: 'none',
    borderRadius: 8, padding: '10px 12px', color: '#111827',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const,
    ...extra,
  }
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        background: saved ? '#166534' : '#1a73e8',
        border: 'none', borderRadius: 10, padding: '11px 28px',
        color: '#fff', fontSize: '0.9rem', fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
      }}>
      {loading ? 'Menyimpan...' : saved ? '✓ Tersimpan' : 'Simpan'}
    </button>
  )
}

export default function BrandModule({
  initialProfile,
  workspaceId,
  modes = ['creator'],
  initialAkun = [],
}: {
  initialProfile: BrandProfile | null
  workspaceId: string
  modes?: string[]
  initialAkun?: SosmedAkun[]
}) {
  const isAffiliate = modes.includes('affiliate')
  const TABS = TABS_BASE.filter(t => !t.affiliateOnly || isAffiliate)
  const [tab, setTab] = useState('overview')
  const [akunList, setAkunList] = useState<SosmedAkun[]>(initialAkun)
  const [akunForm, setAkunForm] = useState({ platform: 'TikTok', handle: '', nama: '' })
  const [savingAkun, setSavingAkun] = useState(false)
  const [deletingAkun, setDeletingAkun] = useState<string | null>(null)
  const defaultProfile: BrandProfile = {
    workspace_id: workspaceId,
    nama_akun: '', platform_utama: '', gaya_konten: '', tipe_konten: '',
    target_audiens: '', tujuan_konten: '', tone_of_voice: '',
    suka: '', bisa: '', dibutuhkan: '', peluang: '',
    niche: '', kategori: '', micro_niche: '', nama_akun_rekomendasi: '',
    kelebihan: '', kelemahan: '', peluang_brand: '', tantangan: '', premis: '',
    bio_tiktok: '', bio_instagram: '', bio_youtube: '', bio_linkedin: '', bio_facebook: '',
    logo_main_url: '', color_palette: ['#1a73e8', '#1a73e8', '#F9FAFB'], typography: '',
    niche_options: [],
    premis_options: [],
    bio_options: {},
    affiliate_tipe: 'personal',
    affiliate_target_buyer: '',
    affiliate_kategori_fokus: [],
    affiliate_platforms: [],
    affiliate_nama_options: [],
    affiliate_tagline: '',
    affiliate_positioning_statement: '',
    affiliate_positioning: '',
    affiliate_trust_builder: '',
    affiliate_promo_style: '',
    affiliate_hook_style: '',
    affiliate_content_pillars: '',
    affiliate_disclosure: '',
    affiliate_bio_options: [],
  }
  const [profile, setProfile] = useState<BrandProfile>(initialProfile ? {
    ...defaultProfile,
    ...initialProfile,
    color_palette: initialProfile.color_palette?.length ? initialProfile.color_palette : defaultProfile.color_palette,
    niche_options: (initialProfile as unknown as { niche_options?: NicheOption[] }).niche_options || [],
    premis_options: (initialProfile as unknown as { premis_options?: PremisOption[] }).premis_options || [],
    bio_options: (initialProfile as unknown as { bio_options?: BioOptions }).bio_options || {},
    affiliate_platforms: (initialProfile as unknown as { affiliate_platforms?: string[] }).affiliate_platforms || [],
    affiliate_kategori_fokus: (initialProfile as unknown as { affiliate_kategori_fokus?: string[] }).affiliate_kategori_fokus || [],
    affiliate_nama_options: (initialProfile as unknown as { affiliate_nama_options?: AffNamaOption[] }).affiliate_nama_options || [],
    affiliate_bio_options: (initialProfile as unknown as { affiliate_bio_options?: BioOption[] }).affiliate_bio_options || [],
  } : defaultProfile)

  // Niche CRUD state
  const [nicheForm, setNicheForm] = useState<NicheOption | null>(null)
  const [nicheEditId, setNicheEditId] = useState<string | null>(null)

  // Premis CRUD state
  const [premisForm, setPremisForm] = useState<PremisOption | null>(null)
  const [premisEditId, setPremisEditId] = useState<string | null>(null)

  // Bio CRUD state
  const [bioActivePlatform, setBioActivePlatform] = useState<keyof BioOptions>('instagram')
  const [bioForm, setBioForm] = useState<BioOption | null>(null)
  const [bioEditId, setBioEditId] = useState<string | null>(null)

  function getBioList(platform: keyof BioOptions): BioOption[] {
    return profile.bio_options[platform] || []
  }
  function setBioList(platform: keyof BioOptions, list: BioOption[]) {
    setProfile(p => ({ ...p, bio_options: { ...p.bio_options, [platform]: list } }))
    setSaved(false)
  }
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiModal, setAiModal] = useState<{ prompt: string } | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [affStep, setAffStep] = useState('aff-niche')

  async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) { setLogoError('File harus berupa gambar'); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError('Ukuran maksimal 2MB'); return }
    setLogoError('')
    setLogoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('workspaceId', workspaceId)
    const res = await fetch('/api/upload/logo', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setLogoError('Upload gagal: ' + (json.error || res.statusText)); setLogoUploading(false); return }
    setField('logo_main_url', json.url)
    setLogoUploading(false)
  }

  function setField(key: keyof BrandProfile, value: string) {
    setProfile(p => ({ ...p, [key]: value }))
    setSaved(false)
  }

  async function addAkun() {
    if (!akunForm.handle.trim() || !akunForm.nama.trim()) return
    if (akunList.length >= MAX_AKUN) return
    setSavingAkun(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('kf_accounts').insert({
      workspace_id: workspaceId,
      platform: akunForm.platform,
      handle: akunForm.handle.trim().replace(/^@/, ''),
      nama: akunForm.nama.trim(),
    }).select('id, platform, handle, nama').single()
    if (!error && data) {
      setAkunList(prev => [...prev, data as SosmedAkun])
      setAkunForm(f => ({ ...f, handle: '', nama: '' }))
    }
    setSavingAkun(false)
  }

  async function deleteAkun(id: string) {
    if (!confirm('Hapus akun ini?')) return
    setDeletingAkun(id)
    const supabase = createClient()
    await supabase.from('kf_accounts').delete().eq('id', id)
    setAkunList(prev => prev.filter(a => a.id !== id))
    setDeletingAkun(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const payload = { ...profile, workspace_id: workspaceId }
    if (profile.id) {
      const { error: err } = await supabase.from('kf_brand_profiles').update(payload).eq('id', profile.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { data, error: err } = await supabase.from('kf_brand_profiles').insert(payload).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      if (data) setProfile(p => ({ ...p, id: data.id }))
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function buildNichePrompt(): string {
    const nama = profile.nama_akun || '[nama belum diisi]'
    const suka = profile.suka || '[belum diisi]'
    const bisa = profile.bisa || '[belum diisi]'
    const dibutuhkan = profile.dibutuhkan || '[belum diisi]'
    const peluang = profile.peluang ? `Saya sudah punya gambaran: ${profile.peluang}` : 'Saya belum tahu — bantu saya temukan peluangnya.'

    const platform = profile.platform_utama || 'TikTok/Instagram'

    return `Kamu adalah seorang Brand Architect yang spesialis membantu content creator Indonesia membangun positioning yang tajam, autentik, dan sustainable di era konten digital yang makin saturasi.

Jawab seluruhnya dalam Bahasa Indonesia. Gaya komunikasi: jujur, langsung ke poinnya, tidak basa-basi — tapi tetap hangat dan inspiring. Setiap rekomendasi harus spesifik untuk konteks Indonesia dan platform ${platform}.

---

PROFIL KREATOR

Nama: ${nama}
Platform utama: ${platform}

Empat elemen diri:

① SUKA — hal yang tidak terasa berat meski dilakukan setiap hari:
${suka}

② BISA — skill yang sudah dimiliki atau bisa dikembangkan dengan cepat:
${bisa}

③ DIBUTUHKAN — masalah nyata yang ada di sekitar dan ingin saya bantu selesaikan:
${dibutuhkan}

④ MONETISASI — ${peluang}

---

OUTPUT YANG SAYA BUTUHKAN:

▸ IRISAN IKIGAI
Temukan titik temu terkuat dari keempat elemen di atas. Jelaskan secara jujur — apakah irisan ini punya daya tahan jangka panjang atau hanya tren sesaat? Berikan penilaian realistis.

▸ REKOMENDASI NICHE (2–3 opsi)
Untuk setiap opsi, hindari niche yang sudah terlalu saturasi di Indonesia (seperti motivasi generik, skincare umum, dll). Tulis dalam format:
Kategori → Niche → Micro-niche
Alasan cocok untuk saya: [1 kalimat spesifik, bukan generik]
Tingkat persaingan di ${platform}: Rendah / Sedang / Tinggi

▸ CONTOH KONTEN KONKRET
Untuk niche yang paling kamu rekomendasikan, berikan 5 ide konten spesifik yang bisa langsung saya buat minggu ini. Bukan judul generik — langsung yang bisa viral di ${platform}.

▸ PELUANG CUAN REALISTIS
3–5 cara monetisasi yang nyata untuk niche ini di Indonesia. Sebutkan nominal estimasi kasar jika memungkinkan (misalnya: endorsement produk UMKM Rp 300–800rb/post).

▸ NAMA & USERNAME
8 pilihan nama persona/niche: maksimal 2 kata, mudah diingat, tidak pasaran, ada karakternya. Hindari nama yang terlalu umum dipakai kreator lain.
Format: Nama | @username | Alasan 1 kalimat

▸ SENJATA DIFERENSIASI
1 angle atau sudut pandang unik yang bisa menjadi signature saya — sesuatu yang belum banyak kreator lain di niche ini lakukan, khususnya di ${platform} Indonesia.

---

Tutup dengan 1 pertanyaan spesifik berdasarkan data di atas yang akan membuat rekomendasi berikutnya jauh lebih akurat dan personal. Bukan pertanyaan generik.`
  }

  function buildHelperPrompt(): string {
    const suka = profile.suka || '[belum diisi]'
    const platform = profile.platform_utama || 'TikTok/Instagram'

    return `Saya seorang calon content creator Indonesia yang baru memulai perjalanan membangun personal brand.

Satu hal yang saya tahu pasti: saya suka "${suka}".

Tapi saya belum bisa menjawab 3 pertanyaan ini dengan yakin. Bantu saya menemukannya.

Jawab seluruhnya dalam Bahasa Indonesia. Jujur, spesifik, dan relevan untuk konteks Indonesia & ${platform}.

---

① APA YANG MUNGKIN BISA SAYA LAKUKAN?
Berdasarkan passion saya di "${suka}", temukan:
- 5 skill yang kemungkinan besar sudah saya miliki tanpa saya sadari
- 3 skill yang bisa saya pelajari dalam 30 hari untuk memperkuat posisi di bidang ini
- 1 kombinasi skill unik yang bisa jadi keunggulan saya di ${platform}

② APA YANG DIBUTUHKAN ORANG?
- 5 masalah nyata yang sering dihadapi orang Indonesia yang berkaitan dengan "${suka}"
- Siapa yang paling butuh solusinya? (gambarkan orangnya secara spesifik)
- Apa yang mereka cari tapi belum banyak tersedia di ${platform}?

③ PELUANG PENGHASILAN APA YANG ADA?
- 5 cara monetisasi yang realistis dari passion ini di Indonesia
- Untuk setiap cara: cara kerjanya + estimasi penghasilan awal + waktu yang dibutuhkan
- Mana yang paling cepat menghasilkan dalam 30 hari ke depan?

---

Format jawaban: pisahkan setiap bagian dengan jelas (①, ②, ③) agar mudah saya salin ke masing-masing kolom.

Tutup dengan pertanyaan yang membantu saya menggali lebih dalam salah satu dari ketiga jawaban di atas.`
  }

  function buildSwotHelperPrompt(): string {
    const nama = profile.nama_akun || '[nama belum diisi]'
    const niche = profile.niche || '[isi Niche Hunt dulu]'
    const kategori = profile.kategori || '-'
    const microNiche = profile.micro_niche || '-'
    const platform = profile.platform_utama || 'TikTok/Instagram'

    return `Saya seorang content creator Indonesia yang sedang membangun personal brand.

Nama: ${nama}
Niche: ${niche}
Kategori: ${kategori}
Micro-niche: ${microNiche}
Platform: ${platform}

Saya perlu melakukan analisis SWOT diri saya sebagai kreator, tapi saya tidak tahu harus mulai dari mana. Bantu saya menggali keempat elemen ini secara jujur dan spesifik.

Jawab seluruhnya dalam Bahasa Indonesia. Format jawaban pisahkan jelas per bagian ①②③④ agar mudah saya salin:

① KELEBIHAN (Strength)
Apa kemampuan, sifat, atau kondisi unik yang saya miliki sebagai kreator di niche "${niche}"?
- Berikan 5–7 kelebihan yang mungkin dimiliki seseorang di bidang ini
- Fokus pada yang benar-benar bisa jadi competitive advantage di ${platform}
- Sertakan kelebihan yang mungkin tidak disadari (hidden strength)

② KELEMAHAN (Weakness)
Apa jujurnya yang bisa menghambat perjalanan saya?
- 4–5 kelemahan umum kreator di niche "${niche}" yang perlu diwaspadai
- Bukan untuk menjatuhkan, tapi agar bisa diantisipasi sejak awal

③ PELUANG (Opportunity)
Apa kondisi eksternal yang bisa saya manfaatkan sekarang?
- Tren yang sedang naik di niche ini di Indonesia
- Gap pasar yang belum banyak diisi kreator lain di ${platform}
- Momen atau timing yang tepat untuk masuk

④ TANTANGAN (Threat)
Apa hambatan eksternal yang perlu saya waspadai?
- Persaingan dan saturasi di niche ini
- Perubahan algoritma atau tren yang bisa berdampak
- Tantangan spesifik untuk kreator baru di bidang ini

Tutup dengan 1 pertanyaan yang membantu saya mengidentifikasi mana dari keempat elemen ini yang perlu diperkuat paling cepat.`
  }

  function copyPrompt(text: string) {
    navigator.clipboard.writeText(text)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2500)
  }

  function buildStoryPrompt(): string {
    const nama = profile.nama_akun || '[nama belum diisi]'
    const niche = profile.niche || '[isi Niche Hunt dulu]'
    const kategori = profile.kategori || '-'
    const microNiche = profile.micro_niche || '-'
    const kelebihan = profile.kelebihan || '[belum diisi]'
    const kelemahan = profile.kelemahan || '[belum diisi]'
    const peluang = profile.peluang_brand || profile.peluang || '[belum diisi]'
    const tantangan = profile.tantangan || '[belum diisi]'
    const platform = profile.platform_utama || 'TikTok/Instagram'

    return `Kamu adalah seorang Narrative Strategist yang spesialis membantu content creator Indonesia merumuskan origin story yang autentik, emosional, dan kuat untuk membangun koneksi dengan audiens.

Jawab seluruhnya dalam Bahasa Indonesia. Gaya: jujur, emosional tapi tidak lebay, relatable untuk pengguna ${platform} Indonesia.

---

DATA KREATOR

Nama: ${nama}
Niche: ${niche}
Kategori: ${kategori}
Micro-niche: ${microNiche}
Platform: ${platform}

Analisis diri:
① KELEBIHAN: ${kelebihan}
② KELEMAHAN: ${kelemahan}
③ PELUANG: ${peluang}
④ TANTANGAN: ${tantangan}

---

YANG SAYA BUTUHKAN:

▸ PREMIS UTAMA
Satu kalimat yang merangkum perjalanan dan positioning saya sebagai kreator. Harus terasa personal, bukan generik.

▸ 5 VARIASI ORIGIN STORY
Masing-masing dalam format storytelling yang berbeda, pilih dari:
- Format transformasi: "Dulu saya [kelemahan], sampai akhirnya [titik balik], dan sekarang saya [positioning]."
- Format paradoks: "Justru karena [kelemahan/tantangan], saya bisa [kelebihan unik]."
- Format misi: "Saya percaya [keyakinan], makanya saya [apa yang saya lakukan] untuk [target audiens]."
- Format konflik: "Saya pernah [struggle nyata], dan ternyata banyak orang [target audiens] merasakan hal yang sama."
- Format hook: Mulai dengan pertanyaan atau fakta mengejutkan yang relevan dengan niche.

Setiap variasi: maksimal 3-4 kalimat, terasa natural diucapkan, dan cocok dijadikan caption atau konten pembuka.

▸ PILIHAN TAGLINE
3 tagline pendek (maks 7 kata) yang bisa jadi signature saya di bio atau konten.

---

Tutup dengan 1 pertanyaan yang membantu saya memilih variasi yang paling sesuai dengan karakter asli saya.`
  }

  function buildPillarsPrompt(): string {
    const nama = profile.nama_akun || '[nama belum diisi]'
    const niche = profile.niche || '[isi Niche Hunt dulu]'
    const microNiche = profile.micro_niche || '-'
    const premis = profile.premis || '[isi Origin Story dulu]'
    const tone = profile.tone_of_voice || 'Friendly'
    const audiens = profile.target_audiens || '[belum diisi]'
    const platform = profile.platform_utama || 'TikTok/Instagram'

    return `Kamu adalah seorang Content Strategist yang ahli membangun ekosistem konten yang konsisten dan strategis untuk content creator Indonesia.

Jawab seluruhnya dalam Bahasa Indonesia. Output harus langsung actionable dan spesifik untuk ${platform}.

---

DATA KREATOR

Nama: ${nama}
Niche: ${niche}
Micro-niche: ${microNiche}
Platform utama: ${platform}
Tone of voice: ${tone}
Target audiens: ${audiens}
Premis brand: ${premis}

---

YANG SAYA BUTUHKAN:

▸ 5–7 CONTENT PILLAR UTAMA
Untuk setiap pillar, berikan:
- Nama pillar (2-4 kata, berkarakter, bukan generik seperti "Edukasi" saja)
- Fungsi pillar ini dalam membangun personal branding saya
- 3 contoh judul konten spesifik yang bisa langsung dibuat di ${platform}
- Tipe konten yang paling cocok (Reels, Carousel, Live, dll)

Pastikan 5 pilar dasar ini tercakup tapi disesuaikan dengan niche saya:
Edukasi / Hiburan / Bukti Sosial / Cerita Personal / Promosi

▸ 2–3 PILLAR BONUS
Pillar tambahan yang relevan dengan micro-niche dan bisa membedakan saya dari kreator lain.

▸ STRATEGI ROTASI
Rekomendasikan pola posting mingguan — pillar mana diposting hari apa dan kenapa.

---

Tutup dengan pertanyaan yang membantu saya memilih pillar yang paling realistis untuk dikerjakan konsisten.`
  }

  function buildBioPrompt(): string {
    const nama = profile.nama_akun || '[nama belum diisi]'
    const niche = profile.niche || '[isi Niche Hunt dulu]'
    const premis = profile.premis || '[isi Origin Story dulu]'
    const audiens = profile.target_audiens || '[belum diisi]'
    const kelebihan = profile.kelebihan || '[belum diisi]'
    const tone = profile.tone_of_voice || 'Friendly'
    const platform = profile.platform_utama || 'TikTok/Instagram'

    return `Kamu adalah seorang copywriter sosial media yang spesialis membuat bio profil yang ringkas, menarik, dan mampu mengkonversi pengunjung jadi followers atau leads.

Jawab seluruhnya dalam Bahasa Indonesia. Sesuaikan panjang dan gaya untuk masing-masing platform.

---

DATA KREATOR

Nama: ${nama}
Niche: ${niche}
Premis: ${premis}
Target audiens: ${audiens}
Keunggulan utama: ${kelebihan}
Tone of voice: ${tone}
Platform utama: ${platform}

---

YANG SAYA BUTUHKAN:

▸ BIO PER PLATFORM
Buatkan bio yang sudah dioptimasi untuk setiap platform berikut. Masing-masing 3 variasi dengan gaya berbeda (profesional / relatable / bold):

TikTok (maks 80 karakter)
Instagram (maks 150 karakter, boleh pakai emoji, bisa multi-baris)
YouTube About (2-3 kalimat, tone lebih formal)
LinkedIn (1 paragraf profesional, highlight value proposition)
Facebook (1-2 kalimat, warm dan relatable)

▸ FORMULA BIO TERBAIK
Jelaskan formula bio mana yang paling cocok untuk niche dan tone saya, dan kenapa.

▸ CTA SUGGESTIONS
5 pilihan CTA (call-to-action) untuk akhir bio yang relevan dengan niche saya.

---

Sajikan dalam format tabel: Platform | Variasi | Isi Bio | Kekuatan

Tutup dengan pertanyaan untuk membantu saya memilih yang paling sesuai karakter.`
  }

  function buildAffNichePrompt(): string {
    const tipe = profile.affiliate_tipe === 'store' ? 'Niche Store (akun khusus produk, bukan personal)' : 'Personal Brand Affiliator'
    const kategori = (profile.affiliate_kategori_fokus || []).join(', ') || '[belum dipilih]'
    const platforms = (profile.affiliate_platforms || []).join(', ') || 'TikTok Shop'
    return `Kamu adalah affiliate marketing strategist yang spesialis membantu seller dan affiliator Indonesia memilih niche produk yang menguntungkan.

Jawab seluruhnya dalam Bahasa Indonesia. Output harus spesifik, actionable, dan relevan untuk pasar Indonesia 2024-2025.

---

DATA AFFILIATOR

Tipe akun: ${tipe}
Kategori produk yang diminati: ${kategori}
Platform affiliate: ${platforms}

---

YANG SAYA BUTUHKAN:

▸ ANALISIS NICHE
Untuk setiap kategori yang saya pilih, berikan:
- Potensi pasar di Indonesia (besar/sedang/kecil)
- Tingkat persaingan (ketat/sedang/longgar)
- Rata-rata komisi affiliate (%)
- Produk best seller di kategori tersebut
- Musim/timing terbaik untuk promosi

▸ REKOMENDASI MICRO-NICHE
3 micro-niche spesifik yang paling potensial dari kategori yang saya pilih, dengan alasan dan contoh produk konkret

▸ TARGET BUYER PERSONA
Untuk micro-niche terbaik, buatkan profil buyer persona yang detail:
- Demografi (usia, gender, lokasi, income)
- Pain points utama
- Trigger untuk membeli
- Platform yang paling sering dipakai
- Waktu aktif online

▸ COMPETITIVE EDGE
Apa yang bisa membuat akun affiliate saya berbeda dari yang sudah ada di niche ini?

---

Sajikan dalam format yang mudah dibaca. Rekomendasikan 1 micro-niche terbaik di akhir dengan alasan kuat.`
  }

  function buildAffIdentityPrompt(): string {
    const tipe = profile.affiliate_tipe === 'store' ? 'Niche Store' : 'Personal Brand Affiliator'
    const kategori = (profile.affiliate_kategori_fokus || []).join(', ') || '[belum dipilih]'
    const targetBuyer = profile.affiliate_target_buyer || '[belum diisi]'
    const positioning = profile.affiliate_positioning || '[belum dipilih]'
    const platforms = (profile.affiliate_platforms || []).join(', ') || 'TikTok Shop'
    return `Kamu adalah brand naming expert dan copywriter yang spesialis membuat identitas akun affiliate Indonesia yang mudah diingat, dipercaya, dan convert.

Jawab seluruhnya dalam Bahasa Indonesia kecuali nama akun (boleh mix English).

---

DATA AKUN

Tipe: ${tipe}
Kategori produk: ${kategori}
Target pembeli: ${targetBuyer}
Positioning: ${positioning}
Platform utama: ${platforms}

---

YANG SAYA BUTUHKAN:

▸ NAMA AKUN (10 pilihan)
Format tabel: Nama | Tipe (brand/kata kunci/kombinasi) | Kenapa bagus | Available di TikTok? (prediksi)
Kriteria: mudah diingat, relate ke niche, bisa jadi "brand", tidak terlalu generik
Variasi: beberapa pakai .id, beberapa singkat, beberapa deskriptif

▸ TAGLINE (5 pilihan)
Kalimat singkat 1-2 baris untuk bio. Harus langsung jelas akunnya tentang apa + value proposition-nya.

▸ POSITIONING STATEMENT
3 versi positioning statement (pendek/medium/panjang) yang jelas membedakan akun ini dari kompetitor

▸ USERNAME FORMULA
Pola penamaan yang bisa dipakai jika nama utama sudah dipakai orang lain (misal: tambah underscore, angka, dll)

---

Rekomendasi top 3 nama terbaik di akhir dengan alasan spesifik.`
  }

  function buildAffKontenPrompt(): string {
    const tipe = profile.affiliate_tipe === 'store' ? 'Niche Store' : 'Personal Brand Affiliator'
    const kategori = (profile.affiliate_kategori_fokus || []).join(', ') || '[belum dipilih]'
    const targetBuyer = profile.affiliate_target_buyer || '[belum diisi]'
    const positioning = profile.affiliate_positioning || '[belum dipilih]'
    const namaUtama = (profile.affiliate_nama_options || []).find(n => n.is_primary)?.nama || '[belum dipilih]'
    const platforms = (profile.affiliate_platforms || []).join(', ') || 'TikTok Shop'
    return `Kamu adalah content strategist yang spesialis membantu akun affiliate Indonesia membangun konten yang build trust sekaligus convert penjualan.

Jawab seluruhnya dalam Bahasa Indonesia. Fokus pada TikTok sebagai platform utama jika tidak disebutkan lain.

---

DATA AKUN

Nama akun: ${namaUtama}
Tipe: ${tipe}
Kategori produk: ${kategori}
Target pembeli: ${targetBuyer}
Positioning: ${positioning}
Platform affiliate: ${platforms}

---

YANG SAYA BUTUHKAN:

▸ CONTENT PILLARS (5-6 pillar)
Format tabel: Nama Pillar | Tujuan | Frekuensi/minggu | Contoh judul konten
Pastikan ada mix antara: konten educate, konten entertain, konten convert

▸ HOOK FORMULA
5 template hook (3 detik pertama video/caption) yang paling cocok untuk niche ini dengan contoh konkret

▸ CONTENT CALENDAR TEMPLATE
Contoh 1 minggu konten: Senin-Minggu, setiap hari 1 ide konten + format + CTA

▸ VIRAL ANGLE
3 angle konten yang berpotensi viral untuk niche ${kategori} di TikTok, berdasarkan tren 2024-2025

▸ HASHTAG STRATEGY
Set hashtag per pillar konten (mix: niche + broad + trending), maks 10 per post

---

Output yang spesifik dan langsung bisa dieksekusi besok.`
  }

  function buildAffiliatePrompt(): string {
    const nama = profile.nama_akun || '[nama belum diisi]'
    const niche = profile.niche || '[belum diisi]'
    const premis = profile.premis || '[belum diisi]'
    const positioning = profile.affiliate_positioning || '[belum dipilih]'
    const promoStyle = profile.affiliate_promo_style || '[belum dipilih]'
    const platforms = (profile.affiliate_platforms || []).join(', ') || '[belum dipilih]'
    const kategori = (profile.affiliate_kategori_fokus || []).join(', ') || '[belum dipilih]'
    const audiens = profile.target_audiens || '[belum diisi]'

    return `Kamu adalah seorang brand strategist yang spesialis membantu affiliate marketer Indonesia membangun identitas sebagai trusted recommender — bukan hard seller.

Jawab seluruhnya dalam Bahasa Indonesia. Output harus konkret dan langsung bisa dipakai.

---

DATA AFFILIATOR

Nama: ${nama}
Niche: ${niche}
Premis brand: ${premis}
Positioning yang dipilih: ${positioning}
Style konten promosi: ${promoStyle}
Platform affiliate: ${platforms}
Kategori produk fokus: ${kategori}
Target audiens: ${audiens}

---

YANG SAYA BUTUHKAN:

▸ TRUST STATEMENT
3 versi kalimat "kenapa orang harus percaya rekomendasiku" — pendek (1 kalimat), medium (2-3 kalimat), panjang (1 paragraf). Fokus pada kredibilitas dan keaslian, bukan followers.

▸ BIO AFFILIATOR
3 variasi bio profil khusus untuk affiliate (80-150 karakter) yang menonjolkan identitas sebagai trusted recommender, bukan penjual. Cocok untuk TikTok/Instagram.

▸ KALIMAT DISCLOSURE
5 pilihan kalimat disclosure yang natural dan tidak kaku — yang bikin audience malah respect, bukan kabur. Beda gaya: santai, profesional, lucu, singkat, storytelling.

▸ ANGLE KONTEN
5 ide angle konten affiliate yang autentik untuk niche "${niche}" dengan style "${promoStyle}" — bukan sekadar "beli ini beli itu" tapi yang build trust sambil convert.

▸ POSITIONING STATEMENT
1 kalimat positioning yang bisa dijadikan tagline atau anchor identity:
"Saya [nama] — [positioning statement yang jelas membedakan dari affiliator lain]"

---

Format output: per seksi dengan header jelas. Mulai dari yang paling actionable.`
  }

  async function callAI(prompt: string, fields: (keyof BrandProfile)[]) {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, profile }),
      })
      const data = await res.json()
      if (data.result) {
        fields.forEach((f, i) => {
          if (data.result[i]) setField(f, data.result[i])
        })
      }
    } finally {
      setAiLoading(false)
    }
  }

  const sectionCard = (children: React.ReactNode) => (
    <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {children}
    </div>
  )

  // Frekuensi level calc
  const hasBio = !!(profile.bio_tiktok || profile.bio_instagram || profile.bio_youtube || profile.bio_linkedin || profile.bio_facebook)
  const hasColorPalette = (profile.color_palette?.length ?? 0) > 0
  const freqChecked = FREQ_CHECKS.map(c => {
    if (c.key === 'bio_instagram') return hasBio
    if (c.key === 'color_palette') return hasColorPalette
    const val = profile[c.key as keyof BrandProfile]
    return typeof val === 'string' ? val.trim().length > 0 : Array.isArray(val) ? val.length > 0 : false
  })
  const freqDone = freqChecked.filter(Boolean).length
  const freqTotal = FREQ_CHECKS.length
  const freqPct = Math.round((freqDone / freqTotal) * 100)
  const freqLevelIdx = freqPct >= 90 ? 5 : freqPct >= 70 ? 4 : freqPct >= 50 ? 3 : freqPct >= 30 ? 2 : freqPct >= 10 ? 1 : 0
  const freqLevel = FREQ_LEVELS[freqLevelIdx]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Brand</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Bangun fondasi identitas brand dan konten kamu</p>
      </div>

      {/* Tabs */}
      <div className="kf-tabs-wrap">
        <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #f3f4f6', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 16px', background: 'transparent', border: 'none',
                borderBottom: tab === t.id ? '2px solid #1a73e8' : '2px solid transparent',
                color: tab === t.id ? '#1a73e8' : '#6b7280',
                fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                flexShrink: 0, whiteSpace: 'nowrap',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Overview — Frekuensi Kreator */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left: Level Display */}
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', overflow: 'hidden' }}>
              {/* glow bg */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: freqLevel.glow, filter: 'blur(70px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative' }}>
                {/* Icon + level header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${freqLevel.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: freqLevel.color, flexShrink: 0 }}>
                    {freqLevel.id === 1 ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : freqLevel.id === 2 ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6c0 0 5-2 11-2s11 2 11 2"/><path d="M1 12c0 0 5 2 11 2s11-2 11-2"/><path d="M1 18c0 0 5-2 11-2s11 2 11 2"/></svg>
                    : freqLevel.id === 3 ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                    : freqLevel.id === 4 ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
                    : freqLevel.id === 5 ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500, marginBottom: 5 }}>Frekuensi brand kamu</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: freqLevel.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{freqLevel.name}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic', marginBottom: 10 }}>"{freqLevel.tagline}"</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6 }}>{freqLevel.desc}</div>
              </div>

              {/* Signal Bars */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 10, fontWeight: 500 }}>Signal strength</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 48 }}>
                  {FREQ_LEVELS.map((lvl, i) => {
                    const active = i <= freqLevelIdx
                    const heights = [16, 22, 28, 34, 40, 48]
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: '100%', height: heights[i], borderRadius: '4px 4px 0 0',
                          background: active ? lvl.color : '#e8eaed',
                          boxShadow: active ? `0 0 8px ${lvl.glow}` : 'none',
                          transition: 'all 0.3s',
                        }} />
                        <div style={{ fontSize: '0.55rem', color: active ? lvl.color : '#d1d5db', fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>{i + 1}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Progress Brand</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: freqLevel.color }}>{freqPct}% ({freqDone}/{freqTotal})</span>
                </div>
                <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${freqPct}%`, background: `linear-gradient(90deg, #1a73e8, ${freqLevel.color})`, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                {freqLevelIdx < 5 && (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>
                    Butuh {Math.ceil((FREQ_LEVELS[freqLevelIdx + 1] ? (freqLevelIdx + 1) / 6 * freqTotal : freqTotal) - freqDone)} field lagi untuk jadi <span style={{ color: FREQ_LEVELS[freqLevelIdx + 1]?.color }}>{FREQ_LEVELS[freqLevelIdx + 1]?.name}</span>
                  </div>
                )}
              </div>

              {freqPct === 100 && (
                <div style={{ background: `${freqLevel.color}18`, border: `1px solid ${freqLevel.color}40`, borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: freqLevel.color }}>Full Power! Brand kamu 100% siap.</div>
                </div>
              )}
            </div>

            {/* Right: Checklist */}
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ fontSize: '0.82rem', color: '#111827', fontWeight: 700, marginBottom: 16 }}>Sinyal yang perlu dikuatkan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                {FREQ_CHECKS.map((check, i) => {
                  const done = freqChecked[i]
                  return (
                    <button key={check.key} type="button" onClick={() => setTab(check.tab)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: done ? 'rgba(52,211,153,0.05)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${done ? '#059669' : '#d1d5db'}`, background: done ? '#059669' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: done ? '#374151' : '#6b7280', textDecoration: done ? 'line-through' : 'none', fontWeight: done ? 400 : 500 }}>{check.label}</span>
                      {!done && <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#6b7280', flexShrink: 0 }}>→ {check.tab === 'identity' ? 'Identity' : check.tab === 'niche' ? 'Niche' : check.tab === 'story' ? 'Story' : check.tab === 'bio' ? 'Bio' : 'Visual'}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Level ladder summary */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, marginBottom: 10 }}>Tangga frekuensi</div>
                {[...FREQ_LEVELS].reverse().map((lvl) => (
                  <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, background: lvl.id === freqLevel.id ? `${lvl.color}12` : 'transparent', marginBottom: 2 }}>
                    <span style={{ color: lvl.color, display: 'flex', alignItems: 'center' }}>
                    {lvl.id === 1 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : lvl.id === 2 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6c0 0 5-2 11-2s11 2 11 2"/><path d="M1 12c0 0 5 2 11 2s11-2 11-2"/><path d="M1 18c0 0 5-2 11-2s11 2 11 2"/></svg>
                    : lvl.id === 3 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                    : lvl.id === 4 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49"/></svg>
                    : lvl.id === 5 ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: lvl.id === freqLevel.id ? 700 : 400, color: lvl.id === freqLevel.id ? lvl.color : '#6b7280' }}>
                      {lvl.id}. {lvl.name}
                    </span>
                    {lvl.id === freqLevel.id && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: `${lvl.color}20`, color: lvl.color, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>NOW</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Account Identity */}
        {tab === 'identity' && sectionCard(<>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Nama Akun</label>
            <input
              style={fieldStyle()}
              value={profile.nama_akun ?? ''}
              onChange={e => setField('nama_akun', e.target.value)}
              placeholder="Nama akun atau creator kamu"
            />
          </div>
          <SingleSelect label="Platform Utama" options={PLATFORMS} value={profile.platform_utama} onChange={v => setField('platform_utama', v)} />
          <MultiSelect label="Gaya Konten" options={GAYA} value={profile.gaya_konten} onChange={v => setField('gaya_konten', v)} />
          <MultiSelect label="Tipe Konten" options={TIPE} value={profile.tipe_konten} onChange={v => setField('tipe_konten', v)} />
          <MultiSelect label="Target Audiens" options={AUDIENS} value={profile.target_audiens} onChange={v => setField('target_audiens', v)} />
          <MultiSelect label="Tujuan Konten" options={TUJUAN} value={profile.tujuan_konten} onChange={v => setField('tujuan_konten', v)} />
          <MultiSelect label="Tone of Voice" options={TONE} value={profile.tone_of_voice} onChange={v => setField('tone_of_voice', v)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={saving} saved={saved} />
          </div>
        </>)}

        {/* Niche Hunt */}
        {tab === 'niche' && sectionCard(<>
          {/* Helper banner — muncul kalau suka sudah isi tapi field lain masih kosong */}
          {profile.suka && (!profile.bisa || !profile.dibutuhkan || !profile.peluang) && (
            <div style={{ background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Belum tau mau isi kolom lainnya?</span>
              <button type="button" onClick={() => setAiModal({ prompt: buildHelperPrompt() })}
                style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                Gak tau? Generate semuanya
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Apa yang kamu suka?</label>
              <textarea style={fieldStyle({ height: 88, resize: 'none' })} value={profile.suka ?? ''} onChange={e => setField('suka', e.target.value)} placeholder="Hal-hal yang kamu minati..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Apa yang kamu bisa lakukan?</label>
              <textarea style={fieldStyle({ height: 88, resize: 'none' })} value={profile.bisa ?? ''} onChange={e => setField('bisa', e.target.value)} placeholder="Keahlian atau skill kamu..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Apa yang dibutuhkan orang?</label>
              <textarea style={fieldStyle({ height: 88, resize: 'none' })} value={profile.dibutuhkan ?? ''} onChange={e => setField('dibutuhkan', e.target.value)} placeholder="Problem yang orang butuh solusinya..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Peluang penghasilan?</label>
              <textarea style={fieldStyle({ height: 88, resize: 'none' })} value={profile.peluang ?? ''} onChange={e => setField('peluang', e.target.value)} placeholder="Monetisasi yang mungkin..." />
            </div>
          </div>
          <button
            type="button"
            disabled={!profile.suka}
            onClick={() => setAiModal({ prompt: buildNichePrompt() })}
            style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: profile.suka ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
            Generate dengan AI
          </button>
          {/* Niche Options CRUD */}
          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opsi Niche dari AI</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Tambah opsi dari hasil AI, pilih satu sebagai utama</div>
              </div>
              <button type="button" onClick={() => { setNicheForm({ id: crypto.randomUUID(), niche: '', kategori: '', micro_niche: '', nama_akun: '', is_primary: profile.niche_options.length === 0 }); setNicheEditId(null) }}
                style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                + Tambah Opsi
              </button>
            </div>

            {/* Inline Add/Edit Form */}
            {nicheForm && (
              <div style={{ background: '#fff', border: '1px solid #1a73e840', borderRadius: 10, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.78rem', color: '#1a73e8', fontWeight: 600 }}>{nicheEditId ? 'Edit Opsi' : 'Tambah Opsi Baru'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Niche', key: 'niche' as keyof NicheOption, placeholder: 'cth: Personal Finance' },
                    { label: 'Kategori', key: 'kategori' as keyof NicheOption, placeholder: 'cth: Keuangan' },
                    { label: 'Micro-niche', key: 'micro_niche' as keyof NicheOption, placeholder: 'cth: Nabung untuk Gen Z' },
                    { label: 'Nama Akun', key: 'nama_akun' as keyof NicheOption, placeholder: 'cth: @duitgenz' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <input style={fieldStyle()} value={(nicheForm[key] as string) ?? ''} onChange={e => setNicheForm(f => f ? { ...f, [key]: e.target.value } : f)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => {
                    if (!nicheForm.niche) return
                    if (nicheEditId) {
                      const updated = profile.niche_options.map(o => o.id === nicheEditId ? nicheForm : o)
                      setProfile(p => ({ ...p, niche_options: updated }))
                    } else {
                      setProfile(p => ({ ...p, niche_options: [...p.niche_options, nicheForm] }))
                    }
                    if (nicheForm.is_primary) {
                      setProfile(p => ({ ...p, niche: nicheForm.niche, kategori: nicheForm.kategori, micro_niche: nicheForm.micro_niche, nama_akun_rekomendasi: nicheForm.nama_akun }))
                    }
                    setNicheForm(null); setNicheEditId(null); setSaved(false)
                  }} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    Simpan Opsi
                  </button>
                  <button type="button" onClick={() => { setNicheForm(null); setNicheEditId(null) }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}>
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Options List */}
            {profile.niche_options.length === 0 && !nicheForm && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280', fontSize: '0.82rem' }}>
                Belum ada opsi — klik Generate lalu tambah hasil dari AI
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.niche_options.map(opt => (
                <div key={opt.id} style={{ background: opt.is_primary ? 'rgba(26,115,232,0.08)' : '#f9fafb', border: `1px solid ${opt.is_primary ? '#1a73e840' : '#f3f4f6'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {opt.is_primary && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a73e8', marginTop: 6, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: opt.is_primary ? '#1a73e8' : '#111827', fontSize: '0.9rem' }}>{opt.niche}</span>
                      {opt.is_primary && <span style={{ background: 'rgba(26,115,232,0.2)', color: '#1a73e8', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utama</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {opt.kategori && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opt.kategori}</span>}
                      {opt.micro_niche && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{opt.micro_niche}</span>}
                      {opt.nama_akun && <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>{opt.nama_akun}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {!opt.is_primary && (
                      <button type="button" title="Jadikan Utama" onClick={() => {
                        const updated = profile.niche_options.map(o => ({ ...o, is_primary: o.id === opt.id }))
                        setProfile(p => ({ ...p, niche_options: updated, niche: opt.niche, kategori: opt.kategori, micro_niche: opt.micro_niche, nama_akun_rekomendasi: opt.nama_akun }))
                        setSaved(false)
                      }} style={{ background: 'rgba(66,165,245,0.1)', border: '1px solid #1a73e830', borderRadius: 6, padding: '5px 8px', color: '#1a73e8', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Pilih
                      </button>
                    )}
                    <button type="button" title="Edit" onClick={() => { setNicheForm({ ...opt }); setNicheEditId(opt.id) }}
                      style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button type="button" title="Hapus" onClick={() => {
                      const filtered = profile.niche_options.filter(o => o.id !== opt.id)
                      setProfile(p => ({ ...p, niche_options: filtered }))
                      setSaved(false)
                    }} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '5px 8px', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={saving} saved={saved} />
          </div>
        </>)}

        {/* Origin Story */}
        {tab === 'story' && sectionCard(<>
          {/* Step warning */}
          {!profile.niche && (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b' }}>
              Perhatian: Isi tab <button type="button" onClick={() => setTab('niche')} style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Niche Hunt</button> dulu dan simpan agar prompt lebih akurat.
            </div>
          )}

          {/* SWOT helper banner */}
          {profile.niche && (!profile.kelebihan || !profile.kelemahan || !profile.peluang_brand || !profile.tantangan) && (
            <div style={{ background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Belum tau mau isi SWOT kamu?</span>
              <button type="button" onClick={() => setAiModal({ prompt: buildSwotHelperPrompt() })}
                style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                Gak tau? Generate semuanya
              </button>
            </div>
          )}

          {/* SWOT Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Kelebihan kamu', key: 'kelebihan' as keyof BrandProfile, placeholder: 'Apa yang jadi keunggulan kamu...' },
              { label: 'Kelemahan kamu', key: 'kelemahan' as keyof BrandProfile, placeholder: 'Apa yang masih jadi tantangan...' },
              { label: 'Peluang brand', key: 'peluang_brand' as keyof BrandProfile, placeholder: 'Peluang yang bisa dimanfaatkan...' },
              { label: 'Tantangan', key: 'tantangan' as keyof BrandProfile, placeholder: 'Hambatan yang dihadapi...' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                <textarea style={fieldStyle({ height: 88, resize: 'none' })} value={(profile[key] ?? '') as string} onChange={e => setField(key, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={!profile.kelebihan}
            onClick={() => setAiModal({ prompt: buildStoryPrompt() })}
            style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: profile.kelebihan ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
            Generate dengan AI
          </button>

          {/* Premis CRUD */}
          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variasi Premis dari AI</div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Tambah variasi, pilih satu sebagai premis utama</div>
              </div>
              <button type="button" onClick={() => { setPremisForm({ id: crypto.randomUUID(), teks: '', format: '', is_primary: profile.premis_options.length === 0 }); setPremisEditId(null) }}
                style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                + Tambah Variasi
              </button>
            </div>

            {/* Inline form */}
            {premisForm && (
              <div style={{ background: '#fff', border: '1px solid #1a73e840', borderRadius: 10, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.78rem', color: '#1a73e8', fontWeight: 600 }}>{premisEditId ? 'Edit Variasi' : 'Tambah Variasi Baru'}</div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format / Nama Variasi</div>
                  <input style={fieldStyle()} value={premisForm.format} onChange={e => setPremisForm(f => f ? { ...f, format: e.target.value } : f)} placeholder="cth: Format Transformasi / Format Misi / Variasi 1" />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teks Premis</div>
                  <textarea style={fieldStyle({ height: 100, resize: 'vertical' })} value={premisForm.teks} onChange={e => setPremisForm(f => f ? { ...f, teks: e.target.value } : f)} placeholder="Paste variasi premis dari AI di sini..." />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => {
                    if (!premisForm.teks) return
                    if (premisEditId) {
                      const updated = profile.premis_options.map(o => o.id === premisEditId ? premisForm : o)
                      setProfile(p => ({ ...p, premis_options: updated }))
                    } else {
                      setProfile(p => ({ ...p, premis_options: [...p.premis_options, premisForm] }))
                    }
                    if (premisForm.is_primary) {
                      setProfile(p => ({ ...p, premis: premisForm.teks }))
                    }
                    setPremisForm(null); setPremisEditId(null); setSaved(false)
                  }} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    Simpan Variasi
                  </button>
                  <button type="button" onClick={() => { setPremisForm(null); setPremisEditId(null) }}
                    style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}>
                    Batal
                  </button>
                </div>
              </div>
            )}

            {profile.premis_options.length === 0 && !premisForm && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280', fontSize: '0.82rem' }}>
                Belum ada variasi — klik Generate lalu tambah hasil dari AI
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.premis_options.map(opt => (
                <div key={opt.id} style={{ background: opt.is_primary ? 'rgba(26,115,232,0.08)' : '#f9fafb', border: `1px solid ${opt.is_primary ? '#1a73e840' : '#f3f4f6'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {opt.is_primary && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a73e8', marginTop: 6, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {opt.format && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{opt.format}</span>
                        {opt.is_primary && <span style={{ background: 'rgba(26,115,232,0.2)', color: '#1a73e8', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utama</span>}
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: '0.85rem', color: opt.is_primary ? '#111827' : '#6b7280', lineHeight: 1.6 }}>{opt.teks}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {!opt.is_primary && (
                      <button type="button" title="Jadikan Utama" onClick={() => {
                        const updated = profile.premis_options.map(o => ({ ...o, is_primary: o.id === opt.id }))
                        setProfile(p => ({ ...p, premis_options: updated, premis: opt.teks }))
                        setSaved(false)
                      }} style={{ background: 'rgba(66,165,245,0.1)', border: '1px solid #1a73e830', borderRadius: 6, padding: '5px 8px', color: '#1a73e8', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Pilih
                      </button>
                    )}
                    <button type="button" onClick={() => { setPremisForm({ ...opt }); setPremisEditId(opt.id) }}
                      style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                    <button type="button" onClick={() => {
                      const filtered = profile.premis_options.filter(o => o.id !== opt.id)
                      setProfile(p => ({ ...p, premis_options: filtered }))
                      setSaved(false)
                    }} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '5px 8px', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={saving} saved={saved} />
          </div>
        </>)}

        {/* Bio Studio */}
        {tab === 'bio' && sectionCard(<>
          {/* Step warnings */}
          {!profile.niche && (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b' }}>
              Perhatian: Isi tab <button type="button" onClick={() => setTab('niche')} style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Niche Hunt</button> dulu agar bio lebih akurat.
            </div>
          )}
          {profile.niche && !profile.premis && (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b' }}>
              Perhatian: Isi tab <button type="button" onClick={() => setTab('story')} style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Origin Story</button> dulu agar bio punya premis yang kuat.
            </div>
          )}

          {/* Header + Generate */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Bio Studio</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Simpan beberapa variasi bio per platform, pilih satu sebagai utama</div>
            </div>
            <button type="button" disabled={!profile.niche} onClick={() => setAiModal({ prompt: buildBioPrompt() })}
              style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: profile.niche ? 'pointer' : 'not-allowed', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              Generate dengan AI
            </button>
          </div>

          {/* Platform tabs */}
          {(() => {
            const BIO_PLATFORMS: { key: keyof BioOptions; label: string; icon: string; max: number; profileKey: keyof BrandProfile }[] = [
              { key: 'tiktok', label: 'TikTok', icon: 'TT', max: 80, profileKey: 'bio_tiktok' },
              { key: 'instagram', label: 'Instagram', icon: 'IG', max: 150, profileKey: 'bio_instagram' },
              { key: 'youtube', label: 'YouTube', icon: 'YT', max: 1000, profileKey: 'bio_youtube' },
              { key: 'linkedin', label: 'LinkedIn', icon: 'IN', max: 2600, profileKey: 'bio_linkedin' },
              { key: 'facebook', label: 'Facebook', icon: 'FB', max: 255, profileKey: 'bio_facebook' },
            ]
            const activePl = BIO_PLATFORMS.find(p => p.key === bioActivePlatform)!
            const bioList = getBioList(bioActivePlatform)

            return (
              <div>
                {/* Platform switcher */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                  {BIO_PLATFORMS.map(pl => {
                    const hasUtama = getBioList(pl.key).some(b => b.is_primary)
                    return (
                      <button key={pl.key} type="button" onClick={() => { setBioActivePlatform(pl.key); setBioForm(null); setBioEditId(null) }}
                        style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${bioActivePlatform === pl.key ? '#1a73e8' : 'transparent'}`, background: bioActivePlatform === pl.key ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: bioActivePlatform === pl.key ? '#1a73e8' : '#6b7280', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {pl.label}
                        {hasUtama && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </div>

                {/* CRUD section */}
                <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variasi Bio {activePl.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Maks {activePl.max} karakter</div>
                    </div>
                    <button type="button" onClick={() => { setBioForm({ id: crypto.randomUUID(), teks: '', is_primary: bioList.length === 0 }); setBioEditId(null) }}
                      style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      + Tambah Variasi
                    </button>
                  </div>

                  {/* Inline form */}
                  {bioForm && (
                    <div style={{ background: '#fff', border: '1px solid #1a73e840', borderRadius: 10, padding: 16, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: '0.78rem', color: '#1a73e8', fontWeight: 600 }}>{bioEditId ? 'Edit Variasi' : 'Tambah Variasi Baru'}</div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teks Bio</div>
                          <span style={{ fontSize: '0.7rem', color: bioForm.teks.length > activePl.max ? '#dc2626' : '#6b7280' }}>{bioForm.teks.length}/{activePl.max}</span>
                        </div>
                        <textarea style={fieldStyle({ height: 90, resize: 'none' })} value={bioForm.teks} maxLength={activePl.max} onChange={e => setBioForm(f => f ? { ...f, teks: e.target.value } : f)} placeholder={`Paste variasi bio ${activePl.label} dari AI...`} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => {
                          if (!bioForm.teks) return
                          const updated = bioEditId
                            ? bioList.map(b => b.id === bioEditId ? bioForm : b)
                            : [...bioList, bioForm]
                          setBioList(bioActivePlatform, updated)
                          if (bioForm.is_primary) setField(activePl.profileKey, bioForm.teks)
                          setBioForm(null); setBioEditId(null)
                        }} style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                          Simpan Variasi
                        </button>
                        <button type="button" onClick={() => { setBioForm(null); setBioEditId(null) }}
                          style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}>
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {bioList.length === 0 && !bioForm && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280', fontSize: '0.82rem' }}>
                      Belum ada variasi — Generate lalu tambah hasilnya
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {bioList.map(opt => (
                      <div key={opt.id} style={{ background: opt.is_primary ? 'rgba(26,115,232,0.08)' : '#f9fafb', border: `1px solid ${opt.is_primary ? '#1a73e840' : '#f3f4f6'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {opt.is_primary && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a73e8', marginTop: 5, flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {opt.is_primary && <span style={{ background: 'rgba(26,115,232,0.2)', color: '#1a73e8', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utama</span>}
                            <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>{opt.teks.length} karakter</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: opt.is_primary ? '#111827' : '#6b7280', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{opt.teks}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {!opt.is_primary && (
                            <button type="button" onClick={() => {
                              setBioList(bioActivePlatform, bioList.map(b => ({ ...b, is_primary: b.id === opt.id })))
                              setField(activePl.profileKey, opt.teks)
                            }} style={{ background: 'rgba(66,165,245,0.1)', border: '1px solid #1a73e830', borderRadius: 6, padding: '5px 8px', color: '#1a73e8', fontSize: '0.75rem', cursor: 'pointer' }}>
                              Pilih
                            </button>
                          )}
                          <button type="button" onClick={() => { setBioForm({ ...opt }); setBioEditId(opt.id) }}
                            style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                          <button type="button" onClick={() => {
                            setBioList(bioActivePlatform, bioList.filter(b => b.id !== opt.id))
                          }} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '5px 8px', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={saving} saved={saved} />
          </div>
        </>)}

        {/* Brand Identity (Visual) */}
        {tab === 'visual' && sectionCard(<>
          {/* Logo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Logo Utama</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Preview */}
              <div
                onClick={() => !logoUploading && logoFileRef.current?.click()}
                style={{ width: 72, height: 72, borderRadius: 20, border: `2px dashed ${logoUploading ? '#1a73e8' : '#d1d5db'}`, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative' }}>
                {logoUploading ? (
                  <div style={{ fontSize: '0.7rem', color: '#1a73e8', textAlign: 'center', padding: 4 }}>uploading...</div>
                ) : profile.logo_main_url ? (
                  <img src={profile.logo_main_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8d1e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <div style={{ fontSize: '0.7rem', marginTop: 2 }}>Upload</div>
                  </div>
                )}
              </div>
              {/* Hidden file input */}
              <input
                ref={logoFileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = '' }}
              />
              {/* URL input */}
              <div style={{ flex: 1 }}>
                <input
                  style={fieldStyle({})}
                  value={profile.logo_main_url ?? ''}
                  onChange={e => setField('logo_main_url', e.target.value)}
                  placeholder="https://... atau klik kotak untuk upload langsung"
                />
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                  Klik kotak kiri untuk upload file (maks 2MB) — atau paste URL dari Drive/Imgur
                </div>
                {logoError && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 4 }}>{logoError}</div>}
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Color Palette Brand</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {(profile.color_palette ?? ['#1a73e8', '#1a73e8', '#F9FAFB']).map((color, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="color"
                      value={color}
                      onChange={e => {
                        const next = [...(profile.color_palette ?? [])]
                        next[i] = e.target.value
                        setProfile(p => ({ ...p, color_palette: next }))
                        setSaved(false)
                      }}
                      style={{ width: 48, height: 48, border: '2px solid #f3f4f6', borderRadius: 10, cursor: 'pointer', padding: 2, background: 'transparent' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#6b7280', fontFamily: 'monospace' }}>{color}</span>
                  {(profile.color_palette ?? []).length > 1 && (
                    <button type="button" onClick={() => {
                      const next = (profile.color_palette ?? []).filter((_, idx) => idx !== i)
                      setProfile(p => ({ ...p, color_palette: next }))
                      setSaved(false)
                    }} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>hapus</button>
                  )}
                </div>
              ))}
              {(profile.color_palette ?? []).length < 6 && (
                <button type="button" onClick={() => {
                  setProfile(p => ({ ...p, color_palette: [...(p.color_palette ?? []), '#000000'] }))
                  setSaved(false)
                }} style={{ width: 48, height: 48, border: '2px dashed #2a2a2a', borderRadius: 10, background: 'transparent', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>Klik warna untuk mengubah — maksimal 6 warna</div>
          </div>

          {/* Color Preview */}
          {(profile.color_palette ?? []).length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Preview Palette</label>
              <div style={{ display: 'flex', height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                {(profile.color_palette ?? []).map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c }} title={c} />
                ))}
              </div>
            </div>
          )}

          {/* Typography */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>Tipografi / Font Utama</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'Nunito', 'DM Sans', 'Raleway', 'Custom'].map(font => (
                <button key={font} type="button"
                  onClick={() => setField('typography', font)}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, border: profile.typography === font ? '1px solid #1a73e8' : 'none', background: profile.typography === font ? 'rgba(26,115,232,0.10)' : '#f3f4f6', color: profile.typography === font ? '#1a73e8' : '#6b7280', cursor: 'pointer', fontFamily: font !== 'Custom' ? font : 'inherit' }}>
                  {font}
                </button>
              ))}
            </div>
            {profile.typography === 'Custom' && (
              <input style={fieldStyle({ marginTop: 10 })} value={profile.typography === 'Custom' ? '' : profile.typography} onChange={e => setField('typography', e.target.value)} placeholder="Nama font custom..." />
            )}
          </div>

          {/* Brand Summary */}
          {(profile.color_palette?.length || profile.logo_main_url || profile.typography) ? (
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
              {profile.logo_main_url && (
                <div style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={profile.logo_main_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', marginBottom: 4, fontFamily: profile.typography || 'inherit' }}>{profile.nama_akun || 'Nama Brand'}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(profile.color_palette ?? []).map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />)}
                  {profile.typography && <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: 4, fontStyle: 'italic' }}>{profile.typography}</span>}
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SaveButton loading={saving} saved={saved} />
          </div>
        </>)}

        {/* Affiliator Brand Tab — full flow with sub-steps */}
        {tab === 'affiliate' && (() => {
          const affSteps = [
            { id: 'aff-niche', label: 'Niche & Target' },
            { id: 'aff-identity', label: 'Identitas Akun' },
            { id: 'aff-konten', label: 'Konten Strategy' },
            { id: 'aff-bio', label: 'Bio & Trust' },
          ]
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Sub-step tabs */}
              <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f3f4f6', marginBottom: 24 }}>
                {affSteps.map((s, i) => (
                  <button key={s.id} type="button" onClick={() => setAffStep(s.id)}
                    style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: affStep === s.id ? '2px solid #34d399' : '2px solid transparent', color: affStep === s.id ? '#059669' : '#6b7280', fontSize: '0.82rem', fontWeight: affStep === s.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: affStep === s.id ? 'rgba(52,211,153,0.15)' : '#f3f4f6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: affStep === s.id ? '#059669' : '#6b7280', flexShrink: 0 }}>{i + 1}</span>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* ── Step 1: Niche & Target ── */}
              {affStep === 'aff-niche' && sectionCard(<>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Niche & Target Pembeli</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Tentukan jenis akun, produk yang mau dijual, dan siapa yang beli</div>
                  </div>
                  <button type="button" onClick={() => setAiModal({ prompt: buildAffNichePrompt() })}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Generate dengan AI
                  </button>
                </div>

                {/* Tipe akun */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 10, fontWeight: 600 }}>Tipe Akun Affiliate</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { id: 'personal', icon: 'P', label: 'Personal Brand', desc: 'Akun personal kamu sendiri + promosi produk affiliate. Audiens kenal kamu sebagai orangnya.' },
                      { id: 'store', icon: 'S', label: 'Niche Store', desc: 'Akun khusus satu niche produk (misal kidstuff.id). Fokus produk, bukan personal.' },
                    ].map(tipe => (
                      <div key={tipe.id} onClick={() => setField('affiliate_tipe', tipe.id)}
                        style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${profile.affiliate_tipe === tipe.id ? '#059669' : 'transparent'}`, background: profile.affiliate_tipe === tipe.id ? 'rgba(52,211,153,0.07)' : '#f9fafb', cursor: 'pointer' }}>
                        <div style={{ marginBottom: 8, color: profile.affiliate_tipe === tipe.id ? '#059669' : '#6b7280' }}>
                        {tipe.id === 'personal' ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                      </div>
                        <div style={{ fontWeight: 600, color: profile.affiliate_tipe === tipe.id ? '#059669' : '#111827', fontSize: '0.875rem', marginBottom: 4 }}>{tipe.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5 }}>{tipe.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kategori produk */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Kategori Produk Fokus <span style={{ color: '#6b7280', fontWeight: 400 }}>(pilih yang paling relevan)</span></label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {['Mainan Anak', 'Skincare & Beauty', 'Fashion', 'Gadget & Tech', 'Makanan & Minuman', 'Ibu & Bayi', 'Olahraga & Fitness', 'Rumah & Dekorasi', 'Buku & Edukasi', 'Travel', 'Otomotif', 'Kesehatan', 'Gaming', 'Hewan Peliharaan', 'Peralatan Dapur'].map(kat => {
                      const selected = (profile.affiliate_kategori_fokus || []).includes(kat)
                      return (
                        <button key={kat} type="button" onClick={() => {
                          const cur = profile.affiliate_kategori_fokus || []
                          setProfile(p => ({ ...p, affiliate_kategori_fokus: selected ? cur.filter(x => x !== kat) : [...cur, kat] }))
                          setSaved(false)
                        }} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${selected ? '#059669' : 'transparent'}`, background: selected ? 'rgba(52,211,153,0.12)' : '#f3f4f6', color: selected ? '#059669' : '#6b7280', fontSize: '0.8rem', cursor: 'pointer', fontWeight: selected ? 600 : 400 }}>
                          {kat}
                        </button>
                      )
                    })}
                    {/* Custom kategori tags (non-preset) */}
                    {(profile.affiliate_kategori_fokus || []).filter(k => !['Mainan Anak','Skincare & Beauty','Fashion','Gadget & Tech','Makanan & Minuman','Ibu & Bayi','Olahraga & Fitness','Rumah & Dekorasi','Buku & Edukasi','Travel','Otomotif','Kesehatan','Gaming','Hewan Peliharaan','Peralatan Dapur'].includes(k)).map(k => (
                      <button key={k} type="button" onClick={() => {
                        setProfile(p => ({ ...p, affiliate_kategori_fokus: (p.affiliate_kategori_fokus || []).filter(x => x !== k) }))
                        setSaved(false)
                      }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #34d399', background: 'rgba(52,211,153,0.12)', color: '#059669', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {k} <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>×</span>
                      </button>
                    ))}
                  </div>
                  {/* Custom input */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input id="aff-kat-custom" style={fieldStyle({ flex: 1 })} placeholder="Kategori lain... (tekan Enter atau klik +)" onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && !(profile.affiliate_kategori_fokus || []).includes(val)) {
                          setProfile(p => ({ ...p, affiliate_kategori_fokus: [...(p.affiliate_kategori_fokus || []), val] }))
                          setSaved(false)
                        }
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }} />
                    <button type="button" onClick={() => {
                      const inp = document.getElementById('aff-kat-custom') as HTMLInputElement
                      const val = inp?.value.trim()
                      if (val && !(profile.affiliate_kategori_fokus || []).includes(val)) {
                        setProfile(p => ({ ...p, affiliate_kategori_fokus: [...(p.affiliate_kategori_fokus || []), val] }))
                        setSaved(false)
                        inp.value = ''
                      }
                    }} style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid #34d399', borderRadius: 8, padding: '0 16px', color: '#059669', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>+</button>
                  </div>
                </div>

                {/* Target buyer */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Target Pembeli (Buyer Persona)</label>
                  <textarea style={fieldStyle({ height: 80, resize: 'none' })} value={profile.affiliate_target_buyer} onChange={e => setField('affiliate_target_buyer', e.target.value)}
                    placeholder={`cth: Ibu-ibu 25-40 tahun yang punya anak balita, aktif di TikTok, cari produk mainan edukatif yang aman dan harga terjangkau, sering belanja online di Shopee/Tokopedia`} />
                </div>

                {/* Platform */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Platform Affiliate yang Digunakan</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['TikTok Shop', 'Shopee Affiliate', 'Tokopedia Affiliate', 'Lazada Affiliate', 'Involve Asia', 'AccessTrade', 'Evermos', 'Sociolla Affiliate', 'Traveloka', 'Tiket.com'].map(pl => {
                      const selected = (profile.affiliate_platforms || []).includes(pl)
                      return (
                        <button key={pl} type="button" onClick={() => {
                          const cur = profile.affiliate_platforms || []
                          setProfile(p => ({ ...p, affiliate_platforms: selected ? cur.filter(x => x !== pl) : [...cur, pl] }))
                          setSaved(false)
                        }} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${selected ? '#1a73e8' : 'transparent'}`, background: selected ? 'rgba(26,115,232,0.12)' : '#f3f4f6', color: selected ? '#1a73e8' : '#6b7280', fontSize: '0.8rem', cursor: 'pointer', fontWeight: selected ? 600 : 400 }}>
                          {pl}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SaveButton loading={saving} saved={saved} />
                  <button type="button" onClick={() => setAffStep('aff-identity')}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                    Lanjut: Identitas Akun →
                  </button>
                </div>
              </>)}

              {/* ── Step 2: Identitas Akun ── */}
              {affStep === 'aff-identity' && sectionCard(<>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Identitas Akun</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Nama akun, tagline, dan positioning yang bikin orang langsung ngerti akunmu tentang apa</div>
                  </div>
                  <button type="button" onClick={() => setAiModal({ prompt: buildAffIdentityPrompt() })}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Generate dengan AI
                  </button>
                </div>

                {/* Nama akun CRUD */}
                <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rekomendasi Nama Akun</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Simpan pilihan nama dari AI, lalu pilih satu sebagai utama</div>
                    </div>
                    <button type="button" onClick={() => setProfile(p => ({ ...p, affiliate_nama_options: [...(p.affiliate_nama_options || []), { id: crypto.randomUUID(), nama: '', alasan: '', is_primary: (p.affiliate_nama_options || []).length === 0 }] }))}
                      style={{ background: '#059669', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      + Tambah Nama
                    </button>
                  </div>
                  {(profile.affiliate_nama_options || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: '0.82rem' }}>Belum ada — Generate dengan AI lalu tambahkan hasilnya</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(profile.affiliate_nama_options || []).map((opt, idx) => (
                      <div key={opt.id} style={{ background: opt.is_primary ? 'rgba(52,211,153,0.06)' : '#f9fafb', border: `1px solid ${opt.is_primary ? '#34d39950' : 'transparent'}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          {opt.is_primary && <span style={{ background: '#d1fae5', color: '#059669', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>Utama</span>}
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                            {!opt.is_primary && <button type="button" onClick={() => setProfile(p => ({ ...p, affiliate_nama_options: (p.affiliate_nama_options || []).map(n => ({ ...n, is_primary: n.id === opt.id })) }))}
                              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d39930', borderRadius: 6, padding: '4px 8px', color: '#059669', fontSize: '0.73rem', cursor: 'pointer' }}>Pilih</button>}
                            <button type="button" onClick={() => setProfile(p => ({ ...p, affiliate_nama_options: (p.affiliate_nama_options || []).filter(n => n.id !== opt.id) }))}
                              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '4px 8px', color: '#dc2626', fontSize: '0.73rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                          </div>
                        </div>
                        <input style={fieldStyle({ marginBottom: 8 })} value={opt.nama}
                          onChange={e => setProfile(p => ({ ...p, affiliate_nama_options: (p.affiliate_nama_options || []).map((n, i) => i === idx ? { ...n, nama: e.target.value } : n) }))}
                          placeholder="Nama akun (cth: kidstuff.id, tokomainanedu, mainan_cermat)" />
                        <input style={fieldStyle({ fontSize: '0.78rem' })} value={opt.alasan}
                          onChange={e => setProfile(p => ({ ...p, affiliate_nama_options: (p.affiliate_nama_options || []).map((n, i) => i === idx ? { ...n, alasan: e.target.value } : n) }))}
                          placeholder="Alasan / keunggulan nama ini..." />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tagline */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Tagline Akun</label>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>1 kalimat singkat yang menjelaskan akunmu (tampil di bio)</div>
                  <input style={fieldStyle({})} value={profile.affiliate_tagline} onChange={e => setField('affiliate_tagline', e.target.value)}
                    placeholder="cth: Mainan edukatif terpercaya untuk tumbuh kembang si kecil" />
                </div>

                {/* Positioning */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Positioning Statement</label>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>Apa yang membedakan akunmu dari akun sejenis?</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {['Honest Reviewer', 'Deal Hunter', 'Niche Expert', 'Lifestyle Curator', 'Tutorial Creator', 'Comparison Expert', 'Budget Finder', 'Premium Curator'].map(opt => (
                      <button key={opt} type="button" onClick={() => setField('affiliate_positioning', profile.affiliate_positioning === opt ? '' : opt)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${profile.affiliate_positioning === opt ? '#059669' : 'transparent'}`, background: profile.affiliate_positioning === opt ? 'rgba(52,211,153,0.12)' : '#f3f4f6', color: profile.affiliate_positioning === opt ? '#059669' : '#6b7280', fontSize: '0.8rem', cursor: 'pointer', fontWeight: profile.affiliate_positioning === opt ? 600 : 400 }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <textarea style={fieldStyle({ height: 72, resize: 'none' })} value={profile.affiliate_positioning_statement} onChange={e => setField('affiliate_positioning_statement', e.target.value)}
                    placeholder="cth: Satu-satunya akun TikTok yang test & review mainan anak secara langsung sebelum rekomendasiin — gak ada titipan, semuanya jujur" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setAffStep('aff-niche')} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>← Kembali</button>
                    <SaveButton loading={saving} saved={saved} />
                  </div>
                  <button type="button" onClick={() => setAffStep('aff-konten')}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                    Lanjut: Konten Strategy →
                  </button>
                </div>
              </>)}

              {/* ── Step 3: Konten Strategy ── */}
              {affStep === 'aff-konten' && sectionCard(<>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Konten Strategy</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Set preferensi dasar — eksekusi naskah & konten di modul Plan</div>
                  </div>
                  <button type="button" onClick={() => setAiModal({ prompt: buildAffKontenPrompt() })}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Generate dengan AI
                  </button>
                </div>

                {/* CTA ke Plan */}
                <a href="/plan" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 20, border: '1px solid rgba(26,115,232,0.3)', background: 'rgba(26,115,232,0.06)', textDecoration: 'none' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8d1e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#1a73e8', fontSize: '0.9rem', marginBottom: 4 }}>Eksekusi di modul Plan</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.6 }}>Naskah, hook, ide konten, jadwal posting — semua dikerjakan di Plan yang sudah baca data brand ini secara otomatis.</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#42a5f5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>

                {/* Content pillars — satu-satunya yang memang brand-level */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Content Pillars Akun</label>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>Tema besar konten yang membentuk identitas akun — generate AI lalu paste di sini</div>
                  <textarea style={fieldStyle({ height: 110, resize: 'none' })} value={profile.affiliate_content_pillars} onChange={e => setField('affiliate_content_pillars', e.target.value)}
                    placeholder={'cth:\n1. Review Jujur — test produk sebelum rekomendasiin\n2. Deal Alert — info flash sale & promo\n3. Tutorial — cara pakai produk yang bener\n4. Perbandingan — A vs B, mana worth it?'} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setAffStep('aff-identity')} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>← Kembali</button>
                    <SaveButton loading={saving} saved={saved} />
                  </div>
                  <button type="button" onClick={() => setAffStep('aff-bio')}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                    Lanjut: Bio & Trust →
                  </button>
                </div>
              </>)}

              {/* ── Step 4: Bio & Trust ── */}
              {affStep === 'aff-bio' && sectionCard(<>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Bio & Trust Builder</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Bio yang convert + kalimat yang bikin audiens percaya rekomendasimu</div>
                  </div>
                  <button type="button" onClick={() => setAiModal({ prompt: buildAffiliatePrompt() })}
                    style={{ background: '#059669', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Generate dengan AI
                  </button>
                </div>

                {/* Trust builder */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Kenapa Orang Harus Percaya Rekomendasimu?</label>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>Pengalaman, track record, atau expertise yang kamu punya di niche ini</div>
                  <textarea style={fieldStyle({ height: 88, resize: 'none' })} value={profile.affiliate_trust_builder} onChange={e => setField('affiliate_trust_builder', e.target.value)}
                    placeholder="cth: Gua ibu 2 anak yang udah 3 tahun kuratasi mainan edukatif — semua produk yang gua rekomendasiin udah gua beliin dulu buat anak gua, bukan asal comot dari seller..." />
                </div>

                {/* Disclosure */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>Kalimat Disclosure Affiliate</label>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: 8 }}>Transparansi ke audiens — justru ini yang bikin makin dipercaya</div>
                  <input style={fieldStyle({})} value={profile.affiliate_disclosure} onChange={e => setField('affiliate_disclosure', e.target.value)}
                    placeholder="cth: Link di bio adalah affiliate link — gua dapet komisi kecil kalau kamu beli, tapi review gua tetap jujur dan berdasarkan pengalaman sendiri ✓" />
                </div>

                {/* Bio CRUD */}
                <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variasi Bio Akun</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>Simpan beberapa variasi, pilih satu sebagai utama</div>
                    </div>
                    <button type="button" onClick={() => setProfile(p => ({ ...p, affiliate_bio_options: [...(p.affiliate_bio_options || []), { id: crypto.randomUUID(), teks: '', is_primary: (p.affiliate_bio_options || []).length === 0 }] }))}
                      style={{ background: '#059669', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      + Tambah Variasi
                    </button>
                  </div>
                  {(profile.affiliate_bio_options || []).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#6b7280', fontSize: '0.82rem' }}>Belum ada variasi — Generate lalu tambahkan hasilnya</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(profile.affiliate_bio_options || []).map((opt, idx) => (
                      <div key={opt.id} style={{ background: opt.is_primary ? 'rgba(52,211,153,0.06)' : '#f9fafb', border: `1px solid ${opt.is_primary ? '#34d39950' : 'transparent'}`, borderRadius: 10, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          {opt.is_primary && <span style={{ background: '#d1fae5', color: '#059669', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>Utama</span>}
                          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                            {!opt.is_primary && <button type="button" onClick={() => setProfile(p => ({ ...p, affiliate_bio_options: (p.affiliate_bio_options || []).map(b => ({ ...b, is_primary: b.id === opt.id })) }))}
                              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid #34d39930', borderRadius: 6, padding: '4px 8px', color: '#059669', fontSize: '0.73rem', cursor: 'pointer' }}>Pilih</button>}
                            <button type="button" onClick={() => setProfile(p => ({ ...p, affiliate_bio_options: (p.affiliate_bio_options || []).filter(b => b.id !== opt.id) }))}
                              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '4px 8px', color: '#dc2626', fontSize: '0.73rem', cursor: 'pointer' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                          </div>
                        </div>
                        <textarea style={fieldStyle({ height: 80, resize: 'none' })} value={opt.teks}
                          onChange={e => setProfile(p => ({ ...p, affiliate_bio_options: (p.affiliate_bio_options || []).map((b, i) => i === idx ? { ...b, teks: e.target.value } : b) }))}
                          placeholder="Paste variasi bio dari AI..." />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="button" onClick={() => setAffStep('aff-konten')} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>← Kembali</button>
                  <SaveButton loading={saving} saved={saved} />
                </div>
              </>)}
            </div>
          )
        })()}
      </form>

      {/* Content Pillars — own form, must be outside outer form */}
      {tab === 'pillars' && (
        <ContentPillarsTab workspaceId={workspaceId} profile={profile} />
      )}

      {/* ── Akun Sosial ── */}
      {tab === 'akun' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>Akun Sosial Media</div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Daftarkan akun-akun sosmed yang kamu kelola. Maksimal {MAX_AKUN} akun per workspace.</div>
          </div>

          {/* Registered accounts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {akunList.length === 0 && (
              <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 10, padding: '28px 20px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                Belum ada akun terdaftar. Tambahkan akun pertama kamu.
              </div>
            )}
            {akunList.map(a => (
              <div key={a.id} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'rgba(26,115,232,0.12)', color: '#1a73e8', border: '1px solid rgba(26,115,232,0.2)', whiteSpace: 'nowrap' }}>{a.platform}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{a.nama}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 1 }}>@{a.handle}</div>
                </div>
                <button
                  onClick={() => deleteAkun(a.id)}
                  disabled={deletingAkun === a.id}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>
                  {deletingAkun === a.id ? '...' : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></>}
                </button>
              </div>
            ))}
          </div>

          {/* Add new account form */}
          {akunList.length < MAX_AKUN ? (
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: '16px 18px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>+ Tambah Akun ({akunList.length}/{MAX_AKUN})</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginBottom: 5 }}>Platform</label>
                  <select
                    value={akunForm.platform}
                    onChange={e => setAkunForm(f => ({ ...f, platform: e.target.value }))}
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 7, padding: '8px 10px', color: '#111827', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
                    {PLATFORMS_SOSMED.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginBottom: 5 }}>Username / Handle</label>
                  <input
                    value={akunForm.handle}
                    onChange={e => setAkunForm(f => ({ ...f, handle: e.target.value }))}
                    placeholder="namaakun (tanpa @)"
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 7, padding: '8px 10px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', marginBottom: 5 }}>Nama Akun (label untuk kamu)</label>
                  <input
                    value={akunForm.nama}
                    onChange={e => setAkunForm(f => ({ ...f, nama: e.target.value }))}
                    placeholder="cth: Toko Utama, Akun Affiliate A"
                    style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 7, padding: '8px 10px', color: '#111827', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button
                onClick={addAkun}
                disabled={savingAkun || !akunForm.handle.trim() || !akunForm.nama.trim()}
                style={{ background: '#1a73e8', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: savingAkun ? 'default' : 'pointer', opacity: (!akunForm.handle.trim() || !akunForm.nama.trim()) ? 0.5 : 1 }}>
                {savingAkun ? 'Menyimpan...' : '+ Tambah Akun'}
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: '0.82rem', color: '#dc2626' }}>
              Batas maksimal {MAX_AKUN} akun sudah tercapai. Hapus akun yang tidak aktif untuk menambah baru.
            </div>
          )}
        </div>
      )}

      {/* Universal AI Picker Modal */}
      {aiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) { setAiModal(null); setPromptCopied(false) } }}>
          <div style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.14)', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>Buka dengan AI</div>
              <button type="button" onClick={() => { setAiModal(null); setPromptCopied(false) }} style={{ width: 30, height: 30, borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#6b7280', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'ChatGPT', desc: 'OpenAI GPT-4o', abbr: 'GPT', color: '#10b981', url: `https://chatgpt.com/?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'Claude', desc: 'Anthropic Claude', abbr: 'Cl', color: '#d97706', url: `https://claude.ai/new?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'Gemini', desc: 'Google Gemini', abbr: 'Gm', color: '#3b82f6', url: `https://gemini.google.com/app?q=${encodeURIComponent(aiModal.prompt)}` },
                { label: 'DeepSeek', desc: 'DeepSeek R1', abbr: 'DS', color: '#8b5cf6', url: `https://chat.deepseek.com/?q=${encodeURIComponent(aiModal.prompt)}` },
              ].map(ai => (
                <a key={ai.label} href={ai.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: '#f9fafb', textDecoration: 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: ai.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: ai.color }}>{ai.abbr}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{ai.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{ai.desc}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                </a>
              ))}
            </div>
            <div style={{ height: 12 }} />
          </div>
        </div>
      )}
    </div>
  )
}

function ContentPillarsTab({ workspaceId, profile }: { workspaceId: string; profile: BrandProfile }) {
  const [pillars, setPillars] = useState<Array<{ id?: string; nama: string; hashtags: string; urutan: number }>>([
    { nama: '', hashtags: '', urutan: 1 }
  ])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [aiModal, setAiModal] = useState<{ prompt: string } | null>(null)
  const [promptCopied, setPromptCopied] = useState(false)

  function buildPillarsPromptLocal(): string {
    const niche = profile.niche || '[isi Niche Hunt dulu]'
    const microNiche = profile.micro_niche || '-'
    const premis = profile.premis || '[isi Origin Story dulu]'
    const tone = profile.tone_of_voice || 'Friendly'
    const audiens = profile.target_audiens || '[belum diisi]'
    const platform = profile.platform_utama || 'TikTok/Instagram'
    const nama = profile.nama_akun || '[nama belum diisi]'

    return `Kamu adalah seorang Content Strategist yang ahli membangun ekosistem konten yang konsisten dan strategis untuk content creator Indonesia.

Jawab seluruhnya dalam Bahasa Indonesia. Output harus langsung actionable dan spesifik untuk ${platform}.

---

DATA KREATOR

Nama: ${nama}
Niche: ${niche}
Micro-niche: ${microNiche}
Platform utama: ${platform}
Tone of voice: ${tone}
Target audiens: ${audiens}
Premis brand: ${premis}

---

YANG SAYA BUTUHKAN:

▸ 5–7 CONTENT PILLAR UTAMA
Untuk setiap pillar, berikan:
- Nama pillar (2-4 kata, berkarakter, bukan generik seperti "Edukasi" saja)
- Fungsi pillar ini dalam membangun personal branding saya
- 3 contoh judul konten spesifik yang bisa langsung dibuat di ${platform}
- Tipe konten yang paling cocok (Reels, Carousel, Live, dll)
- 5 hashtag relevan untuk pillar ini

Pastikan 5 pilar dasar ini tercakup tapi disesuaikan dengan niche saya:
Edukasi / Hiburan / Bukti Sosial / Cerita Personal / Promosi

▸ 2–3 PILLAR BONUS
Pillar tambahan yang relevan dengan micro-niche dan bisa membedakan saya dari kreator lain.

▸ STRATEGI ROTASI
Rekomendasikan pola posting mingguan — pillar mana diposting hari apa dan kenapa.

---

Tutup dengan pertanyaan yang membantu saya memilih pillar yang paling realistis untuk dikerjakan konsisten.`
  }

  function addPillar() {
    if (pillars.length >= 10) return
    setPillars(p => [...p, { nama: '', hashtags: '', urutan: p.length + 1 }])
  }

  function removePillar(i: number) {
    setPillars(p => p.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, urutan: idx + 1 })))
  }

  async function savePillars(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('kf_content_pillars').delete().eq('workspace_id', workspaceId)
    await supabase.from('kf_content_pillars').insert(
      pillars.filter(p => p.nama).map(p => ({
        workspace_id: workspaceId,
        nama: p.nama,
        urutan: p.urutan,
        hashtags: p.hashtags.split(/\s+/).filter(Boolean),
      }))
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
    {/* Warning banners — di luar form agar tidak trigger submit */}
    {!profile.niche && (
      <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b', marginBottom: 12 }}>
        Pillar akan lebih tepat jika kamu sudah mengisi <strong>Niche Hunt</strong> dan <strong>Origin Story</strong> terlebih dahulu.
      </div>
    )}
    {profile.niche && !profile.premis && (
      <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem', color: '#f59e0b', marginBottom: 12 }}>
        Tip: Kamu sudah punya niche. Isi juga <strong>Origin Story</strong> agar AI bisa buat pillar yang lebih tajam dan sesuai premis brand.
      </div>
    )}
    <form onSubmit={savePillars}>
      <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>Content Pillars</div>
            <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Maksimal 10 pillar konten + hashtag set per pillar</div>
          </div>
          <button
            type="button"
            disabled={!profile.niche}
            onClick={() => setAiModal({ prompt: buildPillarsPromptLocal() })}
            style={{ background: '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: profile.niche ? 'pointer' : 'not-allowed', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            Generate dengan AI
          </button>
        </div>

        {pillars.map((pillar, i) => (
          <div key={i} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1a73e8', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {i + 1}
              </div>
              <input
                style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#111827', fontSize: '0.875rem', outline: 'none' }}
                value={pillar.nama}
                onChange={e => setPillars(p => p.map((x, idx) => idx === i ? { ...x, nama: e.target.value } : x))}
                placeholder={`Nama pillar ${i + 1}...`}
              />
              {pillars.length > 1 && (
                <button type="button" onClick={() => removePillar(i)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}>×</button>
              )}
            </div>
            <textarea
              style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#6b7280', fontSize: '0.8rem', outline: 'none', height: 64, resize: 'none', boxSizing: 'border-box' }}
              value={pillar.hashtags}
              onChange={e => setPillars(p => p.map((x, idx) => idx === i ? { ...x, hashtags: e.target.value } : x))}
              placeholder="#hashtag1 #hashtag2 #hashtag3 (max 30 hashtag)"
            />
          </div>
        ))}

        {pillars.length < 10 && (
          <button type="button" onClick={addPillar} style={{ background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 10, padding: '12px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            + Tambah Pillar
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <SaveButton loading={saving} saved={saved} />
        </div>
      </div>
    </form>

    {aiModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={e => { if (e.target === e.currentTarget) { setAiModal(null); setPromptCopied(false) } }}>
        <div style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.14)', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>Buka dengan AI</div>
            <button type="button" onClick={() => { setAiModal(null); setPromptCopied(false) }} style={{ width: 30, height: 30, borderRadius: 8, background: '#f3f4f6', border: 'none', color: '#6b7280', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'ChatGPT', desc: 'OpenAI GPT-4o', abbr: 'GPT', color: '#10b981', url: `https://chatgpt.com/?q=${encodeURIComponent(aiModal.prompt)}` },
              { label: 'Claude', desc: 'Anthropic Claude', abbr: 'Cl', color: '#d97706', url: `https://claude.ai/new?q=${encodeURIComponent(aiModal.prompt)}` },
              { label: 'Gemini', desc: 'Google Gemini', abbr: 'Gm', color: '#3b82f6', url: `https://gemini.google.com/app?q=${encodeURIComponent(aiModal.prompt)}` },
              { label: 'DeepSeek', desc: 'DeepSeek R1', abbr: 'DS', color: '#8b5cf6', url: `https://chat.deepseek.com/?q=${encodeURIComponent(aiModal.prompt)}` },
            ].map(ai => (
              <a key={ai.label} href={ai.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, background: '#f9fafb', textDecoration: 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: ai.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: ai.color }}>{ai.abbr}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{ai.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{ai.desc}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              </a>
            ))}
          </div>
          <div style={{ height: 12 }} />
        </div>
      </div>
    )}
    </>
  )
}
