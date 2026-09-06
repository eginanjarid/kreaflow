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

## Setup Lokal (Onboarding Developer Baru)

### 1. Clone repo

```bash
git clone git@github.com:eginanjarid/kreaflow.git
cd kreaflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup env

Minta file `.env.local` dari owner. Letakkan di root folder.  
**Jangan pernah commit `.env.local` ke GitHub.**

Key penting yang dibutuhkan:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_APP_URL=https://kreaflow.id
CRON_SECRET=
WEBHOOK_SECRET=
XENDIT_SECRET_KEY=
XENDIT_WEBHOOK_TOKEN=
```

### 4. Jalankan dev server

```bash
npm run dev
# Buka http://localhost:3000
```

---

## Deploy Flow (PENTING)

**Alur deploy tim:**

```
Developer → git push origin main → GitHub Actions → VPS → Live
```

Developer **tidak perlu** SSH ke VPS. Cukup push ke GitHub, GitHub Actions yang handle sisanya secara otomatis.

### Langkah deploy:

```bash
git add .
git commit -m "feat: deskripsi perubahan"
git push origin main        # ← ini saja sudah cukup
```

Setelah push:
1. GitHub Actions otomatis jalan (~5-10 menit)
2. VPS pull kode terbaru dari GitHub
3. Build + restart PM2
4. Owner dapat notifikasi Telegram sukses/gagal

### Cek status deploy:

Buka: `https://github.com/eginanjarid/kreaflow/actions`

---

## Database Migration

Untuk perubahan schema DB (tambah tabel, kolom, index), gunakan migration file.

### Cara membuat migration:

1. Buat file SQL di folder `migrations/pending/`:

```bash
# Contoh nama file: 001_add_column_notes.sql
touch migrations/pending/001_add_column_notes.sql
```

2. Tulis SQL yang **idempotent** (aman dijalankan berulang):

```sql
-- migrations/pending/001_add_column_notes.sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE INDEX IF NOT EXISTS idx_tasks_brand_id ON tasks(brand_id);
```

3. Commit dan push:

```bash
git add migrations/pending/
git commit -m "migration: add notes column to tasks"
git push origin main
```

GitHub Actions akan otomatis apply migration sebelum build.

### Migration manual (darurat):

Kalau perlu jalankan migration langsung tanpa push kode:

1. Buka GitHub → **Actions** → **"Run DB Migration"**
2. Klik **"Run workflow"** (kanan atas)
3. Isi `filename` (nama file di `migrations/pending/`) atau `sql` (inline SQL)
4. Klik **"Run workflow"**
5. Owner dapat notifikasi Telegram hasilnya

---

## Setup GitHub Actions (Owner — One-time Setup)

> Bagian ini hanya dilakukan **sekali** oleh owner. Developer tidak perlu repot ini.

### Step 1: Generate SSH Deploy Key

Di terminal lokal owner:

```bash
ssh-keygen -t ed25519 -C "kreaflow-github-actions" -f ~/.ssh/kreaflow_deploy -N ""
# Hasilnya: kreaflow_deploy (private) dan kreaflow_deploy.pub (public)
```

### Step 2: Tambahkan Public Key ke VPS

```bash
cat ~/.ssh/kreaflow_deploy.pub | ssh root@194.233.95.194 "cat >> ~/.ssh/authorized_keys"
```

### Step 3: Setup GitHub Secrets

Buka: `https://github.com/eginanjarid/kreaflow/settings/secrets/actions`

Tambahkan secrets berikut:

| Secret | Value |
|---|---|
| `VPS_HOST` | `194.233.95.194` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | isi dengan konten file `~/.ssh/kreaflow_deploy` (private key) |
| `TELEGRAM_BOT_TOKEN` | token bot Telegram (lihat Step 4) |
| `TELEGRAM_CHAT_ID` | chat ID owner (lihat Step 4) |

**Cara copy private key:**
```bash
cat ~/.ssh/kreaflow_deploy
# Copy semua output termasuk -----BEGIN/END-----
```

