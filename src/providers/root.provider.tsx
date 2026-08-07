'use client';

import { ReactNode } from 'react';

import '@/app/globals.css';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Toaster } from '@/components/ui/sonner';

import ReactQueryProvider from './react-query.provider';

interface RootProviderProps {
  children: ReactNode;
}

export const RootProvider = ({ children }: RootProviderProps) => {
  return (
    <NuqsAdapter>
      <ReactQueryProvider>
        <Toaster richColors />
        {children}
      </ReactQueryProvider>
    </NuqsAdapter>
  );
};
