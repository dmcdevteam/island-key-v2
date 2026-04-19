import { AdminShell } from '../_components/sidebar'
import { TransfersSection } from './_components/transfers-section'

export default function TransfersPage() {
  return (
    <AdminShell>
      <div className="p-8">
        <TransfersSection />
      </div>
    </AdminShell>
  )
}
