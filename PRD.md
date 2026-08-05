# KreaFlow — Product Requirements Document

**Last updated:** 4 Agustus 2026 (rev 2)  
**Domain:** kreaflow.id  
**Stack:** Next.js 16.2.10 App Router + TypeScript + Supabase self-hosted + AI (OpenRouter)  
**VPS:** 194.233.95.194 | PM2: `kreaflow` (id: 15) | Port: 2847  
**Deploy:** `git push vps main` → auto build + restart  
**DB:** Supabase self-hosted `api-sf.tuasdigital.com`, semua tabel prefix `kf_`

---

## Pricing Model (Confirmed)

| Plan | Harga | Member | Fitur |
|---|---|---|---|
| `free` | Gratis | 1 (owner only) | Semua fitur, tapi tidak bisa invite tim |
| `lifetime` | Rp149.000 sekali bayar | 5 (owner + 4 anggota) | Full akses + invite tim |

Payment via **Xendit Invoice API**. Webhook di `/api/payment/webhook`.

---

## Workflow Inti (Confirmed, Production-Ready)

```
Brand (setup sekali) → tab Akun Sosial (daftarkan max 10 akun sosmed)
  ↓
Sprints  ←── entry point setiap produksi konten
  → pilih template (Affiliate / Creator / Live / Custom)
  → pilih akun posting (dari Brand → Akun Sosial)
  → isi produk + jumlah konten → auto-generate content slots
  → assign step per anggota tim + deadline per step
  ↓ (klik chip step "Buat Naskah" → buka Plan)
Plan  ←── copywriter buat naskah AI
  → simpan → cek apakah ada slot Sprint aktif untuk produk ini
     ↓ jika ada → modal: "Update Slot Sprint" atau "Simpan Baru"
  ↓ (notif ke Studio)
Studio  ←── desainer/editor produksi visual
  ↓ (notif ke Calendar)
Calendar  ←── "Siap Dijadwalkan" antrian + jadwal posting
  → quick schedule: pilih tanggal + jam + platform → status Terjadwal
  ↓
Tayang → Sprint Board column "Done ✓"
```

---

## Status Modul

### ✅ LIVE

#### 1. Brand
Setup identitas workspace sekali. AI-powered. Mode tab ditentukan oleh `kf_workspaces.brand_type`.

**Mode Creator** (tab: Frekuensi | Account Identity | Niche Hunt | Origin Story | Content Pillars | Bio Studio | Brand Identity | Akun Sosial)
- Niche Finder, Micro-niche, Storytelling Builder, Smart Content Pillar, Bio Generator

**Mode Affiliate** (tab: Brand Score | Profil & Target | Identitas Akun | Bio & Trust | Akun Sosial | Brand Visual)
- **Profil & Target** (`aff-niche`): tipe akun (personal/store), kategori produk fokus, platform affiliate
  - 3 save fields dari AI: Micro-niche Dipilih, Target Pembeli, Competitive Edge
  - Generate AI button disabled sampai kategori + platform dipilih
- **Identitas Akun** (`aff-identity`): CRUD nama akun (is_primary), tagline, positioning (tag + textarea)
  - AI output: 5 nama options + 3 taglines + 1 positioning statement
- **Bio & Trust** (`aff-bio`): latar belakang (input konteks AI), kalimat disclosure, CRUD variasi bio
  - AI output: 3 variasi bio + 3 pilihan kalimat disclosure
- Tidak ada tab Konten Strategy — konten affiliate driven by produk di Catalog
- `AFFILIATE_FREQ_CHECKS`: 10 checks (tipe, kategori, platform, micro-niche, target buyer, competitive edge, positioning, tagline, trust builder, disclosure)
- AI prompts semua tab: output fokus (2-3 section max) matching exact save fields

**Shared:**
- Tab "Akun Sosial": daftarkan akun sosmed (platform + handle + nama label), max 10 per workspace
- `kf_brand_profiles` + `kf_accounts`
- New DB columns (Agustus 2026): `affiliate_micro_niche text`, `affiliate_competitive_edge text`
- **Feature gating**: Brand wajib diisi (minimal `niche`/`affiliate_micro_niche`) sebelum bisa akses Sprint/Plan/Studio/Calendar
  - Redirect ke `/brand?setup=1` dengan banner peringatan jika belum isi
  - Gate dilakukan di server component masing-masing halaman
