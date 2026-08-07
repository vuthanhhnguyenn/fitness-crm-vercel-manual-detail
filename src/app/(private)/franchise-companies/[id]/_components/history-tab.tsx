import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { FranchiseCompanyHistoryItem } from '@/lib/api/types.gen';

import { FRANCHISE_COMPANY_HISTORY_LABELS } from '../_constants/detail.constants';

interface HistoryTabProps {
  history: FranchiseCompanyHistoryItem[];
}

function formatHistoryValue(value: string | null) {
  return value ?? '—';
}

function formatChangeContent(entry: FranchiseCompanyHistoryItem) {
  const before = formatHistoryValue(entry.before);
  const after = formatHistoryValue(entry.after);
  if (before === '—' && after === '—') return entry.changed_item;
  return `${entry.changed_item}: ${before} → ${after}`;
}

export function HistoryTab({ history }: Readonly<HistoryTabProps>) {
  return (
    <Card className="gap-0 py-0">
      <Table size="md">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[160px] text-xs font-semibold">
              {FRANCHISE_COMPANY_HISTORY_LABELS.updated_at}
            </TableHead>
            <TableHead className="w-[200px] text-xs font-semibold">
              {FRANCHISE_COMPANY_HISTORY_LABELS.operator}
            </TableHead>
            <TableHead className="text-xs font-semibold">
              {FRANCHISE_COMPANY_HISTORY_LABELS.changed_item}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length > 0 ? (
            history.map((entry, index) => (
              <TableRow key={`${entry.updated_at}-${entry.changed_item}-${index}`}>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDateYYYYMMDD_HHMM(entry.updated_at)}
                </TableCell>
                <TableCell className="text-sm">{entry.operator}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatChangeContent(entry)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                表示できる変更履歴がありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center border-t px-4 py-3">
        <p className="text-muted-foreground text-xs">全 {history.length} 件</p>
      </div>
    </Card>
  );
}
