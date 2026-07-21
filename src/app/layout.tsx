import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'KreaFlow — Alur kreasi kontenmu',
  description: 'Platform manajemen konten sosial media berbasis AI untuk creator dan affiliator Indonesia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  )
}
