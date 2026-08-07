'use client';

import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function fetchChangeHistory(memberId: string) {
  const response = await fetch(`/api/crm/members/${memberId}/change-history`);
  if (!response.ok) throw new Error('Failed to fetch change history');
  return response.json();
}

export function ChangeHistoryTab({ memberId }: { memberId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-change-history', memberId],
    queryFn: () => fetchChangeHistory(memberId),
  });

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
    >
      {data ? (
        <div className="space-y-4">
          {data.timeline && data.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>タイムライン</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.timeline.map((item: any) => (
                    <div key={item.id} className="border-b pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.event_type}</p>
                          <p className="text-muted-foreground text-sm">{item.content}</p>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {new Date(item.date).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.membershipHistory && (
            <Card>
              <CardHeader>
                <CardTitle>入会履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm">入会日</p>
                    <p className="mt-1">
                      {new Date(data.membershipHistory.joined_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">入会ルート</p>
                    <p className="mt-1">{data.membershipHistory.join_route}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">入会店舗</p>
                    <p className="mt-1">{data.membershipHistory.join_store}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </DataStateBoundary>
  );
}
