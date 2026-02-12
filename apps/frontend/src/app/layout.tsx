import type { Metadata } from 'next';
import { Theme } from '@chakra-ui/react';

import './globals.css';

import { Provider } from '@/components/ui/ChakraProvider/ChakraProvider';
import { ColorModeButton } from '@/components/ui/Theme/Theme';

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
      <body className="antialiased">
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
