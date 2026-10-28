import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';
import { Providers } from '@/providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Fabric Explorer — Enterprise Data Management',
    template: '%s — Fabric Explorer',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} font-sans bg-slate-50 text-slate-800 h-full flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-700`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
