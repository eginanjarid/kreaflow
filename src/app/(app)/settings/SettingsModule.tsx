'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  workspaceId: string
  workspaceName: string
  userEmail: string
  userName: string
  plan: string
  modes: string[]
}

const MODE_OPTIONS = [
  { id: 'creator', label: 'Content Creator', desc: 'Brand building, Library konten, Calendar, Plan, Tracker', icon: '🎬', color: '#A78BFA' },
  { id: 'affiliate', label: 'Affiliator', desc: 'Catalog produk affiliate + digital, komisi tracker, affiliate stats', icon: '🔗', color: '#34d399' },
]

function fieldStyle(extra?: object) {
  return { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const, ...extra }
}

export default function SettingsModule({ workspaceId, workspaceName, userEmail, userName, plan, modes: initialModes }: Props) {
  const [tab, setTab] = useState('workspace')
  const [wsName, setWsName] = useState(workspaceName)
  const [activeModes, setActiveModes] = useState<string[]>(initialModes?.length ? initialModes : ['creator'])
  const [displayName, setDisplayName] = useState(userName === userEmail ? '' : userName)
  const [wsSaving, setWsSaving] = useState(false)
  const [wsMsg, setWsMsg] = useState('')

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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>Settings</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Kelola workspace dan akun kamu</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #1f1f1f' }}>
        {[{ id: 'workspace', label: 'Workspace' }, { id: 'akun', label: 'Akun' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 18px', background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #7C3AED' : '2px solid transparent', color: tab === t.id ? '#A78BFA' : '#64748b', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Workspace Tab */}
      {tab === 'workspace' && (
        <div style={{ maxWidth: 480 }}>
          {/* Plan info */}
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>Plan saat ini</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan || 'Free'}</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Mode Aktif</div>
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
                      <div style={{ fontSize: '0.72rem', color: '#475569' }}>{m.desc}</div>
                    </div>
                    <div style={{ width: 36, height: 20, borderRadius: 10, background: active ? m.color : '#2a2a2a', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: active ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 10 }}>Kedua mode bisa aktif sekaligus. Klik Simpan untuk menyimpan.</div>
          </div>

          <form onSubmit={saveWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Nama Workspace</label>
              <input style={fieldStyle()} value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Nama workspace..." required />
              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4 }}>Tampil di sidebar dan semua modul</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Nama Tampilan</label>
              <input style={fieldStyle()} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={userEmail} />
              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4 }}>Tampil di avatar sidebar</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input style={fieldStyle({ color: '#475569', cursor: 'not-allowed' })} value={userEmail} readOnly />
            </div>
            {wsMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: '0.85rem' }}>{wsMsg}</div>}
            <div>
              <button type="submit" disabled={wsSaving} style={{ background: wsSaving ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: wsSaving ? 'not-allowed' : 'pointer' }}>
                {wsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Akun Tab */}
      {tab === 'akun' && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Info Akun</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(userName || userEmail).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>{userName || userEmail}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{userEmail}</div>
              </div>
            </div>
          </div>

          <form onSubmit={changePassword} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ganti Password</div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Password Baru *</label>
              <input type="password" style={fieldStyle()} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Konfirmasi Password *</label>
              <input type="password" style={fieldStyle()} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Ulangi password baru" required />
            </div>
            {pwdError && <div style={{ background: '#1a0000', border: '1px solid #450a0a', borderRadius: 8, padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>{pwdError}</div>}
            {pwdMsg && <div style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: 8, padding: '10px 14px', color: '#86efac', fontSize: '0.85rem' }}>{pwdMsg}</div>}
            <div>
              <button type="submit" disabled={pwdSaving} style={{ background: pwdSaving ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: pwdSaving ? 'not-allowed' : 'pointer' }}>
                {pwdSaving ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
