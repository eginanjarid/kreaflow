import { redirect } from 'next/navigation'

export default function TasksPage() {
  redirect('/sprints?tab=tasks')
}