- **Multi-workspace isolation fix**: Sidebar badge + Topbar notifications filter by `workspace_id` (bug: sebelumnya tampil data semua workspace)
- **`/upgrade` redirect loop fix**: hanya redirect ke `/sprints` jika active workspace (cookie) juga lifetime
- **SaveButton UX**: `tabHasContent()` per-tab check field isi → button "✓ Tersimpan" akurat per tab, persists on reload

#### 2. Catalog
Database produk affiliate.
- Nama, link affiliate, harga normal/diskon, platform, kategori, deskripsi, thumbnail
- Filter by platform, toggle aktif/nonaktif
- `kf_products`

#### 3. Sprints (gabungan Tasks + Sprint)
**Entry point utama workflow konten.** Dua tab: Sprint Board + Tasks.

**Sprint Board:**
- Kanban 3 kolom: **Todo** (Draft) | **Dikerjakan** (Naskah Siap s.d. Terjadwal) | **Done** (Tayang)
- Sidebar list sprint dengan tombol ✕ hapus + **undo toast 5 detik** (hapus optimistis, batalkan sebelum DB delete)
- **Buat Sprint modal:**
  - Pilih template: Affiliate / Creator / Live / Custom (bisa add/remove/reorder step)
  - Pilih **Akun Posting** (dropdown dari `kf_accounts`, kalau kosong → link ke Brand)
  - Pilih Platform
  - **Slot Konten**: default 1 baris kosong (tanpa produk). Produk **opsional** per baris.
    - Konten kreator: biarkan kosong → slot judul "Konten N"
    - Affiliator: klik **"+ Tambahkan Semua Produk"** → semua catalog masuk sekaligus
    - Per baris: produk (opsional) × jumlah + mulai posting + jam + interval
  - Per step: assign anggota tim (by jabatan) + deadline
  - `step_config` JSONB: `[{ id, deadline, memberName }]`
  - `template_type` encoding: `key:step1,step2,...`
- **Step chips di card:**
  - Chip aktif (▶ ungu) = link ke modul terkait (Plan/Studio/Calendar)
  - Tombol ✓ kecil hijau = eksplisit tandai step selesai → advance status
  - Done step = chip hijau ✓ (dekoratif)
  - Future step = abu ○ (dekoratif)
- **Jadwal per konten**: klik kartu → detail modal → section "Jadwal Posting" (tanggal + jam)
  - Simpan → update `tanggal_tayang` + `jam_tayang` di `kf_content_ideas`
  - Badge di kartu board menampilkan tanggal + jam
- **Laporan Tim** (tombol 📊 di sprint header):
  - Per step: member, deadline, selesai, tepat waktu, terlambat, pending+overdue
  - Tracking via `step_log` JSONB: `{ naskah_done_at, editing_done_at, ... }` dicatat saat ✓ diklik
- `kf_sprints` (columns: workspace_id, nama, start_date, end_date, target_konten, platform, akun, template_type, step_config, status)
- `kf_content_ideas` (sprint_id, status, product_id, assigned_naskah, assigned_produksi, assigned_schedule, step_log JSONB)

**Notification chain Sprint Board:**
| Step selesai | Status baru | Notif ke |
|---|---|---|
| Buat Naskah ✓ | Naskah Siap | Studio |
| Take Video ✓ | Produksi | Studio |
| Editing ✓ | Siap Tayang | Calendar |
| Schedule ✓ | Terjadwal | — |
| Tayang ✓ | Tayang | Sprint (done) |

**Tasks tab:**
- Manual tasks dengan priority, due_date, percent_complete, notes
- Toggle selesai, delete

Team/Jabatan:
- `kf_workspace_members.jabatan`: Copywriter, Editor, Videografer, dll
- Settings → member row punya dropdown jabatan
- API PATCH /api/team handles jabatan + role

#### 4. Plan
Copywriter buat naskah dengan AI.
- Tab Konten (Creator) + Tab Afiliasi
- AI generate dari brand + produk context → prompt dikirim ke ChatGPT/Claude/Gemini/DeepSeek
- **Sprint linkage**: saat simpan naskah → cek `sprintDrafts` (konten status Draft + sprint_id not null) untuk produk yang sama
  - Jika match → modal: "Update Slot Sprint" (update existing + notif Naskah Siap) atau "Simpan Baru" (insert terpisah)
