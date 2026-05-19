import { SectionImageBrowser } from '@/app/admin/_components/image-browser'

export const metadata = { title: 'Transfer Images — Island Key Admin' }

export default function TransferImagesPage() {
  return (
    <SectionImageBrowser
      apiUrl="/api/admin/transfer-images"
      title="Transfer Images"
      subtitle="All images uploaded across transfer routes and vehicles"
      emptyMessage="No transfer images uploaded yet. Images appear here when uploaded via transfer listings."
    />
  )
}
