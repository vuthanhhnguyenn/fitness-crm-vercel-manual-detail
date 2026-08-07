'use client';

import { useRef, useState } from 'react';

import { Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { StudioSpace } from '@/lib/api/types.gen';

interface SpaceCellPopoverProps {
  space: StudioSpace;
  cellClass: string;
  /** FR-008 — whether the current role may cancel this reservation */
  canCancel: boolean;
  onCancelReservation: (space: StudioSpace) => void;
  onNavigateToMember?: (memberId: string) => void;
}

export function SpaceCellPopover({
  space,
  cellClass,
  canCancel,
  onCancelReservation,
  onNavigateToMember,
}: SpaceCellPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (pinned) return;
    hoverTimeout.current = setTimeout(() => setOpen(true), 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (!pinned) setOpen(false);
  };

  const handleClick = () => {
    if (pinned) {
      setPinned(false);
      setOpen(false);
    } else {
      setPinned(true);
      setOpen(true);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setPinned(false);
          setOpen(false);
        }
      }}
    >
      <PopoverTrigger
        render={
          <div
            className={cellClass}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          />
        }
      >
        {space.space_number}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-auto p-3"
        align="center"
        onMouseEnter={() => {
          if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        }}
        onMouseLeave={() => {
          if (!pinned) setOpen(false);
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-muted flex size-6 items-center justify-center rounded-full text-[10px] font-medium">
              {space.member_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{space.member_name}</p>
              <p className="text-muted-foreground text-[10px]">スペース {space.space_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => space.reservation_id && onNavigateToMember?.(space.reservation_id)}
            >
              <Users className="mr-1 size-3" />
              会員詳細
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 flex-1 text-xs"
                onClick={() => {
                  onCancelReservation(space);
                  setPinned(false);
                  setOpen(false);
                }}
              >
                <X className="mr-1 size-3" />
                予約取消
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
