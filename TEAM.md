# KreaFlow — Developer Guide

> SaaS manajemen konten untuk Social Media Manager (SMM).  
> Platform multi-workspace untuk tim agency/brand mengelola konten, jadwal posting, brief, dan performa.  
> URL: **kreaflow.id**

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router, folder `src/`) |
| Database | Supabase (self-hosted di VPS) |
| Auth | Supabase Auth — **magic link via SMTP custom** |
| Styling | Tailwind CSS |
| AI | OpenRouter API |
| Payment | Xendit (belum live, sudah terintegrasi) |
| Storage | Google Drive API (upload media) |
| Deploy | PM2 di VPS (id: 25), port 3003 |

---

## Struktur Folder

```
src/
├── app/
│   ├── (app)/               # Semua halaman dalam dashboard (butuh login + workspace)
│   │   ├── admin/           # Panel admin internal (super admin)
│   │   ├── brand/           # Manajemen brand/klien
│   │   ├── budget/          # Manajemen budget konten
│   │   ├── calendar/        # Kalender jadwal posting
│   │   ├── catalog/         # Katalog konten (template)
│   │   ├── insights/        # Laporan kerja tim
│   │   ├── library/         # Library aset (gambar, video, copy)
│   │   ├── notifications/   # Notifikasi
│   │   ├── plan/            # Content plan bulanan
│   │   ├── settings/        # Pengaturan workspace & profil
│   │   ├── sprints/         # Sprint konten
│   │   ├── studio/          # Studio konten (editor)
│   │   ├── tasks/           # Task management
│   │   ├── tracker/         # Time tracker
│   │   └── upgrade/         # Halaman upgrade ke Lifetime
│   ├── (auth)/              # Login, register
│   ├── api/                 # API routes
│   ├── auth/callback/       # Supabase auth callback
│   ├── checkout/            # Halaman checkout Xendit
│   └── LandingContent.tsx   # Landing page publik
```

---

## Modul & Fitur

### Auth & Workspace
- Login via **magic link** (email) — tidak ada password
- SMTP custom: `tuasdigitalofficial@gmail.com` via Gmail
- Cookie name: `sb-api-sf-auth-token` (penting untuk logout!)
- Setiap user bisa punya 1+ workspace, bisa switch antar workspace
- **Logout WAJIB via server route** `/auth/logout` — jangan client-side, karena server & browser pakai URL Supabase berbeda sehingga cookie name beda

### Pricing (2 Tier)
| Tier | Harga | Limit |
|---|---|---|
| Free | Gratis | 1 member |
| Lifetime | Rp 149.000 (one-time) | 5 members |

Harga dikelola via Admin Panel (dynamic, bukan hardcode).

### Brand
- CRUD brand/klien yang dikelola workspace
- Setiap konten terikat ke brand

### Calendar
- Kalender visual jadwal posting
- Drag & drop konten ke tanggal

### Plan
- Content plan per bulan per brand
- Status: draft → review → approved → scheduled → posted

### Tasks
- Task management per konten/project
- Assign ke anggota tim

### Tracker
- Time tracker untuk catat jam kerja per task

### Studio
- Editor konten: copy, caption, hashtag
- Upload aset ke Google Drive

### Library
- Penyimpanan aset yang sudah diupload
- Filter by brand, tipe, tanggal

### Insights
- Laporan kerja tim: konten selesai, jam kerja, dll

### Sprints
- Sprint management (mirip Agile sprint untuk konten)

### Admin Panel
- Kelola user, pricing, promo, kupon
- Lihat semua transaksi Xendit
- Migrate data antar workspace

---

## API Routes Penting

```
POST /api/auth/magic-link          # Kirim magic link login
POST /api/auth/logout              # Logout (WAJIB server-side)
POST /api/workspace/create         # Buat workspace baru
POST /api/workspace/switch         # Ganti workspace aktif
POST /api/team                     # Invite/kelola anggota tim
POST /api/payment/create-invoice   # Buat invoice Xendit untuk upgrade
POST /api/payment/webhook          # Terima callback pembayaran Xendit
POST /api/payment/validate-coupon  # Validasi kode kupon
POST /api/upload/avatar            # Upload foto profil
POST /api/upload/logo              # Upload logo brand
POST /api/gdrive                   # Integrasi Google Drive
POST /api/ai/brand                 # AI generate brand brief
POST /api/ai/expand-idea           # AI expand ide konten
POST /api/ai/library               # AI untuk library
GET  /api/cron/deadline-check      # Cek deadline konten (dijadwal)
POST /api/admin/...                # Admin endpoints (butuh super admin)
```

---

## Database (Supabase self-hosted, shared VPS)

Tabel utama:

| Tabel | Isi |
|---|---|
| `profiles` | User + workspace aktif |
| `workspaces` | Data workspace per user/tim |
| `workspace_members` | Relasi user ↔ workspace (role: owner/member) |
| `brands` | Brand/klien per workspace |
| `content_plans` | Plan konten per bulan |
| `tasks` | Task per konten |
| `time_logs` | Log waktu kerja |
| `assets` | Aset media (Google Drive link) |
| `transactions` | Riwayat pembayaran Xendit |
| `promo_codes` | Kode promo/kupon |
| `app_settings` | Pengaturan global (harga, dll) |

---

## Env Vars

```env
NEXT_PUBLIC_SUPABASE_URL=      # URL Supabase self-hosted (sama dengan AdsGrow)
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Anon key
SUPABASE_SERVICE_ROLE_KEY=     # Service role (server-side only)
OPENROUTER_API_KEY=            # Untuk fitur AI
NEXT_PUBLIC_APP_URL=           # https://kreaflow.id
CRON_SECRET=                   # Auth header cron jobs
WEBHOOK_SECRET=                # Validasi webhook internal
XENDIT_SECRET_KEY=             # Xendit payment gateway
XENDIT_WEBHOOK_TOKEN=          # Validasi webhook Xendit
```

---

## Auth & Cookie — Hal Kritis

Supabase self-hosted punya 2 URL berbeda (internal Docker vs external domain). Ini menyebabkan cookie name berbeda antara server dan browser. **Aturan wajib:**

- ✅ Logout → `router.push('/auth/logout')` atau fetch ke `/api/auth/logout`
- ❌ Jangan `supabase.auth.signOut()` langsung di client — cookie tidak terhapus dengan benar

Cookie name aktif: **`sb-api-sf-auth-token`**

---

## Deploy Flow

```bash
git add .
git commit -m "pesan"
git push origin main     # ke GitHub
git push vps main        # ke VPS → auto build + restart PM2
```

Port: **3003** (diproxy Nginx ke kreaflow.id)

---

## Keterkaitan dengan Project Lain

### ← AdsGrow
AdsGrow punya `lib/utils/provision-kreaflow.ts` yang hit API KreaFlow untuk **provisioning akun secara otomatis** ketika buyer di CRM AdsGrow dikonversi ke user KreaFlow. Flow:
1. Owner tandai buyer di CRM AdsGrow
2. AdsGrow POST ke endpoint KreaFlow (`/api/workspace/create`)
3. KreaFlow buat akun + workspace baru untuk buyer
4. Buyer dapat magic link login

### SprintFlow
Tidak ada integrasi teknis. Produk terpisah, target market berbeda.

---

## Kontak & Akses

- **Supabase Dashboard**: shared VPS dengan AdsGrow (194.233.95.194)
- **Xendit Dashboard**: minta akses dari owner
- **GitHub Repo**: `github.com/eginanjarid/kreaflow`
