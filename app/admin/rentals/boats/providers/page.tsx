import { ProvidersSection } from '@/app/admin/providers/_components/providers-table'

export const metadata = { title: 'Boat Providers — Island Key Admin' }

export default function BoatProvidersPage() {
  return (
    <div className="p-8">
      <ProvidersSection typeFilter="boat_rental" />
    </div>
  )
}
