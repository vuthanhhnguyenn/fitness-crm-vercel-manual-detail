'use client';

import { formatDate } from '@/utils/format.util';
import { Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { ExerciseMasterListItem } from '@/lib/api/types.gen';

import { toLabel, toStatusBadgeClass } from '../_constants/constants';

interface ExerciseMasterTableProps {
  label: string;
  items: ExerciseMasterListItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (row: ExerciseMasterListItem) => void;
  onDelete: (row: ExerciseMasterListItem) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ExerciseMasterTable({
  label,
  items,
  searchValue,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
  isLoading,
  isError,
  onRetry,
}: ExerciseMasterTableProps) {
  return (
    <Card className="gap-0 overflow-hidden rounded-xl border p-0">
      <div className="border-b px-4 py-3">
        <div className="relative max-w-[420px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchValue}
            placeholder="名称・コードで検索..."
            className="pl-9 text-sm"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[110px] text-xs font-semibold">ID</TableHead>
            <TableHead className="w-[140px] text-xs font-semibold">コード</TableHead>
            <TableHead className="text-xs font-semibold">名称</TableHead>
            <TableHead className="min-w-[240px] text-xs font-semibold">説明</TableHead>
            <TableHead className="w-[70px] text-center text-xs font-semibold">順</TableHead>
            <TableHead className="w-[90px] text-xs font-semibold">参照数</TableHead>
            <TableHead className="w-[90px] text-xs font-semibold">ステータス</TableHead>
            <TableHead className="w-[110px] text-xs font-semibold">更新日</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="h-28">
                <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  読み込み中...
                </div>
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="h-28">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-muted-foreground text-sm">一覧の取得に失敗しました。</p>
                  <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    再読み込み
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="h-36">
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-muted-foreground text-sm">
                    {searchValue ? '該当のデータがありません。' : '登録されたデータはありません。'}
                  </p>
                  {searchValue ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSearchChange('')}
                    >
                      条件をクリア
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1 bg-black text-white hover:bg-black/90"
                      onClick={onCreate}
                    >
                      <Plus className="size-4" />
                      {label}を登録
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                <TableCell className="text-muted-foreground text-xs">{row.id}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.code}</TableCell>
                <TableCell className="text-sm font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-[240px] text-xs">
                  <span className="block truncate">{row.description ?? '—'}</span>
                </TableCell>
                <TableCell className="text-muted-foreground text-center text-xs">
                  {row.sortOrder}
                </TableCell>
                <TableCell className="text-xs">
                  {row.usageCount > 0 ? (
                    <span className="font-medium">{row.usageCount}件</span>
                  ) : (
                    '0件'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={toStatusBadgeClass(row.status)}>
                    {toLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDate(row.updatedAt)}
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" className="size-8" />}
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(row)}>
                        <Pencil className="size-4" />
                        編集
                      </DropdownMenuItem>
                      {row.usageCount > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={<span className="block" />}>
                              <DropdownMenuItem disabled className="text-destructive opacity-50">
                                <Trash2 className="size-4" />
                                削除
                              </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">
                                エクササイズから参照中のため削除できません（{row.usageCount}
                                件使用中）
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="size-4" />
                          削除
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
