export type MagicLinkSettings = {
  sender_name: string
  subject: string
  primary_color: string
  app_name: string
  tagline: string
  body_text: string
  button_text: string
  footer_text: string
}

export const DEFAULT_MAGIC_LINK_SETTINGS: MagicLinkSettings = {
  sender_name: 'KreaFlow',
  subject: 'Link Masuk KreaFlow Kamu',
  primary_color: '#1a73e8',
  app_name: 'KreaFlow',
  tagline: 'Platform Workflow Konten',
  body_text: 'Klik tombol di bawah untuk masuk ke akun kamu — tanpa perlu password. Link ini hanya berlaku 1 jam.',
  button_text: 'Masuk ke KreaFlow →',
  footer_text: '© 2026 KreaFlow by TUAS DIGITAL',
}

export const APP_CONFIG_KEY = 'kf_magic_link_template'
