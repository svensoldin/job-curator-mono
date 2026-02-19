import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Job Curator',
  description: 'A website with curated job postings for software engineers.',
  viewport: 'width=device-width, initial-scale=1',
  keywords: ['jobs', 'software engineer', 'developer', 'careers', 'curated jobs'],
  authors: [{ name: 'Job Curator' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Job Curator',
    description: 'A website with curated job postings for software engineers.',
    url: 'https://your-domain.example/',
    siteName: 'Job Curator',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Curator',
    description: 'A website with curated job postings for software engineers.',
    images: ['/og-image.png'],
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='antialiased bg-black'>{children}</body>
    </html>
  );
};

export default RootLayout;
