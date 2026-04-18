import { AdminShell } from './_components/sidebar'

export const metadata = {
  title: 'Island Key Admin',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
