import { EssentialsCartProvider } from '@/lib/essentials-cart'

export default function EssentialsLayout({ children }: { children: React.ReactNode }) {
  return <EssentialsCartProvider>{children}</EssentialsCartProvider>
}
