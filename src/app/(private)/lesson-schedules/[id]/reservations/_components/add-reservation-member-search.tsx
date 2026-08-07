'use client';

import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Check, Search, UserRoundPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { getCrmLessonSchedulesByScheduleIdMembersSearchOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { MemberSearchResult } from '@/lib/api/types.gen';

interface AddReservationMemberSearchProps {
  scheduleId: string;
  addedMemberIds: string[];
  remainingSeats: number;
  onAdd: (member: MemberSearchResult) => void;
}

export function AddReservationMemberSearch({
  scheduleId,
  addedMemberIds,
  remainingSeats,
  onAdd,
}: AddReservationMemberSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    ...getCrmLessonSchedulesByScheduleIdMembersSearchOptions({
      path: { scheduleId },
      query: { q: debouncedQuery },
    }),
    enabled: debouncedQuery.length > 0,
  });

  const members = searchQuery.data?.members ?? [];

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">会員検索（氏名・会員ID）</Label>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="会員名または会員番号で検索"
          className="h-9 pl-9 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {debouncedQuery.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[90px] text-xs font-semibold">会員番号</TableHead>
                <TableHead className="text-xs font-semibold">会員名</TableHead>
                <TableHead className="text-xs font-semibold">残回数</TableHead>
                <TableHead className="w-[80px] text-xs font-semibold" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground h-16 text-center text-xs">
                    {searchQuery.isLoading ? '検索中...' : '該当する会員が見つかりません'}
                  </TableCell>
                </TableRow>
              ) : (
                members.slice(0, 5).map((m) => {
                  const isAdded = addedMemberIds.includes(m.member_id);
                  const isDisabled = m.remaining_sessions === 0 || m.penalty_active;
                  return (
                    <TableRow key={m.member_id} className={isAdded ? 'bg-success/10' : undefined}>
                      <TableCell className="text-muted-foreground text-xs">{m.member_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{m.name}</span>
                          {m.penalty_active && m.penalty_end_date && (
                            <span className="text-destructive text-[10px]">
                              ペナルティ中（{m.penalty_end_date}まで）
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {m.remaining_sessions === 0 ? (
                          <span className="text-destructive text-xs font-medium">0回</span>
                        ) : (
                          <span className="text-xs">{m.remaining_sessions}回</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdded ? (
                          <span className="text-success flex items-center gap-1 text-xs font-medium">
                            <Check className="size-3" />
                            追加済み
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onAdd(m)}
                            disabled={remainingSeats <= 0 || isDisabled}
                          >
                            <UserRoundPlus className="mr-1 size-3" />
                            追加
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
