import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { BlacklistSourceBadge } from '../../_components/blacklist-source-badge';
import type { BlacklistDetail } from '../../_constants/blacklist.constants';

interface BlacklistDetailInfoProps {
  blacklist: BlacklistDetail;
}

function InfoRow({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

/**
 * FR-058 — 登録理由 / 登録日時 / 登録者, plus メモ across both columns.
 *
 * Member identity is deliberately absent: it lives in the head-up card above, so
 * repeating 会員ID / 氏名 / 店舗名 here would duplicate it. V0 does the same.
 */
export function BlacklistDetailInfo({ blacklist }: Readonly<BlacklistDetailInfoProps>) {
  const isReleased = !blacklist.is_active;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">登録情報</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <InfoRow label="登録理由">
            {/* The registration-path axis. The stored reason categories are never shown (FR-043a). */}
            <BlacklistSourceBadge source={blacklist.source} />
          </InfoRow>
          <InfoRow label="登録日時">
            <span className="font-medium">
              {formatDateYYYYMMDD_HHMM(blacklist.registered_at, '—')}
            </span>
          </InfoRow>
          <InfoRow label="登録者">
            <span className="font-medium">{blacklist.registered_by.display_name}</span>
          </InfoRow>

          {/**
           * FR-069b — a released entry has to say who released it and when. Without this
           * the release facts the contract retains for audit would be invisible, and the
           * only route to a released entry is its own URL (FR-069a).
           */}
          {isReleased && (
            <>
              <InfoRow label="解除日時">
                <span className="font-medium">
                  {formatDateYYYYMMDD_HHMM(blacklist.removed_at, '—')}
                </span>
              </InfoRow>
              <InfoRow label="解除者">
                <span className="font-medium">{blacklist.removed_by?.display_name ?? '—'}</span>
              </InfoRow>
            </>
          )}

          <div className="col-span-2">
            <InfoRow label="メモ">
              {/* v0.4 — `memo` is the screen's メモ. Up to v0.3 this slot held 登録理由. */}
              <span className="text-sm">{blacklist.memo || '—'}</span>
            </InfoRow>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
