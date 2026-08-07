'use client';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdUsageHistoryAccessSettingsOptions } from '@/lib/api/@tanstack/react-query.gen';

import { getAuthMethodLabel } from './auth-method-label';

interface AccessSettingsCardProps {
  readonly memberId: string;
}

export function AccessSettingsCard(props: AccessSettingsCardProps) {
  const { memberId } = props;
  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    getCrmMembersByIdUsageHistoryAccessSettingsOptions({
      path: { id: memberId },
    }),
  );

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!settings}
      onRetry={() => {
        void refetch();
      }}
      skeleton={
        <Card className="sticky">
          <CardHeader>
            <CardTitle>入退館設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`access-settings-skeleton-${index}`} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      }
    >
      <Card className="sticky">
        <CardHeader>
          <CardTitle>入退館設定</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium">認証方法</span>
            <p className="text-sm font-medium">
              {settings ? getAuthMethodLabel(settings.auth_method) : '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium">ICカード番号</span>
            <p className="font-mono text-sm">{settings?.ic_card_number ?? '—'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium">QRコード</span>
            <p className="font-mono text-sm">{settings?.qr_code ?? '—'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">ゲートストップ</span>
              {/* {settings.gate_stop && onGateStopRelease && (
                <Button variant="outline" size="sm" onClick={onGateStopRelease}>
                  解除
                </Button>
              )} */}
            </div>
            <p
              className={`text-sm ${settings?.gate_stop ? 'text-warning font-medium' : 'text-muted-foreground'}`}
            >
              {settings?.gate_stop ? '設定中' : '設定なし'}
            </p>
          </div>
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}
