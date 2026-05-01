import { createServerClient } from '@/lib/supabase'
import ActivitiesClient from './_activities-client'

export const revalidate = 300 // revalidate every 5 minutes

export default async function ActivitiesPage() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('activities')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('title')

  return <ActivitiesClient initialActivities={data ?? []} />
}
