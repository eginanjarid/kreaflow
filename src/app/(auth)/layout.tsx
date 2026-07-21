export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1e1040 0%, #0a0a0a 60%)' }}>
      {children}
    </div>
  )
}
