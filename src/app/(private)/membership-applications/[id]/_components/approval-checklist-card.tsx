import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { AlertTriangle, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { USAGE_START_WARNING_MONTHS } from '../../_constants/constants';
import type { ApplicationDetail } from './membership-application.utils';
import { isUsageStartWithinTwoMonths } from './membership-application.utils';

interface ApprovalChecklistCardProps {
  app: ApplicationDetail;
}

/** 承認前チェック — only rendered by the caller while status is `pending`. */
export function ApprovalChecklistCard({ app }: Readonly<ApprovalChecklistCardProps>) {
  const isMinor = app.age < 18;
  const usageStartOk = isUsageStartWithinTwoMonths(app);
  // `incomplete` must never read as a passed check — the comparison could not run.
  const blacklistPassed = app.blacklist_state !== 'incomplete';

  return (
    <>
      <Separator className="w-full" />
      <div className="flex w-full flex-col gap-2">
        <span className="text-muted-foreground text-xs font-medium">承認前チェック</span>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {blacklistPassed ? (
              <CheckCircle className="text-success size-4 shrink-0" />
            ) : (
              <AlertTriangle className="text-warning size-4 shrink-0" />
            )}
            <span className={blacklistPassed ? 'text-xs' : 'text-warning text-xs'}>
              {blacklistPassed ? 'ブラックリスト照合完了' : 'ブラックリスト照合未完了'}
            </span>
            {app.blacklist_state === 'matched' && (
              <Badge
                variant="outline"
                className="bg-destructive/15 text-destructive border-destructive/20 ml-auto text-[10px]"
              >
                一致あり
              </Badge>
            )}
          </div>

          {isMinor ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-warning size-4 shrink-0" />
                <span className="text-warning text-xs">
                  未成年（{app.age}歳 / {app.brand_name}: {app.brand_min_age}歳以上）
                </span>
                {app.parental_consent && (
                  <Badge
                    variant="outline"
                    className="bg-success/15 text-success border-success/20 ml-auto text-[10px]"
                  >
                    保護者同意確認済み
                  </Badge>
                )}
              </div>
              {app.parental_consent && app.parental_consent_at && (
                <div className="text-muted-foreground pl-6 text-[10px]">
                  {formatDateYYYYMMDD_HHMM(app.parental_consent_at, '—')} ／{' '}
                  {app.parental_consent_method ?? 'アプリ上の確認チェック'}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="text-success size-4 shrink-0" />
              <span className="text-xs">
                年齢条件: 成人（{app.age}歳 / {app.brand_name}: {app.brand_min_age}歳以上）
              </span>
            </div>
          )}

          {usageStartOk ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="text-success size-4 shrink-0" />
              <span className="text-xs">利用開始日: {USAGE_START_WARNING_MONTHS}ヶ月以内</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-warning size-4 shrink-0" />
              <span className="text-warning text-xs">
                利用開始日: 契約開始日から{USAGE_START_WARNING_MONTHS}ヶ月超（{app.usage_start_date}
                ）
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
