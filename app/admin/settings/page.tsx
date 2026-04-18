import type { Metadata } from 'next'
import { AccessKeyManager } from './_components/access-key-manager'

export const metadata: Metadata = { title: 'Settings — Island Key Admin' }

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-2xl text-navy mb-1">Settings</h1>
      <p className="text-sm text-tx-mid mb-8">Manage access keys for the Island Key guest app.</p>
      <AccessKeyManager />
    </div>
  )
}
