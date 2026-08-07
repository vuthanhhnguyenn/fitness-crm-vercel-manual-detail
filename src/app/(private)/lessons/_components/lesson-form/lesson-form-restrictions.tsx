'use client';

import { memo, useCallback, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Check, ChevronDown, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import type { LessonFormValues } from '../../_schemas/lesson-form.schema';

type ContractFieldName = 'restrictedMainContracts' | 'restrictedOptionContracts';

const MAIN_CONTRACTS = [
  'Rikkei_ContractA_20260129',
  'レギュラー会員',
  'プレミアム会員',
  'FIT365プレミアム会員',
  'ライト会員',
];

const OPTION_CONTRACTS = [
  'レディースエリア',
  'どこでもJOY',
  'シャワー',
  'パーソナルトレーニングオプション',
  'ロッカー',
];

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
    </div>
  );
}

interface ContractMultiSelectProps {
  name: ContractFieldName;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  options: string[];
}

const ContractMultiSelect = memo(function ContractMultiSelect({
  name,
  label,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
}: ContractMultiSelectProps) {
  const { control } = useFormContext<LessonFormValues>();
  const [open, setOpen] = useState(false);

  const {
    field: { value, onChange },
  } = useController({ control, name });
  const selected = value as string[];

  const toggle = useCallback(
    (item: string) => {
      onChange(selected.includes(item) ? selected.filter((v) => v !== item) : [...selected, item]);
    },
    [onChange, selected],
  );

  return (
    <div>
      <label className="mb-2 block text-xs font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="h-auto min-h-8 w-full items-center justify-between text-sm font-normal"
            />
          }
        >
          <div className="flex flex-wrap items-center gap-1 py-0.5">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <Badge key={item} variant="secondary" className="gap-1 text-[11px]">
                  {item}
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    className="hover:text-destructive cursor-pointer"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(item);
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="text-muted-foreground ml-1 size-4 shrink-0" />
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((item) => {
                  const isSelected = selected.includes(item);
                  return (
                    <CommandItem key={item} value={item} onSelect={() => toggle(item)}>
                      <Check
                        className={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                      {item}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export function LessonFormRestrictions() {
  return (
    <Card>
      <CardContent className="px-6">
        <SectionHeader number={2} title="予約制限" />
        <div className="grid grid-cols-2 gap-4">
          <ContractMultiSelect
            name="restrictedMainContracts"
            label="制限主契約"
            placeholder="制限なし（複数選択可）"
            searchPlaceholder="主契約を検索..."
            emptyText="該当する契約がありません"
            options={MAIN_CONTRACTS}
          />
          <ContractMultiSelect
            name="restrictedOptionContracts"
            label="制限オプション契約"
            placeholder="制限なし（複数選択可）"
            searchPlaceholder="オプション契約を検索..."
            emptyText="該当するオプションがありません"
            options={OPTION_CONTRACTS}
          />
        </div>
      </CardContent>
    </Card>
  );
}
