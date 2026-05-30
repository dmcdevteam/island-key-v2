import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AdminPreviewPill } from './_components/admin-preview-pill';
import { ServiceWorkerRegister } from './_components/sw-register';
import { FavouritesProvider } from './_components/favourites-provider';
import { BookingCardProvider } from './_components/booking-card-context';
import { ShellWrapper } from './_components/shell-wrapper';
import { EssentialsCartProvider } from '@/lib/essentials-cart';
import { GlobalFloatingElements } from '@/components/ui/global-floating-elements';

export const metadata: Metadata = {
  title: 'Island Key — Your island. Unlocked.',
  description: 'Curated local experiences, deals, transfers, and insider tips for your stay in Crete.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B2D4F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body text-tx min-h-screen">
        <ServiceWorkerRegister />
        <EssentialsCartProvider>
          <FavouritesProvider>
            <BookingCardProvider>
              <ShellWrapper>
                <AdminPreviewPill />
<GlobalFloatingElements />
                {children}
              </ShellWrapper>
            </BookingCardProvider>
          </FavouritesProvider>
        </EssentialsCartProvider>
      </body>
    </html>
  );
}