- `kf_content_ideas`

#### 5. Library
Arsip & editor semua konten (sprint maupun standalone).
- Edit modal: tab Info Dasar | Konten (hook/body/cta/hashtag) | Script (script lengkap)
- Status badge auto dari workflow — tidak bisa diubah manual dari Library
- Status flow: `Draft → Naskah Siap → Produksi → Siap Tayang → Terjadwal → Tayang`

#### 6. Studio
Production workspace untuk desainer/editor.
- Antrian / Dikerjakan / Selesai tabs
- Input Canva URL, Google Drive URL, preview thumbnail
- "Simpan Progress" → status: Produksi
- "Tandai Selesai" → status: Siap Tayang + notif ke Calendar + update `step_log.editing_done_at` (jika ada sprint_id)
- IG Profile mockup: Grid / Reels / Tagged tabs
- `studio_notes`, `studio_done_at` di kf_content_ideas

#### 7. Calendar
Jadwal posting konten.
- **Panel "⏰ Siap Dijadwalkan"**: SEMUA konten status Siap Tayang (sprint maupun standalone)
  - Tampil per item: nama produk (ungu), judul konten, format, platform
  - Tombol "+ Jadwalkan" → modal pilih tanggal + jam + platform
  - Validasi: tolak jadwal di masa lalu (error inline)
  - On confirm: buat `kf_calendar_entries` + update konten status "Terjadwal"
  - Notif sprint hanya dikirim jika konten punya sprint_id
- Calendar chip & list view: tampil jam posting + nama produk
- List view: badge produk ungu + waktu posting prominent
- Edit/hapus jadwal manual
- `kf_calendar_entries` (content_id, platform, scheduled_at, posted_at, posted_url, status)

#### 8. Budget
Tracking pemasukan dan pengeluaran konten.
- CRUD transaksi: tipe (Pemasukan/Pengeluaran), kategori, deskripsi, jumlah, tanggal
- Summary cards: total pemasukan, pengeluaran, saldo bersih
- Filter by tipe
- `kf_transactions`
- **Gap**: belum ada filter bulan/tahun, belum ada grafik tren

#### 9. Tracker
Input metrics performa bulanan per platform.
- 9 metrics: impressi, reach, follower growth, likes, komentar, share, klik, konversi, cost campaign
- Hitung CPR (cost per result) otomatis
- Filter per platform
- `kf_monthly_metrics`
- **Gap**: belum ada grafik tren, data belum muncul di Insights/Dashboard

#### 10. Insights (Dashboard)
Dashboard overview harian workspace.
- KPI cards: total konten, produk aktif, jadwal hari ini, saldo bersih
- Sprint aktif + progress bar (todo/in progress/tayang)
- Pipeline konten (bar visual: draft/in progress/tayang)
- Konten terbaru (6 item)
- Jadwal hari ini dari Calendar
- Overdue tasks
- Quick actions menu
- Finance summary (ringkasan Budget)
- **Gap**: data Tracker (social metrics) belum ditampilkan di sini

#### 11. Settings
- Workspace settings, team management, profile
- Jabatan field per member (Copywriter, Editor, Videografer, dll)
- Invite member via link + **Undangan Tertunda** (Salin Link + Cancel)
- **Member limit enforcement (UI)**:
  - Free plan: banner "Fitur tim terkunci" + tombol Upgrade
  - Lifetime + full (5/5): banner merah "Slot anggota tim penuh"
  - Lifetime + tersedia: form invite + counter "X slot tersisa"
- **Mode Aktif DIHAPUS** (Agustus 2026) — redundant dengan `brand_type` per workspace. Field `kf_workspaces.modes` tidak dipakai lagi.

#### 12. Admin (Super Admin — `eginanjarism@gmail.com`)
> **Unlimited Workspace**: Super admin bypass semua limit workspace. Workspace baru langsung `plan: lifetime`. Check dilakukan server-side via Supabase `user.email` — tidak bisa di-spoof dari client.

