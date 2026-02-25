'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { getQueryClient } from './client';

const QueryProviderWrapper = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(getQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProviderWrapper;
