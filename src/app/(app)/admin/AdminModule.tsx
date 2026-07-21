'use client'

import { useState } from 'react'

type UserRow = {
  id: string
  email: string
  nama: string
  created_at: string
  last_sign_in: string
  workspaces: { id: string; name: string; plan: string; role: string }[]
  plan: string
}

type WorkspaceMember = {
  user_id: string
  role: string
  joined_at: string
  email: string
  nama: string
}

type WorkspaceRow = {
  id: string
  name: string
  plan: string
  created_at: string
  modes: string[]
  owner_email: string
  member_count: number
  members: WorkspaceMember[]
  pending_invites: number
}

type Stats = {
  total: number
  today: number
  week: number
  month: number
  byPlan: { free: number; solo: number; pro: number; team: number }
  totalWorkspaces: number
}

const PLANS = ['free', 'solo', 'pro', 'team']
const PLAN_COLORS: Record<string, string> = { free: '#475569', solo: '#7C3AED', pro: '#A78BFA', team: '#34d399' }

function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] || '#475569'
  return <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: color + '20', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{plan || 'free'}</span>
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function AdminModule({ users, workspaces, stats }: { users: UserRow[]; workspaces: WorkspaceRow[]; stats: Stats }) {
  const [tab, setTab] = useState<'users' | 'workspaces'>('users')
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [expandedWs, setExpandedWs] = useState<string | null>(null)
  const [actionUser, setActionUser] = useState<UserRow | null>(null)
  const [actionType, setActionType] = useState<'plan' | 'password' | null>(null)
  const [actionWs, setActionWs] = useState<WorkspaceRow | null>(null)
  const [newPlan, setNewPlan] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.email.includes(search.toLowerCase()) || u.nama.toLowerCase().includes(search.toLowerCase())
    const matchPlan = !filterPlan || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  const filteredWs = workspaces.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.owner_email.includes(search.toLowerCase())
  )

  function openUserAction(u: UserRow, type: 'plan' | 'password') {
    setActionUser(u); setActionType(type); setNewPlan(u.plan || 'free'); setNewPassword(''); setMsg('')
  }
  function openWsPlan(ws: WorkspaceRow) {
    setActionWs(ws); setNewPlan(ws.plan || 'free'); setMsg('')
  }
  function closeAction() { setActionUser(null); setActionType(null); setActionWs(null) }

  async function handleSave() {
    setSaving(true); setMsg('')
    let body: Record<string, string>

    if (actionWs) {
      body = { action: 'plan', userId: '', plan: newPlan, workspaceId: actionWs.id }
    } else if (!actionUser) return
    else if (actionType === 'plan') {
      body = { action: 'plan', userId: actionUser.id, plan: newPlan, workspaceId: actionUser.workspaces[0]?.id || '' }
    } else {
      body = { action: 'password', userId: actionUser.id, password: newPassword }
    }

    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg('Error: ' + (data.error || 'Gagal')); return }
    setMsg(actionType === 'password' ? 'Password direset!' : 'Plan diperbarui!')
    setTimeout(() => { closeAction(); window.location.reload() }, 800)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Super Admin</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Platform management — hanya visible untuk kamu</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total User', value: stats.total, color: '#A78BFA' },
          { label: 'Hari Ini', value: stats.today, color: '#86efac' },
          { label: '7 Hari', value: stats.week, color: '#86efac' },
          { label: '30 Hari', value: stats.month, color: '#93c5fd' },
          { label: 'Workspace', value: stats.totalWorkspaces, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per Plan</span>
        {Object.entries(stats.byPlan).map(([plan, count]) => (
          <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PlanBadge plan={plan} />
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1f1f1f' }}>
        {([['users', 'Users'], ['workspaces', 'Workspaces']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '9px 16px', background: 'transparent', border: 'none', borderBottom: tab === id ? '2px solid #f87171' : '2px solid transparent', color: tab === id ? '#f87171' : '#64748b', fontSize: '0.875rem', fontWeight: tab === id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {label} <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: 4 }}>{id === 'users' ? users.length : workspaces.length}</span>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input placeholder={tab === 'users' ? 'Cari email atau nama...' : 'Cari workspace atau owner...'}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none' }} />
        {tab === 'users' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['', ...PLANS].map(p => (
              <button key={p} onClick={() => setFilterPlan(p)}
                style={{ padding: '6px 10px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600, border: filterPlan === p ? `1px solid ${PLAN_COLORS[p] || '#f87171'}` : '1px solid #2a2a2a', background: filterPlan === p ? (PLAN_COLORS[p] || '#f87171') + '20' : '#1a1a1a', color: filterPlan === p ? (PLAN_COLORS[p] || '#f87171') : '#64748b', cursor: 'pointer', textTransform: 'uppercase' }}>
                {p || 'All'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', padding: '10px 16px', borderBottom: '1px solid #1f1f1f', fontSize: '0.68rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <div>User</div><div>Workspace</div><div>Plan</div><div>Daftar</div><div>Aksi</div>
          </div>
          {filteredUsers.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Tidak ada user</div>}
          {filteredUsers.map((u, i) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', padding: '11px 16px', borderBottom: i < filteredUsers.length - 1 ? '1px solid #1a1a1a' : 'none', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nama || u.email}</div>
                {u.nama && <div style={{ fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
              </div>
              <div style={{ minWidth: 0, fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                {u.workspaces[0]?.name || <span style={{ color: '#475569' }}>—</span>}
              </div>
              <div style={{ paddingLeft: 12 }}><PlanBadge plan={u.plan} /></div>
              <div style={{ fontSize: '0.7rem', color: '#475569', paddingLeft: 12, whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</div>
              <div style={{ display: 'flex', gap: 6, paddingLeft: 12 }}>
                <button onClick={() => openUserAction(u, 'plan')} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '4px 8px', color: '#A78BFA', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}>Plan</button>
                <button onClick={() => openUserAction(u, 'password')} style={{ background: 'rgba(71,85,105,0.15)', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 8px', color: '#64748b', fontSize: '0.68rem', cursor: 'pointer' }}>PW</button>
              </div>
            </div>
          ))}
          <div style={{ padding: '8px 16px', borderTop: '1px solid #1a1a1a', fontSize: '0.72rem', color: '#475569' }}>{filteredUsers.length} dari {users.length} user</div>
        </div>
      )}

      {/* Workspaces Tab */}
      {tab === 'workspaces' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredWs.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#475569', fontSize: '0.85rem', background: '#111', border: '1px solid #1f1f1f', borderRadius: 12 }}>Tidak ada workspace</div>}
          {filteredWs.map(ws => (
            <div key={ws.id} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{ws.name}</span>
                    <PlanBadge plan={ws.plan} />
                    {ws.modes.map(m => (
                      <span key={m} style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 8, background: m === 'affiliate' ? 'rgba(52,211,153,0.1)' : 'rgba(167,139,250,0.1)', color: m === 'affiliate' ? '#34d399' : '#A78BFA', fontWeight: 600 }}>{m}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Owner: {ws.owner_email} · {ws.member_count} member{ws.pending_invites > 0 ? ` · ${ws.pending_invites} pending invite` : ''} · Dibuat {fmtDate(ws.created_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openWsPlan(ws)} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 7, padding: '5px 10px', color: '#A78BFA', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>Ubah Plan</button>
                  <button onClick={() => setExpandedWs(expandedWs === ws.id ? null : ws.id)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, padding: '5px 10px', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer' }}>
                    {expandedWs === ws.id ? 'Tutup' : 'Lihat Tim'}
                  </button>
                </div>
              </div>
              {expandedWs === ws.id && (
                <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 18px', background: '#0d0d0d' }}>
                  <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Anggota Tim</div>
                  {ws.members.map(m => (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.role === 'owner' ? 'linear-gradient(135deg,#7C3AED,#A78BFA)' : '#1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0', flexShrink: 0 }}>
                        {(m.nama || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{m.nama || m.email}</div>
                        {m.nama && <div style={{ fontSize: '0.68rem', color: '#475569' }}>{m.email}</div>}
                      </div>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 8, background: m.role === 'owner' ? 'rgba(124,58,237,0.15)' : 'rgba(71,85,105,0.2)', color: m.role === 'owner' ? '#A78BFA' : '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                      <span style={{ fontSize: '0.65rem', color: '#475569' }}>Bergabung {fmtDate(m.joined_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {(actionUser || actionWs) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 400, padding: '24px' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem', marginBottom: 4 }}>
              {actionType === 'password' ? 'Reset Password' : 'Ubah Plan'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 20 }}>
              {actionWs ? actionWs.name : actionUser?.email}
            </div>

            {actionType !== 'password' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>Plan Baru</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                  {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            )}

            {actionType === 'password' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>Password Baru</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter" style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            {msg && <div style={{ marginBottom: 12, fontSize: '0.82rem', color: msg.startsWith('Error') ? '#f87171' : '#86efac' }}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeAction} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 9, padding: '9px 18px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#5B21B6' : 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none', borderRadius: 9, padding: '9px 20px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
