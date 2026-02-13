import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Job Curator',
  description: 'A website with curated job postings for software engineers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
