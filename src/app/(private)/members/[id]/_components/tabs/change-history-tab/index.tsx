'use client';

import { useState } from 'react';

import { PAGE_SIZE } from '@/constants/app.constants';
import { formatDateTime } from '@/utils/format.util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmMembersByIdChangeHistoryOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersByIdChangeHistoryResponse } from '@/lib/api/types.gen';

import { getMemberStatusClassByLabel } from '../../../../_constants/constants';

type ChangeHistoryItem = GetCrmMembersByIdChangeHistoryResponse['items'][number];
type FieldChange = ChangeHistoryItem['changes'][number];

/** Prototype highlights the record that created the member; our mock carries it in `action`. */
const CREATE_ACTION = '新規作成';

function renderValue(value: string | null, isStatusAfter: boolean, isCreateAction = false) {
  if (value === null || value === '') {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  if (isCreateAction) {
    return (
      <Badge variant="outline" className="bg-info/15 text-info border-info/20 text-xs font-medium">
        {value}
      </Badge>
    );
  }
  if (isStatusAfter) {
    return (
      <Badge
        variant="outline"
        className={`gap-1 text-xs font-medium ${getMemberStatusClassByLabel(value)}`}
      >
        <span className="size-1.5 rounded-full bg-current" />
        {value}
      </Badge>
    );
  }
  return value;
}

function ChangeRow({
  item,
  change,
  changeIndex,
}: {
  item: ChangeHistoryItem;
  change: FieldChange;
  changeIndex: number;
}) {
  const isStatus = change.fieldCode === 'status';
  return (
    <TableRow>
      {changeIndex === 0 ? (
        <>
          <TableCell className="align-top text-sm" rowSpan={item.changes.length}>
            {formatDateTime(item.changedAt)}
          </TableCell>
          <TableCell className="align-top text-sm" rowSpan={item.changes.length}>
            {item.operatorName}
          </TableCell>
        </>
      ) : null}
      <TableCell className="text-sm font-medium">
        {change.field || <span className="text-muted-foreground">&mdash;</span>}
      </TableCell>
      <TableCell className="max-w-xs truncate text-sm">
        {renderValue(change.before, false)}
      </TableCell>
      <TableCell className="text-center">
        <ArrowRight className="text-muted-foreground inline size-4" />
      </TableCell>
      <TableCell className="max-w-xs truncate text-sm">
        {renderValue(change.after, isStatus, item.action === CREATE_ACTION)}
      </TableCell>
    </TableRow>
  );
}

export function ChangeHistoryTab({ memberId }: { memberId: string }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    ...getCrmMembersByIdChangeHistoryOptions({
      path: { id: memberId },
      query: { page, limit: PAGE_SIZE },
    }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_SIZE;
  const totalPages = Math.ceil(total / limit);

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data}
      onRetry={() => refetch()}
    >
      {data ? (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">更新日時</TableHead>
                <TableHead className="text-xs font-semibold">操作者</TableHead>
                <TableHead className="text-xs font-semibold">変更フィールド</TableHead>
                <TableHead className="text-xs font-semibold">変更前</TableHead>
                <TableHead className="w-12 text-center text-xs font-semibold" />
                <TableHead className="text-xs font-semibold">変更後</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                    変更履歴はありません
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) =>
                  item.changes.length === 0 ? (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{formatDateTime(item.changedAt)}</TableCell>
                      <TableCell className="text-sm">{item.operatorName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm" colSpan={4}>
                        {item.action || <span>&mdash;</span>}
                      </TableCell>
                    </TableRow>
                  ) : (
                    item.changes.map((change, changeIndex) => (
                      <ChangeRow
                        key={`${item.id}-${changeIndex}`}
                        item={item}
                        change={change}
                        changeIndex={changeIndex}
                      />
                    ))
                  ),
                )
              )}
            </TableBody>
          </Table>
          <CardContent className="px-0 py-0">
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              isLoading={isFetching}
            />
          </CardContent>
        </Card>
      ) : null}
    </DataStateBoundary>
  );
}
