import { ImageManager } from '@/app/admin/images/_components/image-manager'

export const metadata = { title: 'Activity Images — Island Key Admin' }

export default function ActivityImagesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-navy">Activity Images</h1>
        <p className="text-sm text-tx-mid mt-1">All images uploaded across activity listings</p>
      </div>
      <ImageManager />
    </div>
  )
}
