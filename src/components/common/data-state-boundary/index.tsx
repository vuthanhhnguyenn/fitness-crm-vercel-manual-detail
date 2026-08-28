import { ReactElement, ReactNode, cloneElement, isValidElement } from 'react';

import { DataTable } from '../data-table';
import { Empty, EmptyProps } from './empty';
import { Error } from './error';
import { Loading } from './loading';

export { Empty, type EmptyProps } from './empty';

/**
 * Picks ONE state to render:
 *   isLoading -> skeleton/Loading | isError -> Error | isEmpty -> Empty | else -> children
 *
 * `isLoading` and `isError` ALWAYS replace the whole subtree. `isEmpty` is
 * special-cased: if `children` is directly a `<DataTable>`, the Empty is injected
 * as its `emptyContent` (table + header stay mounted); for any other children
 * (a raw `<Table>`, a `<Card>` wrapper, a Fragment) the whole subtree is replaced.
 *
 * ── Rules for the refactor / new usages ────────────────────────────────────
 * 1. NEVER put filter / search / toolbar / tab controls inside `children`.
 *    isLoading and isError unmount everything, so those controls vanish and
 *    trap the user (e.g. a filter returning 0 rows would hide the control
 *    needed to clear it). Keep them OUTSIDE the boundary; wrap only data.
 *
 * 2. The empty special-case only helps when `children` is a BARE `<DataTable>`.
 *    Wrap it in a Card/Fragment, or use a raw `<Table>`, and empty replaces the
 *    whole subtree again — so still keep filters outside.
 *
 * 3. With `DataTable`: do NOT wrap it in this boundary at all. DataTable already
 *    owns loading (`isLoading` skeleton) and empty (`emptyContent`, filters stay
 *    mounted). Surface query errors with a toast (`sonner`) in the query's
 *    `onError` / an effect — no boundary, no full-page error swap.
 *    (Some legacy list screens still wrap DataTable for the error UI; new and
 *    refactored code should follow the toast approach instead.)
 *
 * 4. `isEmpty` gotcha for raw tables: derive it from "no data object at all"
 *    (`!data`), NOT from row count (`data.items.length === 0`), unless filters
 *    already live outside the boundary — otherwise filtering to zero rows
 *    unmounts everything.
 *
 * WHEN TO USE: read-only single-record detail views, or a data region that just
 * needs a consistent Error + retry UI. WHEN NOT TO: as an outer wrapper around a
 * whole card/section that also contains filters — scope it to the data only.
 */
interface DataStateBoundaryProps {
  isLoading: boolean;
  isError?: boolean;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyState?: EmptyProps;
  errorTitle?: string;
  errorDescription?: string;
  children?: ReactNode;
  skeleton?: ReactNode;
}

export function DataStateBoundary({
  isLoading,
  isError,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyState,
  errorTitle,
  errorDescription,
  children,
  skeleton,
}: DataStateBoundaryProps) {
  if (isLoading) return skeleton ?? <Loading />;
  if (isError) return <Error title={errorTitle} description={errorDescription} onRetry={onRetry} />;
  if (isEmpty) {
    const emptyComponent = (
      <Empty
        {...emptyState}
        title={emptyState?.title ?? emptyTitle}
        description={emptyState?.description ?? emptyDescription}
      />
    );

    if (isValidElement(children) && children.type === DataTable) {
      return cloneElement(children as ReactElement<{ emptyContent?: ReactNode }>, {
        emptyContent: emptyComponent,
      });
    }

    return emptyComponent;
  }

  return <div className="animate-in fade-in duration-500">{children}</div>;
}
