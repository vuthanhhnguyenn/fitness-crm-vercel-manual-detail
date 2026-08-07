'use client';

import { AlertTriangle } from 'lucide-react';

interface HolidayWarningBannerProps {
  storeName: string;
  date: string;
}

export function HolidayWarningBanner({ storeName, date }: HolidayWarningBannerProps) {
  return (
    <div className="border-warning/30 bg-warning/10 mt-2 flex items-start gap-2 rounded-md border px-3 py-2">
      <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
      <p className="text-warning text-xs">
        {storeName}は{date}が休業日です。それでも登録しますか？
      </p>
    </div>
  );
}
