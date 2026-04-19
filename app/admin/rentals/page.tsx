import { AdminShell } from '../_components/sidebar'
import { RentalsSection } from './_components/rentals-section'

export default function RentalsPage() {
  return (
    <AdminShell>
      <div className="p-8">
        <RentalsSection />
      </div>
    </AdminShell>
  )
}
