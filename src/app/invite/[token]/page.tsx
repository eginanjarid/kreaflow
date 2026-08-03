import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: invite } = await admin.from('kf_invites')
    .select('*, kf_workspaces(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ marginBottom: 16, color: '#ef4444' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h1 style={{ color: '#1e293b', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Link Tidak Valid</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24 }}>Link invite sudah kadaluarsa atau tidak ditemukan.</p>
          <Link href="/login" style={{ padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Kembali ke Login</Link>
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const workspaceName = (invite.kf_workspaces as { name: string } | null)?.name || 'Workspace'

  if (user) {
    if (user.email?.toLowerCase() !== invite.email?.toLowerCase()) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ marginBottom: 16, color: '#f59e0b' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h1 style={{ color: '#1e293b', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Akun Tidak Sesuai</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 6 }}>
              Invite ini untuk <strong style={{ color: '#7C3AED' }}>{invite.email}</strong>.
            </p>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
              Kamu login sebagai <strong style={{ color: '#ef4444' }}>{user.email}</strong>. Logout dulu lalu buka link ini kembali.
            </p>
            <Link href="/login" style={{ padding: '10px 24px', borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Logout & Login Ulang</Link>
          </div>
        </div>
      )
    }

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

    await admin.from('kf_invites').update({ accepted_at: new Date().toISOString() }).eq('token', token)

    redirect('/sprints')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#1e293b' }}>KreaFlow</span>
          </div>
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Undangan Tim</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>{workspaceName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Bergabung sebagai <span style={{ color: '#7C3AED', fontWeight: 600, textTransform: 'capitalize' }}>{invite.role}</span></div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
            Kamu diundang ke <strong style={{ color: '#1e293b' }}>{workspaceName}</strong>.<br />
            Login atau daftar dengan email <strong style={{ color: '#7C3AED' }}>{invite.email}</strong> untuk bergabung.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href={`/login?redirect=/invite/${token}`} style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              Login & Bergabung
            </Link>
            <Link href={`/register?email=${encodeURIComponent(invite.email)}&redirect=/invite/${token}`} style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', color: '#374151', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', background: '#f8fafc' }}>
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
