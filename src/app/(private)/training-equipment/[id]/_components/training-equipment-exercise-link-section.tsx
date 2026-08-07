'use client';

import { useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Link2, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Loading } from '@/components/common/data-state-boundary/loading';
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
  deleteCrmTrainingEquipmentByEquipmentIdExerciseLinksMutation,
  getCrmTrainingEquipmentByEquipmentIdExerciseLinksOptions,
  getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey,
  getCrmTrainingEquipmentByEquipmentIdQueryKey,
  getCrmTrainingEquipmentExercisesOptions,
  getCrmTrainingEquipmentQueryKey,
  postCrmTrainingEquipmentByEquipmentIdExerciseLinksMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { TrainingEquipmentItem } from '@/lib/api/types.gen';

type TrainingEquipmentExerciseLinkSectionProps = {
  equipmentId: string;
  equipment: TrainingEquipmentItem;
  enabled?: boolean;
};

export function TrainingEquipmentExerciseLinkSection({
  equipmentId,
  equipment,
  enabled = true,
}: TrainingEquipmentExerciseLinkSectionProps) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [unlinkTargetId, setUnlinkTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('全難易度');
  const [bodyPartFilter, setBodyPartFilter] = useState('全部位');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mismatchConfirmOpen, setMismatchConfirmOpen] = useState(false);
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };
  const selectedCount = selectedIds.length;
  const clearSelection = () => setSelectedIds([]);
  const { data: linksRes, isLoading } = useQuery({
    ...getCrmTrainingEquipmentByEquipmentIdExerciseLinksOptions({
      path: { equipmentId },
    }),
    enabled,
  });
  const links = useMemo(() => linksRes?.items ?? [], [linksRes?.items]);
  const { data: exercisesRes } = useQuery({
    ...getCrmTrainingEquipmentExercisesOptions(),
    enabled,
  });
  const exerciseCatalog = useMemo(() => exercisesRes?.items ?? [], [exercisesRes?.items]);

  const resetAddForm = () => {
    clearSelection();
    setSearchQuery('');
    setDifficultyFilter('全難易度');
    setBodyPartFilter('全部位');
    setMismatchConfirmOpen(false);
    setAddOpen(false);
  };

  const addLinksMutation = useMutation({
    ...postCrmTrainingEquipmentByEquipmentIdExerciseLinksMutation(),
    onSuccess: () => {
      toast.success('エクササイズを追加しました');
      resetAddForm();
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey({
          path: { equipmentId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdQueryKey({ path: { equipmentId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
    },
    onError: () => toast.error('エクササイズの追加に失敗しました'),
  });

  const unlinkMutation = useMutation({
    ...deleteCrmTrainingEquipmentByEquipmentIdExerciseLinksMutation(),
    onSuccess: () => {
      toast.success('紐づけを解除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdExerciseLinksQueryKey({
          path: { equipmentId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmTrainingEquipmentByEquipmentIdQueryKey({ path: { equipmentId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmTrainingEquipmentQueryKey() });
    },
    onError: () => toast.error('紐づけの解除に失敗しました'),
  });

  const equipmentToolTypeLabel = equipment.tool_name ?? equipment.tool_type;
  const linkedIds = useMemo(() => new Set(links.map((link) => link.exercise_id)), [links]);

  const filteredCandidates = exerciseCatalog.filter((candidate) => {
    if (linkedIds.has(candidate.id)) return false;
    if (searchQuery && !candidate.name.includes(searchQuery)) return false;
    if (difficultyFilter !== '全難易度' && candidate.difficulty !== difficultyFilter) return false;
    if (bodyPartFilter !== '全部位' && candidate.body_part !== bodyPartFilter) return false;
    return true;
  });

  const hasSelectedMismatch = useMemo(
    () =>
      selectedIds.some((id) => {
        const candidate = exerciseCatalog.find((item) => item.id === id);
        return candidate !== undefined && candidate.tool_type !== equipment.tool_type;
      }),
    [equipment.tool_type, exerciseCatalog, selectedIds],
  );

  const commitAdd = (force = false) => {
    addLinksMutation.mutate({
      path: { equipmentId },
      body: { exercise_ids: selectedIds, ...(force ? { force: true } : {}) },
    });
  };

  const handleAdd = () => {
    if (selectedCount === 0) return;
    if (hasSelectedMismatch) {
      setMismatchConfirmOpen(true);
      return;
    }
    commitAdd();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="size-4" />
        <AlertDescription className="text-xs">
          この紐づけは Y-08 エクササイズ管理画面からも編集できます（双方向同期）
        </AlertDescription>
      </Alert>

      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-muted-foreground text-sm">
            この機材（器具種別:{' '}
            <strong className="text-foreground">{equipmentToolTypeLabel}</strong>
            ）に紐づいているエクササイズです。
          </p>
          <Button size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            エクササイズを追加
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Link2 className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">紐づいているエクササイズはありません</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setAddOpen(true)}>
              エクササイズを追加する
            </Button>
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
                <TableRow key={link.exercise_id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {link.exercise_id}
                  </TableCell>
                  <TableCell className="hover:text-primary text-sm font-medium">
                    {link.exercise_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {link.exercise_tool_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{link.difficulty ?? '—'}</TableCell>
                  <TableCell className="text-sm">{link.body_part ?? '—'}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive size-7"
                              onClick={() => setUnlinkTargetId(link.exercise_id)}
                            />
                          }
                        >
                          <Trash2 className="size-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">紐づけを解除</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden sm:max-w-[720px]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base">エクササイズを追加</DialogTitle>
            <DialogDescription>
              この機材の器具種別「{equipmentToolTypeLabel}
              」と一致するエクササイズのみ紐付けできます。
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
                onValueChange={(value) => setDifficultyFilter(value ?? '全難易度')}
              >
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['全難易度', '初級', '中級', '上級'].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={bodyPartFilter}
                onValueChange={(value) => setBodyPartFilter(value ?? '全部位')}
              >
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['全部位', '胸', '背中', '肩', '腕', '脚', '体幹'].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-md border">
              <Table containerClassName="overflow-visible" className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="bg-muted sticky top-0 z-10 w-10 px-4 text-xs font-semibold" />
                    <TableHead className="bg-muted sticky top-0 z-10 text-xs font-semibold">
                      エクササイズ名
                    </TableHead>
                    <TableHead className="bg-muted sticky top-0 z-10 w-[140px] text-xs font-semibold">
                      器具種別
                    </TableHead>
                    <TableHead className="bg-muted sticky top-0 z-10 w-[72px] text-xs font-semibold">
                      難易度
                    </TableHead>
                    <TableHead className="bg-muted sticky top-0 z-10 w-[72px] text-xs font-semibold">
                      部位
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-b">
                  {filteredCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-8 text-center text-sm"
                      >
                        該当するエクササイズがありません
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidates.map((candidate) => {
                      const isToolMismatch = candidate.tool_type !== equipment.tool_type;
                      const isSelected = selectedIds.includes(candidate.id);
                      return (
                        <TableRow
                          key={candidate.id}
                          className={`cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                          onClick={() => toggleSelection(candidate.id)}
                        >
                          <TableCell className="px-4" onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(candidate.id)}
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
                                    <TooltipContent className="max-w-[220px]">
                                      <p className="text-xs">
                                        このエクササイズの器具種別（{candidate.tool_name}
                                        ）がこの機材の器具種別（{equipmentToolTypeLabel}
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
                              {candidate.tool_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{candidate.difficulty}</TableCell>
                          <TableCell className="text-sm">{candidate.body_part}</TableCell>
                        </TableRow>
                      );
                    })
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
              選択したエクササイズに、この機材の器具種別（{equipmentToolTypeLabel}
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
                  unlinkMutation.mutate({
                    path: { equipmentId },
                    query: { exerciseId: unlinkTargetId },
                  });
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
