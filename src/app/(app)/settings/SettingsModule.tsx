'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

type Member = {
  id: string
  user_id: string
  role: string
  jabatan: string
  created_at: string
  email: string
  nama: string
}

type PendingInvite = {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
}

type Props = {
  workspaceId: string
  workspaceName: string
  userEmail: string
  userName: string
  plan: string
  myRole: string
  members: Member[]
  pendingInvites: PendingInvite[]
  appUrl: string
}

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function SettingsModule({ workspaceId, workspaceName, userEmail, userName, plan, myRole, members: initialMembers, pendingInvites: initialPending, appUrl }: Props) {
  const [tab, setTab] = useState('workspace')
  const [wsName, setWsName] = useState(workspaceName)
  const [displayName, setDisplayName] = useState(userName === userEmail ? '' : userName)
  const [wsSaving, setWsSaving] = useState(false)
  const [wsMsg, setWsMsg] = useState('')

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [pending, setPending] = useState<PendingInvite[]>(initialPending)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteJabatan, setInviteJabatan] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [teamMsg, setTeamMsg] = useState('')

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true); setInviteError(''); setInviteLink('')
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, email: inviteEmail, role: inviteRole, jabatan: inviteJabatan }),
    })
    const data = await res.json()
    setInviting(false)
    if (!res.ok) { setInviteError(data.error || 'Gagal'); return }
    setInviteLink(data.url)
    setPending(prev => [...prev, { id: data.token, email: inviteEmail, role: inviteRole, token: data.token, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }])
    setInviteEmail('')
    setInviteJabatan('')
  }

  async function resendInvite(inv: PendingInvite) {
    const url = `${appUrl}/invite/${inv.token}`
    await navigator.clipboard.writeText(url)
    setTeamMsg(`Link untuk ${inv.email} disalin!`)
    setTimeout(() => setTeamMsg(''), 3000)
  }

  async function cancelInvite(inviteId: string) {
    if (!confirm('Batalkan undangan ini?')) return
    const res = await fetch('/api/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, inviteId }),
    })
    if (res.ok) { setPending(prev => prev.filter(i => i.id !== inviteId)); setTeamMsg('Undangan dibatalkan.'); setTimeout(() => setTeamMsg(''), 3000) }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Hapus member ini dari workspace?')) return
    const res = await fetch('/api/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, memberId }),
    })
    if (res.ok) { setMembers(prev => prev.filter(m => m.id !== memberId)); setTeamMsg('Member dihapus.'); setTimeout(() => setTeamMsg(''), 3000) }
  }

  async function changeRole(memberId: string, role: string) {
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, memberId, role }),
    })
    if (res.ok) { setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m)); setTeamMsg('Role diperbarui.'); setTimeout(() => setTeamMsg(''), 3000) }
  }

  async function changeJabatan(memberId: string, jabatan: string) {
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, memberId, jabatan }),
    })
    if (res.ok) { setMembers(prev => prev.map(m => m.id === memberId ? { ...m, jabatan } : m)); setTeamMsg('Jabatan diperbarui.'); setTimeout(() => setTeamMsg(''), 3000) }
  }

  const canManageTeam = myRole === 'owner' || myRole === 'admin'

  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')

  async function saveWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!wsName.trim()) { showToast('Nama workspace wajib diisi.'); return }
    setWsSaving(true)
    setWsMsg('')
    const updates: Record<string, unknown> = {}
    if (wsName.trim() && wsName !== workspaceName) updates.name = wsName.trim()
    const res = await fetch('/api/settings/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, updates }),
    })
    if (!res.ok) {
      const json = await res.json()
      setWsMsg('Gagal menyimpan: ' + (json.error || res.statusText))
      setWsSaving(false)
      return
    }
    if (displayName.trim()) {
      const supabase = createClient()
      await supabase.auth.updateUser({ data: { nama: displayName.trim() } })
    }
    setWsSaving(false)
    showToast('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.', 'success')
    setWsMsg('Tersimpan! Refresh halaman untuk melihat perubahan.')
    setTimeout(() => setWsMsg(''), 4000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError('')
    setPwdMsg('')
    if (!newPwd) { showToast('Password baru wajib diisi.'); return }
    if (newPwd.length < 6) { showToast('Password minimal 6 karakter.'); return }
    if (newPwd !== confirmPwd) { showToast('Konfirmasi password tidak cocok.'); return }
    setPwdSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdSaving(false)
    if (error) { setPwdError(error.message); return }
    showToast('Password berhasil diubah!', 'success')
    setPwdMsg('Password berhasil diubah!')
    setCurPwd(''); setNewPwd(''); setConfirmPwd('')
    setTimeout(() => setPwdMsg(''), 4000)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Settings</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Kelola workspace dan akun kamu</p>
      </div>

      {/* Tabs */}
      <div className="kf-tabs-wrap">
        <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #e5eaf2' }}>
          {[{ id: 'workspace', label: 'Workspace' }, { id: 'tim', label: 'Tim' }, { id: 'akun', label: 'Akun' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #1a73e8' : '2px solid transparent', color: tab === t.id ? '#1a73e8' : '#6b7280', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Tab */}
      {tab === 'workspace' && (
        <div style={{ maxWidth: 480 }}>
          {/* Plan info */}
          <div style={{ background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 2 }}>Plan saat ini</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a73e8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan || 'Free'}</div>
            </div>
          </div>

          <form onSubmit={saveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Nama Workspace</label>
              <input style={fieldStyle()} value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Nama workspace..." required />
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>Tampil di sidebar dan semua modul</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Nama Tampilan</label>
              <input style={fieldStyle()} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={userEmail} />
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>Tampil di avatar sidebar</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input style={fieldStyle({ color: '#6b7280', cursor: 'not-allowed' })} value={userEmail} readOnly />
            </div>
            {wsMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#059669', fontSize: '0.85rem' }}>{wsMsg}</div>}
            <div>
              <button type="submit" disabled={wsSaving} style={{ background: wsSaving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: wsSaving ? 'not-allowed' : 'pointer' }}>
                {wsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tim Tab */}
      {tab === 'tim' && (
        <div style={{ maxWidth: 560 }}>
          {teamMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#059669', fontSize: '0.85rem', marginBottom: 16 }}>{teamMsg}</div>}

          {/* Members list */}
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Member Aktif</div>
              <div style={{ fontSize: '0.75rem', color: members.length >= 6 ? '#dc2626' : '#6b7280', fontWeight: 600 }}>
                {members.length}/6 slot
              </div>
            </div>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.role === 'owner' ? '#1a73e8' : '#f1f5f9', border: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#111827', flexShrink: 0 }}>
                  {(m.nama || m.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nama || m.email}</div>
                  {m.nama && <div style={{ fontSize: '0.72rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>}
                </div>
                {/* Jabatan */}
                <select
                  value={m.jabatan || ''}
                  onChange={e => changeJabatan(m.id, e.target.value)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '4px 8px', color: m.jabatan ? '#1a73e8' : '#374151', fontSize: '0.72rem', cursor: 'pointer', outline: 'none', minWidth: 110 }}
                >
                  <option value="">— Jabatan —</option>
                  {['Manager','Copywriter','Videografer','Editor','Desainer','Admin Sosmed','Social Media Specialist','Art Director','Content Creator'].map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                {canManageTeam && m.role !== 'owner' ? (
                  <select
                    value={m.role}
                    onChange={e => changeRole(m.id, e.target.value)}
                    style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 10, background: m.role === 'owner' ? 'rgba(26,115,232,0.10)' : 'rgba(71,85,105,0.2)', color: m.role === 'owner' ? '#1a73e8' : '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                )}
                {canManageTeam && m.role !== 'owner' && m.email !== userEmail && (
                  <button onClick={() => removeMember(m.id)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.85rem', padding: '4px' }} title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
                )}
              </div>
            ))}
          </div>

          {/* Pending invites */}
          {pending.length > 0 && (
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5eaf2' }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Undangan Tertunda</div>
              </div>
              {pending.map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Exp. {new Date(inv.expires_at).toLocaleDateString('id-ID')}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 10, background: 'rgba(254,188,46,0.1)', color: '#d97706', fontWeight: 600, textTransform: 'capitalize' }}>{inv.role}</span>
                  <button
                    onClick={() => resendInvite(inv)}
                    title="Salin link undangan"
                    style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #e5eaf2', background: '#f8fafc', color: '#374151', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Salin Link
                  </button>
                  <button
                    onClick={() => cancelInvite(inv.id)}
                    title="Batalkan undangan"
                    style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Invite form */}
          {canManageTeam && members.length >= 6 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>Slot anggota tim penuh</div>
              <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>Maksimal 1 owner + 5 karyawan sudah tercapai. Hapus member untuk menambah yang baru.</div>
            </div>
          )}
          {canManageTeam && members.length < 6 && (
            <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Undang Member Baru</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{6 - members.length} slot tersisa</div>
              </div>
              <form onSubmit={sendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10 }}>
                  <input
                    type="email"
                    placeholder="email@contoh.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    style={fieldStyle()}
                  />
                  <select
                    value={inviteJabatan}
                    onChange={e => setInviteJabatan(e.target.value)}
                    style={{ ...fieldStyle(), width: 'auto', cursor: 'pointer', color: inviteJabatan ? '#111827' : '#9ca3af' }}
                  >
                    <option value="">— Jabatan —</option>
                    {['Manager','Copywriter','Videografer','Editor','Desainer','Admin Sosmed','Social Media Specialist','Art Director','Content Creator'].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    style={{ ...fieldStyle(), width: 'auto', cursor: 'pointer' }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {inviteError && <div style={{ color: '#dc2626', fontSize: '0.82rem' }}>{inviteError}</div>}
                <button type="submit" disabled={inviting} style={{ background: inviting ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 9, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: inviting ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                  {inviting ? 'Mengirim undangan...' : '✉ Kirim Undangan'}
                </button>
              </form>

              {inviteLink && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1rem' }}>✅</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>Email undangan terkirim!</div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 1 }}>Link juga bisa disalin manual di bawah sebagai backup.</div>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Link backup (valid 7 hari)</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ flex: 1, fontSize: '0.72rem', color: '#6b7280', wordBreak: 'break-all', background: '#fff', borderRadius: 6, padding: '8px 10px', border: '1px solid #e5eaf2' }}>{inviteLink}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(inviteLink).then(() => setTeamMsg('Link disalin!'))}
                        style={{ background: '#fff', border: '1px solid #e5eaf2', borderRadius: 7, padding: '8px 12px', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
                      >Salin</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Akun Tab */}
      {tab === 'akun' && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Info Akun</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(userName || userEmail).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{userName || userEmail}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{userEmail}</div>
              </div>
            </div>
          </div>

          <form onSubmit={changePassword} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ganti Password</div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Password Baru *</label>
              <input type="password" style={fieldStyle()} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>Konfirmasi Password *</label>
              <input type="password" style={fieldStyle()} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Ulangi password baru" required />
            </div>
            {pwdError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: '0.85rem' }}>{pwdError}</div>}
            {pwdMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#059669', fontSize: '0.85rem' }}>{pwdMsg}</div>}
            <div>
              <button type="submit" disabled={pwdSaving} style={{ background: pwdSaving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: pwdSaving ? 'not-allowed' : 'pointer' }}>
                {pwdSaving ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
