'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Reservation } from '@/lib/api/types.gen';

interface PtLimitedProfileCardProps {
  reservation: Reservation | null;
}

const GENDER_LABELS: Record<string, string> = { male: '男性', female: '女性' };

/** FR-007 L310 / FR-015 — Trainer-facing limited profile shown instead of the space grid + stats for PT sessions. */
export function PtLimitedProfileCard({ reservation }: PtLimitedProfileCardProps) {
  if (!reservation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">予約者の限定プロフィール</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-6 text-center text-xs">予約者はいません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">予約者の限定プロフィール</CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            Trainer向け限定表示
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar + name + basic */}
        <div className="flex items-center gap-3">
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full text-base font-bold">
            {reservation.member_name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold">{reservation.member_name}</p>
            <p className="text-muted-foreground text-xs">
              {reservation.age != null && reservation.gender
                ? `${reservation.age}歳・${GENDER_LABELS[reservation.gender]}`
                : '—'}
            </p>
          </div>
        </div>

        {/* Fitness summary */}
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
          <div>
            <p className="text-muted-foreground mb-1 text-[10px]">ボディデータ</p>
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
          </div>
        )}

        <p className="text-muted-foreground/70 border-t pt-2 text-[10px]">
          住所・電話番号・メール・契約・支払・入退館情報はここには表示されません。
        </p>
      </CardContent>
    </Card>
  );
}