### Step 4: Setup Telegram Bot untuk Notifikasi

1. Buka Telegram → cari `@BotFather`
2. Ketik `/newbot` → ikuti instruksi → simpan token
3. Start chat dengan bot baru kamu
4. Dapat Chat ID: buka `https://api.telegram.org/bot<TOKEN>/getUpdates` → cari `"id"` di bawah `"chat"`
5. Isi `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` di GitHub Secrets

### Step 5: Pastikan VPS bisa pull dari GitHub

Di VPS, cek apakah sudah ada SSH key untuk GitHub:

```bash
ssh root@194.233.95.194 "ssh -T git@github.com 2>&1"
# Harusnya: "Hi eginanjarid! You've successfully authenticated..."
```

Kalau belum:
```bash
ssh root@194.233.95.194
ssh-keygen -t ed25519 -C "vps-kreaflow" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
# Copy output, tambahkan di: https://github.com/settings/ssh/new
```

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
migrations/
├── pending/                 # SQL yang belum diapply (akan auto-run saat deploy)
└── applied/                 # SQL yang sudah diapply (auto-dipindah oleh deploy)
.github/
└── workflows/
    ├── deploy.yml           # Auto-deploy saat push ke main
    └── migrate.yml          # Manual migration via GitHub Actions
```

---

## Modul & Fitur

### Auth & Workspace
- Login via **magic link** (email) — tidak ada password
- SMTP custom: `tuasdigitalofficial@gmail.com` via Gmail
- Cookie name: `sb-api-sf-auth-token` (penting untuk logout!)
- Setiap user bisa punya 1+ workspace, bisa switch antar workspace
- **Logout WAJIB via server route** `/auth/logout` — jangan client-side

### Pricing (2 Tier)
| Tier | Harga | Limit |
|---|---|---|
| Free | Gratis | 1 member |
| Lifetime | Rp 149.000 (one-time) | 5 members |

---

## Auth & Cookie — Hal Kritis

- ✅ Logout → `router.push('/auth/logout')`
- ❌ Jangan `supabase.auth.signOut()` langsung di client

Cookie name aktif: **`sb-api-sf-auth-token`**

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
POST /api/upload/avatar            # Upload foto profil
POST /api/upload/logo              # Upload logo brand
POST /api/gdrive                   # Integrasi Google Drive
POST /api/ai/brand                 # AI generate brand brief
POST /api/ai/expand-idea           # AI expand ide konten
GET  /api/cron/deadline-check      # Cek deadline konten (dijadwal)
```

---

## Database (Supabase self-hosted, shared VPS)

Host: `194.233.95.194`

Tabel utama:

| Tabel | Isi |
|---|---|
| `profiles` | User + workspace aktif |
| `workspaces` | Data workspace per user/tim |
| `workspace_members` | Relasi user ↔ workspace |
| `brands` | Brand/klien per workspace |
| `content_plans` | Plan konten per bulan |
| `tasks` | Task per konten |
| `time_logs` | Log waktu kerja |
| `assets` | Aset media (Google Drive link) |
| `transactions` | Riwayat pembayaran Xendit |
| `promo_codes` | Kode promo/kupon |
| `app_settings` | Pengaturan global (harga, dll) |

---

## Keterkaitan dengan Project Lain

### ← AdsGrow
AdsGrow punya `lib/utils/provision-kreaflow.ts` yang hit API KreaFlow untuk provisioning akun otomatis ketika buyer dikonversi. Flow:
1. Owner tandai buyer di CRM AdsGrow
2. AdsGrow POST ke `/api/workspace/create`
3. KreaFlow buat akun + workspace baru
4. Buyer dapat magic link login

---

## Kontak & Akses

- **Supabase Dashboard**: shared VPS dengan AdsGrow (194.233.95.194)
- **GitHub Repo**: `github.com/eginanjarid/kreaflow`
- **GitHub Actions**: `github.com/eginanjarid/kreaflow/actions`
- **Xendit Dashboard**: minta akses dari owner
