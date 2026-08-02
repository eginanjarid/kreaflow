export default function PageLoader() {
  return (
    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
      <div style={{ height: 32, width: 200, background: '#e5e7eb', borderRadius: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 100, background: '#f3f4f6', borderRadius: 16 }} />
        ))}
      </div>
      <div style={{ height: 300, background: '#f3f4f6', borderRadius: 16 }} />
    </div>
  )
}
