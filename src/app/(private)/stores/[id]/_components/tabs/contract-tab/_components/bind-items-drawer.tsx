'use client';

import { useMemo, useState } from 'react';

import { Plus, Search, X } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';

import { Permission } from '@/types/permission.type';

import { DrawerListItem } from './drawer-list-item';

type BindDrawerItem = {
  id: string;
  name: string;
  source: 'hq' | 'store';
};

type Props<TItem extends BindDrawerItem> = {
  title: string;
  description: string;
  searchPlaceholder: string;
  listLabel: string;
  emptyLabel: string;
  items: TItem[];
  getSubText: (item: TItem) => string;
  onBind: (selectedIds: string[]) => void;
};

export function BindItemsDrawer<TItem extends BindDrawerItem>({
  title,
  description,
  searchPlaceholder,
  listLabel,
  emptyLabel,
  items,
  getSubText,
  onBind,
}: Props<TItem>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const keyword = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword),
    );
  }, [items, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const closeDrawer = () => {
    setOpen(false);
    setSearch('');
    setSelectedIds([]);
  };

  const handleBind = () => {
    if (selectedIds.length === 0) return;
    onBind(selectedIds);
    closeDrawer();
  };

  return (
    <>
      <RoleGatedButton
        requiredPermission={Permission.StoresConfigContract}
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3.5" />
        紐づけ追加
      </RoleGatedButton>

      <Drawer
        direction="right"
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSearch('');
            setSelectedIds([]);
          }
        }}
      >
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
          <DrawerHeader className="border-border border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DrawerTitle className="text-base">{title}</DrawerTitle>
                <DrawerDescription className="text-xs">{description}</DrawerDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={closeDrawer}
              >
                <X className="size-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {listLabel}（{filteredItems.length}件）
            </p>

            <div className="max-h-[calc(100vh-250px)] space-y-2 overflow-y-auto pr-1">
              {filteredItems.map((item) => (
                <DrawerListItem
                  key={item.id}
                  selected={selectedIds.includes(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  name={item.name}
                  source={item.source}
                  subText={getSubText(item)}
                />
              ))}
              {filteredItems.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">{emptyLabel}</p>
              ) : null}
            </div>
          </div>

          <DrawerFooter className="border-border border-t bg-neutral-50 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">項目を選択してください</p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={closeDrawer}>
                  キャンセル
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedIds.length === 0}
                  onClick={handleBind}
                >
                  紐づける
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
