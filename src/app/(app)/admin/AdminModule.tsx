'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  byPlan: { free: number; lifetime: number }
  totalWorkspaces: number
  revenue: number
  paidUserCount: number
}

type SuperAdminRow = {
  email: string
  added_by: string
  created_at: string
}

const PLANS = ['free', 'lifetime']
const PLAN_COLORS: Record<string, string> = { free: '#6b7280', lifetime: '#059669' }

function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] || '#6b7280'
  return <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: color + '20', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{plan || 'free'}</span>
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function AdminModule({ users, workspaces, stats, isGodAdmin, superAdmins, godAdminEmail }: { users: UserRow[]; workspaces: WorkspaceRow[]; stats: Stats; isGodAdmin: boolean; superAdmins: SuperAdminRow[]; godAdminEmail: string }) {
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<'users' | 'workspaces' | 'superadmins'>('users')
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
  const [saList, setSaList] = useState<SuperAdminRow[]>(superAdmins)
  const [newSaEmail, setNewSaEmail] = useState('')
  const [saMsg, setSaMsg] = useState('')
  const [saLoading, setSaLoading] = useState(false)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [userList, setUserList] = useState<UserRow[]>(users)

  const superAdminEmailSet = new Set([godAdminEmail, ...saList.map(s => s.email)])

  const filteredUsers = userList.filter(u => {
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

  async function deleteUser(u: UserRow) {
    if (!confirm(`Hapus akun "${u.email}" beserta semua workspace-nya? Ini tidak bisa dibatalkan.`)) return
    setDeletingUser(u.id)
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteUser', userId: u.id }) })
    const data = await res.json()
    setDeletingUser(null)
    if (!res.ok) { alert('Gagal: ' + (data.error || 'Unknown error')); return }
    setUserList(prev => prev.filter(x => x.id !== u.id))
  }

  async function addSuperAdmin() {
    if (!newSaEmail.trim()) return
    setSaLoading(true); setSaMsg('')
    const res = await fetch('/api/admin/super-admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newSaEmail.trim() }) })
    const data = await res.json()
    setSaLoading(false)
    if (!res.ok) { setSaMsg('Error: ' + (data.error || 'Gagal')); return }
    setSaList(prev => [...prev, { email: newSaEmail.trim().toLowerCase(), added_by: godAdminEmail, created_at: new Date().toISOString() }])
    setNewSaEmail(''); setSaMsg('Super admin ditambahkan!')
    setTimeout(() => setSaMsg(''), 3000)
  }

  async function removeSuperAdmin(email: string) {
    if (!confirm(`Hapus ${email} dari super admin?`)) return
    setSaLoading(true); setSaMsg('')
    const res = await fetch('/api/admin/super-admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const data = await res.json()
    setSaLoading(false)
    if (!res.ok) { setSaMsg('Error: ' + (data.error || 'Gagal')); return }
    setSaList(prev => prev.filter(s => s.email !== email))
    setSaMsg('Dihapus.'); setTimeout(() => setSaMsg(''), 3000)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.3px', marginBottom: 4 }}>Super Admin</h1>
        <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>Platform management — hanya visible untuk kamu</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'Total User', value: stats.total, color: '#1a73e8' },
          { label: 'Hari Ini', value: stats.today, color: '#059669' },
          { label: '7 Hari', value: stats.week, color: '#059669' },
          { label: '30 Hari', value: stats.month, color: '#1a73e8' },
          { label: 'Workspace', value: stats.totalWorkspaces, color: '#d97706' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, boxShadow: '0 4px 16px rgba(5,150,105,0.25)' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Estimasi Revenue</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
            Rp{stats.revenue.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>berdasarkan plan/user · exclude super admin</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>User Berbayar</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{stats.paidUserCount} user</div>
        </div>
      </div>

      {/* Plan breakdown */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per Plan</span>
        {Object.entries(stats.byPlan).map(([plan, count]) => (
          <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PlanBadge plan={plan} />
            <span style={{ fontWeight: 700, color: '#111827' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5eaf2' }}>
        {([['users', 'Users'], ['workspaces', 'Workspaces']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '9px 16px', background: 'transparent', border: 'none', borderBottom: tab === id ? '2px solid #f87171' : '2px solid transparent', color: tab === id ? '#dc2626' : '#6b7280', fontSize: '0.875rem', fontWeight: tab === id ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
            {label} <span style={{ fontSize: '0.72rem', color: '#6b7280', marginLeft: 4 }}>{id === 'users' ? users.length : workspaces.length}</span>
          </button>
        ))}
        {isGodAdmin && (
          <button onClick={() => setTab('superadmins')}
            style={{ padding: '9px 16px', background: 'transparent', border: 'none', borderBottom: tab === 'superadmins' ? '2px solid #7c3aed' : '2px solid transparent', color: tab === 'superadmins' ? '#7c3aed' : '#6b7280', fontSize: '0.875rem', fontWeight: tab === 'superadmins' ? 600 : 400, cursor: 'pointer', marginBottom: -1 }}>
            Super Admin <span style={{ fontSize: '0.72rem', color: '#6b7280', marginLeft: 4 }}>{saList.length}</span>
          </button>
        )}
      </div>

      {/* Search + filter */}
      {tab !== 'superadmins' && <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input placeholder={tab === 'users' ? 'Cari email atau nama...' : 'Cari workspace atau owner...'}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#111827', fontSize: '0.85rem', outline: 'none' }} />
        {tab === 'users' && (
          <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 6 }}>
            {['', ...PLANS].map(p => (
              <button key={p} onClick={() => setFilterPlan(p)}
                style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 7, fontSize: '0.72rem', fontWeight: 600, border: filterPlan === p ? `1px solid ${PLAN_COLORS[p] || '#dc2626'}` : '1px solid #e5e7eb', background: filterPlan === p ? (PLAN_COLORS[p] || '#dc2626') + '20' : '#f1f5f9', color: filterPlan === p ? (PLAN_COLORS[p] || '#dc2626') : '#6b7280', cursor: 'pointer', textTransform: 'uppercase' }}>
                {p || 'All'}
              </button>
            ))}
          </div>
        )}
      </div>}

      {/* Users Tab */}
      {tab === 'users' && (
        <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, overflow: 'hidden' }}>
          {filteredUsers.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>Tidak ada user</div>}

          {isMobile ? (
            /* Mobile: card layout per user */
            filteredUsers.map((u, i) => (
              <div key={u.id} style={{ padding: '14px 16px', borderBottom: i < filteredUsers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nama || u.email}</div>
                    {u.nama && <div style={{ fontSize: '0.72rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openUserAction(u, 'plan')} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.3)', borderRadius: 6, padding: '5px 10px', color: '#1a73e8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>Plan</button>
                    <button onClick={() => openUserAction(u, 'password')} style={{ background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 6, padding: '5px 10px', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>PW</button>
                    {isGodAdmin && !superAdminEmailSet.has(u.email) && (
                      <button onClick={() => deleteUser(u)} disabled={deletingUser === u.id} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '5px 8px', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                        {deletingUser === u.id ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {u.workspaces[0]?.name && <span style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 500 }}>{u.workspaces[0].name}</span>}
                  {u.workspaces[0]?.role && (
                    <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase',
                      background: u.workspaces[0].role === 'owner' ? 'rgba(251,191,36,0.15)' : 'rgba(107,114,128,0.1)',
                      color: u.workspaces[0].role === 'owner' ? '#b45309' : '#6b7280',
                    }}>
                      {u.workspaces[0].role === 'owner' ? '👑' : u.workspaces[0].role}
                    </span>
                  )}
                  <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>·</span>
                  <PlanBadge plan={u.plan} />
                  <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>·</span>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{fmtDate(u.created_at)}</span>
                </div>
                {u.workspaces[0]?.role && u.workspaces[0].role !== 'owner' && (() => {
                  const ownerEmail = workspaces.find(w => w.id === u.workspaces[0].id)?.owner_email
                  return ownerEmail ? <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: 2 }}>induk: {ownerEmail}</div> : null
                })()}
              </div>
            ))
          ) : (
            /* Desktop: table grid */
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', padding: '10px 16px', borderBottom: '1px solid #e5eaf2', fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <div>User</div><div>Workspace</div><div>Plan</div><div>Daftar</div><div>Aksi</div>
              </div>
              {filteredUsers.map((u, i) => (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', padding: '11px 16px', borderBottom: i < filteredUsers.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nama || u.email}</div>
                    {u.nama && <div style={{ fontSize: '0.7rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
                  </div>
                  <div style={{ minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.workspaces[0]?.name || '—'}
                      </span>
                      {u.workspaces[0]?.role && (
                        <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', flexShrink: 0,
                          background: u.workspaces[0].role === 'owner' ? 'rgba(251,191,36,0.15)' : u.workspaces[0].role === 'admin' ? 'rgba(99,102,241,0.12)' : 'rgba(107,114,128,0.1)',
                          color: u.workspaces[0].role === 'owner' ? '#b45309' : u.workspaces[0].role === 'admin' ? '#4f46e5' : '#6b7280',
                        }}>
                          {u.workspaces[0].role === 'owner' ? '👑 Owner' : u.workspaces[0].role}
                        </span>
                      )}
                    </div>
                    {u.workspaces[0]?.role && u.workspaces[0].role !== 'owner' && (() => {
                      const ownerEmail = workspaces.find(w => w.id === u.workspaces[0].id)?.owner_email
                      return ownerEmail ? <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: 1 }}>induk: {ownerEmail}</div> : null
                    })()}
                    {u.workspaces.length > 1 && (
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: 1 }}>+{u.workspaces.length - 1} workspace lain</div>
                    )}
                  </div>
                  <div style={{ paddingLeft: 12 }}><PlanBadge plan={u.plan} /></div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', paddingLeft: 12, whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</div>
                  <div style={{ display: 'flex', gap: 6, paddingLeft: 12 }}>
                    <button onClick={() => openUserAction(u, 'plan')} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.3)', borderRadius: 6, padding: '4px 8px', color: '#1a73e8', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}>Plan</button>
                    <button onClick={() => openUserAction(u, 'password')} style={{ background: 'rgba(71,85,105,0.15)', border: '1px solid #e5eaf2', borderRadius: 6, padding: '4px 8px', color: '#6b7280', fontSize: '0.68rem', cursor: 'pointer' }}>PW</button>
                    {isGodAdmin && !superAdminEmailSet.has(u.email) && (
                      <button onClick={() => deleteUser(u)} disabled={deletingUser === u.id} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 8px', color: '#dc2626', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}>
                        {deletingUser === u.id ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          <div style={{ padding: '8px 16px', borderTop: '1px solid #f3f4f6', fontSize: '0.72rem', color: '#6b7280' }}>{filteredUsers.length} dari {userList.length} user</div>
        </div>
      )}

      {/* Workspaces Tab */}
      {tab === 'workspaces' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredWs.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20 }}>Tidak ada workspace</div>}
          {filteredWs.map(ws => (
            <div key={ws.id} style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{ws.name}</span>
                      <PlanBadge plan={ws.plan} />
                      {ws.modes.map(m => (
                        <span key={m} style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 8, background: m === 'affiliate' ? 'rgba(52,211,153,0.1)' : 'rgba(66,165,245,0.1)', color: m === 'affiliate' ? '#059669' : '#1a73e8', fontWeight: 600 }}>{m}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Owner: {ws.owner_email}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{ws.member_count} member{ws.pending_invites > 0 ? ` · ${ws.pending_invites} pending` : ''} · {fmtDate(ws.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: isMobile ? 'column' : 'row' }}>
                    <button onClick={() => openWsPlan(ws)} style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.3)', borderRadius: 7, padding: '5px 10px', color: '#1a73e8', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Ubah Plan</button>
                    <button onClick={() => setExpandedWs(expandedWs === ws.id ? null : ws.id)} style={{ background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 7, padding: '5px 10px', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {expandedWs === ws.id ? 'Tutup' : 'Lihat Tim'}
                    </button>
                  </div>
                </div>
              </div>
              {expandedWs === ws.id && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 18px', background: '#fff' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Anggota Tim</div>
                  {ws.members.map(m => (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.role === 'owner' ? '#1a73e8' : '#e5eaf2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#111827', flexShrink: 0 }}>
                        {(m.nama || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', color: '#111827', fontWeight: 500 }}>{m.nama || m.email}</div>
                        {m.nama && <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{m.email}</div>}
                      </div>
                      <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 8, background: m.role === 'owner' ? 'rgba(26,115,232,0.10)' : 'rgba(71,85,105,0.2)', color: m.role === 'owner' ? '#1a73e8' : '#6b7280', fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                      <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>Bergabung {fmtDate(m.joined_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Super Admin Tab */}
      {tab === 'superadmins' && isGodAdmin && (
        <div>
          {/* God Admin card */}
          <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: '0 4px 20px rgba(124,58,237,0.25)' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>God Admin (Hardcoded)</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{godAdminEmail}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Akses penuh. Tidak bisa dihapus.</div>
          </div>

          {/* Add new super admin */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111827', marginBottom: 12 }}>Tambah Super Admin</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={newSaEmail} onChange={e => setNewSaEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSuperAdmin()}
                placeholder="email@contoh.com"
                style={{ flex: 1, background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 10, padding: '9px 14px', color: '#111827', fontSize: '0.85rem', outline: 'none' }} />
              <button onClick={addSuperAdmin} disabled={saLoading || !newSaEmail.trim()}
                style={{ background: '#7c3aed', border: 'none', borderRadius: 10, padding: '9px 18px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: saLoading ? 'not-allowed' : 'pointer', opacity: !newSaEmail.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                {saLoading ? '...' : 'Tambah'}
              </button>
            </div>
            {saMsg && <div style={{ marginTop: 10, fontSize: '0.8rem', color: saMsg.startsWith('Error') ? '#dc2626' : '#059669' }}>{saMsg}</div>}
          </div>

          {/* Super admin list */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.05)' }}>
            {saList.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>Belum ada super admin lain</div>
            )}
            {saList.map((sa, i) => (
              <div key={sa.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < saList.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', flexShrink: 0 }}>
                  {sa.email.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#111827' }}>{sa.email}</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>Ditambahkan oleh {sa.added_by} · {fmtDate(sa.created_at)}</div>
                </div>
                <button onClick={() => removeSuperAdmin(sa.email)} disabled={saLoading}
                  style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '5px 12px', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {(actionUser || actionWs) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.05)', borderRadius: 20, width: '100%', maxWidth: 400, padding: '24px' }}>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem', marginBottom: 4 }}>
              {actionType === 'password' ? 'Reset Password' : 'Ubah Plan'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 20 }}>
              {actionWs ? actionWs.name : actionUser?.email}
            </div>

            {actionType !== 'password' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>Plan Baru</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                  style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}>
                  {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            )}

            {actionType === 'password' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>Password Baru</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter" style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 14px', color: '#111827', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            {msg && <div style={{ marginBottom: 12, fontSize: '0.82rem', color: msg.startsWith('Error') ? '#dc2626' : '#059669' }}>{msg}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeAction} style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 9, padding: '9px 18px', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave} disabled={saving} style={{ background: saving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 9, padding: '9px 20px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
