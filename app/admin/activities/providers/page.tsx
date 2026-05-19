import { ProvidersSection } from '@/app/admin/providers/_components/providers-table'

export const metadata = { title: 'Activity Providers — Island Key Admin' }

export default function ActivityProvidersPage() {
  return (
    <div className="p-8">
      <ProvidersSection typeFilter="activity" />
    </div>
  )
}
