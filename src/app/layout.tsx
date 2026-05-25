import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'FitTracker — трекер тренировок',
  description: 'Трекер тренировок с AI-программой',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'FitTracker',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F7F8FA',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <div className="mx-auto flex h-[100dvh] max-w-[440px] flex-col bg-white overflow-hidden">
            {children}
          </div>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
