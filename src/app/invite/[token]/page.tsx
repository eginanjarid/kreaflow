import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Validate invite
  const { data: invite } = await admin.from('kf_invites')
    .select('*, kf_workspaces(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ marginBottom: 16, color: '#ef4444' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Link Tidak Valid</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24 }}>Link invite sudah kadaluarsa atau tidak ditemukan.</p>
          <Link href="/login" style={{ padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Kembali ke Login</Link>
        </div>
      </div>
    )
  }

  // Check if user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const workspaceName = (invite.kf_workspaces as { name: string } | null)?.name || 'Workspace'

  if (user) {
    // Pastikan email yang login = email yang diundang
    if (user.email?.toLowerCase() !== invite.email?.toLowerCase()) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ marginBottom: 16, color: '#f59e0b' }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <h1 style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Akun Tidak Sesuai</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 6 }}>
              Invite ini untuk <strong style={{ color: '#A78BFA' }}>{invite.email}</strong>.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
              Kamu login sebagai <strong style={{ color: '#f87171' }}>{user.email}</strong>. Logout dulu lalu buka link ini kembali.
            </p>
            <Link href="/login" style={{ padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Logout & Login Ulang</Link>
          </div>
        </div>
      )
    }

    // Check if already member
    const { data: alreadyMember } = await admin.from('kf_workspace_members')
      .select('id').eq('workspace_id', invite.workspace_id).eq('user_id', user.id).single()

    if (!alreadyMember) {
      await admin.from('kf_workspace_members').insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
        jabatan: (invite as { jabatan?: string }).jabatan || null,
      })
    }

    // Mark invite accepted
    await admin.from('kf_invites').update({ accepted_at: new Date().toISOString() }).eq('token', token)

    redirect('/sprints')
  }

  // Not logged in — show join page
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#f1f5f9' }}>KreaFlow</span>
          </div>
          <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 8 }}>
            <div style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Undangan Tim</div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>{workspaceName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Bergabung sebagai <span style={{ color: '#A78BFA', fontWeight: 600, textTransform: 'capitalize' }}>{invite.role}</span></div>
          </div>
        </div>

        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, padding: '28px' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
            Kamu diundang ke <strong style={{ color: '#d1d9e6' }}>{workspaceName}</strong>.<br />
            Login atau daftar dengan email <strong style={{ color: '#A78BFA' }}>{invite.email}</strong> untuk bergabung.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={`/login?redirect=/invite/${token}`} style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              Login & Bergabung
            </Link>
            <Link href={`/register?email=${encodeURIComponent(invite.email)}&redirect=/invite/${token}`} style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, border: '1px solid #2a2a2a', color: '#d1d9e6', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', background: '#1a1a1a' }}>
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
