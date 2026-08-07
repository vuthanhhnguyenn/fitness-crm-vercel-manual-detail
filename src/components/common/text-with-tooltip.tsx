import React, { useEffect, useRef, useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

interface TextWithTooltipProps {
  text: string | number;
  className?: string;
  wrapperClassName?: string;
  contentClassName?: string;
  lines?: number; // 1-6 for line-clamp, undefined for single line truncate
  side?: React.ComponentProps<typeof TooltipContent>['side'];
  align?: React.ComponentProps<typeof TooltipContent>['align'];
  sideOffset?: number;
}

export function TextWithTooltip({
  text,
  className,
  wrapperClassName,
  contentClassName,
  lines,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
}: Readonly<TextWithTooltipProps>) {
  const [isTruncated, setIsTruncated] = useState<boolean>(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Get line-clamp class based on lines prop
  const lineClampClass = lines && lines >= 1 && lines <= 6 ? `line-clamp-${lines}` : 'truncate';

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;

        // For line-clamp or truncate
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const scrollWidth = element.scrollWidth;
        const clientWidth = element.clientWidth;

        // Check if text is truncated (either horizontally or vertically)
        // Use a tiny tolerance to avoid rounding issues from sub-pixel layout.
        const isTrunc = scrollWidth - clientWidth > 1 || scrollHeight - clientHeight > 1;
        setIsTruncated(isTrunc);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      checkTruncation();
    });

    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }

    const rafId = window.requestAnimationFrame(checkTruncation);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [className, lines, text]);

  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger
          render={<div className={cn('min-w-0', wrapperClassName)} />}
          disabled={!isTruncated}
        >
          <div ref={textRef} className={cn(lineClampClass, className)}>
            {text}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'max-h-48 max-w-sm overflow-y-auto wrap-break-word whitespace-normal',
            contentClassName,
          )}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
