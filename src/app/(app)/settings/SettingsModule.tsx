'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  expires_at: string
}

type Props = {
  workspaceId: string
  workspaceName: string
  userEmail: string
  userName: string
  plan: string
  modes: string[]
  myRole: string
  members: Member[]
  pendingInvites: PendingInvite[]
  appUrl: string
}

const MODE_OPTIONS = [
  { id: 'creator', label: 'Content Creator', desc: 'Brand building, Library konten, Calendar, Plan, Tracker', icon: '🎬', color: '#42a5f5' },
  { id: 'affiliate', label: 'Affiliator', desc: 'Catalog produk affiliate + digital, komisi tracker, affiliate stats', icon: '🔗', color: '#34d399' },
]

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 8, padding: '10px 12px', color: '#2a3547', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function SettingsModule({ workspaceId, workspaceName, userEmail, userName, plan, modes: initialModes, myRole, members: initialMembers, pendingInvites: initialPending, appUrl }: Props) {
  const [tab, setTab] = useState('workspace')
  const [wsName, setWsName] = useState(workspaceName)
  const [activeModes, setActiveModes] = useState<string[]>(initialModes?.length ? initialModes : ['creator'])
  const [displayName, setDisplayName] = useState(userName === userEmail ? '' : userName)
  const [wsSaving, setWsSaving] = useState(false)
  const [wsMsg, setWsMsg] = useState('')

  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [pending, setPending] = useState<PendingInvite[]>(initialPending)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
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
      body: JSON.stringify({ workspaceId, email: inviteEmail, role: inviteRole }),
    })
    const data = await res.json()
    setInviting(false)
    if (!res.ok) { setInviteError(data.error || 'Gagal'); return }
    setInviteLink(data.url)
    setPending(prev => [...prev, { id: data.token, email: inviteEmail, role: inviteRole, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }])
    setInviteEmail('')
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
    setWsSaving(true)
    setWsMsg('')
    const updates: Record<string, unknown> = {}
    if (wsName.trim() && wsName !== workspaceName) updates.name = wsName.trim()
    updates.modes = activeModes
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
    setWsMsg('Tersimpan! Refresh halaman untuk melihat perubahan.')
    setTimeout(() => setWsMsg(''), 4000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError('')
    setPwdMsg('')
    if (newPwd !== confirmPwd) { setPwdError('Password baru tidak cocok.'); return }
    if (newPwd.length < 6) { setPwdError('Password minimal 6 karakter.'); return }
    setPwdSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdSaving(false)
    if (error) { setPwdError(error.message); return }
    setPwdMsg('Password berhasil diubah!')
    setCurPwd(''); setNewPwd(''); setConfirmPwd('')
    setTimeout(() => setPwdMsg(''), 4000)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2a3547', marginBottom: 6 }}>Settings</h1>
        <p style={{ color: '#5a6a85', fontSize: '0.9rem' }}>Kelola workspace dan akun kamu</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #e5eaf2' }}>
        {[{ id: 'workspace', label: 'Workspace' }, { id: 'tim', label: 'Tim' }, { id: 'akun', label: 'Akun' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #1a73e8' : '2px solid transparent', color: tab === t.id ? '#1a73e8' : '#5a6a85', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Workspace Tab */}
      {tab === 'workspace' && (
        <div style={{ maxWidth: 480 }}>
          {/* Plan info */}
          <div style={{ background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginBottom: 2 }}>Plan saat ini</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#42a5f5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan || 'Free'}</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Mode Aktif</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MODE_OPTIONS.map(m => {
                const active = activeModes.includes(m.id)
                return (
                  <div key={m.id} onClick={() => {
                    if (active && activeModes.length === 1) return // minimal 1 mode aktif
                    setActiveModes(prev => active ? prev.filter(x => x !== m.id) : [...prev, m.id])
                  }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: `1px solid ${active ? m.color + '40' : '#2a2a2a'}`, background: active ? m.color + '08' : '#1a1a1a', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: active ? m.color : '#94a3b8', fontSize: '0.875rem', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>{m.desc}</div>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: active ? m.color : '#2a2a2a', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: active ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginTop: 10 }}>Kedua mode bisa aktif sekaligus. Klik Simpan untuk menyimpan.</div>
          </div>

          <form onSubmit={saveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Nama Workspace</label>
              <input style={fieldStyle()} value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Nama workspace..." required />
              <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginTop: 4 }}>Tampil di sidebar dan semua modul</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Nama Tampilan</label>
              <input style={fieldStyle()} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={userEmail} />
              <div style={{ fontSize: '0.72rem', color: '#5a6a85', marginTop: 4 }}>Tampil di avatar sidebar</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input style={fieldStyle({ color: '#5a6a85', cursor: 'not-allowed' })} value={userEmail} readOnly />
            </div>
            {wsMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: '0.85rem' }}>{wsMsg}</div>}
            <div>
              <button type="submit" disabled={wsSaving} style={{ background: wsSaving ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: wsSaving ? 'not-allowed' : 'pointer' }}>
                {wsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tim Tab */}
      {tab === 'tim' && (
        <div style={{ maxWidth: 560 }}>
          {teamMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: '0.85rem', marginBottom: 16 }}>{teamMsg}</div>}

          {/* Members list */}
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.875rem' }}>Member Aktif</div>
              <div style={{ fontSize: '0.75rem', color: '#5a6a85' }}>{members.length} member</div>
            </div>
            {members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: m.role === 'owner' ? 'linear-gradient(135deg,#1a73e8,#42a5f5)' : '#1a1a1a', border: '1px solid #e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#2a3547', flexShrink: 0 }}>
                  {(m.nama || m.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: '#2a3547', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nama || m.email}</div>
                  {m.nama && <div style={{ fontSize: '0.72rem', color: '#5a6a85', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>}
                </div>
                {/* Jabatan */}
                <select
                  value={m.jabatan || ''}
                  onChange={e => changeJabatan(m.id, e.target.value)}
                  style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 8px', color: m.jabatan ? '#42a5f5' : '#334155', fontSize: '0.72rem', cursor: 'pointer', outline: 'none', minWidth: 110 }}
                >
                  <option value="">— Jabatan —</option>
                  {['Copywriter','Videografer','Editor','Admin Sosmed','Art Director','Content Creator','Owner'].map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                {canManageTeam && m.role !== 'owner' ? (
                  <select
                    value={m.role}
                    onChange={e => changeRole(m.id, e.target.value)}
                    style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 8px', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 10, background: m.role === 'owner' ? 'rgba(26,115,232,0.15)' : 'rgba(71,85,105,0.2)', color: m.role === 'owner' ? '#42a5f5' : '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                )}
                {canManageTeam && m.role !== 'owner' && m.email !== userEmail && (
                  <button onClick={() => removeMember(m.id)} style={{ background: 'transparent', border: 'none', color: '#5a6a85', cursor: 'pointer', fontSize: '0.85rem', padding: '4px' }} title="Remove">🗑</button>
                )}
              </div>
            ))}
          </div>

          {/* Pending invites */}
          {pending.length > 0 && (
            <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5eaf2' }}>
                <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.875rem' }}>Undangan Tertunda</div>
              </div>
              {pending.map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: '#2a3547', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                    <div style={{ fontSize: '0.72rem', color: '#5a6a85' }}>Expires {new Date(inv.expires_at).toLocaleDateString('id-ID')}</div>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 10, background: 'rgba(254,188,46,0.1)', color: '#febc2e', fontWeight: 600, textTransform: 'capitalize' }}>{inv.role}</span>
                  <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 10, background: 'rgba(71,85,105,0.2)', color: '#5a6a85' }}>Pending</span>
                </div>
              ))}
            </div>
          )}

          {/* Invite form */}
          {canManageTeam && (
            <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '20px' }}>
              <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.875rem', marginBottom: 14 }}>Undang Member Baru</div>
              <form onSubmit={sendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <input
                    type="email"
                    placeholder="email@contoh.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    style={fieldStyle()}
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    style={{ ...fieldStyle(), width: 'auto', cursor: 'pointer' }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {inviteError && <div style={{ color: '#f87171', fontSize: '0.82rem' }}>{inviteError}</div>}
                <button type="submit" disabled={inviting} style={{ background: inviting ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 9, padding: '10px 20px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: inviting ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                  {inviting ? 'Membuat link...' : '+ Generate Link Undangan'}
                </button>
              </form>

              {inviteLink && (
                <div style={{ marginTop: 16, background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.25)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#42a5f5', fontWeight: 600, marginBottom: 8 }}>Link Undangan (valid 7 hari)</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ flex: 1, fontSize: '0.72rem', color: '#5a6a85', wordBreak: 'break-all', background: '#fff', borderRadius: 6, padding: '8px 10px', border: '1px solid #e5eaf2' }}>{inviteLink}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteLink).then(() => setTeamMsg('Link disalin!'))}
                      style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 7, padding: '8px 12px', color: '#5a6a85', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
                    >Salin</button>
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
          <div style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#5a6a85', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Info Akun</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #1a73e8, #42a5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(userName || userEmail).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#2a3547', fontSize: '0.9rem' }}>{userName || userEmail}</div>
                <div style={{ fontSize: '0.78rem', color: '#5a6a85' }}>{userEmail}</div>
              </div>
            </div>
          </div>

          <form onSubmit={changePassword} style={{ background: '#fff', boxShadow: '0 6px 30px rgba(42,53,71,0.10)', borderRadius: 20, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: '0.78rem', color: '#5a6a85', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ganti Password</div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Password Baru *</label>
              <input type="password" style={fieldStyle()} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#5a6a85', marginBottom: 6, fontWeight: 500 }}>Konfirmasi Password *</label>
              <input type="password" style={fieldStyle()} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Ulangi password baru" required />
            </div>
            {pwdError && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{pwdError}</div>}
            {pwdMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: '0.85rem' }}>{pwdMsg}</div>}
            <div>
              <button type="submit" disabled={pwdSaving} style={{ background: pwdSaving ? '#1557b0' : 'linear-gradient(135deg, #1a73e8, #42a5f5)', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: pwdSaving ? 'not-allowed' : 'pointer' }}>
                {pwdSaving ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
