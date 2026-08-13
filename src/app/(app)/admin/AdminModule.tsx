'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { DEFAULT_PRICING, type PricingConfig, type PricingTier } from '@/lib/pricing'

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

type TxRow = {
  id: string
  external_id: string
  workspace_id: string
  user_email: string
  tier: string
  amount_original: number
  amount_paid: number
  coupon_code: string | null
  discount_amount: number
  status: string
  paid_at: string | null
  created_at: string
}

type CouponRow = {
  id: string
  code: string
  type: string
  value: number
  max_uses: number | null
  used_count: number
  applicable_tiers: string[] | null
  is_active: boolean
  expires_at: string | null
  created_at: string
  created_by: string
}

type NewCoupon = {
  code: string
  type: string
  value: string
  maxUses: string
  tiers: string[]
  expiresAt: string
}

const PLANS = ['free', 'monthly', 'lifetime']
const PLAN_COLORS: Record<string, string> = { free: '#6b7280', monthly: '#1a73e8', lifetime: '#059669' }

function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] || '#6b7280'
  return <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: color + '20', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{plan || 'free'}</span>
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtPrice(n: number) {
  return 'Rp' + n.toLocaleString('id-ID')
}

const TX_STATUS_COLORS: Record<string, string> = { paid: '#059669', pending: '#d97706', failed: '#dc2626' }
const TIER_NAMES: Record<string, string> = { bulanan: 'Bulanan', basic: 'Basic', pro: 'Pro', agency: 'Agency', addon: 'Add-on', starter: 'Starter (lama)' }

function BarChart({ data, color = '#1a73e8', height = 56 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const n = data.length
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${n * 5} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {data.map((v, i) => {
        const barH = Math.max(1, (v / max) * (height - 6))
        return <rect key={i} x={i * 5 + 0.5} y={height - barH - 3} width={4} height={barH} fill={color} rx="0.8" opacity={0.85} />
      })}
    </svg>
  )
}