Panel internal semua user/workspace.
- Stats: Total User, Hari Ini, 7 Hari, 30 Hari, Total Workspace
- **Revenue card**: estimasi revenue (lifetime workspace × Rp149.000) + jumlah lifetime terjual
- Plan breakdown: free vs lifetime
- User list: search, filter plan, ubah plan, reset password
- Workspace list: search, lihat anggota tim, ubah plan per workspace
- Plan values: `['free', 'lifetime']` (legacy solo/pro/team sudah dihapus)
- Unauthorized → redirect `/sprints`

#### 13. Upgrade (Payment)
- `/upgrade` — pricing page dengan card Lifetime Deal Rp149.000
  - Server component: redirect ke `/sprints` jika sudah lifetime
  - Client component `UpgradeModule`: call `/api/payment/create-invoice` → redirect ke Xendit hosted invoice
- `/api/payment/create-invoice` — POST: buat Xendit invoice, return `invoice_url`
  - Reject jika workspace sudah lifetime
  - `external_id`: `kreaflow-{workspace_id}-{timestamp}`
- `/api/payment/webhook` — POST: terima callback Xendit
  - Validasi `x-callback-token` vs `XENDIT_WEBHOOK_TOKEN`
  - Proses hanya `status === 'PAID'`
  - Update `kf_workspaces.plan = 'lifetime'`
- `/payment/success` — static success page, link ke `/sprints`
- Sidebar upgrade banner: tampil jika `plan !== 'lifetime'`
  - Collapsed: icon arrow up
  - Expanded: card "Upgrade ke Lifetime · Rp149.000 · bayar sekali"
- **Member limit enforcement (API)**: `/api/team` POST cek jumlah member vs limit plan sebelum invite
  - `free` → max 1 (owner only)
  - `lifetime` → max 5
- **Workspace limit enforcement (API)**: `/api/workspace/create` POST
  - `free` → tidak bisa buat workspace baru (wajib upgrade)
  - `lifetime` → max sesuai `max_workspaces` field
  - **`SUPER_ADMINS`** → unlimited, workspace baru langsung `lifetime`, skip semua cek

#### 14. Halaman Publik
- `/` — Landing page (marketing)
  - Testimonial dengan foto avatar (i.pravatar.cc)
  - FAQ accordion CSS-only (`<details>/<summary>`)
  - Nav CTA "Mulai Sekarang", Hero CTA "Lihat Harga →"
  - Footer: 5 kolom (KreaFlow, Produk, Bantuan, Legal, Sosial)
  - Footer Sosial: TikTok, Instagram, YouTube @kreaflowid
  - Authenticated user → redirect `/sprints`
  - Mobile responsive: tabs overflow-x scroll, nav CTA white-space nowrap
- `/privacy` — Kebijakan Privasi (10 seksi, UU PDP No. 27/2022)
- `/terms` — Syarat & Ketentuan (11 seksi, refund policy 7 hari)

---

## Auth Flow

| Event | Redirect |
|---|---|
| Login | `/sprints` |
| Register | `/brand?setup=1` |
| Akses Sprint/Plan/Studio/Calendar tanpa Brand | `/brand?setup=1` |
| Unauthorized admin | `/sprints` |

`src/proxy.ts` = middleware auth (Next.js 16 mengenali nama `proxy.ts`, bukan `middleware.ts`).  
Public routes: `/`, `/privacy`, `/terms`, `/payment/success`, `/invite/*`.

### Invite Flow (Live, Agustus 2026)
1. Settings → Tim → "Undang Member Baru" → generate `kf_invites` row + link `kreaflow.id/invite/[token]`
2. Penerima buka `/invite/[token]` (public, tidak perlu login):
   - Pilih **"Login & Bergabung"** → `/login?redirect=/invite/[token]&email=[email]`
   - Pilih **"Daftar Akun Baru"** → `/register?email=[email]&redirect=/invite/[token]`
3. Setelah login/register → redirect ke `/invite/[token]` → server cek email match → join workspace → redirect `/sprints`
4. Invite page server-side validasi: `user.email === invite.email`, jika tidak → error "Akun Tidak Sesuai"
5. Setelah bergabung: `accepted_at` di-set → link invalid (cegah reuse)

**Register page saat invite flow:**
- Brand/Workspace fields di-hide (`isInvite = redirect.includes('/invite/')`)
- Email field locked/readonly jika `?email=` param ada (security: cegah isi email berbeda)

