'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmFamilyRegistrationsDashboardOptions } from '@/lib/api/@tanstack/react-query.gen';

type Period = 'this_month' | 'last_3_months' | 'last_year';

interface FamilyRegistrationsPrimaryAnalysisProps {
  period: Period;
}

function SkeletonRows() {
  return (
    <div className="grid grid-cols-2 gap-x-4">
      {[0, 1].map((col) => (
        <div key={col} className="overflow-hidden rounded-md border">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, row) => (
              <div
                key={row}
                className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 px-3 py-2.5"
              >
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-3 w-full max-w-[120px]" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FamilyRegistrationsPrimaryAnalysis({
  period,
}: FamilyRegistrationsPrimaryAnalysisProps) {
  const { isLoading, data } = useQuery(
    getCrmFamilyRegistrationsDashboardOptions({ query: { period } }),
  );

  const topMembers = data?.top_primary_members ?? [];

  return (
    <div className="space-y-4 px-4">
      {/* TOP10 家族会員が多い主会員 */}
      <Card className="gap-0 rounded-lg py-0 shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Users className="size-4" />
              家族会員が多い主会員TOP10
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              平均家族数：
              <span className="ml-1 font-semibold">{data?.avg_children_per_primary ?? 0}人</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <SkeletonRows />
          ) : topMembers.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">データがありません</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4">
              {[
                topMembers.slice(0, Math.ceil(topMembers.length / 2)),
                topMembers.slice(Math.ceil(topMembers.length / 2)),
              ].map((columnMembers, colIndex) => (
                <div key={colIndex} className="overflow-hidden rounded-md border">
                  <div className="divide-y">
                    {columnMembers.map((member, rowIndex) => {
                      const index = colIndex * Math.ceil(topMembers.length / 2) + rowIndex;
                      return (
                        <div
                          key={member.primary_member_id}
                          className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 px-3 py-2.5"
                        >
                          <span
                            className={`inline-flex size-5 items-center justify-center rounded-full text-xs font-bold ${
                              index === 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : index === 1
                                  ? 'bg-gray-100 text-gray-600'
                                  : index === 2
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="truncate text-sm">{member.primary_member_name}</span>
                          <span className="text-foreground shrink-0 text-sm font-semibold">
                            {member.family_count}人
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
