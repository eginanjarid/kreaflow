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
  settings: MagicLinkSettings,
  otp?: string
) {
  const s = { ...DEFAULT_MAGIC_LINK_SETTINGS, ...settings }
  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"${s.sender_name}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: s.subject,
    html: buildMagicLinkHtml(magicLink, s, otp),
  })
}

function buildMagicLinkHtml(magicLink: string, s: MagicLinkSettings, otp?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'
  const logoUrl = `${appUrl}/logo-icon.png`

  const otpSection = otp ? `
          <tr><td style="padding-top:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="border-top:1px solid #f0f0f0;padding-bottom:20px;"></td></tr>
            </table>
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Atau gunakan kode OTP</p>
            <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:12px;">
              <tr><td style="padding:16px 24px;">
                <span style="font-size:30px;font-weight:900;color:#111827;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</span>
              </td></tr>
            </table>
          </td></tr>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <img src="${logoUrl}" alt="${s.app_name}" width="40" height="40" style="display:block;border-radius:10px;" />
        </td>
        <td style="vertical-align:middle;">
          <span style="font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.5px;">${s.app_name}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#ffffff;border-radius:20px;padding:36px 36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0">

      <!-- Label + Heading + Body -->
      <tr><td style="padding-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${s.primary_color};letter-spacing:0.08em;text-transform:uppercase;">LINK MASUK</p>
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px;">${s.button_text.replace(' →', '').replace(' →', '')}</h1>
        <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.65;">${s.body_text}</p>
      </td></tr>

      <!-- CTA Button -->
      <tr><td style="padding-bottom:24px;">
        <table cellpadding="0" cellspacing="0">
          <tr><td style="background:${s.primary_color};border-radius:12px;">
            <a href="${magicLink}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">Masuk Sekarang &rarr;</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- OTP Section -->
      ${otpSection}

      <!-- Fallback URL -->
      <tr><td style="padding-top:20px;border-top:1px solid #f3f4f6;">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">Jika tombol tidak berfungsi, salin URL ini ke browser:</p>
        <span style="font-size:11px;color:${s.primary_color};word-break:break-all;">${magicLink}</span>
      </td></tr>

    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding-top:24px;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">${s.footer_text}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
