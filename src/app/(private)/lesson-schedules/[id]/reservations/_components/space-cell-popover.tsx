'use client';

import { memo, useState } from 'react';

import { Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { StudioSpace } from '@/lib/api/types.gen';

interface SpaceCellPopoverProps {
  space: StudioSpace;
  /** Continuous 1..N seat number in reading order (bookable seats only) */
  seatNumber?: number;
  cellClass: string;
  /** FR-008 — whether the current role may cancel this reservation */
  canCancel: boolean;
  onCancelReservation: (space: StudioSpace) => void;
  onNavigateToMember?: (memberId: string) => void;
}

function SpaceCellPopoverComponent({
  space,
  seatNumber,
  cellClass,
  canCancel,
  onCancelReservation,
  onNavigateToMember,
}: Readonly<SpaceCellPopoverProps>) {
  // Controlled only so cancel/navigate can close the popover programmatically.
  // Hover open/close (and the safe trigger→popup transition) is handled natively
  // by base-ui, so the cursor can travel to the action buttons without it closing.
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        openOnHover
        delay={200}
        closeDelay={150}
        render={<div className={cellClass} />}
      >
        {seatNumber}
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto p-3" align="center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-muted flex size-6 items-center justify-center rounded-full text-[10px] font-medium">
              {space.member_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{space.member_name}</p>
              <p className="text-muted-foreground text-[10px]">スペース {seatNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => {
                if (space.member_id) onNavigateToMember?.(space.member_id);
                setOpen(false);
              }}
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

export const SpaceCellPopover = memo(SpaceCellPopoverComponent);
