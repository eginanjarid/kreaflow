'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'error' | 'success' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let _counter = 0

export function showToast(message: string, type: ToastType = 'error') {
  window.dispatchEvent(new CustomEvent('kf-toast', { detail: { message, type } }))
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent).detail as { message: string; type: ToastType }
      const id = ++_counter
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }
    window.addEventListener('kf-toast', handler)
    return () => window.removeEventListener('kf-toast', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'max-content', maxWidth: 'calc(100vw - 32px)' }}>
      {toasts.map(t => {
        const colors = t.type === 'error'
          ? { bg: '#fef2f2', border: '#fecaca', icon: '#dc2626', text: '#991b1b' }
          : t.type === 'success'
            ? { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#166534' }
            : { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e40af' }
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', animation: 'kf-toast-in 0.2s ease', pointerEvents: 'auto' }}>
            {t.type === 'error' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            {t.type === 'success' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
            {t.type === 'info' && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: colors.text, lineHeight: 1.5 }}>{t.message}</span>
          </div>
        )
      })}
      <style>{`@keyframes kf-toast-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
