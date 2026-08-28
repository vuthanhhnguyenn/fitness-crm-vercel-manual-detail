'use client';

import { useQuery } from '@tanstack/react-query';
import { LineChart as LineChartIcon } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Card } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmEntryExitLogsHourlySummaryOptions } from '@/lib/api/@tanstack/react-query.gen';

const HOURLY_CHART_CONFIG = {
  count: {
    label: '入館者数',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface HourlyEntryChartProps {
  date?: string;
  storeId?: string;
  /** Set to false while the caller's store scope is still resolving, to avoid an extra fetch. */
  enabled?: boolean;
}

/** FR-B01-08: hourly entry-count chart (06:00-22:00) with the current hour highlighted. */
export function HourlyEntryChart({
  date,
  storeId,
  enabled = true,
}: Readonly<HourlyEntryChartProps>) {
  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmEntryExitLogsHourlySummaryOptions({
      query: {
        ...(date ? { date } : {}),
        ...(storeId ? { store_id: storeId } : {}),
      },
    }),
    enabled,
  });

  const hourlyEntries = data?.data ?? [];
  const currentHour = new Date().getHours();

  return (
    <Card className="shrink-0 gap-0 overflow-hidden py-0">
      <div className="flex items-center gap-2 px-4 py-2">
        <LineChartIcon className="text-muted-foreground size-4" />
        <span className="text-sm font-semibold">時間帯別入館者数</span>
      </div>
      <div className="border-t px-4 py-3">
        <DataStateBoundary
          isLoading={isLoading || !enabled}
          isError={isError}
          isEmpty={false}
          onRetry={refetch}
          errorTitle="時間帯別入館者数の取得に失敗しました"
          skeleton={<Skeleton className="h-[180px] w-full" />}
        >
          <ChartContainer config={HOURLY_CHART_CONFIG} className="h-[180px] w-full">
            <LineChart
              accessibilityLayer
              data={hourlyEntries}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={Number(y) + 10}
                    textAnchor="middle"
                    fill={
                      payload.value === currentHour
                        ? 'var(--destructive)'
                        : 'var(--muted-foreground)'
                    }
                    fontWeight={payload.value === currentHour ? '700' : '400'}
                    fontSize={10}
                  >
                    {`${payload.value}時`}
                  </text>
                )}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickCount={3}
                tickMargin={4}
                fontSize={10}
                width={36}
                tickFormatter={(value) => `${value}人`}
              />
              <ReferenceLine
                x={currentHour}
                stroke="var(--destructive)"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: '現在',
                  position: 'top',
                  fill: 'var(--destructive)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
              <ChartTooltip
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value}人`, '入館者数']}
                    labelFormatter={(label) => `${label}:00`}
                  />
                }
              />
              <Line
                type="natural"
                dataKey="count"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        </DataStateBoundary>
      </div>
    </Card>
  );
}
