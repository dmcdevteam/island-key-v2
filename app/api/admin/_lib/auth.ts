import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(_cookiesToSet: any[]) {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email?.toLowerCase().trim() === process.env.ADMIN_EMAIL?.toLowerCase().trim()
}
