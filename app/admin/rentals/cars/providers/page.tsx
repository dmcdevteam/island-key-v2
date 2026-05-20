import { ProvidersSection } from '@/app/admin/providers/_components/providers-table'

export const metadata = { title: 'Car Rental Providers — Island Key Admin' }

export default function CarProvidersPage() {
  return (
    <div className="p-8">
      <ProvidersSection typeFilter="car_rental" />
    </div>
  )
}
