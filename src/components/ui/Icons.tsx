type P = { size?: number; color?: string; sw?: number }
const I = ({ size = 16, color = 'currentColor', sw = 2, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{children}</svg>
)

export const ISearch = (p: P) => <I {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I>
export const IPen = (p: P) => <I {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></I>
export const IVideo = (p: P) => <I {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></I>
export const IScissors = (p: P) => <I {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></I>
export const ICalendar = (p: P) => <I {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>
export const IZap = (p: P) => <I {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></I>
export const ICheckCircle = (p: P) => <I {...p}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></I>
export const IBarChart = (p: P) => <I {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></I>
export const ITarget = (p: P) => <I {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></I>
export const ILink = (p: P) => <I {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></I>
export const IList = (p: P) => <I {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></I>
export const IMegaphone = (p: P) => <I {...p}><path d="M3 11l19-9-9 19-2-8-8-2z"/></I>
export const IClock = (p: P) => <I {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></I>
export const IPackage = (p: P) => <I {...p}><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></I>
export const IPhone = (p: P) => <I {...p}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></I>
export const IAlert = (p: P) => <I {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></I>
export const IFilm = (p: P) => <I {...p}><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></I>
export const IBell = (p: P) => <I {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></I>
export const IGear = (p: P) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></I>
export const IRadio = (p: P) => <I {...p}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></I>
export const IPalette = (p: P) => <I {...p}><circle cx="13.5" cy="6.5" r=".5" fill={p.color}/><circle cx="17.5" cy="10.5" r=".5" fill={p.color}/><circle cx="8.5" cy="7.5" r=".5" fill={p.color}/><circle cx="6.5" cy="12.5" r=".5" fill={p.color}/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></I>
export const IGrid = (p: P) => <I {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></I>
export const IClipboard = (p: P) => <I {...p}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></I>
export const IStar = (p: P) => <I {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></I>
export const IPlus = (p: P) => <I {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>
export const IEye = (p: P) => <I {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></I>
export const ICheck = (p: P) => <I {...p}><polyline points="20 6 9 17 4 12"/></I>
export const IRefresh = (p: P) => <I {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></I>

export const STEP_ICON_MAP: Record<string, React.ReactNode> = {
  riset:      <ISearch size={14} />,
  naskah:     <IPen size={14} />,
  take_video: <IVideo size={14} />,
  shooting:   <IVideo size={14} />,
  broll:      <IFilm size={14} />,
  broll_vo:   <IFilm size={14} />,
  editing:    <IScissors size={14} />,
  schedule:   <ICalendar size={14} />,
  caption:    <IPen size={14} />,
  topik:      <IList size={14} />,
  persiapan:  <IGear size={14} />,
  promo:      <IMegaphone size={14} />,
  live:       <IRadio size={14} />,
  clip:       <IFilm size={14} />,
  custom:     <IGear size={14} />,
}

export const NOTIF_ICON_MAP: Record<string, React.ReactNode> = {
  riset:    <ISearch size={16} color="#3b82f6" />,
  naskah:   <IPen size={16} color="#f59e0b" />,
  produksi: <IPalette size={16} color="#f97316" />,
  schedule: <ICalendar size={16} color="#8b5cf6" />,
}
