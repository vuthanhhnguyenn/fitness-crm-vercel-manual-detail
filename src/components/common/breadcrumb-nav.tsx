'use client';

import { Fragment } from 'react';

import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { cn } from '@/lib/utils';

export type BreadcrumbItemType = {
  /** If present: render as link; otherwise: render as current page (no link) */
  url?: string;
  label: string;
};

const sectionListClass = 'text-sm tracking-tight text-foreground gap-2 sm:gap-2.5';
const sectionLinkClass = 'text-muted-foreground hover:opacity-80 transition-opacity';
const sectionPageClass = 'text-foreground';
const sectionSeparatorClass = '[&>svg]:size-4 text-foreground/50';

type BreadcrumbNavProps = {
  items: readonly BreadcrumbItemType[];
  /** "section" = section title style (heading 3: 24px, semibold). "default" = small muted. */
  variant?: 'default' | 'section';
};

/**
 * Shared breadcrumb: pass an array of `{ url?, label }`.
 * Items with `url` render as links; items without `url` (typically the last) render as the current page.
 */
export function BreadcrumbNav({ items, variant = 'default' }: Readonly<BreadcrumbNavProps>) {
  if (items.length === 0) return null;

  const isSection = variant === 'section';

  return (
    <Breadcrumb>
      <BreadcrumbList className={cn(isSection && sectionListClass)}>
        {items.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {'url' in item && item.url != null ? (
                <BreadcrumbLink
                  render={<Link href={item.url} />}
                  className={cn(isSection && sectionLinkClass)}
                >
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className={cn(isSection && sectionPageClass)}>
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && (
              <BreadcrumbSeparator className={cn(isSection && sectionSeparatorClass)} />
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