**Settings → Undangan Tertunda:**
- Tiap row: tombol **"Salin Link"** (copy URL ke clipboard) + **"✕"** (cancel/delete invite)
- Cancel: `DELETE /api/team` dengan `{ inviteId }` → hapus dari `kf_invites`

---

## Notification Chain (Full End-to-End)

| Trigger | type | Destination |
|---------|------|-------------|
| Naskah selesai (Plan save / Sprint step ✓) | `produksi` | Studio |
| Take Video selesai | `produksi` | Studio |
| Editing selesai | `produksi` | Studio (Siap Tayang) |
| Studio "Tandai Selesai" | `schedule` | Calendar |
| Konten dijadwalkan di Calendar | `schedule` | Sprint Board |
| Konten tayang | `schedule` | Sprint Board (Done) |

Sidebar badge: notifikasi unread di bell icon. `/notifications` page untuk list semua notif.

---

## Database Schema

```sql
-- Core
kf_workspaces          (id, name, owner_id, plan, brand_type, created_at)
                        -- plan: 'free' | 'lifetime'
                        -- brand_type: 'creator' | 'affiliate' | 'business'
                        -- modes field DEPRECATED, tidak dipakai lagi
kf_workspace_members   (workspace_id, user_id, role, jabatan)
kf_invites             (workspace_id, email, role, jabatan, token, invited_by, accepted_at, expires_at)

-- Brand
kf_brand_profiles      (workspace_id, niche, micro_niche, premis, tone_of_voice,
                         target_audiens, platform_utama,
                         -- Affiliate fields:
                         affiliate_tipe, affiliate_kategori_fokus[], affiliate_platforms[],
                         affiliate_micro_niche, affiliate_target_buyer, affiliate_competitive_edge,
                         affiliate_nama_options JSONB, affiliate_tagline,
                         affiliate_positioning, affiliate_positioning_statement,
                         affiliate_trust_builder, affiliate_disclosure,
                         affiliate_bio_options JSONB, ...)
kf_accounts            (workspace_id, platform, handle, nama, created_at)

-- Catalog
kf_products            (workspace_id, nama, platform_affiliate, kategori, tipe_produk,
                         harga_normal, komisi_tipe, komisi_nilai, deskripsi, is_active)

-- Content
kf_content_ideas       (workspace_id, judul, format, platform[], status,
                         script, canva_url, drive_url, preview_url,
                         studio_notes, studio_done_at,
                         product_id, sprint_id,
                         assigned_riset, assigned_naskah, assigned_produksi, assigned_schedule,
                         tanggal_tayang, terjadwal_at, tayang_at,
                         step_log JSONB,
                         created_at)

-- Sprint
kf_sprints             (workspace_id, nama, start_date, end_date,
                         target_konten, platform, akun,
                         template_type, step_config JSONB, status, created_at)

-- Tasks (manual)
kf_tasks               (workspace_id, nama, platform, priority, start_date, due_date,
                         percent_complete, notes, stage, parent_id, content_idea_id)

-- Calendar
kf_calendar_entries    (workspace_id, task_id, content_id, label, platform,
                         scheduled_at, posted_at, posted_url, status)

-- Analytics
kf_transactions        (workspace_id, tanggal, deskripsi, kategori, tipe, jumlah)
kf_monthly_metrics     (workspace_id, platform, month, year,
                         impressions, reach, follower_growth, shares, comments,
                         likes, clicks, cost_of_campaign, conversions)

-- Notifications
kf_notifications       (workspace_id, type, title, message,
                         content_idea_id, task_id, is_read, created_at)

-- Plans (legacy, masih ada)
kf_plan_platforms      (workspace_id, platform, ...)
kf_campaigns           (workspace_id, nama, tanggal_mulai, ...)
```

---

## Template System (Sprint)

```typescript
const TEMPLATES = {
  affiliate: { steps: [naskah, take_vid, editing, schedule] },
  creator:   { steps: [naskah, shooting, editing, thumbnail, schedule] },
  live:      { steps: [rundown, persiapan, live, schedule] },
  custom:    { steps: [] }
}

const STATUS_ORDER = ['Draft', 'Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']
```

---

