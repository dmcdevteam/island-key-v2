import { Sidebar } from './_components/sidebar'

export const metadata = {
  title: 'Island Key Admin',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 min-h-screen" style={{ marginLeft: 210 }}>
        {children}
      </main>
    </div>
  )
}
