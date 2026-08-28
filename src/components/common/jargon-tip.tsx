'use client';

import type { ReactNode } from 'react';

import { JARGON_GLOSSARY, type JargonTerm } from '@/constants/jargon-glossary.constants';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface JargonTipProps {
  /** Glossary key; also used as the tooltip heading */
  term: JargonTerm;
  /** Display label (defaults to the term itself) */
  children?: ReactNode;
}

/**
 * Renders a domain term with a dotted underline and shows its glossary description on hover
 *
 * ```tsx
 * <JargonTip term="ゲートストップ" />
 * ```
 */
export function JargonTip({ term, children }: Readonly<JargonTipProps>) {
  const entry = JARGON_GLOSSARY[term];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="border-muted-foreground/60 cursor-help border-b border-dotted" />
          }
        >
          {children ?? term}
        </TooltipTrigger>
        <TooltipContent className="max-w-[280px] flex-col items-start gap-0">
          <p className="mb-1 text-xs font-semibold">{term}</p>
          <p className="text-xs leading-relaxed">{entry.description}</p>
          {entry.example && (
            <p className="text-background/70 mt-2 text-[11px] italic">例：{entry.example}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
