'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function loginAction(formData: FormData): Promise<{ error: string }> {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const password = formData.get('password') as string

  if (email !== process.env.ADMIN_EMAIL?.toLowerCase().trim()) {
    return { error: 'Invalid credentials' }
  }

  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid credentials' }
  }

  redirect('/admin')
}

export async function logoutAction() {
  const supabase = getSupabase()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
