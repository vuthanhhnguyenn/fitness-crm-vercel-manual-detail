'use client';

import { formatDate } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdBodyDataOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { BodyDataSource } from '@/lib/api/types.gen';

const SOURCE_LABELS: Record<BodyDataSource, string> = {
  body_planner: 'Body Planner',
  '3d_scanner': '3DScanner',
  manual: '手動入力',
};

const BODY_WEIGHT_CHART_CONFIG = {
  weight: {
    label: '体重',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

function ValueBox({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-bold">
        {value}
        {unit ? <span className="ml-1 text-xs font-normal">{unit}</span> : null}
      </p>
    </div>
  );
}

function MetricItem({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      <p className="text-sm font-medium">
        {value}
        {unit ? ` ${unit}` : ''}
      </p>
    </div>
  );
}

export function BodyDataTab({ memberId }: { memberId: string }) {
  const { data, isLoading, isError, refetch } = useQuery(
    getCrmMembersByIdBodyDataOptions({
      path: { id: memberId },
    }),
  );

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
    >
      {data ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                最新記録サマリー（{formatDate(data.latest.date)}）
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <ValueBox label="体重" value={data.latest.weight} unit="kg" />
                <ValueBox label="BMI" value={data.latest.bmi} />
                <ValueBox label="体脂肪率" value={data.latest.fatPercent} unit="%" />
                <ValueBox label="骨格筋量" value={data.latest.muscleMass} unit="kg" />
                <ValueBox label="基礎代謝量" value={data.latest.basalMetabolism} unit="kcal" />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex w-full flex-col gap-4 md:w-[60%]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    体組成データ
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      {SOURCE_LABELS[data.bodyComposition.source]} 連携
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-4">
                    <MetricItem label="体重" value={data.bodyComposition.weight} unit="kg" />
                    <MetricItem label="BMI" value={data.bodyComposition.bmi} />
                    <MetricItem label="体脂肪率" value={data.bodyComposition.fatPercent} unit="%" />
                    <MetricItem label="体脂肪量" value={data.bodyComposition.fatMass} unit="kg" />
                    <MetricItem
                      label="内臓脂肪指数"
                      value={data.bodyComposition.visceralFatIndex}
                    />
                    <MetricItem label="骨格筋指数(SMI)" value={data.bodyComposition.smi} />
                    <MetricItem
                      label="骨格筋量"
                      value={data.bodyComposition.muscleMass}
                      unit="kg"
                    />
                    <MetricItem label="推定骨量" value={data.bodyComposition.boneMass} unit="kg" />
                    <MetricItem
                      label="水分量"
                      value={data.bodyComposition.waterContent}
                      unit="kg"
                    />
                    <MetricItem
                      label="基礎代謝量"
                      value={data.bodyComposition.basalMetabolism}
                      unit="kcal"
                    />
                    <MetricItem
                      label="除脂肪量"
                      value={data.bodyComposition.leanBodyMass}
                      unit="kg"
                    />
                    <MetricItem
                      label="四肢除脂肪量"
                      value={data.bodyComposition.limbLeanMass}
                      unit="kg"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    身体データ
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      3DScanner 連携 / 手動入力
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-4">
                    <MetricItem label="首周り" value={data.bodyMeasurement.neck} unit="cm" />
                    <MetricItem label="肩幅" value={data.bodyMeasurement.shoulder} unit="cm" />
                    <MetricItem label="胸囲" value={data.bodyMeasurement.chest} unit="cm" />
                    <MetricItem label="腹囲" value={data.bodyMeasurement.waistAbdomen} unit="cm" />
                    <MetricItem label="上腕" value={data.bodyMeasurement.upperArm} unit="cm" />
                    <MetricItem label="前腕" value={data.bodyMeasurement.forearm} unit="cm" />
                    <MetricItem label="腰回り" value={data.bodyMeasurement.waistHip} unit="cm" />
                    <MetricItem label="ヒップ" value={data.bodyMeasurement.hip} unit="cm" />
                    <MetricItem label="太もも" value={data.bodyMeasurement.thigh} unit="cm" />
                    <MetricItem label="ふくらはぎ" value={data.bodyMeasurement.calf} unit="cm" />
                    <MetricItem label="身長" value={data.bodyMeasurement.height} unit="cm" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex w-full flex-col gap-4 md:w-[40%]">
              <Card className="gap-0 py-0">
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm">測定履歴</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">測定日</TableHead>
                      <TableHead className="text-xs font-semibold">データソース</TableHead>
                      <TableHead className="text-right text-xs font-semibold">体重</TableHead>
                      <TableHead className="text-right text-xs font-semibold">体脂肪率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-muted-foreground py-6 text-center text-sm"
                        >
                          まだボディーデータの記録がありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(item.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {SOURCE_LABELS[item.source]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{item.weight} kg</TableCell>
                          <TableCell className="text-right text-sm">{item.fatPercent} %</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-4" />
                    <CardTitle className="text-sm">体重推移</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ChartContainer config={BODY_WEIGHT_CHART_CONFIG} className="h-[180px] w-full">
                    <LineChart
                      data={data.weightChart}
                      margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        fontSize={10}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickCount={4}
                        tickMargin={4}
                        fontSize={10}
                        domain={['auto', 'auto']}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </DataStateBoundary>
  );
}
