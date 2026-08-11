import nodemailer from 'nodemailer'
import type { MagicLinkSettings } from './email-config'
import { DEFAULT_MAGIC_LINK_SETTINGS } from './email-config'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendMagicLinkEmail(
  to: string,
  magicLink: string,
  settings: MagicLinkSettings
) {
  const s = { ...DEFAULT_MAGIC_LINK_SETTINGS, ...settings }
  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"${s.sender_name}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: s.subject,
    html: buildMagicLinkHtml(magicLink, s),
  })
}

function buildMagicLinkHtml(magicLink: string, s: MagicLinkSettings): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;color:#111827;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,${s.primary_color},#0d47a1);padding:32px;text-align:center;">
      <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">${s.app_name}</div>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:13px;">${s.tagline}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">LINK MASUK</p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">${s.body_text}</p>
      <a href="${magicLink}" style="display:block;text-align:center;background:${s.primary_color};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:10px;margin-bottom:24px;">${s.button_text}</a>
      <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">Jika tombol tidak berfungsi, salin URL ini ke browser:<br><span style="color:#6b7280;word-break:break-all;">${magicLink}</span></p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0;font-size:12px;color:#d1d5db;">${s.footer_text}</p>
    </div>
  </div>
</body>
</html>`
}
