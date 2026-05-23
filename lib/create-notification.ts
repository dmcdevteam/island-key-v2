import { createServerClient } from '@/lib/supabase'

export async function createNotificationFromContent({
  title,
  body,
  type = 'offer',
}: {
  title: string
  body: string
  type?: string
}) {
  try {
    const supabase = createServerClient()
    await supabase.from('notifications').insert({
      title,
      body,
      type,
      target: 'all',
      is_active: true,
      scheduled_at: new Date().toISOString(),
    })
  } catch {
    // Non-critical — don't fail the main save
  }
}
