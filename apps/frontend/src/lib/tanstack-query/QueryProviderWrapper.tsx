'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { queryClientSingleton } from './client';

export default function QueryProviderClient({ children }: { children: ReactNode }) {
  const [queryClient] = useState(queryClientSingleton);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
