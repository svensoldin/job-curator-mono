import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ThemeToggle from '@/components/ui/ThemeToggle';
import './globals.css';
import { Provider } from '@/components/ui/provider';
import { Theme } from '@chakra-ui/react';
import { ColorModeButton } from '@/components/ui/color-mode';

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Provider>
          <div className="fixed bottom-4 right-4 z-50">
            <ColorModeButton />
          </div>
          <Theme>{children}</Theme>
        </Provider>
      </body>
    </html>
  );
}
