# KreaFlow — Product Requirements Document

**Last updated:** 25 Juli 2026  
**Domain:** kreaflow.id  
**Stack:** Next.js 16.2.10 App Router + TypeScript + Supabase self-hosted + AI (OpenRouter)  
**VPS:** 194.233.95.194 | PM2: `kreaflow` (id: 11) | Port: 2847  
**Deploy:** `git push vps main` → auto build + restart  
**DB:** Supabase self-hosted `api-sf.tuasdigital.com`, semua tabel prefix `kf_`

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
Setup identitas workspace sekali. AI-powered.
- Niche Finder, Micro-niche, Storytelling Builder, Smart Content Pillar, Bio Generator
- **[BARU] Tab "📲 Akun Sosial"**: daftarkan akun sosmed (platform + handle + nama label)
  - Maksimal 10 akun per workspace
  - Menjadi sumber dropdown "Akun Posting" di Sprint modal
- `kf_brand_profiles`, **`kf_accounts`** (id, workspace_id, platform, handle, nama)

#### 2. Catalog
Database produk affiliate.
- Nama, link affiliate, harga normal/diskon, platform, kategori, deskripsi, thumbnail
- Filter by platform, toggle aktif/nonaktif
- `kf_products`

#### 3. Sprints (gabungan Tasks + Sprint)
**Entry point utama workflow konten.** Dua tab: Sprint Board + Tasks.

**Sprint Board:**
- Kanban 3 kolom: **Todo** (Draft) | **Dikerjakan** (Naskah Siap s.d. Terjadwal) | **Done** (Tayang)
- Sidebar list sprint dengan tombol ✕ hapus
- **Buat Sprint modal:**
  - Pilih template: Affiliate / Creator / Live / Custom (bisa add/remove/reorder step)
  - Pilih **Akun Posting** (dropdown dari `kf_accounts`, kalau kosong → link ke Brand)
  - Pilih Platform
  - Produk × Jumlah konten → auto-generate content slots
  - Per step: assign anggota tim (by jabatan) + deadline
  - `step_config` JSONB: `[{ id, deadline, memberName }]`
  - `template_type` encoding: `key:step1,step2,...`
- **Step chips di card:**
  - Chip aktif (▶ ungu) = link ke modul terkait (Plan/Studio/Calendar)
  - Tombol ✓ kecil hijau = eksplisit tandai step selesai → advance status
  - Done step = chip hijau ✓ (dekoratif)
  - Future step = abu ○ (dekoratif)
- **Laporan Tim** (tombol 📊 di sprint header):
  - Per step: member, deadline, selesai, tepat waktu, terlambat, pending+overdue
  - Tracking via `step_log` JSONB: `{ naskah_done_at, editing_done_at, ... }` dicatat saat ✓ diklik
- `kf_sprints` (columns: workspace_id, nama, start_date, end_date, target_konten, platform, **akun**, template_type, step_config, status)
- `kf_content_ideas` (sprint_id, status, product_id, assigned_naskah, assigned_produksi, assigned_schedule, **step_log** JSONB)

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
Arsip naskah — READ ONLY.
- Status badge otomatis. Tabs: Info Dasar | Konten | Script
- Status flow: `Draft → Naskah Siap → Produksi → Siap Tayang → Terjadwal → Tayang`

#### 6. Studio
Production workspace untuk desainer/editor.
- Antrian / Dikerjakan / Selesai tabs
- Input Canva URL, Google Drive URL, preview thumbnail
- "Simpan Progress" → status: Produksi
- "Tandai Selesai" → status: Siap Tayang + notif ke Calendar
- IG Profile mockup: Grid / Reels / Tagged tabs
- `studio_notes`, `studio_done_at` di kf_content_ideas

#### 7. Calendar
Jadwal posting konten.
- **[BARU] Panel "⏰ Siap Dijadwalkan"**: konten Sprint status Siap Tayang yang belum dijadwalkan
  - Tampil per item: nama produk (ungu), judul konten, format, platform
  - Tombol "+ Jadwalkan" → modal pilih tanggal + jam + platform
  - On confirm: buat `kf_calendar_entries` + update konten status "Terjadwal" + notif
- Calendar chip & list view: tampil jam posting + nama produk
- List view: badge produk ungu + waktu posting prominent
- Edit/hapus jadwal manual
- `kf_calendar_entries` (content_id, platform, scheduled_at, posted_at, posted_url, status)
- ContentIdea includes `product_id`, `product_nama` (di-join saat fetch)

#### 8. Settings
- Workspace settings, team management, profile
- Jabatan field per member (Copywriter, Editor, Videografer, dll)
- Invite member via link

#### 9. Admin (Super Admin Only)
Panel internal semua user/workspace.

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
kf_workspaces          (id, name, owner_id, plan, modes, created_at)
kf_workspace_members   (workspace_id, user_id, role, jabatan)
kf_invites             (workspace_id, email, role, token, invited_by, accepted_at, expires_at)

-- Brand
kf_brand_profiles      (workspace_id, niche, micro_niche, premis, tone_of_voice,
                         target_audiens, platform_utama, affiliate_*, ...)
kf_accounts            (workspace_id, platform, handle, nama, created_at)  -- NEW

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
                         step_log JSONB,   -- { naskah_done_at, editing_done_at, ... }
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

-- Notifications
kf_notifications       (workspace_id, type, title, message,
                         content_idea_id, task_id, is_read, created_at)

-- Plans
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
  custom:    { steps: [] }  // user define sendiri
}

// template_type encoding:
// "affiliate"                          → pakai default steps dari TEMPLATES
// "affiliate:naskah,take_vid,editing"  → custom steps (override)

const STATUS_ORDER = ['Draft', 'Naskah Siap', 'Produksi', 'Siap Tayang', 'Terjadwal', 'Tayang']
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
    calendar/   CalendarModule.tsx, page.tsx  — Antrian posting + quick schedule
    brand/      BrandModule.tsx, page.tsx     — +Akun Sosial tab
    catalog/    CatalogModule.tsx, page.tsx
    settings/   SettingsModule.tsx, page.tsx  — +jabatan field
    admin/      page.tsx
    tasks/      page.tsx                      — redirect ke /sprints?tab=tasks
  app/api/
    team/route.ts   — POST invite, DELETE remove, PATCH role/jabatan
  components/layout/
    Sidebar.tsx     — nav + notif badge
  lib/supabase/
    client.ts   — browser client
    server.ts   — server component client
```

---

## Backlog Prioritas

### 🟡 PRIORITAS 1 — Notification Center
Panel/halaman semua notif dengan deep link per type (riset→Plan, produksi→Studio, schedule→Calendar). Mark as read individual + all.

### 🟡 PRIORITAS 2 — Insights
Analytics konten per platform. Input manual: views, likes, comments, shares. Summary per bulan/platform/format. `kf_content_metrics`.

### 🟡 PRIORITAS 3 — Budget
Tracking biaya produksi per konten/sprint. ROI estimasi (affiliate revenue vs cost).

---

## Catatan Teknis

- GDrive thumbnail: `https://drive.google.com/thumbnail?id=FILE_ID&sz=w400`
- Admin client: `createClient as createAdmin` dari `@supabase/supabase-js` dengan `SUPABASE_SERVICE_ROLE_KEY`
- Semua pages: server component fetch → pass ke client module
- TypeScript strict — tidak ada `any`
- Style: inline CSS (dark theme, bg #111, border #2a2a2a, accent #7C3AED/#A78BFA)
- Notif routing: `content_idea_id` → /sprints (Sprint Board); `task_id` → /sprints (Tasks tab)
