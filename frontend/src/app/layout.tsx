import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { THEME_STORAGE_KEY } from '@/lib/theme';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Waby Loan | WABYBIX AI',
  description: 'AI-assisted loan eligibility and bank comparison for the Sri Lankan lending market.',
};

// Runs before hydration so the correct theme class is set pre-paint — avoids a light/dark flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
