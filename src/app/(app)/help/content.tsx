import type { ReactNode } from 'react'

export type HelpTopic = {
  slug: string
  group: string
  label: string
  summary: string
  body: ReactNode
}

const P = ({ children }: { children: ReactNode }) => (
  <p style={{ margin: '0 0 14px', lineHeight: 1.7, color: 'var(--text)', fontSize: '0.92rem' }}>{children}</p>
)
const H = ({ children }: { children: ReactNode }) => (
  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '24px 0 10px' }}>{children}</h3>
)
const Ol = ({ children }: { children: ReactNode }) => (
  <ol style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</ol>
)
const Ul = ({ children }: { children: ReactNode }) => (
  <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</ul>
)
const Li = ({ children }: { children: ReactNode }) => (
  <li style={{ lineHeight: 1.65, color: 'var(--text)', fontSize: '0.92rem' }}>{children}</li>
)
const Note = ({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) => (
  <div
    style={{
      background: tone === 'warn' ? '#fffbeb' : 'var(--brand-bg)',
      border: `1px solid ${tone === 'warn' ? '#fde68a' : '#c8dcfb'}`,
      borderRadius: 12,
      padding: '12px 16px',
      margin: '4px 0 18px',
      fontSize: '0.86rem',
      lineHeight: 1.6,
      color: tone === 'warn' ? '#92400e' : 'var(--brand-dark)',
    }}
  >
    {children}
  </div>
)

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: 'mulai',
    group: 'Mulai Cepat',
    label: 'Masuk Pertama Kali',
    summary: 'Cara login dan apa yang kamu lihat pertama kali masuk KreaFlow.',
    body: (
      <>
        <P>KreaFlow tidak pakai password. Setiap kali mau masuk, kamu cukup pakai email yang terdaftar.</P>
        <H>Cara login</H>
        <Ol>
          <Li>Buka halaman login, masukkan email kamu, lalu klik <strong>&quot;Kirim Link Masuk&quot;</strong>.</Li>
          <Li>Cek inbox email kamu. Ada dua cara masuk dari sana: klik tombol di email, <strong>atau</strong> masukkan 6 digit kode yang tertulis langsung di halaman login (tanpa perlu buka email lagi).</Li>
          <Li>Setelah berhasil, kamu akan otomatis masuk ke workspace terakhir yang kamu pakai.</Li>
        </Ol>
        <Note>
          Belum punya akun? Email kamu harus sudah terdaftar (lewat pembelian paket atau diundang owner workspace) sebelum bisa login. Kalau muncul pesan &quot;email belum terdaftar&quot;, hubungi tim yang mengundang kamu.
        </Note>
        <H>Kalau link/kode expired</H>
        <P>Link dan kode cuma berlaku sebentar. Kalau telat klik, tinggal ulangi dari halaman login untuk minta yang baru — tidak ada batasan berapa kali kamu boleh minta ulang.</P>
        <H>Keluar (logout)</H>
        <P>Logout selalu lewat menu di pojok akun kamu di dalam aplikasi. Setelah logout, kamu perlu login ulang lewat email lagi karena memang tidak ada password yang bisa dipakai.</P>
      </>
    ),
  },
  {
    slug: 'workspace',
    group: 'Mulai Cepat',
    label: 'Workspace & Tim',
    summary: 'Apa itu workspace, cara bikin, gonta-ganti, dan mengundang anggota tim.',
    body: (
      <>
        <P>Satu <strong>workspace</strong> = satu brand/klien yang kamu kelola. Semua sprint, konten, jadwal, dan anggota tim ada di dalam satu workspace. Kalau kamu pegang beberapa brand, kamu akan punya beberapa workspace sekaligus dan bisa pindah-pindah kapan saja.</P>
        <H>Bikin workspace baru</H>
        <Ol>
          <Li>Klik kotak nama workspace di bagian atas sidebar, lalu pilih <strong>&quot;Buat Workspace Baru&quot;</strong>.</Li>
          <Li>Isi nama brand/workspace-nya.</Li>
          <Li>Pilih tipe brand: <strong>Creator</strong> (konten kreator/personal brand), <strong>Affiliate</strong> (affiliator produk & komisi), atau <strong>Business</strong> (brand toko/perusahaan). Pilihan ini memengaruhi jenis konten & ide yang direkomendasikan nanti.</Li>
        </Ol>
        <Note tone="warn">
          Jumlah workspace yang bisa kamu buat dibatasi sesuai paket kamu. Kalau kena limit, kamu akan diarahkan ke halaman upgrade — lihat topik <strong>Paket & Upgrade</strong>.
        </Note>
        <H>Pindah workspace</H>
        <P>Klik kotak nama workspace di sidebar, lalu pilih workspace lain dari daftarnya. Halaman akan reload dan menampilkan data workspace yang baru dipilih.</P>
        <H>Isi profil brand</H>
        <P>Sebelum modul lain (Sprint, Plan, dst.) bisa dipakai penuh, lengkapi dulu profil brand di menu <strong>Brand</strong> — niche/kategori usaha kamu. Ini dipakai sistem untuk kasih rekomendasi ide konten yang relevan.</P>
        <H>Mengundang anggota tim</H>
        <P>Owner atau admin workspace bisa mengundang anggota lewat menu <strong>Pengaturan</strong>. Setiap anggota bisa dikasih <em>jabatan</em> (Manager, Copywriter, Videografer, dll.) yang menentukan modul apa saja yang bisa mereka akses — lihat topik <strong>Peran & Akses Tim</strong> untuk detailnya.</P>
      </>
    ),
  },
  {
    slug: 'alur-konten',
    group: 'Alur Konten',
    label: 'Alur Kerja Konten (Overview)',
    summary: 'Gambaran besar: dari ide sampai konten tayang, lewat modul mana saja.',
    body: (
      <>
        <P>Ini alur kerja utama KreaFlow — semua modul konten saling terhubung lewat satu status berjalan, jadi tim tahu setiap konten lagi di tahap mana:</P>
        <Ol>
          <Li><strong>Sprints</strong> — kamu tentukan target periode kerja (misal 2 minggu) dan berapa banyak konten yang mau digarap.</Li>
          <Li><strong>Plan</strong> — ide/naskah konten dibuat dengan status <em>Draft</em>. Kalau workspace kamu butuh approval, naskah masuk ke <em>Menunggu Approval</em> dulu; kalau ditolak, statusnya jadi <em>Revisi</em> dengan catatan alasannya, lalu diperbaiki dan dikirim ulang.</Li>
          <Li>Setelah disetujui, statusnya jadi <strong>Naskah Siap</strong> — otomatis muncul di antrian <strong>Studio</strong> untuk diproduksi (syuting/desain/edit).</Li>
          <Li>Konten yang sudah selesai diproduksi berubah jadi <strong>Siap Tayang</strong> dan muncul di <strong>Calendar</strong> untuk dijadwalkan tanggal & jam tayangnya.</Li>
        </Ol>
        <Note>Angka merah kecil (badge) di sidebar pada menu Plan, Studio, dan Calendar menunjukkan berapa banyak konten yang sedang menunggu di tahap masing-masing — pantau ini setiap hari biar nggak ada yang kelewat.</Note>
      </>
    ),
  },
  {
    slug: 'sprints',
    group: 'Alur Konten',
    label: 'Sprints',
    summary: 'Menentukan target periode kerja konten tim.',
    body: (
      <>
        <P>Sprint adalah periode kerja dengan target jumlah konten tertentu — mirip sprint di metode Agile, tapi buat produksi konten. Sprint membantu tim punya target yang jelas dan bisa dievaluasi progresnya.</P>
        <H>Bikin sprint baru</H>
        <P>Buka menu <strong>Sprints</strong>, buat sprint baru dengan menentukan tanggal mulai dan target yang ingin dicapai selama periode itu. Semua ide konten yang dibuat di menu Plan bisa dikaitkan ke sprint yang sedang berjalan.</P>
        <H>Kenapa penting</H>
        <Ul>
          <Li>Progress sprint kelihatan langsung — berapa konten yang sudah <em>Naskah Siap</em> vs yang masih <em>Draft</em>.</Li>
          <Li>Memudahkan evaluasi mingguan/bulanan tanpa harus hitung manual.</Li>
        </Ul>
      </>
    ),
  },
  {
    slug: 'plan',
    group: 'Alur Konten',
    label: 'Plan (Ide & Naskah)',
    summary: 'Tempat menulis ide konten dan mengelola alur approval naskah.',
    body: (
      <>
        <P>Plan adalah tempat semua ide dan naskah konten ditulis dan diproses sebelum masuk produksi.</P>
        <H>Status naskah</H>
        <Ul>
          <Li><strong>Draft</strong> — naskah baru dibuat, masih bisa diedit bebas.</Li>
          <Li><strong>Menunggu Approval</strong> — naskah dikirim untuk dicek atasan/PIC sebelum lanjut ke produksi (kalau workspace kamu mengaktifkan alur approval).</Li>
          <Li><strong>Revisi</strong> — naskah dikembalikan dengan catatan perbaikan. Perbaiki sesuai catatan lalu kirim ulang.</Li>
          <Li><strong>Naskah Siap</strong> — sudah disetujui, otomatis masuk antrian Studio.</Li>
        </Ul>
        <Note>Kalau naskahmu ditolak dan masuk status Revisi, catatan alasan penolakan selalu bisa dibaca di kartu naskah itu — cek dulu sebelum kirim ulang.</Note>
      </>
    ),
  },
  {
    slug: 'studio',
    group: 'Alur Konten',
    label: 'Studio',
    summary: 'Tempat produksi konten yang naskahnya sudah disetujui.',
    body: (
      <>
        <P>Semua naskah berstatus <strong>Naskah Siap</strong> dari Plan otomatis muncul di antrian Studio. Di sinilah tim produksi (videografer, editor, desainer) mengerjakan copy, caption, hashtag, sampai upload hasil akhirnya.</P>
        <H>Alur kerja</H>
        <Ol>
          <Li>Ambil satu item dari antrian Studio.</Li>
          <Li>Kerjakan produksinya sesuai format (video, gambar, carousel, dll.) dan lengkapi caption/hashtag.</Li>
          <Li>Upload hasil akhirnya — file tersimpan otomatis dan bisa dilihat lagi lewat menu <strong>Library</strong>.</Li>
          <Li>Setelah selesai, konten berpindah status jadi <strong>Siap Tayang</strong> dan siap dijadwalkan di Calendar.</Li>
        </Ol>
      </>
    ),
  },
  {
    slug: 'calendar',
    group: 'Alur Konten',
    label: 'Calendar',
    summary: 'Menjadwalkan tanggal & jam tayang konten yang sudah siap.',
    body: (
      <>
        <P>Calendar menampilkan semua konten berstatus <strong>Siap Tayang</strong> dalam tampilan kalender bulanan. Kamu bisa tarik-lepas (drag & drop) konten ke tanggal yang diinginkan untuk mengatur jadwal postingnya.</P>
        <Ul>
          <Li>Klik tanggal untuk melihat detail semua konten yang dijadwalkan hari itu.</Li>
          <Li>Geser kartu konten ke tanggal lain kalau jadwal berubah.</Li>
          <Li>Gunakan Calendar sebagai acuan utama tim untuk tahu apa yang harus tayang hari ini.</Li>
        </Ul>
      </>
    ),
  },
  {
    slug: 'library',
    group: 'Alur Konten',
    label: 'Library',
    summary: 'Penyimpanan semua aset (gambar, video, copy) yang sudah pernah dibuat.',
    body: (
      <>
        <P>Semua file yang diupload lewat Studio otomatis tersimpan di Library, jadi tim tidak perlu cari-cari file lama di folder terpisah.</P>
        <Ul>
          <Li>Filter aset berdasarkan brand, tipe file, atau tanggal upload.</Li>
          <Li>Pakai Library untuk cari referensi konten lama sebelum bikin konten baru yang mirip.</Li>
        </Ul>
      </>
    ),
  },
  {
    slug: 'catalog',
    group: 'Alur Konten',
    label: 'Catalog',
    summary: 'Template konten siap pakai supaya tim tidak mulai dari nol tiap kali.',
    body: (
      <P>Catalog berisi template struktur konten (format naskah, jenis hook, dll.) yang bisa langsung dipakai sebagai titik awal saat membuat ide baru di Plan — mempercepat proses brainstorming tim.</P>
    ),
  },
  {
    slug: 'tracker',
    group: 'Manajemen Tim',
    label: 'Tracker',
    summary: 'Mencatat jam kerja tim per konten/tugas.',
    body: (
      <P>Tracker dipakai untuk mencatat berapa lama waktu yang dihabiskan tim mengerjakan satu konten atau tugas. Berguna buat owner/manager melihat beban kerja tim dan efisiensi produksi dari waktu ke waktu.</P>
    ),
  },
  {
    slug: 'budget',
    group: 'Manajemen Tim',
    label: 'Budget',
    summary: 'Mengelola anggaran produksi konten workspace.',
    body: (
      <P>Budget membantu mencatat dan memantau pengeluaran terkait produksi konten (misalnya biaya endorse, properti syuting, atau sewa alat) supaya owner punya gambaran biaya produksi konten workspace secara berkala.</P>
    ),
  },
  {
    slug: 'roles',
    group: 'Akun & Tim',
    label: 'Peran & Akses Tim',
    summary: 'Siapa bisa lihat/akses modul apa, berdasarkan jabatan.',
    body: (
      <>
        <P>Setiap anggota tim yang diundang ke workspace bisa diberi <strong>jabatan</strong>, yang menentukan modul mana saja yang bisa mereka lihat dan pakai. <strong>Owner</strong> dan <strong>admin</strong> workspace selalu punya akses penuh ke semua modul.</P>
        <H>Contoh jabatan yang tersedia</H>
        <Ul>
          <Li><strong>Manager</strong> — akses penuh ke hampir semua modul operasional (Sprint, Plan, Library, Studio, Calendar, Tracker, Budget), kecuali Pengaturan.</Li>
          <Li><strong>Copywriter</strong> — fokus di Plan (nulis naskah), bisa lihat Sprint & Library tapi tidak bisa akses Studio/Calendar/Budget.</Li>
          <Li><strong>Videografer / Editor / Desainer</strong> — fokus di Studio (produksi), bisa lihat Library, tidak akses Plan/Calendar/Budget.</Li>
          <Li><strong>Admin Sosmed / Social Media Specialist</strong> — fokus di Calendar & Tracker untuk eksekusi harian.</Li>
        </Ul>
        <Note>Kalau ada menu yang tidak muncul di sidebar kamu, itu karena jabatan kamu memang tidak diberi akses ke modul tersebut — bukan bug. Minta owner/admin workspace untuk menyesuaikan jabatan kamu kalau merasa perlu akses tambahan.</Note>
      </>
    ),
  },
  {
    slug: 'settings',
    group: 'Akun & Tim',
    label: 'Pengaturan',
    summary: 'Kelola profil, workspace, dan anggota tim.',
    body: (
      <P>Menu Pengaturan berisi info profil kamu, pengaturan workspace, dan (khusus owner/admin) pengelolaan anggota tim — mengundang anggota baru, mengatur jabatan mereka, atau mengeluarkan anggota dari workspace.</P>
    ),
  },
  {
    slug: 'upgrade',
    group: 'Akun & Tim',
    label: 'Paket & Upgrade',
    summary: 'Pilihan paket KreaFlow dan kapan perlu upgrade.',
    body: (
      <>
        <P>KreaFlow punya beberapa pilihan paket. Kamu akan diarahkan ke halaman <strong>Upgrade</strong> secara otomatis kalau kena limit workspace atau anggota tim.</P>
        <Ul>
          <Li><strong>Bulanan</strong> — 1 workspace, 1 owner + 4 anggota, perpanjang tiap bulan.</Li>
          <Li><strong>Basic Lifetime</strong> — 2 workspace, 1 owner + 4 anggota, bayar sekali.</Li>
          <Li><strong>Pro Lifetime</strong> — 4 workspace, 1 owner + 5 anggota, bayar sekali.</Li>
          <Li><strong>Agency Lifetime</strong> — 10 workspace, 1 owner + 10 anggota, bayar sekali.</Li>
        </Ul>
        <P>Semua paket dapat modul lengkap yang sama — bedanya cuma jumlah workspace dan anggota tim yang bisa ditampung. Ada juga tambahan slot workspace/jadwal terpisah kalau butuh lebih tanpa naik paket penuh.</P>
      </>
    ),
  },
  {
    slug: 'faq',
    group: 'Bantuan',
    label: 'FAQ & Troubleshooting',
    summary: 'Pertanyaan yang sering muncul.',
    body: (
      <>
        <H>Saya tidak menerima email link login</H>
        <P>Cek folder spam/promosi. Kalau tetap tidak ada setelah beberapa menit, minta link baru dari halaman login — atau hubungi tim kamu untuk memastikan email kamu benar terdaftar.</P>
        <H>Kode 6 digit saya ditolak terus</H>
        <P>Kode hanya berlaku sebentar dan cuma bisa dipakai sekali. Kalau sudah lewat waktunya, klik &quot;Kirim ulang ke email lain&quot; di halaman login untuk minta kode baru.</P>
        <H>Menu yang biasa saya pakai hilang dari sidebar</H>
        <P>Kemungkinan besar jabatan kamu di workspace ini berubah. Lihat topik <strong>Peran & Akses Tim</strong>, atau tanyakan ke owner/admin workspace kamu.</P>
        <H>Saya mau pindah data ke workspace lain / hapus workspace</H>
        <P>Hapus workspace hanya bisa dilakukan owner/admin lewat menu pemilih workspace, dan sifatnya <strong>permanen</strong> — semua brand, sprint, naskah, dan jadwal di dalamnya ikut terhapus. Pastikan benar-benar yakin sebelum melakukannya.</P>
      </>
    ),
  },
]

export function getTopic(slug: string) {
  return HELP_TOPICS.find(t => t.slug === slug)
}
