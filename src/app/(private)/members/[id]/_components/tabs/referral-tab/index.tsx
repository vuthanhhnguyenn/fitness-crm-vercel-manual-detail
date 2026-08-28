'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { formatDate } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdReferralsOptions } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

export function ReferralTab({
  memberId,
  memberName,
}: {
  memberId: string;
  /** Name of the member being viewed, for the two-level-back breadcrumb on the destination page */
  memberName: string;
}) {
  const router = useRouter();
  const parentParams = { parentMemberId: memberId, parentName: memberName };
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdReferralsOptions({
      path: { id: memberId },
    }),
  );

  const referrer = data?.referrer ?? null;
  const invitees = data?.invitees ?? [];
  const stats = data?.stats;
  const isReferralEntry = data?.inboundFlag ?? false;

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
    >
      {data ? (
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Left column: referrer info + invitee list */}
          <div className="w-full space-y-4 md:w-[60%]">
            {/* Join-route flag */}
            {isReferralEntry && (
              <div className="bg-info/10 border-info/20 flex items-center gap-2 rounded-lg border px-3 py-2">
                <Badge
                  variant="outline"
                  className="bg-info/15 text-info border-info/20 text-xs font-medium"
                >
                  紹介経由
                </Badge>
                <p className="text-info text-xs">この会員は紹介を経由して入会しました。</p>
              </div>
            )}

            {/* Referrer info (who referred this member) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">紹介者情報</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {referrer ? (
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">紹介者</p>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-medium"
                      nativeButton={false}
                      render={
                        <Link href={navigate('/members/[id]', referrer.memberId, parentParams)} />
                      }
                    >
                      {referrer.displayName
                        ? `${referrer.displayName}（${referrer.memberNumber}）`
                        : referrer.memberNumber}
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    紹介者なし（紹介経由の入会ではありません）
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Invitee list (who this member referred) */}
            <Card className="gap-0 py-0">
              <CardHeader className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">招待実績</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {invitees.length}件
                  </Badge>
                </div>
              </CardHeader>
              {invitees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold first:pl-4">氏名</TableHead>
                      <TableHead className="text-xs font-semibold">会員ID</TableHead>
                      <TableHead className="text-xs font-semibold">入会日</TableHead>
                      <TableHead className="text-xs font-semibold last:pr-4">特典付与</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitees.map((invitee) => (
                      <TableRow
                        key={invitee.memberId}
                        className="hover:bg-accent/50 cursor-pointer"
                        onClick={() =>
                          router.push(navigate('/members/[id]', invitee.memberId, parentParams))
                        }
                      >
                        {/* The name is a real link so the row is reachable by keyboard too. */}
                        <TableCell className="text-sm font-medium first:pl-4">
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm font-medium"
                            nativeButton={false}
                            render={
                              <Link
                                href={navigate('/members/[id]', invitee.memberId, parentParams)}
                              />
                            }
                          >
                            {invitee.displayName}
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {invitee.memberNumber}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(invitee.joinedAt)}</TableCell>
                        <TableCell className="last:pr-4">
                          {invitee.rewardGranted ? (
                            <Badge
                              variant="outline"
                              className="bg-success/15 text-success border-success/20 text-xs font-medium"
                            >
                              付与済み
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-warning/15 text-warning border-warning/20 text-xs font-medium"
                            >
                              未付与
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-muted-foreground text-sm">招待した会員はいません。</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right column: aggregate summary */}
          <div className="w-full space-y-4 md:w-[40%]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">紹介サマリー</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">招待人数（合計）</p>
                  <p className="text-sm font-medium">{stats?.totalReferred ?? 0}名</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">特典付与済み</p>
                  <p className="text-sm font-medium">{stats?.rewardGrantedCount ?? 0}名</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">特典未付与</p>
                  <p className="text-sm font-medium">{stats?.rewardPendingCount ?? 0}名</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">入会経路</p>
                  {isReferralEntry ? (
                    <Badge
                      variant="outline"
                      className="bg-info/15 text-info border-info/20 text-xs font-medium"
                    >
                      紹介経由
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm">通常入会</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </DataStateBoundary>
  );
}
