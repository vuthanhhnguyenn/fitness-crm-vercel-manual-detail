'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';

interface StudioSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function StudioSearch({ value, onChange }: StudioSearchProps) {
  return (
    <div className="relative max-w-[400px] flex-1">
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        className="pl-9 text-xs"
        placeholder="スタジオ名で検索..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