## Environment Variables (VPS: `/www/wwwroot/kreaflow/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://api-sf.tuasdigital.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=https://kreaflow.id
XENDIT_SECRET_KEY=           ← wajib diisi sebelum payment live
XENDIT_WEBHOOK_TOKEN=        ← wajib diisi sebelum payment live
OPENROUTER_API_KEY=          ← untuk fitur AI
CRON_SECRET=
WEBHOOK_SECRET=
```

---

## Key Files

```
src/
  app/(app)/
    sprints/    SprintsModule.tsx, page.tsx  — Sprint Board + Tasks tab
    plan/       PlanModule.tsx, page.tsx      — AI naskah + Sprint linkage
    library/    LibraryModule.tsx, page.tsx
    studio/     StudioModule.tsx, page.tsx
    calendar/   CalendarModule.tsx, page.tsx
    brand/      BrandModule.tsx, page.tsx
    catalog/    CatalogModule.tsx, page.tsx
    budget/     BudgetModule.tsx, page.tsx
    tracker/    TrackerModule.tsx, page.tsx
    insights/   page.tsx                      — Dashboard utama
    settings/   SettingsModule.tsx, page.tsx
    admin/      AdminModule.tsx, page.tsx
    upgrade/    UpgradeModule.tsx, page.tsx
  app/invite/[token]/
    page.tsx   — halaman join invite, PUBLIC (root level, bukan route group)
                 dynamic = 'force-dynamic', cek token + email match server-side
  app/(auth)/
    login/      page.tsx   — redirect ke /sprints setelah login, forward ?redirect+email ke register
    register/   page.tsx   — hide brand fields + lock email field saat invite flow
  app/api/
    payment/create-invoice/route.ts  — Xendit invoice
    payment/webhook/route.ts         — Xendit callback
    team/route.ts                    — invite/remove/patch member + limit check
    admin/route.ts                   — ubah plan + reset password
  app/
    privacy/    page.tsx
    terms/      page.tsx
    payment/success/page.tsx
  lib/
    workspace.ts   — getWorkspace() + getWorkspaceWithBrandGuard()
  proxy.ts           — middleware auth + public route whitelist (termasuk /invite/*)
                       Next.js 16 mengenali nama proxy.ts sebagai middleware
  components/layout/
    Sidebar.tsx    — nav + notif badge + upgrade banner
```

---

## Deploy Hook (Updated Agustus 2026)

Hook: `/www/wwwroot/kreaflow.git/hooks/post-receive`
- `while read oldrev newrev refname` — baca stdin per ref yang di-push
- Proses hanya `refs/heads/main`
- Setelah `git checkout -f main`: auto-delete file yang dihapus dari git via `git diff --diff-filter=D $oldrev $newrev | xargs rm`
- Juga hapus empty dirs setelah file delete
- `flock -x 200` → serialized, `set -e` → build gagal = PM2 tidak restart

**Catatan:** Selalu pakai `git rm` (bukan `rm`) untuk hapus file yang perlu di-track git. File yang di-`rm` manual tanpa `git rm` tidak akan ke-delete otomatis di VPS oleh hook.

---

## Backlog / Roadmap

### 🔴 URGENT — Sebelum Iklan
- [ ] Set `XENDIT_SECRET_KEY` + `XENDIT_WEBHOOK_TOKEN` di VPS → aktifkan payment
- [ ] Setup Xendit webhook di dashboard: `https://kreaflow.id/api/payment/webhook`

### 🟡 PRIORITAS BERIKUTNYA
- [ ] **Insights fix**: tampilkan data Tracker (social metrics) di halaman Insights/Dashboard
- [ ] **Budget filter bulan**: filter transaksi per bulan/tahun
- [ ] **Tracker grafik**: visualisasi tren performa (line chart sederhana)
- [ ] **Onboarding wizard**: panduan step-by-step untuk user baru

### 🟢 ROADMAP (sesudah revenue masuk)
- [ ] LP Builder + CAPI (Meta Conversions API) — sebagai fitur KreaFlow untuk user
- [ ] Blog untuk kreaflow.id (SEO)
- [ ] Pixel tracking + CRM leads untuk marketing kreaflow.id
- [ ] AI bring-your-own-API key
- [ ] Mobile app (PWA atau native)
