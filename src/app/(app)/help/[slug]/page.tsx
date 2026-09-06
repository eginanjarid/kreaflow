import { notFound } from 'next/navigation'
import { getTopic } from '../content'

export default async function HelpTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopic(slug)
  if (!topic) notFound()

  return (
    <article>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {topic.group}
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>{topic.label}</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 22px' }}>{topic.summary}</p>
      {topic.body}
    </article>
  )
}
