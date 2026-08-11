'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Shopee']

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export default function QuickCapture({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false)
  const [judul, setJudul] = useState('')
  const [notes, setNotes] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const judulRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setVoiceSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => judulRef.current?.focus(), 80)
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const rec = new SR()
    rec.lang = 'id-ID'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript
      setJudul(prev => prev ? prev + ' ' + t : t)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }

  async function handleSave() {
    if (!judul.trim()) { showToast('Isi judul idenya dulu'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('kf_content_ideas').insert({
      workspace_id: workspaceId,
      judul: judul.trim(),
      hook: notes.trim() || null,
      platform: platforms,
      status: 'Ide',
      pillar_id: null,
      product_id: null,
      format: '',
      formula: '',
      usp: [],
      cta: '',
      hashtags: [],
      prompt_script: '',
      script: '',
      show_in_feed: true,
    })
    setSaving(false)
    if (error) { showToast('Gagal menyimpan'); return }
    showToast('Ide tersimpan di Bank Konten!', 'success')
    setJudul(''); setNotes(''); setPlatforms([])
    setOpen(false)
  }

  if (!workspaceId) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="Simpan Ide Cepat"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a73e8 0%, #1558b0 100%)',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(26,115,232,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(26,115,232,0.6)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(26,115,232,0.5)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500,
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '0 0 env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
          maxWidth: 560, margin: '0 auto',
        }}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e5e7eb' }} />
          </div>

          <div style={{ padding: '8px 20px 28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Simpan Ide</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Masuk ke Bank Konten · Library</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '1rem' }}>×</button>
            </div>

            {/* Judul + Mic */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                ref={judulRef}
                value={judul}
                onChange={e => setJudul(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSave() }}
                placeholder="Ide konten kamu..."
                style={{
                  flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 12,
                  padding: '13px 16px', fontSize: '0.95rem', outline: 'none', color: '#111827',
                }}
              />
              {voiceSupported && (
                <button
                  onClick={startVoice}
                  title={listening ? 'Hentikan' : 'Rekam suara'}
                  style={{
                    width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: listening ? '#fef2f2' : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={listening ? '#dc2626' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
              )}
            </div>

            {listening && (
              <div style={{ fontSize: '0.75rem', color: '#dc2626', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', display: 'inline-block', animation: 'kf-pulse 1s ease-in-out infinite' }} />
                Sedang merekam... bicara sekarang
              </div>
            )}

            {/* Platform chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', border: 'none', cursor: 'pointer',
                    background: platforms.includes(p) ? 'rgba(26,115,232,0.12)' : '#f3f4f6',
                    color: platforms.includes(p) ? '#1a73e8' : '#6b7280',
                    fontWeight: platforms.includes(p) ? 600 : 400,
                    outline: platforms.includes(p) ? '1.5px solid #1a73e8' : '1.5px solid transparent',
                    transition: 'all 0.12s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Notes */}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan tambahan — referensi, konteks, angle yang terlintas... (opsional)"
              style={{
                width: '100%', height: 76, background: '#f3f4f6', border: 'none', borderRadius: 12,
                padding: '11px 14px', fontSize: '0.85rem', outline: 'none', resize: 'none',
                color: '#374151', lineHeight: 1.5, boxSizing: 'border-box',
              }}
            />

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !judul.trim()}
              style={{
                width: '100%', marginTop: 12,
                background: !judul.trim() ? '#e5e7eb' : saving ? '#1558b0' : '#1a73e8',
                border: 'none', borderRadius: 12,
                padding: '13px', color: !judul.trim() ? '#9ca3af' : '#fff',
                fontSize: '0.9rem', fontWeight: 700, cursor: !judul.trim() || saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Ide →'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#9ca3af', marginTop: 7 }}>
              Enter untuk simpan · Esc untuk tutup
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kf-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </>
  )
}