export default function AdminModule({ users, workspaces, stats, isGodAdmin, superAdmins, godAdminEmail, savedPricing }: { users: UserRow[]; workspaces: WorkspaceRow[]; stats: Stats; isGodAdmin: boolean; superAdmins: SuperAdminRow[]; godAdminEmail: string; savedPricing: PricingConfig }) {
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<'dashboard' | 'users' | 'workspaces' | 'transaksi' | 'kupon' | 'pricing' | 'superadmins' | 'akses' | 'promo'>('dashboard')
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(savedPricing)
  const [pricingSaving, setPricingSaving] = useState(false)
  const [pricingMsg, setPricingMsg] = useState('')

  // Transactions
  const [txList, setTxList] = useState<TxRow[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txDays, setTxDays] = useState(30)
  const [txStatusFilter, setTxStatusFilter] = useState('')

  // Coupons
  const [couponList, setCouponList] = useState<CouponRow[]>([])
  const [couponLoading, setCouponLoading] = useState(false)
  const [newCoupon, setNewCoupon] = useState<NewCoupon>({ code: '', type: 'percent', value: '', maxUses: '', tiers: [], expiresAt: '' })
  const [couponMsg, setCouponMsg] = useState('')
  const [couponSaving, setCouponSaving] = useState(false)

  // Dashboard chart data (compute from users + tx)
  const [dashTx, setDashTx] = useState<TxRow[]>([])

  // Fetch transactions (used by both Transaksi tab and Dashboard)
  async function fetchTx(days = 90) {
    setTxLoading(true)
    const res = await fetch(`/api/admin/transactions?days=${days}&status=${txStatusFilter}`)
    const data = await res.json()
    setTxLoading(false)
    if (res.ok) setTxList(data.transactions || [])
  }

  async function fetchCoupons() {
    setCouponLoading(true)
    const res = await fetch('/api/admin/coupons')
    const data = await res.json()
    setCouponLoading(false)
    if (res.ok) setCouponList(data.coupons || [])
  }

  async function fetchDashTx() {
    const res = await fetch('/api/admin/transactions?days=90')
    const data = await res.json()
    if (res.ok) setDashTx(data.transactions || [])
  }

  useEffect(() => {
    if (tab === 'transaksi') fetchTx(txDays)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, txDays, txStatusFilter])

  useEffect(() => {
    if (tab === 'kupon') fetchCoupons()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (tab === 'dashboard') fetchDashTx()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (tab === 'akses') fetchAccess(accessSearch)
    if (tab === 'promo') fetchPromo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function createCoupon() {
    if (!newCoupon.code || !newCoupon.value) { setCouponMsg('Code dan value wajib diisi'); return }
    setCouponSaving(true); setCouponMsg('')
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCoupon, applicableTiers: newCoupon.tiers }),
    })
    const data = await res.json()
    setCouponSaving(false)
    if (!res.ok) { setCouponMsg('Error: ' + (data.error || 'Gagal')); return }
    setCouponList(prev => [data.coupon, ...prev])
    setNewCoupon({ code: '', type: 'percent', value: '', maxUses: '', tiers: [], expiresAt: '' })
    setCouponMsg('Kupon berhasil dibuat!')
    setTimeout(() => setCouponMsg(''), 3000)
  }

  async function toggleCoupon(id: string, isActive: boolean) {
    await fetch('/api/admin/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: isActive }) })
    setCouponList(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c))
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Hapus kupon ini?')) return
    await fetch('/api/admin/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCouponList(prev => prev.filter(c => c.id !== id))
  }

  // Dashboard computations
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
  const signupsByDay = last30Days.map(d => users.filter(u => u.created_at.startsWith(d)).length)
  const revByDay = last30Days.map(d => dashTx.filter(t => t.status === 'paid' && t.paid_at?.startsWith(d)).reduce((s, t) => s + (t.amount_paid || 0), 0))
  const totalRevenue = dashTx.filter(t => t.status === 'paid').reduce((s, t) => s + (t.amount_paid || 0), 0)
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const revenueThisMonth = dashTx.filter(t => t.status === 'paid' && t.paid_at && new Date(t.paid_at) >= monthStart).reduce((s, t) => s + (t.amount_paid || 0), 0)
  const paidTxCount = dashTx.filter(t => t.status === 'paid').length
  const convRate = stats.total > 0 ? ((stats.paidUserCount / stats.total) * 100).toFixed(1) : '0'
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

  // Akses tab state
  type AccessUser = { user_id: string; email: string; name: string; expires_at: string | null; created_at: string; plan: string; max_members: number; max_workspaces: number; is_active: boolean }
  const [accessList, setAccessList] = useState<AccessUser[]>([])
  const [accessLoading, setAccessLoading] = useState(false)
  const [accessSearch, setAccessSearch] = useState('')
  const [grantEmail, setGrantEmail] = useState('')
  const [grantName, setGrantName] = useState('')
  const [grantPlan, setGrantPlan] = useState('basic')
  const [grantSendEmail, setGrantSendEmail] = useState(true)
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantMsg, setGrantMsg] = useState('')

  async function fetchAccess(q = '') {
    setAccessLoading(true)
    const res = await fetch(`/api/admin/access${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    const data = await res.json()
    setAccessLoading(false)
    if (res.ok) setAccessList(data.users || [])
  }

  async function grantAccess() {
    if (!grantEmail.trim()) { setGrantMsg('Email wajib diisi'); return }
    setGrantLoading(true); setGrantMsg('')
    const res = await fetch('/api/admin/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: grantEmail.trim(), name: grantName.trim(), plan: grantPlan, sendEmail: grantSendEmail }),
    })
    const data = await res.json()
    setGrantLoading(false)
    if (!res.ok) { setGrantMsg('Error: ' + (data.error || 'Gagal')); return }
    setGrantMsg(data.is_new
      ? `Akun baru dibuat untuk ${grantEmail}. ${data.email_sent ? 'Magic link terkirim!' : 'Email tidak dikirim.'}`
      : `Akses diperbarui untuk ${grantEmail}. ${data.email_sent ? 'Magic link terkirim!' : ''}`
    )
    setGrantEmail(''); setGrantName('')
    setTimeout(() => setGrantMsg(''), 6000)
    fetchAccess(accessSearch)
  }

  async function revokeAccess(userId: string, email: string) {
    if (!confirm(`Cabut akses KreaFlow dari ${email}?`)) return
    await fetch('/api/admin/access', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
    setAccessList(prev => prev.filter(u => u.user_id !== userId))
  }

  async function extendAccess(userId: string) {
    const exp = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()
    await fetch('/api/admin/access', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, expires_at: exp }) })
    setAccessList(prev => prev.map(u => u.user_id === userId ? { ...u, expires_at: exp, is_active: true } : u))
  }

  async function makeLifetime(userId: string) {
    await fetch('/api/admin/access', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, expires_at: null }) })
    setAccessList(prev => prev.map(u => u.user_id === userId ? { ...u, expires_at: null, is_active: true } : u))
  }

  // Promo Link tab state
  type PromoLink = { id: string; token: string; label: string; plan: string; max_uses: number | null; claimed_emails: string[]; active: boolean; starts_at: string | null; expires_at: string | null; created_at: string }
  const [promoList, setPromoList] = useState<PromoLink[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMsg, setPromoMsg] = useState('')
  const [newPromo, setNewPromo] = useState({ token: '', label: '', plan: 'basic', max_uses: '', starts_at: '', expires_at: '' })
  const [promoSaving, setPromoSaving] = useState(false)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kreaflow.id'

  async function fetchPromo() {
    setPromoLoading(true)
    const res = await fetch('/api/admin/promo')
    const data = await res.json()
    setPromoLoading(false)
    if (res.ok) setPromoList(data.links || [])
  }

  async function createPromo() {
    setPromoSaving(true); setPromoMsg('')
    const res = await fetch('/api/admin/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: newPromo.token, label: newPromo.label, plan: newPromo.plan, max_uses: newPromo.max_uses || null, starts_at: newPromo.starts_at || null, expires_at: newPromo.expires_at || null }),
    })
    const data = await res.json()
    setPromoSaving(false)
    if (!res.ok) { setPromoMsg('Error: ' + (data.error || 'Gagal')); return }
    setPromoMsg('Link berhasil dibuat!')
    setNewPromo({ token: '', label: '', plan: 'basic', max_uses: '', starts_at: '', expires_at: '' })
    fetchPromo()
  }

  async function togglePromo(id: string, active: boolean) {
    await fetch('/api/admin/promo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active }) })
    setPromoList(prev => prev.map(l => l.id === id ? { ...l, active } : l))
  }

  async function deletePromo(id: string, token: string) {
    if (!confirm(`Hapus promo link "${token}"?`)) return
    await fetch('/api/admin/promo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setPromoList(prev => prev.filter(l => l.id !== id))
  }

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

  function updateTierField(tierId: string, field: keyof PricingTier, value: string | number) {
    setPricingConfig(prev => ({
      ...prev,
      tiers: prev.tiers.map(t => t.id === tierId ? { ...t, [field]: value } : t),
    }))
  }

  async function savePricing() {
    setPricingSaving(true); setPricingMsg('')
    const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pricing: pricingConfig }) })
    const data = await res.json()
    setPricingSaving(false)
    if (!res.ok) { setPricingMsg('Error: ' + (data.error || 'Gagal menyimpan')); return }
    setPricingMsg('Pricing disimpan! Refresh halaman upgrade/landing untuk melihat perubahan.')
    setTimeout(() => setPricingMsg(''), 5000)
  }

  function resetPricing() {
    setPricingConfig(DEFAULT_PRICING)
    setPricingMsg('Reset ke default — klik Simpan untuk menyimpan.')
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
      <div className="kf-tabs-scroll" style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #e5eaf2', overflowX: 'auto' }}>
        {([
          ['dashboard', 'Dashboard', '#1a73e8'],
          ['users', 'Users', '#dc2626'],
          ['workspaces', 'Workspaces', '#dc2626'],
          ['transaksi', 'Transaksi', '#059669'],
          ['kupon', 'Kupon', '#d97706'],
          ['pricing', 'Pricing', '#d97706'],
          ['akses', 'Grant Akses', '#059669'],
          ['promo', 'Promo Link', '#7c3aed'],
        ] as [string, string, string][]).map(([id, label, color]) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            style={{ padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: tab === id ? `2px solid ${color}` : '2px solid transparent', color: tab === id ? color : '#6b7280', fontSize: '0.82rem', fontWeight: tab === id ? 700 : 400, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {label}
            {id === 'users' && <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginLeft: 4 }}>{users.length}</span>}
            {id === 'workspaces' && <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginLeft: 4 }}>{workspaces.length}</span>}
          </button>
        ))}
        {isGodAdmin && (
          <button onClick={() => setTab('superadmins')}
            style={{ padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: tab === 'superadmins' ? '2px solid #7c3aed' : '2px solid transparent', color: tab === 'superadmins' ? '#7c3aed' : '#6b7280', fontSize: '0.82rem', fontWeight: tab === 'superadmins' ? 700 : 400, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Super Admin
          </button>
        )}
      </div>

      {/* Search + filter */}
      {(tab === 'users' || tab === 'workspaces') && <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
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

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total Revenue', value: fmtPrice(totalRevenue), sub: 'semua waktu', color: '#059669' },
              { label: 'Revenue Bulan Ini', value: fmtPrice(revenueThisMonth), sub: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), color: '#1a73e8' },
              { label: 'Transaksi Paid', value: paidTxCount, sub: 'last 90 days', color: '#059669' },
              { label: 'Konversi', value: `${convRate}%`, sub: 'free → paid', color: '#7c3aed' },
              { label: 'Total User', value: stats.total, sub: 'terdaftar', color: '#1a73e8' },
              { label: 'User Berbayar', value: stats.paidUserCount, sub: 'lifetime aktif', color: '#059669' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: '0.62rem', color: '#9ca3af', marginTop: 4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: 2 }}>User Baru (30 hari)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a73e8' }}>{signupsByDay.reduce((a, b) => a + b, 0)}</div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>30 hari terakhir</div>
              </div>
              <BarChart data={signupsByDay} color="#1a73e8" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{last30Days[0]?.slice(5)}</span>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{last30Days[29]?.slice(5)}</span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: 2 }}>Revenue (30 hari)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{fmtPrice(revByDay.reduce((a, b) => a + b, 0))}</div>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>30 hari terakhir</div>
              </div>
              <BarChart data={revByDay} color="#059669" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{last30Days[0]?.slice(5)}</span>
                <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{last30Days[29]?.slice(5)}</span>
              </div>
            </div>
          </div>

          {/* Plan breakdown */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>Breakdown Plan</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {Object.entries(stats.byPlan).map(([plan, count]) => (
                <div key={plan} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: PLAN_COLORS[plan] || '#6b7280' }} />
                  <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, textTransform: 'capitalize' }}>{plan}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#111827' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Transaksi Terbaru</div>
              <button onClick={() => setTab('transaksi')} style={{ fontSize: '0.72rem', color: '#1a73e8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Lihat semua →</button>
            </div>
            {dashTx.slice(0, 8).map(tx => (
              <div key={tx.id} style={{ padding: '10px 18px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.user_email}</div>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{TIER_NAMES[tx.tier] || tx.tier} · {fmtDate(tx.created_at)}</div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', flexShrink: 0 }}>{fmtPrice(tx.amount_paid)}</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (TX_STATUS_COLORS[tx.status] || '#6b7280') + '20', color: TX_STATUS_COLORS[tx.status] || '#6b7280', flexShrink: 0 }}>{tx.status}</span>
              </div>
            ))}
            {!dashTx.length && <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>Belum ada transaksi</div>}
          </div>
        </div>
      )}

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
                    {!superAdminEmailSet.has(u.email) && (
                      <button onClick={() => deleteUser(u)} disabled={deletingUser === u.id} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '5px 8px', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>
                        {deletingUser === u.id ? '...' : 'Hapus'}
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
                    {!superAdminEmailSet.has(u.email) && (
                      <button onClick={() => deleteUser(u)} disabled={deletingUser === u.id} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 6, padding: '4px 8px', color: '#dc2626', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}>
                        {deletingUser === u.id ? '...' : 'Hapus'}
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

      {/* Pricing Tab */}
      {tab === 'pricing' && (
        <div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: '0.8rem', color: '#92400e' }}>
            Perubahan pricing akan langsung aktif di halaman Upgrade dan Landing page. Pastikan sudah sesuai sebelum simpan.
          </div>

          {/* Tier cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {pricingConfig.tiers.map(tier => (
              <div key={tier.id} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{tier.name}</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: tier.isMonthly ? 'rgba(26,115,232,0.1)' : 'rgba(5,150,105,0.1)', color: tier.isMonthly ? '#1a73e8' : '#059669', fontWeight: 700 }}>{tier.isMonthly ? 'BULANAN' : 'LIFETIME'}</span>
                  {tier.badge && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#1a73e8', fontWeight: 700 }}>{tier.badge}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Nama Paket</label>
                    <input
                      value={tier.name}
                      onChange={e => updateTierField(tier.id, 'name', e.target.value)}
                      style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Harga (Rp)</label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={e => updateTierField(tier.id, 'price', parseInt(e.target.value) || 0)}
                      style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Max Workspace</label>
                    <input
                      type="number"
                      value={tier.maxWorkspaces}
                      onChange={e => updateTierField(tier.id, 'maxWorkspaces', parseInt(e.target.value) || 1)}
                      style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Badge (opsional)</label>
                    <input
                      value={tier.badge || ''}
                      onChange={e => updateTierField(tier.id, 'badge', e.target.value || null as unknown as string)}
                      placeholder="misal: PALING POPULER"
                      style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Features */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Fitur (1 per baris)</label>
                  <textarea
                    value={tier.features.join('\n')}
                    onChange={e => updateTierField(tier.id, 'features', e.target.value.split('\n') as unknown as number)}
                    rows={tier.features.length + 1}
                    style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.8rem', color: '#111827', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Checkout URL */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Link Checkout</label>
                  <input
                    value={tier.checkout_url || ''}
                    onChange={e => updateTierField(tier.id, 'checkout_url', e.target.value)}
                    placeholder="https://..."
                    style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add-on prices */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', marginBottom: 14 }}>Add-on Prices</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Add-on +1 Workspace (Rp, lifetime)</label>
                <input
                  type="number"
                  value={pricingConfig.addonWs}
                  onChange={e => setPricingConfig(prev => ({ ...prev, addonWs: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 6 }}>Add-on Auto Schedule Post (Rp/bln)</label>
                <input
                  type="number"
                  value={pricingConfig.addonSchedule}
                  onChange={e => setPricingConfig(prev => ({ ...prev, addonSchedule: parseInt(e.target.value) || 0 }))}
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {pricingMsg && (
            <div style={{ marginBottom: 14, padding: '10px 16px', borderRadius: 10, background: pricingMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', color: pricingMsg.startsWith('Error') ? '#dc2626' : '#059669', fontSize: '0.82rem', fontWeight: 500 }}>
              {pricingMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={savePricing} disabled={pricingSaving}
              style={{ background: pricingSaving ? '#1565c0' : '#1a73e8', border: 'none', borderRadius: 10, padding: '11px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: pricingSaving ? 'not-allowed' : 'pointer' }}>
              {pricingSaving ? 'Menyimpan...' : 'Simpan Pricing'}
            </button>
            <button onClick={resetPricing}
              style={{ background: 'transparent', border: '1px solid #e5eaf2', borderRadius: 10, padding: '11px 20px', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer' }}>
              Reset ke Default
            </button>
          </div>
        </div>
      )}

      {/* Transaksi Tab */}
      {tab === 'transaksi' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[30, 60, 90].map(d => (
              <button key={d} onClick={() => setTxDays(d)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: txDays === d ? '1px solid #1a73e8' : '1px solid #e5eaf2', background: txDays === d ? '#eff6ff' : '#f8fafc', color: txDays === d ? '#1a73e8' : '#6b7280', cursor: 'pointer' }}>
                {d} hari
              </button>
            ))}
            {['', 'paid', 'pending', 'failed'].map(s => (
              <button key={s} onClick={() => setTxStatusFilter(s)}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: txStatusFilter === s ? `1px solid ${TX_STATUS_COLORS[s] || '#1a73e8'}` : '1px solid #e5eaf2', background: txStatusFilter === s ? (TX_STATUS_COLORS[s] || '#1a73e8') + '15' : '#f8fafc', color: txStatusFilter === s ? (TX_STATUS_COLORS[s] || '#1a73e8') : '#6b7280', cursor: 'pointer', textTransform: 'capitalize' }}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {/* Summary */}
          {!txLoading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Paid', value: fmtPrice(txList.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount_paid, 0)), color: '#059669' },
                { label: 'Paid', value: txList.filter(t => t.status === 'paid').length, color: '#059669' },
                { label: 'Pending', value: txList.filter(t => t.status === 'pending').length, color: '#d97706' },
                { label: 'Failed', value: txList.filter(t => t.status === 'failed').length, color: '#dc2626' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minWidth: 100 }}>
                  <div style={{ fontSize: '0.62rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {txLoading && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Memuat...</div>}
            {!txLoading && !txList.length && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Tidak ada transaksi</div>}
            {!txLoading && txList.length > 0 && (
              <>
                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto auto', padding: '10px 16px', borderBottom: '1px solid #e5eaf2', fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div>User</div><div>Paket</div><div>Amount</div><div>Kupon</div><div>Status</div><div>Tanggal</div>
                  </div>
                )}
                {txList.map((tx, i) => (
                  <div key={tx.id} style={{
                    display: isMobile ? 'block' : 'grid',
                    gridTemplateColumns: '1fr 1fr auto auto auto auto',
                    padding: '11px 16px',
                    borderBottom: i < txList.length - 1 ? '1px solid #f3f4f6' : 'none',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    {isMobile ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#111827' }}>{tx.user_email}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: TX_STATUS_COLORS[tx.status] || '#6b7280', padding: '1px 7px', borderRadius: 20, background: (TX_STATUS_COLORS[tx.status] || '#6b7280') + '20' }}>{tx.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: '#9ca3af' }}>
                          <span>{TIER_NAMES[tx.tier] || tx.tier}</span>·
                          <span style={{ fontWeight: 700, color: '#111827' }}>{fmtPrice(tx.amount_paid)}</span>
                          {tx.discount_amount > 0 && <span style={{ color: '#059669' }}>-{fmtPrice(tx.discount_amount)}</span>}
                          {tx.coupon_code && <span style={{ color: '#d97706' }}>{tx.coupon_code}</span>}·
                          <span>{fmtDate(tx.created_at)}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.78rem', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.user_email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{TIER_NAMES[tx.tier] || tx.tier}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                          {fmtPrice(tx.amount_paid)}
                          {tx.discount_amount > 0 && <span style={{ fontSize: '0.65rem', color: '#059669', marginLeft: 4 }}>(-{fmtPrice(tx.discount_amount)})</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>{tx.coupon_code || '—'}</div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: (TX_STATUS_COLORS[tx.status] || '#6b7280') + '20', color: TX_STATUS_COLORS[tx.status] || '#6b7280', whiteSpace: 'nowrap' }}>{tx.status}</span>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDate(tx.paid_at || tx.created_at)}</div>
                      </>
                    )}
                  </div>
                ))}
                <div style={{ padding: '8px 16px', borderTop: '1px solid #f3f4f6', fontSize: '0.7rem', color: '#9ca3af' }}>{txList.length} transaksi</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Kupon Tab */}
      {tab === 'kupon' && (
        <div>
          {/* Create coupon form */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: 14 }}>Buat Kupon Baru</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Kode Kupon</label>
                <input value={newCoupon.code} onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="LAUNCH50"
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box', fontWeight: 700, letterSpacing: '0.05em' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Tipe Diskon</label>
                <select value={newCoupon.type} onChange={e => setNewCoupon(p => ({ ...p, type: e.target.value }))}
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="percent">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>
                  {newCoupon.type === 'percent' ? 'Besar Diskon (%)' : 'Besar Diskon (Rp)'}
                </label>
                <input type="number" value={newCoupon.value} onChange={e => setNewCoupon(p => ({ ...p, value: e.target.value }))}
                  placeholder={newCoupon.type === 'percent' ? '20' : '50000'}
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Maks Penggunaan (kosong = ∞)</label>
                <input type="number" value={newCoupon.maxUses} onChange={e => setNewCoupon(p => ({ ...p, maxUses: e.target.value }))}
                  placeholder="100"
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Expire Date (kosong = tidak expired)</label>
                <input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon(p => ({ ...p, expiresAt: e.target.value }))}
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Berlaku untuk (kosong = semua)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['bulanan', 'basic', 'pro', 'agency'].map(t => (
                    <button key={t} onClick={() => setNewCoupon(p => ({ ...p, tiers: p.tiers.includes(t) ? p.tiers.filter(x => x !== t) : [...p.tiers, t] }))}
                      style={{ padding: '4px 10px', borderRadius: 7, fontSize: '0.7rem', fontWeight: 600, border: newCoupon.tiers.includes(t) ? '1px solid #1a73e8' : '1px solid #e5eaf2', background: newCoupon.tiers.includes(t) ? '#eff6ff' : '#f8fafc', color: newCoupon.tiers.includes(t) ? '#1a73e8' : '#6b7280', cursor: 'pointer', textTransform: 'capitalize' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {couponMsg && <div style={{ marginBottom: 10, fontSize: '0.8rem', color: couponMsg.startsWith('Error') ? '#dc2626' : '#059669' }}>{couponMsg}</div>}
            <button onClick={createCoupon} disabled={couponSaving}
              style={{ background: couponSaving ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: couponSaving ? 'not-allowed' : 'pointer' }}>
              {couponSaving ? 'Menyimpan...' : 'Buat Kupon'}
            </button>
          </div>

          {/* Coupon list */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {couponLoading && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Memuat...</div>}
            {!couponLoading && !couponList.length && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Belum ada kupon</div>}
            {couponList.map((cp, i) => (
              <div key={cp.id} style={{ padding: '14px 18px', borderBottom: i < couponList.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem', letterSpacing: '0.05em' }}>{cp.code}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: cp.type === 'percent' ? '#eff6ff' : '#fef3c7',
                      color: cp.type === 'percent' ? '#1a73e8' : '#d97706' }}>
                      {cp.type === 'percent' ? `${cp.value}% OFF` : `-${fmtPrice(cp.value)}`}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: cp.is_active ? '#f0fdf4' : '#f9fafb',
                      color: cp.is_active ? '#059669' : '#9ca3af' }}>
                      {cp.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span>Pakai: {cp.used_count}{cp.max_uses ? `/${cp.max_uses}` : ' (∞)'}</span>
                    {cp.expires_at && <span>Exp: {fmtDate(cp.expires_at)}</span>}
                    {cp.applicable_tiers?.length ? <span>Berlaku: {cp.applicable_tiers.join(', ')}</span> : <span>Semua paket</span>}
                    <span>Dibuat: {fmtDate(cp.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleCoupon(cp.id, !cp.is_active)}
                    style={{ padding: '5px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid #e5eaf2', background: '#f8fafc', color: '#374151', cursor: 'pointer' }}>
                    {cp.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => deleteCoupon(cp.id)}
                    style={{ padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: 'pointer' }}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Grant Akses Tab */}
      {tab === 'akses' && (
        <div>
          {/* Form grant */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: 14 }}>Grant Akses KreaFlow</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Email *</label>
                <input value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="user@email.com"
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Nama (opsional)</label>
                <input value={grantName} onChange={e => setGrantName(e.target.value)} placeholder="Nama user"
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Plan</label>
                <select value={grantPlan} onChange={e => setGrantPlan(e.target.value)}
                  style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="bulanan">Bulanan (1ws, 4 member, 31 hari)</option>
                  <option value="basic">Basic Lifetime (2ws, 4 member)</option>
                  <option value="pro">Pro Lifetime (4ws, 6 member)</option>
                  <option value="agency">Agency Lifetime (10ws, 11 member)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', color: '#374151' }}>
                <input type="checkbox" checked={grantSendEmail} onChange={e => setGrantSendEmail(e.target.checked)} />
                Kirim magic link welcome email ke user
              </label>
            </div>
            {grantMsg && <div style={{ marginBottom: 10, fontSize: '0.8rem', color: grantMsg.startsWith('Error') ? '#dc2626' : '#059669', fontWeight: 500 }}>{grantMsg}</div>}
            <button onClick={grantAccess} disabled={grantLoading}
              style={{ background: grantLoading ? '#047857' : '#059669', border: 'none', borderRadius: 10, padding: '10px 24px', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: grantLoading ? 'not-allowed' : 'pointer' }}>
              {grantLoading ? 'Memproses...' : '✓ Grant Akses'}
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input placeholder="Cari email atau nama..." value={accessSearch} onChange={e => setAccessSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchAccess(accessSearch)}
              style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#111827', fontSize: '0.85rem', outline: 'none' }} />
            <button onClick={() => fetchAccess(accessSearch)}
              style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: '0.82rem', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cari</button>
          </div>

          {/* List */}
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {accessLoading && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Memuat...</div>}
            {!accessLoading && !accessList.length && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Belum ada data. Klik Cari untuk load semua.</div>}
            {accessList.map((u, i) => (
              <div key={u.user_id} style={{ padding: '13px 18px', borderBottom: i < accessList.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{u.email}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 20, fontWeight: 700,
                      background: u.is_active ? '#f0fdf4' : '#fef2f2',
                      color: u.is_active ? '#059669' : '#dc2626' }}>
                      {u.is_active ? 'AKTIF' : 'EXPIRED'}
                    </span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 20, fontWeight: 700, background: '#f8fafc', color: '#6b7280', textTransform: 'uppercase' }}>
                      {u.plan}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {u.name && <span>{u.name}</span>}
                    <span>{u.max_workspaces}ws · {u.max_members} member</span>
                    {u.expires_at
                      ? <span>Exp: {fmtDate(u.expires_at)}</span>
                      : <span style={{ color: '#059669', fontWeight: 600 }}>Lifetime</span>}
                    <span>Diberi: {fmtDate(u.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                  {u.expires_at && (
                    <button onClick={() => extendAccess(u.user_id)}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(26,115,232,0.3)', background: '#eff6ff', color: '#1a73e8', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      +31 hari
                    </button>
                  )}
                  {u.expires_at && (
                    <button onClick={() => makeLifetime(u.user_id)}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(5,150,105,0.3)', background: '#f0fdf4', color: '#059669', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      → Lifetime
                    </button>
                  )}
                  <button onClick={() => revokeAccess(u.user_id, u.email)}
                    style={{ padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Cabut
                  </button>
                </div>
              </div>
            ))}
            {accessList.length > 0 && <div style={{ padding: '8px 16px', borderTop: '1px solid #f3f4f6', fontSize: '0.7rem', color: '#9ca3af' }}>{accessList.length} user</div>}
          </div>
        </div>
      )}

      {/* PROMO LINK TAB */}
      {tab === 'promo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Create form */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', marginBottom: 16 }}>Buat Promo Link Baru</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Token (kosongkan = random)</label>
                <input value={newPromo.token} onChange={e => setNewPromo(p => ({ ...p, token: e.target.value.toUpperCase() }))} placeholder="misal: SPESIAL2026" style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '0.5px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Label (internal)</label>
                <input value={newPromo.label} onChange={e => setNewPromo(p => ({ ...p, label: e.target.value }))} placeholder="misal: Promo Launch Agustus" style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Plan</label>
                <select value={newPromo.plan} onChange={e => setNewPromo(p => ({ ...p, plan: e.target.value }))} style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="basic">Basic Lifetime</option>
                  <option value="pro">Pro Lifetime</option>
                  <option value="agency">Agency Lifetime</option>
                  <option value="bulanan">Bulanan (1 bln)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Maks. Klaim (kosong = unlimited)</label>
                <input type="number" value={newPromo.max_uses} onChange={e => setNewPromo(p => ({ ...p, max_uses: e.target.value }))} placeholder="misal: 50" min={1} style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Mulai dari (opsional)</label>
                <input type="datetime-local" value={newPromo.starts_at} onChange={e => setNewPromo(p => ({ ...p, starts_at: e.target.value }))} style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>Berakhir (opsional)</label>
                <input type="datetime-local" value={newPromo.expires_at} onChange={e => setNewPromo(p => ({ ...p, expires_at: e.target.value }))} style={{ width: '100%', background: '#f3f4f6', border: '1px solid #e5eaf2', borderRadius: 9, padding: '8px 12px', fontSize: '0.85rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            {promoMsg && <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 9, background: promoMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', color: promoMsg.startsWith('Error') ? '#dc2626' : '#059669', fontSize: '0.8rem', fontWeight: 500 }}>{promoMsg}</div>}
            <button onClick={createPromo} disabled={promoSaving} style={{ marginTop: 14, background: promoSaving ? '#c4b5fd' : '#7c3aed', border: 'none', borderRadius: 9, padding: '10px 20px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: promoSaving ? 'not-allowed' : 'pointer' }}>
              {promoSaving ? 'Membuat...' : '+ Buat Promo Link'}
            </button>
          </div>

          {/* List */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>
              Daftar Promo Link {promoList.length > 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}>({promoList.length})</span>}
            </div>
            {promoLoading && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Loading...</div>}
            {!promoLoading && promoList.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>Belum ada promo link.</div>}
            {promoList.map((link, i) => {
              const promoUrl = `${APP_URL}/promo/${link.token}`
              const used = link.claimed_emails.length
              const isNotYet = link.starts_at && new Date(link.starts_at) > new Date()
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date()
              const isMaxed = link.max_uses !== null && used >= link.max_uses
              return (
                <div key={link.id} style={{ padding: '14px 18px', borderBottom: i < promoList.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <code style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7c3aed', letterSpacing: '1px' }}>{link.token}</code>
                      <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 20, background: link.active && !isExpired && !isMaxed && !isNotYet ? '#f0fdf4' : isNotYet ? '#fffbeb' : '#fef2f2', color: link.active && !isExpired && !isMaxed && !isNotYet ? '#059669' : isNotYet ? '#92400e' : '#dc2626', fontWeight: 700 }}>
                        {isExpired ? 'KADALUARSA' : isMaxed ? 'HABIS' : isNotYet ? 'BELUM MULAI' : link.active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                      <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 20, background: '#eff6ff', color: '#1a73e8', fontWeight: 600 }}>{link.plan}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 2 }}>{link.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Dipakai: {used}{link.max_uses !== null ? `/${link.max_uses}` : ''} kali
                      {link.starts_at && <span style={{ marginLeft: 8 }}>· Mulai: {new Date(link.starts_at).toLocaleDateString('id-ID')}</span>}
                      {link.expires_at && <span style={{ marginLeft: 8 }}>· Berakhir: {new Date(link.expires_at).toLocaleDateString('id-ID')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    <button onClick={() => { navigator.clipboard.writeText(promoUrl); alert('Link disalin!') }} style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e5eaf2', borderRadius: 7, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: '#374151' }}>
                      Salin Link
                    </button>
                    <button onClick={() => togglePromo(link.id, !link.active)} style={{ padding: '6px 10px', background: link.active ? '#fef3c7' : '#f0fdf4', border: '1px solid ' + (link.active ? '#fde68a' : '#bbf7d0'), borderRadius: 7, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: link.active ? '#92400e' : '#065f46' }}>
                      {link.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => deletePromo(link.id, link.token)} style={{ padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: '#dc2626' }}>
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
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
