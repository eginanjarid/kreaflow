'use client'

import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[admin] render error:', error)
  }, [error])

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
        Halaman Admin gagal dimuat
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>
        Ada data yang bikin bagian ini error saat dirender. Coba muat ulang — kalau masih terjadi, laporkan ke developer beserta tab yang lagi dibuka.
      </p>
      <button
        onClick={() => reset()}
        style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
      >
        Coba Lagi
      </button>
    </div>
  )
}
