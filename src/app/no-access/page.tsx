"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function NoAccessPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ marginBottom: 28 }}>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827" }}>KreaFlow</span>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <span style={{ fontSize: 28 }}>&#128274;</span>
        </div>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Akses Tidak Tersedia</h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 28px" }}>
          Akun kamu belum memiliki akses ke <strong style={{ color: "#111827" }}>KreaFlow</strong>.
          Dapatkan akses Lifetime sekali bayar untuk pakai selamanya.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="https://kreaflow.id/lp" style={{ display: "block", background: "#1a73e8", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: "0.875rem", fontWeight: 700, textDecoration: "none" }}>
            Beli KreaFlow Lifetime →
          </a>
          <button onClick={handleLogout} style={{ background: "#f3f4f6", color: "#6b7280", border: "none", padding: "12px 20px", borderRadius: 12, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }}>
            Keluar
          </button>
        </div>
        <p style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: 20 }}>
          Sudah beli? Email ke <a href="mailto:support@tuasdigital.com" style={{ color: "#1a73e8" }}>support@tuasdigital.com</a>
        </p>
      </div>
    </div>
  )
}
