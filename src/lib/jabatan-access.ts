export type AccessLevel = 'full' | 'view' | 'none'
export type Module = 'sprints' | 'plan' | 'library' | 'studio' | 'calendar' | 'tracker' | 'budget' | 'brand' | 'catalog' | 'settings' | 'tasks' | 'notifications' | 'insights'

// owner/admin role = full access to everything
// member with jabatan = restricted per matrix below
// member without jabatan = full access (no restriction)
const MATRIX: Record<string, Partial<Record<Module, AccessLevel>>> = {
  'Manager':          { sprints: 'full', plan: 'full', library: 'full', studio: 'full', calendar: 'full', tracker: 'full', budget: 'full', brand: 'full', catalog: 'full', settings: 'none', tasks: 'full', notifications: 'full', insights: 'full' },
  'Copywriter':       { sprints: 'view', plan: 'full', library: 'view', studio: 'none', calendar: 'none', tracker: 'none', budget: 'none', brand: 'none', catalog: 'none', settings: 'none', tasks: 'view', notifications: 'full', insights: 'none' },
  'Videografer':      { sprints: 'view', plan: 'none', library: 'view', studio: 'full', calendar: 'none', tracker: 'none', budget: 'none', brand: 'none', catalog: 'none', settings: 'none', tasks: 'view', notifications: 'full', insights: 'none' },
  'Editor':           { sprints: 'view', plan: 'none', library: 'view', studio: 'full', calendar: 'none', tracker: 'none', budget: 'none', brand: 'none', catalog: 'none', settings: 'none', tasks: 'view', notifications: 'full', insights: 'none' },
  'Desainer':         { sprints: 'view', plan: 'none', library: 'full', studio: 'full', calendar: 'none', tracker: 'none', budget: 'none', brand: 'view', catalog: 'none', settings: 'none', tasks: 'view', notifications: 'full', insights: 'none' },
  'Admin Sosmed':     { sprints: 'view', plan: 'none', library: 'view', studio: 'none', calendar: 'full', tracker: 'full', budget: 'none', brand: 'none', catalog: 'none', settings: 'none', tasks: 'full', notifications: 'full', insights: 'full' },
  'Art Director':     { sprints: 'view', plan: 'view', library: 'full', studio: 'full', calendar: 'none', tracker: 'none', budget: 'none', brand: 'none', catalog: 'none', settings: 'none', tasks: 'view', notifications: 'full', insights: 'none' },
  'Content Creator':  { sprints: 'full', plan: 'full', library: 'full', studio: 'full', calendar: 'full', tracker: 'full', budget: 'none', brand: 'none', catalog: 'none', settings: 'none', tasks: 'full', notifications: 'full', insights: 'full' },
}

export function getAccess(role: string, jabatan: string, module: Module): AccessLevel {
  if (role === 'owner' || role === 'admin') return 'full'
  if (!jabatan || !MATRIX[jabatan]) return 'full'
  return MATRIX[jabatan][module] ?? 'none'
}

export function canAccess(role: string, jabatan: string, module: Module): boolean {
  return getAccess(role, jabatan, module) !== 'none'
}

export function firstAccessibleRoute(role: string, jabatan: string): string {
  const order: Array<[Module, string]> = [
    ['sprints', '/sprints'],
    ['plan', '/plan'],
    ['library', '/library'],
    ['studio', '/studio'],
    ['calendar', '/calendar'],
    ['tracker', '/tracker'],
    ['insights', '/insights'],
    ['brand', '/brand'],
  ]
  for (const [mod, route] of order) {
    if (canAccess(role, jabatan, mod)) return route
  }
  return '/settings'
}
