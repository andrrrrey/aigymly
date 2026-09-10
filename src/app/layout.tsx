import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { AuthProvider } from '@/components/AuthProvider';
import { YandexMetrika } from '@/components/YandexMetrika';
import { DebugOverlay } from '@/components/DebugOverlay';

export const metadata: Metadata = {
  title: 'Ai Gymly — умный фитнес планер',
  description: 'Помогаем не слиться на пути к цели',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/img/logo.jpg',
    apple: '/img/logo.jpg',
  },
  openGraph: {
    title: 'Ai Gymly — умный фитнес планер',
    description: 'Помогаем не слиться на пути к цели',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    title: 'Ai Gymly',
    statusBarStyle: 'default',
  },
  other: {
    'p:domain_verify': 'dcfc63576ab8cca8d1e9a7b925d5a03e',
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
      <head>
        {/* Inline crash catcher. Lives in the static HTML (not the JS bundle),
            so it runs even if the app bundle throws on parse/exec/hydration —
            which is how an iOS-only white screen looks. Visible only with
            ?debug=1; it prints the real error on screen so it can be read on a
            phone without DevTools. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var D=false;try{D=location.search.indexOf('debug=1')>=0||sessionStorage.getItem('aigymly-debug')==='1';}catch(e){}try{if(location.search.indexOf('debug=1')>=0)sessionStorage.setItem('aigymly-debug','1');}catch(e){}function show(m){if(!D)return;try{var d=document.getElementById('__err');if(!d){d=document.createElement('div');d.id='__err';d.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:#111;color:#f88;font:12px/1.4 monospace;padding:10px;white-space:pre-wrap;max-height:60vh;overflow:auto';(document.body||document.documentElement).appendChild(d);}d.appendChild(document.createTextNode(m+'\\n'));}catch(e){}}window.addEventListener('error',function(e){show('ERR: '+(e.message||(e.error&&e.error.message))+' @ '+String(e.filename||'').split('/').pop()+':'+e.lineno+':'+e.colno);});window.addEventListener('unhandledrejection',function(e){var r=e.reason;show('REJ: '+((r&&r.message)||r));});show('debug ready '+navigator.userAgent);})();`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <div className="mx-auto flex h-[100dvh] max-w-[440px] flex-col bg-white overflow-hidden">
            {children}
          </div>
        </AuthProvider>
        <ServiceWorkerRegister />
        <YandexMetrika />
        <DebugOverlay />
      </body>
    </html>
  );
}
