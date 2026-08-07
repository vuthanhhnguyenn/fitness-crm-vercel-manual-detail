import React from 'react';

import { Empty } from './empty';
import { Error } from './error';
import { Loading } from './loading';

interface DataStateBoundaryProps {
  isLoading: boolean;
  isError?: boolean;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  children?: React.ReactNode;
  skeleton?: React.ReactNode;
}

export function DataStateBoundary({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  errorTitle,
  children,
  skeleton,
}: DataStateBoundaryProps) {
  if (isLoading) return skeleton ?? <Loading />;
  if (isError) return <Error title={errorTitle} onRetry={onRetry} />;
  if (isEmpty) return <Empty title={emptyTitle} description={emptyDescription} />;

  return <div className="animate-in fade-in duration-500">{children}</div>;
}
