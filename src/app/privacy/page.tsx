import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — KreaFlow',
  description: 'Kebijakan Privasi KreaFlow. Pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.',
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .pp { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; -webkit-font-smoothing: antialiased; min-height: 100vh; }

  /* NAV */
  .pp-nav { background: #fff; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; z-index: 100; }
  .pp-nav-inner { max-width: 820px; margin: 0 auto; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 60px; }
  .pp-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
  .pp-logo-mark { width: 26px; height: 26px; border-radius: 7px; background: #1a73e8; display: flex; align-items: center; justify-content: center; }
  .pp-logo-name { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.3px; color: #0f172a; }
  .pp-back { font-size: 0.82rem; color: #64748b; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 4px; }
  .pp-back:hover { color: #0f172a; }

  /* CONTENT */
  .pp-wrap { max-width: 820px; margin: 0 auto; padding: 52px 28px 88px; }
  .pp-header { margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #f1f5f9; }
  .pp-tag { display: inline-block; background: #eff6ff; color: #1a73e8; font-size: 0.72rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px; letter-spacing: 0.04em; }
  .pp-title { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 900; letter-spacing: -1px; color: #0f172a; line-height: 1.15; margin-bottom: 12px; }
  .pp-meta { font-size: 0.82rem; color: #94a3b8; }

  .pp-section { margin-bottom: 36px; }
  .pp-section-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-bottom: 12px; }
  .pp-text { font-size: 0.9rem; color: #374151; line-height: 1.8; margin-bottom: 12px; }
  .pp-list { padding-left: 20px; margin-bottom: 12px; }
  .pp-list li { font-size: 0.9rem; color: #374151; line-height: 1.8; margin-bottom: 4px; }

  /* FOOTER */
  .pp-footer { border-top: 1px solid #f1f5f9; padding: 24px 28px; }
  .pp-footer-inner { max-width: 820px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .pp-footer-copy { font-size: 0.78rem; color: #cbd5e1; }
  .pp-footer-links { display: flex; gap: 16px; }
  .pp-footer-link { font-size: 0.78rem; color: #94a3b8; text-decoration: none; }
  .pp-footer-link:hover { color: #374151; }

  @media (max-width: 640px) {
    .pp-wrap { padding: 40px 20px 72px; }
    .pp-footer-inner { flex-direction: column; gap: 12px; text-align: center; }
  }
`

export default function PrivacyPage() {
  return (
    <div className="pp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className="pp-nav">
        <div className="pp-nav-inner">
          <Link href="/" className="pp-logo">
            <div className="pp-logo-mark">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="pp-logo-name">KreaFlow</span>
          </Link>
          <Link href="/" className="pp-back">← Kembali ke Beranda</Link>
        </div>
      </nav>

      <div className="pp-wrap">
        <div className="pp-header">
          <div className="pp-tag">LEGAL</div>
          <h1 className="pp-title">Kebijakan Privasi</h1>
          <p className="pp-meta">Terakhir diperbarui: 30 Juli 2026 · Berlaku untuk kreaflow.id</p>
        </div>

        <div className="pp-section">
          <p className="pp-text">KreaFlow ("kami", "layanan") dioperasikan oleh PT. Kiblat Pemuda Kreatif. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan platform KreaFlow di kreaflow.id.</p>
          <p className="pp-text">Dengan mengakses atau menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui kebijakan ini. Jika Anda tidak setuju, harap hentikan penggunaan layanan.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">1. Informasi yang Kami Kumpulkan</h2>
          <p className="pp-text">Kami mengumpulkan informasi berikut saat Anda menggunakan KreaFlow:</p>
          <ul className="pp-list">
            <li><strong>Informasi akun:</strong> nama, alamat email, dan kata sandi (terenkripsi) yang Anda berikan saat mendaftar.</li>
            <li><strong>Data penggunaan:</strong> konten yang Anda buat, workspace, brand, jadwal, dan data lain yang Anda masukkan ke platform.</li>
            <li><strong>Data teknis:</strong> alamat IP, jenis perangkat, browser, dan log aktivitas yang dikumpulkan secara otomatis untuk keamanan dan performa layanan.</li>
            <li><strong>Data transaksi:</strong> informasi pembayaran yang diproses oleh penyedia pembayaran pihak ketiga (kami tidak menyimpan detail kartu kredit Anda).</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">2. Cara Kami Menggunakan Informasi Anda</h2>
          <p className="pp-text">Informasi yang kami kumpulkan digunakan untuk:</p>
          <ul className="pp-list">
            <li>Menyediakan, mengoperasikan, dan meningkatkan layanan KreaFlow.</li>
            <li>Memproses transaksi dan mengelola akun Anda.</li>
            <li>Mengirimkan notifikasi layanan, pembaruan fitur, dan pengumuman penting.</li>
            <li>Memberikan dukungan teknis dan merespons pertanyaan Anda.</li>
            <li>Mendeteksi dan mencegah aktivitas penipuan atau penyalahgunaan layanan.</li>
            <li>Memenuhi kewajiban hukum yang berlaku di Indonesia.</li>
          </ul>
          <p className="pp-text">Kami tidak akan menjual, menyewakan, atau memperdagangkan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">3. Penyimpanan dan Keamanan Data</h2>
          <p className="pp-text">Data Anda disimpan di server yang aman menggunakan enkripsi standar industri. Kami menggunakan Supabase sebagai infrastruktur database dengan standar keamanan tinggi. Akses ke data dibatasi hanya kepada tim yang memerlukan akses tersebut untuk mengoperasikan layanan.</p>
          <p className="pp-text">Meskipun kami menerapkan langkah keamanan yang wajar, tidak ada sistem yang sepenuhnya aman. Kami mendorong Anda untuk menggunakan kata sandi yang kuat dan tidak membagikan kredensial akun Anda.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">4. Berbagi Data dengan Pihak Ketiga</h2>
          <p className="pp-text">Kami dapat berbagi informasi Anda hanya dalam situasi berikut:</p>
          <ul className="pp-list">
            <li><strong>Penyedia layanan:</strong> mitra teknis yang membantu kami mengoperasikan platform (seperti penyedia hosting dan pembayaran), dengan perjanjian kerahasiaan yang ketat.</li>
            <li><strong>Kewajiban hukum:</strong> jika diwajibkan oleh hukum, peraturan, atau perintah pengadilan yang berlaku di Indonesia.</li>
            <li><strong>Perlindungan hak:</strong> untuk melindungi hak, properti, atau keamanan KreaFlow, pengguna kami, atau pihak lain.</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">5. Cookie dan Teknologi Pelacakan</h2>
          <p className="pp-text">KreaFlow menggunakan cookie sesi untuk mempertahankan status login Anda dan memastikan pengalaman penggunaan yang lancar. Kami tidak menggunakan cookie iklan atau teknologi pelacakan lintas situs untuk keperluan pemasaran pihak ketiga.</p>
          <p className="pp-text">Anda dapat mengatur browser untuk menolak cookie, namun hal ini dapat memengaruhi fungsi platform.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">6. Hak Anda atas Data Pribadi</h2>
          <p className="pp-text">Sesuai dengan peraturan perlindungan data yang berlaku, Anda memiliki hak untuk:</p>
          <ul className="pp-list">
            <li>Mengakses dan melihat data pribadi yang kami simpan tentang Anda.</li>
            <li>Memperbarui atau mengoreksi informasi yang tidak akurat.</li>
            <li>Meminta penghapusan akun dan data pribadi Anda.</li>
            <li>Menarik persetujuan atas pemrosesan data tertentu kapan saja.</li>
          </ul>
          <p className="pp-text">Untuk mengajukan permintaan terkait data Anda, hubungi kami di <strong>hello@kreaflow.id</strong>.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">7. Retensi Data</h2>
          <p className="pp-text">Kami menyimpan data Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Jika Anda menghapus akun, data Anda akan dihapus dalam 30 hari, kecuali jika retensi lebih lama diwajibkan oleh hukum.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">8. Layanan untuk Pengguna di Indonesia</h2>
          <p className="pp-text">KreaFlow dirancang dan dioperasikan untuk pengguna di Indonesia. Dengan menggunakan layanan kami, Anda setuju bahwa informasi Anda dapat diproses di Indonesia sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi dan peraturan perundang-undangan yang berlaku.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">9. Perubahan Kebijakan Privasi</h2>
          <p className="pp-text">Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau pemberitahuan di platform setidaknya 7 hari sebelum berlaku. Penggunaan layanan yang berkelanjutan setelah tanggal berlakunya perubahan merupakan persetujuan Anda atas kebijakan yang diperbarui.</p>
        </div>

        <div className="pp-section">
          <h2 className="pp-section-title">10. Hubungi Kami</h2>
          <p className="pp-text">Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait kebijakan privasi ini atau data pribadi Anda, silakan hubungi kami:</p>
          <ul className="pp-list">
            <li><strong>Email:</strong> hello@kreaflow.id</li>
            <li><strong>Perusahaan:</strong> PT. Kiblat Pemuda Kreatif</li>
            <li><strong>Website:</strong> kreaflow.id</li>
          </ul>
        </div>
      </div>

      <footer className="pp-footer">
        <div className="pp-footer-inner">
          <span className="pp-footer-copy">© 2026 KreaFlow · PT. Kiblat Pemuda Kreatif</span>
          <div className="pp-footer-links">
            <Link href="/privacy" className="pp-footer-link">Kebijakan Privasi</Link>
            <Link href="/terms" className="pp-footer-link">Syarat & Ketentuan</Link>
            <Link href="/" className="pp-footer-link">Beranda</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
