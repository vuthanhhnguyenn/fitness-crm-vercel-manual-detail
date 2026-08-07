import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FeePaymentCardProps {
  app: any;
}

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`;
}

function Field({ label, value, mono }: Readonly<{ label: string; value: string; mono?: boolean }>) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export function FeePaymentCard({ app }: Readonly<FeePaymentCardProps>) {
  const feeRows = app.fee_rows ?? [];
  const totalFee = feeRows.reduce((sum: number, r: any) => sum + r.amount, 0);
  const paymentMethod = app.payment_method ?? 'クレジットカード';
  const cardLast4 = app.card_last4 ?? '****';
  const isJaccs = paymentMethod !== 'クレジットカード';

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 pt-4 pb-3">
        <CardTitle className="text-sm">費用・決済情報</CardTitle>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold first:pl-4 last:pr-4">項目</TableHead>
            <TableHead className="text-right text-xs font-semibold first:pl-4 last:pr-4">
              金額
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeRows.map((row: any) => (
            <TableRow key={row.label}>
              <TableCell className="text-sm first:pl-4 last:pr-4">{row.label}</TableCell>
              <TableCell className="text-right text-sm first:pl-4 last:pr-4">
                {formatPrice(row.amount)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 border-t-2">
            <TableCell className="text-sm font-medium first:pl-4 last:pr-4">合計</TableCell>
            <TableCell className="text-right text-sm font-medium first:pl-4 last:pr-4">
              {formatPrice(totalFee)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Separator className="my-0" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Field label="支払方法" value={paymentMethod} />
          <Field label="カード番号" value={`**** **** **** ${cardLast4}`} mono />
        </div>
        {isJaccs && (
          <Alert className="border-info/50 bg-info/10 py-2">
            <Info className="text-info size-4" />
            <AlertDescription className="text-info text-xs">
              JACCS（口座振替）利用者のため、初回請求は翌月合算になるケースがあります。請求タイミングにご注意ください。
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
