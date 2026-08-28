import { useMemo } from 'react';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

import useClientRequest from '@/hooks/useClientRequest';

import { getApiErrorMessage } from '@/lib/api-error.util';

export interface ReactQueryProviderProps {
  readonly children: React.ReactNode;
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 2 * 60 * 1000,
          },
        },
        mutationCache: new MutationCache({
          onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error));
          },
        }),
        queryCache: new QueryCache({
          onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error));
          },
        }),
      }),
    [],
  );

  // Initialize client request
  useClientRequest();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
