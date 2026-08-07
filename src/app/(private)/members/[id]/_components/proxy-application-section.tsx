'use client';

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

const PROXY_METHOD_OPTIONS = ['来店', '電話', 'メール', 'LINE'] as const;

export interface ProxyApplicationSectionProps {
  isProxy: boolean;
  onIsProxyChange: (v: boolean) => void;
  agreedAt: Date | undefined;
  onAgreedAtChange: (v: Date | undefined) => void;
  method: string;
  onMethodChange: (v: string) => void;
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
            <Select value={method} onValueChange={(v) => onMethodChange(v ?? '')}>
              <SelectTrigger id="proxy-method" className="h-9 text-sm">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {PROXY_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
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
