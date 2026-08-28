'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Info, Link2, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/use-debounce.hook';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll.hook';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  deleteCrmTrainingEquipmentByEquipmentIdExerciseLinksByExerciseIdMutation,
  getCrmTrainingEquipmentByEquipmentIdExerciseLinksOptions,
  getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey,
  getCrmTrainingEquipmentByEquipmentIdQueryKey,
  getCrmTrainingEquipmentExerciseCandidatesInfiniteOptions,
  getCrmTrainingEquipmentQueryKey,
  postCrmTrainingEquipmentByEquipmentIdExerciseLinksMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmTrainingEquipmentExerciseCandidatesResponse,
  TrainingEquipmentDetail,
  TrainingEquipmentExerciseCandidate,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { useSubmitGuard } from '../../_hooks/use-submit-guard.hook';

/** Sentinel Select value meaning "all" for difficulty / body part (Radix disallows an empty string). */
const ALL_OPTION = 'all';
const CANDIDATE_PAGE_SIZE = 20;

type TrainingEquipmentExerciseLinkSectionProps = {
  equipmentId: string;
  equipment: TrainingEquipmentDetail;
  enabled?: boolean;
};

/** FR-008: viewing, adding and removing exercise links. A tool-type mismatch needs approval. */
export function TrainingEquipmentExerciseLinkSection({
  equipmentId,
  equipment,
  enabled = true,
}: TrainingEquipmentExerciseLinkSectionProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [unlinkTargetId, setUnlinkTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState(ALL_OPTION);
  const [bodyPartFilter, setBodyPartFilter] = useState(ALL_OPTION);
  const candidateScrollRef = useRef<HTMLDivElement>(null);
  // The candidate list swaps out as the search changes, so the selection holds the chosen candidates themselves.
  const [selectedCandidates, setSelectedCandidates] = useState<
    Map<string, TrainingEquipmentExerciseCandidate>
  >(new Map());
  const [mismatchConfirmOpen, setMismatchConfirmOpen] = useState(false);

  const {
    data: linksRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getCrmTrainingEquipmentByEquipmentIdExerciseLinksOptions({ path: { equipmentId } }),
    enabled,
  });
  const links = useMemo(() => linksRes?.items ?? [], [linksRes?.items]);

  // The candidate list can be the whole catalog, so keyword, difficulty and body part are all
  // filtered server-side and more rows load via infinite scroll (linked rows are excluded server-side too).
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const {
    data: candidatesRes,
    isFetching: isFetchingCandidates,
    isFetchingNextPage: isLoadingMoreCandidates,
    hasNextPage: hasMoreCandidates,
    fetchNextPage: fetchMoreCandidates,
  } = useInfiniteQuery({
    ...getCrmTrainingEquipmentExerciseCandidatesInfiniteOptions({
      query: {
        limit: CANDIDATE_PAGE_SIZE,
        keyword: debouncedSearchQuery || undefined,
        difficulty: difficultyFilter === ALL_OPTION ? undefined : difficultyFilter,
        bodyPart: bodyPartFilter === ALL_OPTION ? undefined : bodyPartFilter,
        excludeLinkedEquipmentId: equipmentId,
      },
    }),
    enabled: enabled && addOpen,
    // Without this the data (and with it the filter option lists) blanks out on every refetch: the
    // Select then finds no item matching its value and resets itself to 「全難易度」, so choosing a
    // difficulty or body part immediately undid itself.
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: GetCrmTrainingEquipmentExerciseCandidatesResponse,
      allPages: GetCrmTrainingEquipmentExerciseCandidatesResponse[],
    ) => {
      const currentPage = allPages.length;
      return currentPage < lastPage.pagination.totalPages ? currentPage + 1 : undefined;
    },
  });
  const candidates = useMemo(
    () => candidatesRes?.pages.flatMap((page) => page.items) ?? [],
    [candidatesRes],
  );
  // The options are derived from the whole catalog, so every page returns the same set.
  const difficultyOptions = candidatesRes?.pages[0]?.filters.difficulties ?? [];
  const bodyPartOptions = candidatesRes?.pages[0]?.filters.bodyParts ?? [];

  const candidateSentinelRef = useInfiniteScroll<HTMLTableRowElement>({
    hasMore: Boolean(hasMoreCandidates),
    isLoading: isFetchingCandidates,
    onLoadMore: () => void fetchMoreCandidates(),
    rootRef: candidateScrollRef,
    enabled: addOpen,
  });

  const toggleSelection = (candidate: TrainingEquipmentExerciseCandidate) => {
    setSelectedCandidates((prev) => {
      const next = new Map(prev);
      if (!next.delete(candidate.exerciseId)) next.set(candidate.exerciseId, candidate);
      return next;
    });
  };
  const selectedIds = useMemo(() => [...selectedCandidates.keys()], [selectedCandidates]);
  const selectedCount = selectedCandidates.size;

  const resetAddForm = () => {
    setSelectedCandidates(new Map());
    setSearchQuery('');
    setDifficultyFilter(ALL_OPTION);
    setBodyPartFilter(ALL_OPTION);
    setMismatchConfirmOpen(false);
    setAddOpen(false);
  };

  const invalidateLinks = () => {
    queryClient.invalidateQueries({
      queryKey: getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey({
        path: { equipmentId },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: getCrmTrainingEquipmentByEquipmentIdQueryKey({ path: { equipmentId } }),
    });
    queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
  };

  const addLinksMutation = useMutation({
    ...postCrmTrainingEquipmentByEquipmentIdExerciseLinksMutation(),
    onSuccess: () => {
      toast.success('エクササイズを追加しました');
      resetAddForm();
      invalidateLinks();
    },
  });

  const unlinkMutation = useMutation({
    ...deleteCrmTrainingEquipmentByEquipmentIdExerciseLinksByExerciseIdMutation(),
    onSuccess: () => {
      toast.success('紐づけを解除しました');
      invalidateLinks();
    },
  });

  const hasSelectedMismatch = useMemo(
    () =>
      [...selectedCandidates.values()].some(
        (candidate) => candidate.mstToolId !== equipment.mstToolId,
      ),
    [equipment.mstToolId, selectedCandidates],
  );

  const { submitOnce: addOnce, resetSubmitGuard: resetAddGuard } = useSubmitGuard(
    addLinksMutation.isPending,
    addLinksMutation.isError,
  );
  const { submitOnce: unlinkOnce, resetSubmitGuard: resetUnlinkGuard } = useSubmitGuard(
    unlinkMutation.isPending,
    unlinkMutation.isError,
  );

  // Each reopened confirm is a new attempt: the guard only blocks repeated clicks within one attempt.
  useEffect(() => {
    if (addOpen) resetAddGuard();
  }, [addOpen, resetAddGuard]);

  useEffect(() => {
    if (unlinkTargetId !== null) resetUnlinkGuard();
  }, [unlinkTargetId, resetUnlinkGuard]);

  const commitAdd = (force = false) => {
    addOnce(() =>
      addLinksMutation.mutate({
        path: { equipmentId },
        body: { exerciseIds: selectedIds, ...(force ? { force: true } : {}) },
      }),
    );
  };

  const handleAdd = () => {
    if (selectedCount === 0) return;
    if (hasSelectedMismatch) {
      setMismatchConfirmOpen(true);
      return;
    }
    commitAdd();
  };

  if (isLoading || isError) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={false}
        onRetry={() => refetch()}
        errorTitle="エクササイズ紐づけの取得に失敗しました"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="size-4" />
        <AlertDescription className="text-xs">
          この紐づけはエクササイズ管理画面からも編集できます（双方向同期）
        </AlertDescription>
      </Alert>

      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-muted-foreground text-sm">
            この機材（器具種別: <strong className="text-foreground">{equipment.toolName}</strong>
            ）に紐づいているエクササイズです。
          </p>
          <RoleGatedButton
            requiredPermission={Permission.TrainingEquipmentExerciseLinks}
            denyTooltip="エクササイズ紐づけの設定権限がありません"
            size="sm"
            className="gap-1"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" />
            エクササイズを追加
          </RoleGatedButton>
        </div>

        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Link2 className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">紐づいているエクササイズはありません</p>
            <RoleGatedButton
              requiredPermission={Permission.TrainingEquipmentExerciseLinks}
              denyTooltip="エクササイズ紐づけの設定権限がありません"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setAddOpen(true)}
            >
              エクササイズを追加する
            </RoleGatedButton>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">ID</TableHead>
                <TableHead className="text-xs font-semibold">エクササイズ名</TableHead>
                <TableHead className="text-xs font-semibold">器具種別</TableHead>
                <TableHead className="text-xs font-semibold">難易度</TableHead>
                <TableHead className="text-xs font-semibold">部位</TableHead>
                <TableHead className="w-16 text-xs font-semibold" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.exerciseId}>
                  <TableCell className="text-muted-foreground text-xs">{link.exerciseId}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {/* FR-004: clicking the exercise name navigates to the Y-08 exercise detail. */}
                    <Link
                      href={navigate('/exercises/[id]', link.exerciseId)}
                      className="hover:text-primary hover:underline"
                    >
                      {link.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {link.toolName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{link.difficulty ?? '—'}</TableCell>
                  <TableCell className="text-sm">{link.bodyPart ?? '—'}</TableCell>
                  <TableCell>
                    <RoleGatedButton
                      requiredPermission={Permission.TrainingEquipmentExerciseLinks}
                      denyTooltip="エクササイズ紐づけの解除権限がありません"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive size-7"
                      onClick={() => setUnlinkTargetId(link.exerciseId)}
                    >
                      <Trash2 className="size-4" />
                    </RoleGatedButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden sm:max-w-180">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base">エクササイズを追加</DialogTitle>
            <DialogDescription>
              この機材の器具種別「{equipment.toolName}」と一致するエクササイズのみ紐付けできます。
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2">
            <div className="flex shrink-0 gap-2">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  placeholder="エクササイズ名で検索"
                  className="h-8 pl-8 text-sm"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <Select
                value={difficultyFilter}
                onValueChange={(value) => setDifficultyFilter(value || ALL_OPTION)}
              >
                <SelectTrigger className="h-8 w-30 text-xs">
                  <SelectValue>
                    {difficultyFilter === ALL_OPTION ? '全難易度' : difficultyFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>全難易度</SelectItem>
                  {difficultyOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={bodyPartFilter}
                onValueChange={(value) => setBodyPartFilter(value || ALL_OPTION)}
              >
                <SelectTrigger className="h-8 w-30 text-xs">
                  <SelectValue>
                    {bodyPartFilter === ALL_OPTION ? '全部位' : bodyPartFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>全部位</SelectItem>
                  {bodyPartOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              ref={candidateScrollRef}
              className="min-h-0 flex-1 overflow-auto rounded-md border"
            >
              <Table containerClassName="overflow-visible" className="min-w-150">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-muted sticky top-0 z-10 w-10 px-4 text-xs font-semibold" />
                    <TableHead className="bg-muted sticky top-0 z-10 text-xs font-semibold">
                      エクササイズ名
                    </TableHead>
                    <TableHead className="bg-muted sticky top-0 z-10 w-35 text-xs font-semibold">
                      器具種別
                    </TableHead>
                    <TableHead className="bg-muted sticky top-0 z-10 w-18 text-xs font-semibold">
                      難易度
                    </TableHead>
                    <TableHead className="bg-muted sticky top-0 z-10 w-18 text-xs font-semibold">
                      部位
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-b">
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-8 text-center text-sm"
                      >
                        {isFetchingCandidates ? '検索中...' : '該当するエクササイズがありません'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((candidate) => {
                      const isToolMismatch = candidate.mstToolId !== equipment.mstToolId;
                      const isSelected = selectedCandidates.has(candidate.exerciseId);
                      return (
                        <TableRow
                          key={candidate.exerciseId}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                          onClick={() => toggleSelection(candidate)}
                        >
                          <TableCell className="px-4" onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(candidate)}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {candidate.name}
                              {isToolMismatch && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger render={<span className="inline-flex" />}>
                                      <Badge
                                        variant="outline"
                                        className="bg-warning/15 text-warning border-warning/20 cursor-help gap-1 text-[10px]"
                                      >
                                        <TriangleAlert className="size-3" />
                                        種別不一致
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-55">
                                      <p className="text-xs">
                                        このエクササイズの器具種別（{candidate.toolName}
                                        ）がこの機材の器具種別（{equipment.toolName}
                                        ）と異なります
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {candidate.toolName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{candidate.difficulty ?? '—'}</TableCell>
                          <TableCell className="text-sm">{candidate.bodyPart ?? '—'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {hasMoreCandidates && (
                    <TableRow ref={candidateSentinelRef} className="hover:bg-transparent">
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-4 text-center text-xs"
                      >
                        {isLoadingMoreCandidates ? '読み込み中...' : ' '}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="shrink-0 sm:justify-between">
            <p className="text-muted-foreground self-center text-sm">
              {selectedCount > 0 ? (
                <>
                  <strong className="text-foreground">{selectedCount}件</strong>選択中
                </>
              ) : (
                'エクササイズを選択してください'
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleAdd}
                disabled={selectedCount === 0 || addLinksMutation.isPending}
              >
                追加（{selectedCount}件）
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mismatchConfirmOpen} onOpenChange={setMismatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>器具種別が一致していません</AlertDialogTitle>
            <AlertDialogDescription>
              選択したエクササイズに、この機材の器具種別（{equipment.toolName}
              ）と一致しないものが含まれています。承認した場合のみ保存されます。このまま紐づけますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => commitAdd(true)}
              disabled={addLinksMutation.isPending}
            >
              承認して追加
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={unlinkTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setUnlinkTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>紐づけを解除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このエクササイズとの紐づけを解除します。解除後もエクササイズ自体は削除されません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (unlinkTargetId) {
                  const exerciseId = unlinkTargetId;
                  unlinkOnce(() => unlinkMutation.mutate({ path: { equipmentId, exerciseId } }));
                }
                setUnlinkTargetId(null);
              }}
            >
              解除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
