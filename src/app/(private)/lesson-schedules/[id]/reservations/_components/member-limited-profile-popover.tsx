'use client';

import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { Reservation } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

interface MemberLimitedProfilePopoverProps {
  reservation: Reservation;
  children: React.ReactNode;
}

const GENDER_LABELS: Record<string, string> = { male: '男性', female: '女性' };

export function MemberLimitedProfilePopover({
  reservation,
  children,
}: MemberLimitedProfilePopoverProps) {
  const router = useRouter();
  const hasPenalty = reservation.penalty_active;
  const hasZeroRemaining = reservation.remaining_sessions === 0;
  const isPayPerVisit = reservation.plan_type === '都度';

  return (
    <Popover>
      <PopoverTrigger render={<span className="inline-flex max-w-full" />}>
        {children}
      </PopoverTrigger>
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
              <p className="text-muted-foreground text-xs">
                会員ID: {reservation.member_id}
                {reservation.age != null && reservation.gender && (
                  <>
                    {' '}
                    ・ {reservation.age}歳・{GENDER_LABELS[reservation.gender]}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Visit stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded p-2">
              <p className="text-muted-foreground text-[10px]">プラン</p>
              <p className="text-xs font-medium">{reservation.plan_type}</p>
            </div>
            {!isPayPerVisit && (
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground text-[10px]">残回数</p>
                <p className={`text-xs font-medium ${hasZeroRemaining ? 'text-destructive' : ''}`}>
                  {hasZeroRemaining ? '0回（不足）' : `${reservation.remaining_sessions}回`}
                </p>
              </div>
            )}
          </div>

          {/* Penalty info */}
          {hasPenalty && reservation.penalty_end_date && (
            <div className="bg-destructive/10 border-destructive/20 rounded border p-2">
              <p className="text-destructive text-xs">
                ペナルティ期間中（{reservation.penalty_end_date}まで）
              </p>
            </div>
          )}

          {/* Fitness summary */}
          {(reservation.visit_frequency || reservation.last_visit_date) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground text-[10px]">来館頻度</p>
                <p className="text-xs font-medium">{reservation.visit_frequency ?? '—'}</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground text-[10px]">最終来館</p>
                <p className="text-xs font-medium">{reservation.last_visit_date ?? '—'}</p>
              </div>
            </div>
          )}

          {/* Lesson history (own sessions only) */}
          {reservation.lesson_history && reservation.lesson_history.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-1 text-[10px]">レッスン履歴（自分担当分）</p>
              <div className="space-y-1">
                {reservation.lesson_history.map((h, i) => (
                  <div key={`${h.date}-${i}`} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {h.date} {h.lesson_name}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        h.attendance === 'attended'
                          ? 'bg-success/10 text-success border-success/20 text-[10px]'
                          : 'bg-destructive/10 text-destructive border-destructive/20 text-[10px]'
                      }
                    >
                      {h.attendance === 'attended' ? '出席' : '欠席'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body data */}
          {reservation.height_cm != null && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground text-[10px]">身長</p>
                <p className="text-xs font-medium">{reservation.height_cm}cm</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground text-[10px]">体重</p>
                <p className="text-xs font-medium">{reservation.weight_kg}kg</p>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground text-[10px]">体脂肪率</p>
                <p className="text-xs font-medium">{reservation.body_fat_pct}%</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between border-t pt-2 text-xs">
            <span className="text-muted-foreground">予約ステータス</span>
            <ReservationStatusBadge status={reservation.status} />
          </div>

          <p className="text-muted-foreground/70 text-[10px]">
            住所・電話番号・メール・契約・支払・入退館情報はここには表示されません。
          </p>

          <Button
            variant="outline"
            size="sm"
            className="h-7 w-full text-xs"
            onClick={() => router.push(navigate('/members/[id]', reservation.member_id))}
          >
            会員詳細を見る →
          </Button>
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
