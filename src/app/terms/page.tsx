import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — KreaFlow',
  description: 'Syarat dan Ketentuan penggunaan platform KreaFlow. Baca selengkapnya sebelum menggunakan layanan kami.',
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .tos { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; -webkit-font-smoothing: antialiased; min-height: 100vh; }

  /* NAV */
  .tos-nav { background: #fff; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; z-index: 100; }
  .tos-nav-inner { max-width: 820px; margin: 0 auto; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .tos-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .tos-logo-mark { width: 26px; height: 26px; border-radius: 7px; background: #1a73e8; display: flex; align-items: center; justify-content: center; }
  .tos-logo-name { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.3px; color: #0f172a; }
  .tos-back { font-size: 0.82rem; color: #64748b; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 4px; }
  .tos-back:hover { color: #0f172a; }

  /* CONTENT */
  .tos-wrap { max-width: 820px; margin: 0 auto; padding: 52px 28px 88px; }
  .tos-header { margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #f1f5f9; }
  .tos-tag { display: inline-block; background: #eff6ff; color: #1a73e8; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px; letter-spacing: 0.04em; }
  .tos-title { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 900; letter-spacing: -1px; color: #0f172a; line-height: 1.15; margin-bottom: 12px; }
  .tos-meta { font-size: 0.82rem; color: #94a3b8; }

  .tos-section { margin-bottom: 36px; }
  .tos-section-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
  .tos-text { font-size: 0.9rem; color: #374151; line-height: 1.8; margin-bottom: 12px; }
  .tos-list { padding-left: 20px; margin-bottom: 12px; }
  .tos-list li { font-size: 0.9rem; color: #374151; line-height: 1.8; margin-bottom: 4px; }

  /* FOOTER */
  .tos-footer { border-top: 1px solid #f1f5f9; padding: 24px 28px; }
  .tos-footer-inner { max-width: 820px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .tos-footer-copy { font-size: 0.78rem; color: #cbd5e1; }
  .tos-footer-links { display: flex; gap: 16px; }
  .tos-footer-link { font-size: 0.78rem; color: #94a3b8; text-decoration: none; }
  .tos-footer-link:hover { color: #374151; }

  @media (max-width: 640px) {
    .tos-wrap { padding: 40px 20px 72px; }
    .tos-footer-inner { flex-direction: column; gap: 12px; text-align: center; }
  }
`

export default function TermsPage() {
  return (
    <div className="tos">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className="tos-nav">
        <div className="tos-nav-inner">
          <Link href="/" className="tos-logo">
            <div className="tos-logo-mark">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="tos-logo-name">KreaFlow</span>
          </Link>
          <Link href="/" className="tos-back">← Kembali ke Beranda</Link>
        </div>
      </nav>

      <div className="tos-wrap">
        <div className="tos-header">
          <div className="tos-tag">LEGAL</div>
          <h1 className="tos-title">Syarat & Ketentuan</h1>
          <p className="tos-meta">Terakhir diperbarui: 30 Juli 2026 · Berlaku untuk kreaflow.id</p>
        </div>

        <div className="tos-section">
          <p className="tos-text">Selamat datang di KreaFlow. Syarat dan Ketentuan ini ("Perjanjian") mengatur penggunaan Anda atas platform KreaFlow yang dioperasikan oleh PT. Kiblat Pemuda Kreatif ("kami", "Perusahaan"). Dengan mendaftar atau menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan setuju untuk terikat pada Perjanjian ini.</p>
          <p className="tos-text">Jika Anda tidak setuju dengan salah satu ketentuan berikut, harap hentikan penggunaan layanan KreaFlow.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">1. Deskripsi Layanan</h2>
          <p className="tos-text">KreaFlow adalah platform manajemen konten sosial media end-to-end yang mencakup fitur Brand, Catalog, Sprint, Plan, Library, Studio, Calendar, Tracker, Budget, dan Insights. Layanan ini dirancang untuk content creator, affiliator, dan social media manager di Indonesia.</p>
          <p className="tos-text">Kami berhak untuk memodifikasi, menangguhkan, atau menghentikan fitur layanan kapan saja dengan pemberitahuan yang wajar kepada pengguna.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">2. Pendaftaran Akun</h2>
          <p className="tos-text">Untuk menggunakan KreaFlow, Anda wajib mendaftar dan membuat akun dengan informasi yang akurat dan lengkap. Anda bertanggung jawab atas:</p>
          <ul className="tos-list">
            <li>Kerahasiaan kata sandi dan keamanan akun Anda.</li>
            <li>Semua aktivitas yang terjadi di bawah akun Anda.</li>
            <li>Segera memberitahukan kami jika terjadi akses tidak sah ke akun Anda.</li>
          </ul>
          <p className="tos-text">Anda harus berusia minimal 17 tahun atau mendapat persetujuan orang tua/wali untuk mendaftar. Satu orang hanya diperbolehkan memiliki satu akun utama.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">3. Harga dan Pembayaran</h2>
          <p className="tos-text">KreaFlow saat ini menawarkan paket Lifetime Deal dengan biaya satu kali yang memberikan akses permanen ke seluruh fitur platform. Harga dapat berubah kapan saja untuk pembelian baru. Pembelian yang sudah selesai tidak terpengaruh oleh perubahan harga.</p>
          <p className="tos-text">Pro Add-on (fitur Auto Schedule) merupakan layanan berlangganan bulanan terpisah yang akan tersedia segera. Berlangganan dapat dibatalkan kapan saja dan berlaku hingga akhir periode penagihan.</p>
          <p className="tos-text"><strong>Kebijakan pengembalian dana:</strong> Kami menerima permintaan pengembalian dana dalam 7 hari setelah pembelian jika layanan mengalami kendala teknis yang tidak dapat kami selesaikan. Pengembalian dana tidak tersedia setelah 7 hari atau setelah akun digunakan secara aktif.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">4. Penggunaan yang Diizinkan</h2>
          <p className="tos-text">Anda boleh menggunakan KreaFlow untuk keperluan manajemen konten dan bisnis yang sah. Anda tidak diperbolehkan:</p>
          <ul className="tos-list">
            <li>Menggunakan platform untuk menyebarkan konten yang melanggar hukum, mengandung ujaran kebencian, pornografi, atau konten yang melanggar hak cipta pihak lain.</li>
            <li>Mencoba meretas, merusak, atau mengganggu infrastruktur teknis KreaFlow.</li>
            <li>Menggunakan alat otomatis (bot, scraper) untuk mengakses layanan tanpa izin tertulis dari kami.</li>
            <li>Menjual kembali, menyewakan, atau mentransfer akun kepada pihak lain.</li>
            <li>Melakukan tindakan yang merugikan pengguna lain atau reputasi KreaFlow.</li>
          </ul>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">5. Konten Pengguna</h2>
          <p className="tos-text">Anda tetap memiliki hak atas semua konten yang Anda buat dan simpan di KreaFlow. Dengan menggunakan layanan kami, Anda memberikan kami lisensi terbatas, non-eksklusif, dan bebas royalti untuk menyimpan, memproses, dan menampilkan konten Anda semata-mata untuk keperluan pengoperasian layanan.</p>
          <p className="tos-text">Anda bertanggung jawab penuh atas konten yang Anda unggah dan memastikan bahwa konten tersebut tidak melanggar hak pihak ketiga atau peraturan yang berlaku.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">6. Hak Kekayaan Intelektual</h2>
          <p className="tos-text">Seluruh elemen platform KreaFlow, termasuk desain, kode, logo, nama merek, dan antarmuka, adalah milik eksklusif PT. Kiblat Pemuda Kreatif dan dilindungi oleh undang-undang hak cipta Indonesia. Anda tidak diperbolehkan menyalin, mendistribusikan, atau membuat karya turunan dari platform tanpa izin tertulis dari kami.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">7. Batasan Tanggung Jawab</h2>
          <p className="tos-text">KreaFlow disediakan "sebagaimana adanya" tanpa jaminan tersurat maupun tersirat. Kami tidak bertanggung jawab atas:</p>
          <ul className="tos-list">
            <li>Kehilangan data akibat kesalahan teknis, bencana alam, atau kejadian di luar kendali kami.</li>
            <li>Kerugian pendapatan atau bisnis yang diakibatkan oleh gangguan layanan.</li>
            <li>Konten pihak ketiga yang diakses melalui tautan di platform.</li>
            <li>Tindakan atau kelalaian pengguna lain di platform.</li>
          </ul>
          <p className="tos-text">Total tanggung jawab kami kepada Anda tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 3 bulan terakhir sebelum klaim diajukan.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">8. Penangguhan dan Penghentian Akun</h2>
          <p className="tos-text">Kami berhak menangguhkan atau menghentikan akun Anda tanpa pemberitahuan sebelumnya jika:</p>
          <ul className="tos-list">
            <li>Anda melanggar ketentuan dalam Perjanjian ini.</li>
            <li>Terdapat aktivitas penipuan atau penyalahgunaan yang terkait dengan akun Anda.</li>
            <li>Diwajibkan oleh hukum atau otoritas berwenang.</li>
          </ul>
          <p className="tos-text">Anda dapat menghentikan akun Anda kapan saja dengan menghubungi kami. Penghentian sukarela tidak memerlukan alasan.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">9. Perubahan Syarat & Ketentuan</h2>
          <p className="tos-text">Kami dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau notifikasi di platform minimal 14 hari sebelum berlaku. Jika Anda terus menggunakan layanan setelah perubahan berlaku, Anda dianggap telah menyetujui ketentuan yang diperbarui.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">10. Hukum yang Berlaku</h2>
          <p className="tos-text">Perjanjian ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa yang timbul dari Perjanjian ini akan diselesaikan melalui musyawarah mufakat. Jika tidak tercapai kesepakatan, sengketa akan diselesaikan melalui Pengadilan Negeri yang berwenang di Indonesia.</p>
        </div>

        <div className="tos-section">
          <h2 className="tos-section-title">11. Hubungi Kami</h2>
          <p className="tos-text">Untuk pertanyaan atau keberatan terkait Syarat & Ketentuan ini, silakan hubungi:</p>
          <ul className="tos-list">
            <li><strong>Email:</strong> hello@kreaflow.id</li>
            <li><strong>Perusahaan:</strong> PT. Kiblat Pemuda Kreatif</li>
            <li><strong>Website:</strong> kreaflow.id</li>
          </ul>
        </div>
      </div>

      <footer className="tos-footer">
        <div className="tos-footer-inner">
          <span className="tos-footer-copy">© 2026 KreaFlow · PT. Kiblat Pemuda Kreatif</span>
          <div className="tos-footer-links">
            <Link href="/privacy" className="tos-footer-link">Kebijakan Privasi</Link>
            <Link href="/terms" className="tos-footer-link">Syarat & Ketentuan</Link>
            <Link href="/" className="tos-footer-link">Beranda</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
