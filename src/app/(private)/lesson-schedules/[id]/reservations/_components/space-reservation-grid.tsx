'use client';

import { memo, useMemo } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { LessonScheduleListItem, StudioSpaceGridResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { isOwnSessionScope } from '../_utils/session-scope.util';
import { GridLegend } from './grid-legend';
import { SpaceCellPopover } from './space-cell-popover';

/** Available (bookable) seat — click adds a reservation. Memoized so hovering
 * one cell never re-renders its siblings. */
const AvailableCell = memo(function AvailableCell({
  spaceNumber,
  seatNumber,
  cellClass,
  onAddReservation,
}: Readonly<{
  spaceNumber: string;
  seatNumber?: number;
  cellClass: string;
  onAddReservation: (spaceNumber: string) => void;
}>) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<div className={cellClass} onClick={() => onAddReservation(spaceNumber)} />}
      >
        {seatNumber}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>空き — クリックで予約追加</p>
      </TooltipContent>
    </Tooltip>
  );
});

interface SpaceReservationGridProps {
  schedule: LessonScheduleListItem;
  data: StudioSpaceGridResponse;
  onAddReservation: (spaceNumber: string) => void;
  onCancelReservation: (reservationId: string, memberName: string) => void;
  onNavigateToMember?: (memberId: string) => void;
}

export function SpaceReservationGrid({
  schedule,
  data,
  onAddReservation,
  onCancelReservation,
  onNavigateToMember,
}: SpaceReservationGridProps) {
  const { spaces, grid_cols } = data;
  const cols = grid_cols || 8;
  const { hasPermission, user } = useAuthUser();
  const canManageReservation =
    hasPermission(Permission.LessonsReservationManage) && isOwnSessionScope(user, schedule);

  const { orderedSpaces, seatNumberById, reservedCount, totalSeats } = useMemo(() => {
    // Render seats in configured (row, col) order so the grid reflects the studio layout
    // rather than the incoming array order.
    const ordered = [...spaces].sort((a, b) => a.row * cols + a.col - (b.row * cols + b.col));

    // Number seats continuously 1..N in reading order (left-to-right, top-to-bottom);
    // only bookable seats (available/reserved) get a number — equipment/pillar stay label-only.
    const byId = new Map<string, number>();
    let counter = 0;
    let reserved = 0;
    for (const space of ordered) {
      if (space.type === 'available' || space.type === 'reserved') {
        byId.set(space.id, ++counter);
        if (space.type === 'reserved') reserved += 1;
      }
    }
    return {
      orderedSpaces: ordered,
      seatNumberById: byId,
      reservedCount: reserved,
      totalSeats: counter,
    };
  }, [spaces, cols]);

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div
          className="grid w-fit justify-center gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 3rem)` }}
        >
          {orderedSpaces.map((space) => {
            const isReserved = space.type === 'reserved';
            const isEquip = space.type === 'equipment';
            const isFixed = space.type === 'fixed_structure';
            const isAvailable = space.type === 'available';

            let cls =
              'size-12 rounded flex items-center justify-center text-xs font-medium border transition-colors select-none ';

            if (isEquip) {
              cls += 'bg-warning/15 text-warning border-warning/20';
            } else if (isFixed) {
              cls += 'bg-muted text-muted-foreground border-border';
            } else if (isReserved) {
              cls +=
                'bg-chart-2/20 text-chart-2 border-chart-2/30 cursor-pointer hover:bg-chart-2/30';
            } else if (canManageReservation) {
              cls +=
                'bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20';
            } else {
              cls += 'bg-success/10 text-success border-success/20';
            }

            if (isEquip) {
              return (
                <div key={space.id} className={cls}>
                  器材
                </div>
              );
            }

            if (isFixed) {
              return (
                <div key={space.id} className={cls}>
                  柱
                </div>
              );
            }

            const seatNumber = seatNumberById.get(space.id);

            if (isAvailable) {
              if (!canManageReservation) {
                return (
                  <div key={space.id} className={cls}>
                    {seatNumber}
                  </div>
                );
              }
              return (
                <AvailableCell
                  key={space.id}
                  spaceNumber={space.space_number}
                  seatNumber={seatNumber}
                  cellClass={cls}
                  onAddReservation={onAddReservation}
                />
              );
            }

            // Reserved
            return (
              <SpaceCellPopover
                key={space.id}
                space={space}
                seatNumber={seatNumber}
                cellClass={cls}
                canCancel={canManageReservation}
                onCancelReservation={(s) =>
                  onCancelReservation(s.reservation_id ?? '', s.member_name ?? '')
                }
                onNavigateToMember={onNavigateToMember}
              />
            );
          })}
        </div>
      </div>

      <div className="bg-muted/50 -mx-4 mt-4 -mb-4 flex items-center justify-between rounded-b-xl border-t px-4 py-3">
        <GridLegend />
        <span className="text-muted-foreground text-xs">
          {reservedCount}/{totalSeats} 予約済（残り{totalSeats - reservedCount}席）
        </span>
      </div>
    </TooltipProvider>
  );
}
