'use client';

import { useAuthUser } from '@/contexts/auth-user.context';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { StudioSpaceGridResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { GridLegend } from './grid-legend';
import { SpaceCellPopover } from './space-cell-popover';

interface SpaceReservationGridProps {
  data: StudioSpaceGridResponse;
  onAddReservation: (spaceNumber: string) => void;
  onCancelReservation: (reservationId: string, memberName: string) => void;
}

export function SpaceReservationGrid({
  data,
  onAddReservation,
  onCancelReservation,
}: SpaceReservationGridProps) {
  const { spaces, grid_cols } = data;
  const { hasPermission } = useAuthUser();
  const canManageReservation = hasPermission(Permission.LessonsReservationManage);
  const reservedCount = spaces.filter((s) => s.type === 'reserved').length;
  const totalSeats = spaces.filter((s) => s.type === 'available' || s.type === 'reserved').length;

  return (
    <div>
      <div
        className="grid justify-center gap-2"
        style={{ gridTemplateColumns: `repeat(${grid_cols || 8}, minmax(0, 3rem))` }}
      >
        {spaces.map((space) => {
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

          if (isAvailable) {
            if (!canManageReservation) {
              return (
                <div key={space.id} className={cls}>
                  {space.space_number}
                </div>
              );
            }
            return (
              <TooltipProvider key={space.id}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div className={cls} onClick={() => onAddReservation(space.space_number)} />
                    }
                  >
                    {space.space_number}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>空き — クリックで予約追加</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          // Reserved
          return (
            <SpaceCellPopover
              key={space.id}
              space={space}
              cellClass={cls}
              canCancel={canManageReservation}
              onCancelReservation={(s) =>
                onCancelReservation(s.reservation_id ?? '', s.member_name ?? '')
              }
            />
          );
        })}
      </div>

      <div className="bg-muted/50 -mx-4 mt-4 -mb-4 flex items-center justify-between rounded-b-xl border-t px-4 py-3">
        <GridLegend />
        <span className="text-muted-foreground text-xs">
          {reservedCount}/{totalSeats} 予約済（残り{totalSeats - reservedCount}席）
        </span>
      </div>
    </div>
  );
}
