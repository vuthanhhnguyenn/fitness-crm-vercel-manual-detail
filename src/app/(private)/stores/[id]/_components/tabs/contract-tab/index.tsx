'use client';

import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { MainContractSection } from './_components/main-contract-section';
import { OptionSection } from './_components/option-section';

export function ContractTab() {
  return (
    <div className="space-y-4">
      {/* <Alert className="rounded-lg border-amber-300 bg-amber-50 px-3 py-2 [&>svg]:text-amber-700">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <AlertDescription className="text-amber-900 text-sm">
          解除操作を行うと入会時設定との差異が発生し、店舗への適用に時間がかかる場合があります。
        </AlertDescription>
      </Alert> */}

      <Alert className="rounded-lg border-sky-200 bg-sky-50 px-3 py-2 [&>svg]:text-sky-700">
        <Info className="size-4 shrink-0" aria-hidden />
        <AlertDescription className="text-sm text-sky-900">
          「紐づけ追加」で利用するマスタを選択できます。主契約・オプションの価格は本部管理メニューで設定してください。
        </AlertDescription>
      </Alert>

      <MainContractSection />
      <OptionSection />
    </div>
  );
}
