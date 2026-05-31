import { Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import ActivitiesClient from './_activities-client'

export const dynamic = 'force-dynamic'

export default async function ActivitiesPage() {
  let activities: any[] = []
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('title')
    activities = data ?? []
  } catch {
    // fallback to empty; client will fetch on mount if needed
  }

  return (
    <Suspense fallback={null}>
      <ActivitiesClient initialActivities={activities} />
    </Suspense>
  )
}
