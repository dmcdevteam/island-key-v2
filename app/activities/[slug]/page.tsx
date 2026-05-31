import { createClient, createServerClient } from '@/lib/supabase'
import ActivityDetailClient from './_detail-client'
import type { Activity } from '@/lib/types'

export const revalidate = 3600 // rebuild every hour

export async function generateStaticParams() {
  try {
    // Use anon client — service role key is not available at build time
    const supabase = createClient()
    const { data } = await supabase
      .from('activities')
      .select('slug')
      .eq('is_active', true)
    return data?.map(({ slug }: { slug: string }) => ({ slug })) ?? []
  } catch {
    return []
  }
}

export default async function ActivityDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('activities')
    .select('*')
    .eq('slug', params.slug)
    .single()

  return <ActivityDetailClient initialActivity={data as Activity | undefined} />
}
