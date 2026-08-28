'use client';

// Client component: react-hook-form context + accordion/switch interaction
import { useFormContext } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

import { getCrmPermissionsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmPermissionsResponse } from '@/lib/api/types.gen';

import {
  PERMISSION_DESCRIPTION_BY_KEY,
  type PositionPermissionKey,
} from '../../_constants/position-permissions.constant';
import type { PositionFormValues } from '../../_schemas/position-form.schema';

type CatalogCategory = GetCrmPermissionsResponse['categories'][number];

type CategoryAccordionItemProps = {
  category: CatalogCategory;
  permissions: PositionFormValues['permissions'];
  onPermissionChange: (key: PositionPermissionKey, value: boolean) => void;
  onBulkToggle: (category: CatalogCategory, value: boolean) => void;
};

function CategoryAccordionItem({
  category,
  permissions,
  onPermissionChange,
  onBulkToggle,
}: Readonly<CategoryAccordionItemProps>) {
  const onCount = category.permissions.filter(
    (permission) => permissions[permission.permissionKey],
  ).length;
  const total = category.permissions.length;
  const allOn = onCount === total;

  return (
    <AccordionItem value={category.categoryKey}>
      <AccordionTrigger className="px-1 hover:no-underline">
        <div className="mr-2 flex flex-1 items-center gap-3">
          <span className="text-sm font-medium">{category.categoryLabel}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {onCount} / {total}
          </Badge>
        </div>
        {/* 一括切替スイッチ — クリックでアコーディオンを開閉させない (PAR067) */}
        <span
          className="mr-2 flex items-center gap-2"
          role="presentation"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="text-muted-foreground text-xs">{allOn ? '全ON' : '全OFF'}</span>
          <Switch
            checked={allOn}
            size="sm"
            onCheckedChange={(checked) => onBulkToggle(category, checked)}
          />
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="divide-border flex flex-col divide-y px-1">
          {category.permissions.map((permission) => {
            const helperText = PERMISSION_DESCRIPTION_BY_KEY.get(permission.permissionKey);
            return (
              <div
                key={permission.permissionKey}
                className="flex items-center justify-between px-1 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{permission.label}</span>
                  {helperText && (
                    <span className="text-muted-foreground text-xs">{helperText}</span>
                  )}
                </div>
                <Switch
                  checked={permissions[permission.permissionKey] ?? false}
                  onCheckedChange={(checked) =>
                    onPermissionChange(permission.permissionKey, checked)
                  }
                />
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function PositionFormPermissionsSection() {
  const form = useFormContext<PositionFormValues>();
  const permissions = form.watch('permissions');
  const {
    data: catalog,
    isLoading,
    isError,
    refetch,
  } = useQuery({ ...getCrmPermissionsOptions() });

  const handlePermissionChange = (key: PositionPermissionKey, value: boolean) => {
    form.setValue(`permissions.${key}`, value, { shouldDirty: true });
  };

  const handleBulkToggle = (category: CatalogCategory, value: boolean) => {
    const next = { ...form.getValues('permissions') };
    for (const permission of category.permissions) {
      next[permission.permissionKey] = value;
    }
    form.setValue('permissions', next, { shouldDirty: true });
  };

  const categories = catalog?.categories ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">権限設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {isLoading && (
          <div className="flex flex-col gap-4 py-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={`catalog-skeleton-${index}`} className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="ml-auto h-5 w-16" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground text-sm">権限一覧の取得に失敗しました</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => void refetch()}
            >
              再試行
            </Button>
          </div>
        )}
        {!isLoading && !isError && (
          <Accordion defaultValue={categories.map((category) => category.categoryKey)}>
            {categories.map((category) => (
              <CategoryAccordionItem
                key={category.categoryKey}
                category={category}
                permissions={permissions}
                onPermissionChange={handlePermissionChange}
                onBulkToggle={handleBulkToggle}
              />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
