'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { queryClientSingleton } from './client';

const QueryProviderWrapper = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(queryClientSingleton);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProviderWrapper;
