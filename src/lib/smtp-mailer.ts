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
  const otpSection = otp ? `
    <div style="margin:28px 0 0;padding-top:24px;border-top:1px solid #f0f0f0;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">Atau gunakan kode OTP</p>
      <div style="display:flex;gap:8px;">
        ${otp.split('').map(d => `<div style="width:44px;height:52px;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;text-align:center;line-height:52px;font-size:24px;font-weight:900;color:#111827;font-family:'Courier New',monospace;">${d}</div>`).join('')}
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f7fa;margin:0;padding:40px 20px;">

  <div style="text-align:center;margin-bottom:24px;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="vertical-align:middle;padding-right:10px;">
          <div style="width:40px;height:40px;background:${s.primary_color};border-radius:10px;text-align:center;line-height:40px;font-size:20px;font-weight:900;color:#fff;">${s.app_name.charAt(0)}</div>
        </td>
        <td style="vertical-align:middle;">
          <span style="font-size:22px;font-weight:900;color:#111827;">${s.app_name}</span>
        </td>
      </tr>
    </table>
  </div>

  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="padding:36px 36px 28px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${s.primary_color};text-transform:uppercase;letter-spacing:0.6px;">Link Masuk</p>
      <h2 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111827;">${s.button_text.replace(' →', '')}</h2>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">${s.body_text}</p>
      <a href="${magicLink}" style="display:inline-block;background:${s.primary_color};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 24px;border-radius:10px;">
        Masuk Sekarang →
      </a>
      ${otpSection}
    </div>
    <div style="padding:16px 36px;border-top:1px solid #f3f4f6;background:#fafafa;">
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">Jika tombol tidak berfungsi, salin URL ini ke browser:</p>
      <span style="font-size:11px;color:${s.primary_color};word-break:break-all;">${magicLink}</span>
    </div>
  </div>

  <div style="text-align:center;margin-top:24px;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">${s.footer_text}</p>
  </div>

</body>
</html>`
}
