import { BookingsSection } from './_components/bookings-section'

export const metadata = { title: 'Bookings — Island Key Admin' }

export default function BookingsPage() {
  return (
    <div className="p-4 md:p-8">
      <BookingsSection />
    </div>
  )
}
