'use client';

import { useMemo, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useInfiniteQuery } from '@tanstack/react-query';

import { useInfiniteScroll } from '@/hooks/use-infinite-scroll.hook';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';

import { getCrmOptionsInfiniteOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { CampaignTargetSex, GetCrmOptionsResponse } from '@/lib/api/types.gen';

import { CAMPAIGN_SEARCH_PAGE_LIMIT, CAMPAIGN_TARGET_SEX_LABELS } from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFieldLabel } from './campaign-required-label';

const AUTO_GRANT_TARGET_LABELS: Record<'all' | 'conditional', string> = {
  all: '全員',
  conditional: '条件あり',
};

export function CampaignFormAutoGrantSettings() {
  const form = useFormContext<CampaignFormValues>();
  const {
    data: optionsData,
    fetchNextPage: fetchNextOptions,
    hasNextPage: hasMoreOptions,
    isFetchingNextPage: isFetchingMoreOptions,
  } = useInfiniteQuery({
    ...getCrmOptionsInfiniteOptions({ query: { limit: CAMPAIGN_SEARCH_PAGE_LIMIT } }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmOptionsResponse, allPages) => {
      const currentPage = allPages.length;
      const totalPages = lastPage.pagination?.total_pages ?? 0;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });
  const options = useMemo(
    () => optionsData?.pages.flatMap((page) => page.options ?? []) ?? [],
    [optionsData],
  );

  const grantGridRef = useRef<HTMLDivElement | null>(null);
  const grantSentinelRef = useInfiniteScroll({
    hasMore: hasMoreOptions ?? false,
    isLoading: isFetchingMoreOptions,
    onLoadMore: fetchNextOptions,
    rootRef: grantGridRef,
  });

  const autoGrantEnabled = useWatch({ control: form.control, name: 'autoGrantEnabled' });
  const autoGrantTarget = useWatch({ control: form.control, name: 'autoGrantTarget' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">自動付与設定</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="autoGrantEnabled"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="auto-grant-switch" className="text-sm">
                      自動付与する
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      条件を満たした会員にオプションを自動で付与します
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      id="auto-grant-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {autoGrantEnabled && (
            <>
              <Separator />

              <FormField
                control={form.control}
                name="autoGrantTarget"
                render={({ field }) => (
                  <FormItem>
                    <CampaignFieldLabel>付与対象</CampaignFieldLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-row gap-6"
                      >
                        {Object.entries(AUTO_GRANT_TARGET_LABELS).map(([value, label]) => (
                          <div key={value} className="flex items-center gap-2">
                            <RadioGroupItem value={value} id={`target-${value}`} />
                            <Label
                              htmlFor={`target-${value}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {autoGrantTarget === 'conditional' && (
                <FormField
                  control={form.control}
                  name="autoGrantSexes"
                  render={({ field }) => (
                    <FormItem>
                      <CampaignFieldLabel>性別条件</CampaignFieldLabel>
                      <div className="flex gap-6">
                        {Object.entries(CAMPAIGN_TARGET_SEX_LABELS).map(([value, label]) => (
                          <div key={value} className="flex items-center gap-2">
                            <Checkbox
                              id={`gender-${value}`}
                              checked={field.value.includes(value as CampaignTargetSex)}
                              onCheckedChange={(checked) => {
                                field.onChange(
                                  checked
                                    ? [...field.value, value as CampaignTargetSex]
                                    : field.value.filter((sex) => sex !== value),
                                );
                              }}
                            />
                            <Label
                              htmlFor={`gender-${value}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="autoGrantOptionIds"
                render={({ field }) => (
                  <FormItem>
                    <CampaignFieldLabel>自動付与オプション</CampaignFieldLabel>
                    <div
                      ref={grantGridRef}
                      className="grid max-h-56 grid-cols-3 gap-3 overflow-auto"
                    >
                      {options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`grant-opt-${option.id}`}
                            checked={field.value.includes(option.id)}
                            onCheckedChange={(checked) => {
                              field.onChange(
                                checked
                                  ? [...field.value, option.id]
                                  : field.value.filter((id) => id !== option.id),
                              );
                            }}
                          />
                          <Label
                            htmlFor={`grant-opt-${option.id}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {option.name}
                          </Label>
                        </div>
                      ))}
                      {(hasMoreOptions || isFetchingMoreOptions) && (
                        <div
                          ref={grantSentinelRef}
                          className="col-span-3 flex items-center justify-center py-2"
                        >
                          {isFetchingMoreOptions && <Spinner className="size-4" />}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
