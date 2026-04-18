import type { Metadata } from 'next'
import { ImageManager } from './_components/image-manager'

export const metadata: Metadata = { title: 'Image Manager — Island Key Admin' }

export default function ImagesPage() {
  return (
    <div className="p-6 md:p-8">
      <ImageManager />
    </div>
  )
}
