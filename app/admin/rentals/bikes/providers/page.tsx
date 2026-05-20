import { ProvidersSection } from '@/app/admin/providers/_components/providers-table'

export const metadata = { title: 'Bike & E-Bike Providers — Island Key Admin' }

export default function BikeProvidersPage() {
  return (
    <div className="p-8">
      <ProvidersSection typeFilter="bike_rental" />
    </div>
  )
}
