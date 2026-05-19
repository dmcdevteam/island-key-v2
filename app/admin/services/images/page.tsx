import { SectionImageBrowser } from '@/app/admin/_components/image-browser'

export const metadata = { title: 'Service Images — Island Key Admin' }

export default function ServiceImagesPage() {
  return (
    <SectionImageBrowser
      apiUrl="/api/admin/service-images"
      title="Service Images"
      subtitle="All images uploaded across service listings"
      emptyMessage="No service images uploaded yet. Images appear here when uploaded via service listings."
    />
  )
}
