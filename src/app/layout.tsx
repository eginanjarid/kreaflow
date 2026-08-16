import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'KreaFlow — Alur kreasi kontenmu',
  description: 'Platform manajemen konten sosial media berbasis AI untuk creator dan affiliator Indonesia.',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
