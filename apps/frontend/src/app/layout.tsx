import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ThemeToggle from '@/app/components/ThemeToggle';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Job Curator',
  description: 'A website with curated job postings for Sven Soldin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className='fixed top-4 right-4 z-50'>
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
