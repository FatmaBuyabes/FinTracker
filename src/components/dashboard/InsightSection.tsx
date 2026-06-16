// Async server component — fetches AI insight then renders the card.
// Wrapped in <Suspense> on the dashboard so it never blocks page render.
import { getAIDailyInsight } from '@/lib/ai'
import { DailyInsightCard } from './DailyInsightCard'

export async function InsightSection() {
  const insight = await getAIDailyInsight()
  if (!insight) return null
  return <DailyInsightCard insight={insight} />
}
