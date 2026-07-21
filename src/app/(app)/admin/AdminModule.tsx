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

type Stats = {
  total: number
  today: number
  week: number
  month: number
  byPlan: { free: number; solo: number; pro: number; team: number }
  totalWorkspaces: number
}

const PLANS = ['free', 'solo', 'pro', 'team']
const PLAN_COLORS: Record<string, string> = {
  free: '#475569', solo: '#7C3AED', pro: '#A78BFA', team: '#34d399'
}

function planBadge(plan: string) {
  const color = PLAN_COLORS[plan] || '#475569'
  return (
    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: color + '20', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {plan || 'free'}
    </span>
  )
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function AdminModule({ users, stats }: { users: UserRow[]; stats: Stats }) {
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [actionUser, setActionUser] = useState<UserRow | null>(null)
  const [actionType, setActionType] = useState<'plan' | 'password' | null>(null)
  const [newPlan, setNewPlan] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.includes(search.toLowerCase()) || u.nama.toLowerCase().includes(search.toLowerCase())
    const matchPlan = !filterPlan || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  function openAction(user: UserRow, type: 'plan' | 'password') {
    setActionUser(user)
    setActionType(type)
    setNewPlan(user.plan || 'free')
    setNewPassword('')
    setMsg('')
  }
  function closeAction() { setActionUser(null); setActionType(null) }

  async function handleSave() {
    if (!actionUser) return
    setSaving(true); setMsg('')
    const body = actionType === 'plan'
      ? { action: 'plan', userId: actionUser.id, plan: newPlan, workspaceId: actionUser.workspaces[0]?.id }
      : { action: 'password', userId: actionUser.id, password: newPassword }
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setMsg('Error: ' + (data.error || 'Gagal')); return }
    setMsg(actionType === 'plan' ? 'Plan diperbarui!' : 'Password direset!')
    setTimeout(() => { closeAction(); window.location.reload() }, 1000)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Super Admin</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Platform management — hanya visible untuk admin</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total User', value: stats.total, color: '#A78BFA' },
          { label: 'Daftar Hari Ini', value: stats.today, color: '#86efac' },
          { label: '7 Hari Ini', value: stats.week, color: '#86efac' },
          { label: '30 Hari Ini', value: stats.month, color: '#93c5fd' },
          { label: 'Workspace', value: stats.totalWorkspaces, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>User per Plan</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {Object.entries(stats.byPlan).map(([plan, count]) => (
            <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {planBadge(plan)}
              <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Cari email atau nama..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['', ...PLANS].map(p => (
            <button key={p} onClick={() => setFilterPlan(p)}
              style={{ padding: '6px 12px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, border: filterPlan === p ? `1px solid ${PLAN_COLORS[p] || '#7C3AED'}` : '1px solid #2a2a2a', background: filterPlan === p ? (PLAN_COLORS[p] || '#7C3AED') + '20' : '#1a1a1a', color: filterPlan === p ? (PLAN_COLORS[p] || '#A78BFA') : '#64748b', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {p || 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 0, padding: '10px 16px', borderBottom: '1px solid #1f1f1f', fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <div>User</div>
          <div>Workspace</div>
          <div>Plan</div>
          <div>Daftar</div>
          <div>Aksi</div>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>Tidak ada user ditemukan</div>
        )}
        {filtered.map((u, i) => (
          <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 0, padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #1a1a1a' : 'none', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nama || u.email}</div>
              <div style={{ fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              {u.workspaces.length > 0
                ? <div style={{ fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.workspaces[0].name}</div>
                : <span style={{ fontSize: '0.72rem', color: '#475569' }}>—</span>
              }
            </div>
            <div style={{ paddingLeft: 12 }}>{planBadge(u.plan)}</div>
            <div style={{ fontSize: '0.72rem', color: '#475569', paddingLeft: 12, whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</div>
            <div style={{ display: 'flex', gap: 6, paddingLeft: 12 }}>
              <button onClick={() => openAction(u, 'plan')} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '4px 8px', color: '#A78BFA', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}>Plan</button>
              <button onClick={() => openAction(u, 'password')} style={{ background: 'rgba(71,85,105,0.2)', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 8px', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer' }}>Reset PW</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#475569' }}>Menampilkan {filtered.length} dari {users.length} user</div>

      {/* Action Modal */}
      {actionUser && actionType && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, width: '100%', maxWidth: 400, padding: '24px' }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem', marginBottom: 4 }}>
              {actionType === 'plan' ? 'Ubah Plan' : 'Reset Password'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 20 }}>{actionUser.email}</div>

            {actionType === 'plan' && (
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
