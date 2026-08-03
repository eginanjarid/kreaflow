export default function AuthLayout({ children }: { children: React.ReactNode }) {
  process.stdout.write(`[KREAFLOW-DEBUG] AuthLayout called at ${new Date().toISOString()}\n`)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)' }}>
      {children}
    </div>
  )
}
