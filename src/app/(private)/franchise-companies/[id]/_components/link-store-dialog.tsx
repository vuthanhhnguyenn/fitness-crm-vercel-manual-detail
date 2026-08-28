'use client';

import { useRef } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  getCrmFranchiseCompaniesByIdLinkableStoresOptions,
  getCrmFranchiseCompaniesByIdLinkableStoresQueryKey,
  getCrmFranchiseCompaniesByIdQueryKey,
  getCrmFranchiseCompaniesQueryKey,
  postCrmFranchiseCompaniesByIdStoresMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { STORE_BRAND_DISPLAY_LABELS } from '../_constants/detail.constants';

interface LinkStoreDialogProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkStoreDialog({ companyId, open, onOpenChange }: Readonly<LinkStoreDialogProps>) {
  const queryClient = useQueryClient();
  const isSubmittingRef = useRef(false);

  const { data, isLoading } = useQuery({
    ...getCrmFranchiseCompaniesByIdLinkableStoresOptions({ path: { id: companyId } }),
    enabled: open,
  });
  const stores = data?.stores ?? [];

  const linkMutation = useMutation({
    ...postCrmFranchiseCompaniesByIdStoresMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesByIdQueryKey({ path: { id: companyId } }),
      });
      void queryClient.invalidateQueries({
        queryKey: getCrmFranchiseCompaniesByIdLinkableStoresQueryKey({ path: { id: companyId } }),
      });
      void queryClient.invalidateQueries({ queryKey: getCrmFranchiseCompaniesQueryKey() });
      toast.success('店舗を紐づけました');
    },
    onError: () => {
      toast.error('店舗の紐づけに失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleLink = (storeId: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    linkMutation.mutate({ path: { id: companyId }, body: { store_id: storeId } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">店舗を紐づける</DialogTitle>
          <p className="text-muted-foreground text-xs">
            店舗の紐づけ・解除は本部が設定できます。変更は変更履歴に記録されます。
          </p>
        </DialogHeader>

        <Command className="rounded-lg border" shouldFilter={!isLoading}>
          <CommandInput placeholder="店舗名・店舗IDで検索..." className="h-9 text-sm" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>
              {isLoading ? '読み込み中...' : '紐づけ可能な店舗がありません'}
            </CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={`${store.name} ${store.store_id}`}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{store.name}</p>
                    <p className="text-muted-foreground text-[10px]">
                      {store.store_id} ・ {STORE_BRAND_DISPLAY_LABELS[store.brand]}
                      {store.prefecture ? ` ・ ${store.prefecture}` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 text-xs"
                    disabled={linkMutation.isPending}
                    onClick={() => handleLink(store.id)}
                  >
                    紐づける
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
