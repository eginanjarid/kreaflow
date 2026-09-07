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
          <Li>Setelah workspace dibuat, kamu <strong>otomatis diarahkan ke halaman Brand</strong> untuk mengisi identitas brand — ini wajib diisi dulu sebelum menu lain (Dashboard, Sprint, Plan, Studio, Calendar, Catalog, Library, Tracker, Budget, Notifikasi) bisa dibuka.</Li>
        </Ol>
        <Note tone="warn">
          Jumlah workspace yang bisa kamu buat dibatasi sesuai paket kamu. Kalau kena limit, kamu akan diarahkan ke halaman upgrade — lihat topik <strong>Paket & Upgrade</strong>.
        </Note>
        <H>Pindah workspace</H>
        <P>Klik kotak nama workspace di sidebar, lalu pilih workspace lain dari daftarnya. Halaman akan reload dan menampilkan data workspace yang baru dipilih.</P>
        <H>Isi identitas brand (wajib di awal)</H>
        <P>Begitu workspace baru dibuat, sistem akan terus mengarahkanmu ke halaman <strong>Brand</strong> setiap kali membuka menu lain sampai identitas brand-nya lengkap. Halaman pertama yang muncul adalah pemilihan tipe brand — <strong>ini menentukan tools, form, dan AI yang akan kamu pakai selanjutnya</strong>, jadi pilih yang paling cocok dengan fokus kamu:</P>
        <H>Creator — personal brand & konten kreator</H>
        <P>Cocok buat YouTuber, TikToker, Instagrammer, atau podcaster. Setelah dipilih, kamu akan melewati tab-tab berikut secara bertahap:</P>
        <Ul>
          <Li><strong>Frekuensi</strong> — dashboard progres brand kamu, dikemas dengan level bertema sinyal radio (Signal → Broadcast → Icon Frequency) yang naik seiring makin lengkapnya identitas brand kamu diisi.</Li>
          <Li><strong>Account Identity</strong> — data dasar akun kamu.</Li>
          <Li><strong>Niche Hunt</strong> (wajib diisi paling awal) — jawab &quot;apa yang kamu suka&quot;, &quot;apa yang kamu bisa&quot;, &quot;apa yang dibutuhkan orang&quot;, dan &quot;peluang penghasilan&quot;; AI akan menyarankan niche, kategori, dan micro-niche yang paling cocok buat kamu pilih.</Li>
          <Li><strong>Origin Story</strong> — cerita/latar belakang brand kamu, dipakai sebagai bahan konten storytelling.</Li>
          <Li><strong>Content Pillars</strong> — pilar-pilar tema konten yang akan jadi acuan ide di modul Plan.</Li>
          <Li><strong>Bio Studio</strong> — bio siap pakai untuk tiap platform (TikTok, Instagram, YouTube, dll.).</Li>
          <Li><strong>Brand Identity</strong> — logo, warna, dan tipografi brand.</Li>
          <Li><strong>Akun Sosial</strong> — hubungkan akun sosial media kamu per platform.</Li>
        </Ul>
        <H>Affiliate — affiliator produk & komisi</H>
        <P>Cocok buat affiliate TikTok/Shopee, review produk, atau dropshipper. Tab-nya lebih ringkas dan fokus ke target jualan:</P>
        <Ul>
          <Li><strong>Brand Score</strong> — dashboard progres kelengkapan brand kamu.</Li>
          <Li><strong>Profil & Target</strong> (wajib diisi paling awal) — tipe akun, kategori fokus, platform affiliate yang dipakai, micro-niche, dan target pembeli.</Li>
          <Li><strong>Identitas Akun</strong> — data dasar akun kamu.</Li>
          <Li><strong>Bio & Trust</strong> — bio dan elemen kepercayaan (trust builder) buat meyakinkan calon pembeli.</Li>
          <Li><strong>Akun Sosial</strong> — hubungkan akun sosial media kamu per platform.</Li>
          <Li><strong>Brand Visual</strong> — logo, warna, dan tipografi brand.</Li>
        </Ul>
        <H>Business — brand toko atau perusahaan</H>
        <P>Cocok buat UMKM, toko online, brand produk, atau jasa lokal. Setelah memilih Business, kamu juga akan memilih kategori bisnis yang lebih spesifik (Kuliner, Pendidikan, Fashion, Kecantikan, Properti, Jasa Profesional, Teknologi, Retail, Otomotif, dll.) — pilihan ini otomatis menyesuaikan rekomendasi platform, tipe konten, dan content pillar yang muncul di tab-tab berikut:</P>
        <Ul>
          <Li><strong>Brand Score</strong> — dashboard progres kelengkapan brand kamu.</Li>
          <Li><strong>Profil Bisnis</strong> (wajib diisi paling awal) — nama brand dan kategori bisnisnya.</Li>
          <Li><strong>Market & Produk</strong> — produk/layanan unggulan dan target pasar/klien.</Li>
          <Li><strong>Strategi Konten</strong> — tipe konten dan platform yang direkomendasikan sesuai kategori bisnis kamu.</Li>
          <Li><strong>Bio & Copy</strong> — bio dan copy siap pakai per platform.</Li>
          <Li><strong>Content Pillars</strong> — pilar-pilar tema konten yang jadi acuan ide di modul Plan.</Li>
          <Li><strong>Brand Visual</strong> — logo, warna, dan tipografi brand.</Li>
          <Li><strong>Akun Sosial</strong> — hubungkan akun sosial media kamu per platform.</Li>
        </Ul>
        <Note tone="warn">Menu Sprint, Plan, Studio, dan Calendar baru bisa dipakai setelah field <strong>wajib paling awal</strong> di tiap tipe terisi — Niche Hunt untuk Creator, Profil & Target untuk Affiliate, atau Profil Bisnis untuk Business. Tab-tab lainnya boleh dilengkapi belakangan, tapi makin lengkap diisi, makin relevan rekomendasi ide konten yang dikasih sistem — jadi worth diisi serius, bukan asal-asalan biar cepat lewat.</Note>
        <H>Mengundang anggota tim</H>
        <P>Owner atau admin workspace bisa mengundang anggota lewat menu <strong>Pengaturan</strong>. Setiap anggota bisa dikasih <em>jabatan</em> (Manager, Copywriter, Videografer, dll.) yang menentukan modul apa saja yang bisa mereka akses — lihat topik <strong>Peran & Akses Tim</strong> untuk detailnya.</P>
        <H>Menghapus workspace</H>
        <P>Kalau kamu <strong>owner atau admin</strong> dan punya lebih dari satu workspace, kamu bisa hapus workspace yang sudah tidak dipakai lewat ikon tempat sampah di sebelah nama workspace pada dropdown switcher (klik kotak nama workspace di sidebar/topbar untuk membukanya).</P>
        <Note tone="warn">
          Menghapus workspace itu <strong>permanen dan tidak bisa dibatalkan</strong> — semua brand, sprint, naskah, jadwal, produk di Catalog, dan data lain di dalamnya ikut terhapus. Sistem akan minta konfirmasi dulu sebelum benar-benar menghapus. Kamu juga tidak bisa menghapus satu-satunya workspace yang kamu punya — harus ada minimal satu yang tersisa.
        </Note>
      </>
    ),
  },
  {
    slug: 'dashboard',
    group: 'Mulai Cepat',
    label: 'Dashboard',
    summary: 'Halaman pertama yang kamu lihat — ringkasan progres, jadwal, dan keuangan.',
    body: (
      <>
        <P>Dashboard adalah halaman utama yang muncul begitu kamu masuk ke sebuah workspace (menu <strong>Dashboard</strong> di sidebar) — ringkasan cepat semua hal penting tanpa harus buka satu-satu modul.</P>
        <Note tone="warn">Dashboard cuma bisa dibuka kalau workspace kamu sudah pakai <strong>paket berbayar</strong>. Kalau masih Free, kamu akan diarahkan ke halaman <strong>Upgrade</strong> — lihat topik <strong>Paket & Upgrade</strong>.</Note>
        <H>Yang ditampilkan</H>
        <Ul>
          <Li><strong>4 kartu KPI</strong> — Total Konten, Produk Aktif, Jadwal Hari Ini, dan Saldo Bersih.</Li>
          <Li><strong>Sprint Aktif</strong> — progres sprint yang sedang berjalan minggu ini (Todo/In Progress/Tayang), atau ajakan bikin sprint baru kalau belum ada yang aktif.</Li>
          <Li><strong>Pipeline Konten</strong> — breakdown semua ide konten berdasarkan status: Draft, In Progress, Tayang.</Li>
          <Li><strong>Keterlambatan Tim</strong> — muncul otomatis kalau ada task lewat deadline, dikelompokkan per anggota tim biar gampang ditindaklanjuti.</Li>
          <Li><strong>Aktivitas Tim</strong> — grafik batang aktivitas harian (7/30 hari) per modul (Naskah/Studio/Tasks/Tayang), plus leaderboard per anggota lengkap dengan badge 🔥⭐🎯 buat yang paling produktif.</Li>
          <Li><strong>Konten Terbaru</strong> — daftar ide konten yang paling baru dibuat.</Li>
          <Li><strong>Jadwal Hari Ini</strong>, <strong>Menu Cepat</strong> (shortcut ke Plan/Studio/Calendar/Catalog/Tracker), dan ringkasan <strong>Keuangan</strong> (pemasukan/pengeluaran/saldo) di kolom kanan.</Li>
        </Ul>
        <P>Semua angka di Dashboard ngambil data real-time dari modul lain — jadi gak perlu diisi manual, cukup pakai Sprint/Plan/Studio/Calendar/Budget seperti biasa dan Dashboard otomatis kebaruan.</P>
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
    summary: 'Daftar produk/layanan yang kamu promosikan lewat konten — harga, link, dan komisi.',
    body: (
      <>
        <P>Catalog adalah daftar produk atau layanan yang jadi bahan promosi konten kamu — bukan template naskah. Setiap produk yang kamu tambahkan di sini bisa dikaitkan ke ide konten di menu Plan, jadi jelas konten mana yang mempromosikan produk yang mana.</P>
        <H>Tipe produk</H>
        <Ul>
          <Li><strong>Fisik</strong> — barang yang kamu jual sendiri, lengkap dengan harga normal & diskon.</Li>
          <Li><strong>Digital</strong> — produk digital seperti ebook, kelas online, atau software.</Li>
          <Li><strong>Affiliate</strong> — produk orang lain yang kamu promosikan untuk komisi; isi link affiliate, platform (Shopee, Tokopedia, dll.), dan besaran komisinya.</Li>
        </Ul>
        <P>Tiap produk juga punya kode/SKU, kategori, thumbnail, dan status aktif/nonaktif — produk yang dinonaktifkan tidak akan muncul sebagai pilihan saat membuat ide konten baru.</P>
      </>
    ),
  },
  {
    slug: 'notifikasi',
    group: 'Alur Konten',
    label: 'Notifikasi',
    summary: 'Pemberitahuan otomatis saat ada aktivitas konten yang perlu perhatian.',
    body: (
      <>
        <P>Buka lewat ikon lonceng di pojok kanan atas, atau menu <strong>Notifikasi</strong> di bawah (mobile). Notifikasi muncul otomatis saat ada aktivitas di sprint yang perlu kamu tahu atau tindak lanjuti.</P>
        <H>Jenis notifikasi</H>
        <Ul>
          <Li><strong>Riset</strong> — terkait tahap riset di Sprints.</Li>
          <Li><strong>Naskah</strong> — ada naskah baru, butuh approval, atau kena revisi di Plan.</Li>
          <Li><strong>Produksi</strong> — update dari antrian Studio.</Li>
          <Li><strong>Schedule</strong> — terkait penjadwalan di Calendar.</Li>
          <Li><strong>Deadline</strong> — pengingat tenggat waktu sprint/task.</Li>
        </Ul>
        <H>Kelola notifikasi</H>
        <Ul>
          <Li>Klik <strong>&quot;Buka [Modul] →&quot;</strong> di tiap notifikasi untuk langsung lompat ke halaman terkait (otomatis ditandai dibaca).</Li>
          <Li>Filter berdasarkan jenis, atau lihat yang belum dibaca saja.</Li>
          <Li><strong>&quot;Tandai Semua Dibaca&quot;</strong> untuk bersihkan badge merah di sidebar sekaligus.</Li>
          <Li>Notifikasi yang sudah tidak relevan bisa dihapus satu-satu lewat ikon ✕.</Li>
        </Ul>
      </>
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
    summary: 'Harga KreaFlow dan kapan perlu upgrade/tambah workspace.',
    body: (
      <>
        <P>KreaFlow sekarang cuma punya <strong>1 paket: Lifetime Rp199.000</strong>, bayar sekali untuk selamanya. Kamu akan diarahkan ke halaman <strong>Upgrade</strong> secara otomatis kalau kena limit workspace atau anggota tim.</P>
        <Ul>
          <Li><strong>Rp199.000 (sekali bayar)</strong> — 3 workspace/brand, 1 owner + 5 anggota tim, semua modul lengkap, konten & jadwal unlimited, update fitur selamanya.</Li>
        </Ul>
        <P>Butuh lebih dari 3 workspace? Ada add-on <strong>+1 Workspace seharga Rp49.000</strong> (sekali bayar, berlaku selamanya) — nggak perlu ganti paket.</P>
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
