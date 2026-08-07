'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { Reservation } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

interface MemberLimitedProfilePopoverProps {
  reservation: Reservation;
  children: React.ReactNode;
}

export function MemberLimitedProfilePopover({
  reservation,
  children,
}: MemberLimitedProfilePopoverProps) {
  const hasPenalty = reservation.penalty_active;
  const hasZeroRemaining = reservation.remaining_sessions === 0;

  return (
    <Popover>
      <PopoverTrigger render={<span className="contents" />}>{children}</PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="space-y-3 p-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full text-sm font-bold">
              {reservation.member_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{reservation.member_name}</p>
                {hasPenalty && (
                  <Badge
                    variant="secondary"
                    className="bg-destructive/15 text-destructive px-1 py-0 text-[10px]"
                  >
                    ペナルティ中
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">会員ID: {reservation.member_id}</p>
            </div>
          </div>

          {/* Visit stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded p-2">
              <p className="text-muted-foreground text-[10px]">プラン</p>
              <p className="text-xs font-medium">{reservation.plan_type}</p>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <p className="text-muted-foreground text-[10px]">残回数</p>
              <p className={`text-xs font-medium ${hasZeroRemaining ? 'text-destructive' : ''}`}>
                {hasZeroRemaining ? '0回（不足）' : `${reservation.remaining_sessions}回`}
              </p>
            </div>
          </div>

          {/* Penalty info */}
          {hasPenalty && reservation.penalty_end_date && (
            <div className="bg-destructive/10 border-destructive/20 rounded border p-2">
              <p className="text-destructive text-xs">
                ペナルティ期間中（{reservation.penalty_end_date}まで）
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between border-t pt-2 text-xs">
            <span className="text-muted-foreground">予約ステータス</span>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          <Link href={navigate('/members/[id]', reservation.member_id)}>
            <Button variant="outline" size="sm" className="h-7 w-full text-xs">
              会員詳細を見る →
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ReservationStatusBadge({ status }: { status: Reservation['status'] }) {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-[10px]">
          予約済
        </Badge>
      );
    case 'tentative':
      return (
        <Badge
          variant="outline"
          className="bg-warning/10 text-warning border-warning/20 text-[10px]"
        >
          仮予約
        </Badge>
      );
    case 'attended':
      return (
        <Badge
          variant="outline"
          className="bg-success/10 text-success border-success/20 text-[10px]"
        >
          出席確認済
        </Badge>
      );
    case 'no_show':
      return (
        <Badge
          variant="outline"
          className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
        >
          無断キャンセル
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground border-border text-[10px]"
        >
          キャンセル済
        </Badge>
      );
    default:
      return null;
  }
}
