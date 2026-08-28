'use client';
import { toSelectItems } from '@/utils/app.util';

import { DateTimePicker } from '@/components/common/date-time-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import type { ProxyAgreementMethod } from '@/lib/api/types.gen';

const PROXY_METHOD_OPTIONS: { value: ProxyAgreementMethod; label: string }[] = [
  { value: 'in_person', label: '来店' },
  { value: 'phone', label: '電話' },
  { value: 'email', label: 'メール' },
  { value: 'line', label: 'LINE' },
];

const PROXY_METHOD_ITEMS = toSelectItems(PROXY_METHOD_OPTIONS);

export interface ProxyApplicationSectionProps {
  isProxy: boolean;
  onIsProxyChange: (v: boolean) => void;
  agreedAt: Date | undefined;
  onAgreedAtChange: (v: Date | undefined) => void;
  method: ProxyAgreementMethod | '';
  onMethodChange: (v: ProxyAgreementMethod | '') => void;
  agreedAtError?: string;
}

export function ProxyApplicationSection({
  isProxy,
  onIsProxyChange,
  agreedAt,
  onAgreedAtChange,
  method,
  onMethodChange,
  agreedAtError,
}: Readonly<ProxyApplicationSectionProps>) {
  return (
    <div className="flex flex-col gap-3 rounded-md border px-4 py-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="proxy-switch" className="cursor-pointer text-sm font-medium">
          スタッフが代理申請する
        </Label>
        <Switch id="proxy-switch" checked={isProxy} onCheckedChange={onIsProxyChange} />
      </div>

      {isProxy && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs">
              合意日時 <span className="text-destructive ml-0.5">*</span>
            </Label>
            <DateTimePicker
              value={agreedAt}
              onChange={onAgreedAtChange}
              placeholder="日時を選択"
              hasError={!!agreedAtError}
            />
            {agreedAtError && <p className="text-destructive text-xs">{agreedAtError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="proxy-method" className="text-muted-foreground text-xs">
              合意方法
            </Label>
            <Select
              value={method}
              onValueChange={(v) => onMethodChange((v ?? '') as ProxyAgreementMethod | '')}
              items={PROXY_METHOD_ITEMS}
            >
              <SelectTrigger id="proxy-method" className="h-9 text-sm">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {PROXY_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
