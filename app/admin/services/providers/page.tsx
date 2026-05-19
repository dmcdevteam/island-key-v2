import { ProvidersSection } from '@/app/admin/providers/_components/providers-table'

export const metadata = { title: 'Service Providers — Island Key Admin' }

export default function ServiceProvidersPage() {
  return (
    <div className="p-8">
      <ProvidersSection typeFilter="service" />
    </div>
  )
}
