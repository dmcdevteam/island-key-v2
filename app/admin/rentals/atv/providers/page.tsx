import { ProvidersSection } from '@/app/admin/providers/_components/providers-table'

export const metadata = { title: 'ATV & Motorbike Providers — Island Key Admin' }

export default function ATVProvidersPage() {
  return (
    <div className="p-8">
      <ProvidersSection typeFilter="atv_rental" />
    </div>
  )
}
