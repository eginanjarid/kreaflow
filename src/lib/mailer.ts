const MAILKETING_API = 'https://api.mailketing.co.id/api/v1/send'

interface SendEmailParams {
  to: string
  subject: string
  content: string
  fromName?: string
  fromEmail?: string
}

async function sendEmail({ to, subject, content, fromName, fromEmail }: SendEmailParams) {
  const token = process.env.MAILKETING_API_TOKEN
  if (!token) {
    console.error('[mailer] MAILKETING_API_TOKEN not set')
    return { ok: false, error: 'Mailer not configured' }
  }

  const body = new URLSearchParams({
    api_token: token,
    from_name: fromName || process.env.MAILKETING_FROM_NAME || 'KreaFlow',
    from_email: fromEmail || process.env.MAILKETING_FROM_EMAIL || 'noreply@kreaflow.id',
    recipient: to,
    subject,
    content,
  })

  try {
    const res = await fetch(MAILKETING_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json() as { status: string; response: string }
    if (data.status !== 'success') {
      console.error('[mailer] Send failed:', data.response)
      return { ok: false, error: data.response }
    }
    return { ok: true }
  } catch (err) {
    console.error('[mailer] Fetch error:', err)
    return { ok: false, error: 'Network error' }
  }
}

export async function sendInviteEmail({
  to,
  workspaceName,
  inviteUrl,
  inviterName,
}: {
  to: string
  workspaceName: string
  inviteUrl: string
  inviterName: string
}) {
  const subject = `${inviterName} mengundang kamu bergabung ke ${workspaceName} di KreaFlow`
  const content = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px 36px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">KreaFlow</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:0.5px;">Platform Workflow Konten</div>
    </div>

    <div style="padding:36px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.3px;">
        Kamu diundang! 🎉
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        <strong style="color:#374151;">${inviterName}</strong> mengundang kamu untuk bergabung ke workspace
        <strong style="color:#1a73e8;">${workspaceName}</strong> di KreaFlow.
      </p>

      <div style="background:#f8faff;border:1px solid #dbeafe;border-radius:12px;padding:20px;margin-bottom:28px;">
        <div style="font-size:12px;font-weight:700;color:#1a73e8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">WORKSPACE</div>
        <div style="font-size:18px;font-weight:800;color:#111827;">${workspaceName}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Diundang oleh ${inviterName}</div>
      </div>

      <a href="${inviteUrl}"
        style="display:block;text-align:center;background:#1a73e8;color:#fff;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;margin-bottom:20px;">
        Terima Undangan →
      </a>

      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
        Link undangan ini hanya berlaku satu kali.<br>
        Jika kamu tidak mengenal pengirim, abaikan email ini.
      </p>
    </div>

    <div style="border-top:1px solid #f3f4f6;padding:20px 36px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#d1d5db;">
        © ${new Date().getFullYear()} KreaFlow · Platform Workflow Konten Indonesia
      </p>
    </div>
  </div>
</body>
</html>`.trim()

  return sendEmail({ to, subject, content })
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string
  name: string
}) {
  const subject = `Selamat datang di KreaFlow, ${name}! 🚀`
  const content = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:32px 36px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">KreaFlow</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Platform Workflow Konten</div>
    </div>

    <div style="padding:36px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
        Halo, ${name}! 👋
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
        Selamat datang di KreaFlow! Akun kamu sudah aktif dan siap digunakan.
        Mulai kelola workflow konten kamu dari ide sampai posting dalam satu platform.
      </p>

      <div style="display:grid;gap:12px;margin-bottom:28px;">
        ${[
          ['🎯', 'Brand & Strategi', 'Bangun identitas brand dan strategi konten kamu'],
          ['⚡', 'Sprint Board', 'Kelola konten dengan sistem sprint yang terstruktur'],
          ['✍️', 'Plan & Studio', 'Buat naskah dengan AI dan produksi konten'],
          ['📅', 'Calendar', 'Jadwalkan dan pantau semua konten kamu'],
        ].map(([icon, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:14px;background:#f9fafb;border-radius:10px;">
          <span style="font-size:20px;flex-shrink:0;">${icon}</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">${title}</div>
            <div style="font-size:12px;color:#6b7280;">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'}/brand"
        style="display:block;text-align:center;background:#1a73e8;color:#fff;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:20px;">
        Mulai Sekarang →
      </a>
    </div>

    <div style="border-top:1px solid #f3f4f6;padding:20px 36px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#d1d5db;">
        © ${new Date().getFullYear()} KreaFlow · Platform Workflow Konten Indonesia
      </p>
    </div>
  </div>
</body>
</html>`.trim()

  return sendEmail({ to, subject, content })
}
