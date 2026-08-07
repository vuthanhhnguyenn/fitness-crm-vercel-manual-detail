'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { getCrmOptionsOptions } from '@/lib/api/@tanstack/react-query.gen';

import {
  CAMPAIGN_AUTO_GRANT_TARGET_LABELS,
  CAMPAIGN_GENDER_CONDITION_LABELS,
  type CampaignGenderCondition,
} from '../_constants/constants';
import type { CampaignFormValues } from '../_schemas/campaign-form.schema';

type GenderConditionValue = CampaignGenderCondition;

export function CampaignFormAutoGrantSettings() {
  const form = useFormContext<CampaignFormValues>();
  const autoGrantEnabled = useWatch({ control: form.control, name: 'auto_grant.enabled' });
  const autoGrantTarget = useWatch({ control: form.control, name: 'auto_grant.target_type' });
  const selectedGenderConditions =
    useWatch({ control: form.control, name: 'auto_grant.gender_conditions' }) ?? [];
  const selectedOptionIds =
    useWatch({ control: form.control, name: 'auto_grant.option_ids' }) ?? [];

  const { data: optionsData } = useQuery({
    ...getCrmOptionsOptions({ query: { limit: 200 } }),
    enabled: autoGrantEnabled,
  });
  const optionChoices = optionsData?.options ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">自動付与設定</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4">
        <FormField
          control={form.control}
          name="auto_grant.enabled"
          render={({ field }) => (
            <FormItem className="rounded-lg border px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <FormLabel>自動付与する</FormLabel>
                  <p className="text-muted-foreground text-xs">
                    条件を満たした会員にオプションを自動で付与します
                  </p>
                </div>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
              name="auto_grant.target_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>付与対象</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col gap-3 md:flex-row md:gap-6"
                    >
                      {Object.entries(CAMPAIGN_AUTO_GRANT_TARGET_LABELS).map(([value, label]) => (
                        <div key={value} className="flex items-center gap-2">
                          <RadioGroupItem value={value} id={`auto-grant-target-${value}`} />
                          <Label
                            htmlFor={`auto-grant-target-${value}`}
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
                name="auto_grant.gender_conditions"
                render={() => (
                  <FormItem>
                    <FormLabel>性別条件</FormLabel>
                    <div className="flex flex-col gap-3 md:flex-row md:gap-6">
                      {Object.entries(CAMPAIGN_GENDER_CONDITION_LABELS).map(([value, label]) => {
                        const checked = selectedGenderConditions.includes(
                          value as GenderConditionValue,
                        );

                        return (
                          <div key={value} className="flex items-center gap-2">
                            <Checkbox
                              id={`auto-grant-gender-${value}`}
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                const nextValues = nextChecked
                                  ? [...selectedGenderConditions, value as GenderConditionValue]
                                  : selectedGenderConditions.filter((item) => item !== value);
                                form.setValue('auto_grant.gender_conditions', nextValues, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                            />
                            <Label
                              htmlFor={`auto-grant-gender-${value}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="auto_grant.option_ids"
              render={() => (
                <FormItem>
                  <FormLabel>自動付与オプション</FormLabel>
                  <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-3">
                    {optionChoices.map((option) => {
                      const checked = selectedOptionIds.includes(option.id);
                      return (
                        <div key={option.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`auto-grant-option-${option.id}`}
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              const nextValues = nextChecked
                                ? [...selectedOptionIds, option.id]
                                : selectedOptionIds.filter((item) => item !== option.id);
                              form.setValue('auto_grant.option_ids', nextValues, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                          />
                          <Label
                            htmlFor={`auto-grant-option-${option.id}`}
                            className="cursor-pointer text-sm font-normal"
                          >
                            {option.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
