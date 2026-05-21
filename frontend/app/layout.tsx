import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Rate Limiter Demo',
  description: 'Interactive demo for Token Bucket and Fixed Window rate limiting',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark font-sans', geist.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
