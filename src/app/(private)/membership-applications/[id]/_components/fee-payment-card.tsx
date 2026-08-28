import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { formatYen } from '@/utils/format.util';
import { CheckCircle, Info } from 'lucide-react';

import { RequiredMark } from '@/components/common/field-marker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';

import { type ApplicationDetail, previewExemption } from './membership-application.utils';

interface FeePaymentCardProps {
  app: ApplicationDetail;
  staffExemptionOpen: boolean;
  staffExemptionReason: string;
  onStaffExemptionOpenChange: (open: boolean) => void;
  onStaffExemptionReasonChange: (reason: string) => void;
}

function Field({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function FeePaymentCard({
  app,
  staffExemptionOpen,
  staffExemptionReason,
  onStaffExemptionOpenChange,
  onStaffExemptionReasonChange,
}: Readonly<FeePaymentCardProps>) {
  const feeRows = app.fee_rows;
  const exemption = app.enrollment_fee_exemption;
  const preview = previewExemption(exemption, staffExemptionReason);
  const rowsTotal = feeRows.reduce((sum, r) => sum + r.amount, 0);
  const previewTotal = rowsTotal - (preview?.discountAmount ?? 0);
  const isJaccs = app.payment_method !== 'credit_card';

  // ⚠️ PROVISIONAL (FR-025a) — the exemption block below is reproduced from the
  // V0 prototype and is absent from C-01 revision 260624_v5; the precedence it
  // renders (campaign → re-enrolment → staff-discretionary, first match wins) is
  // not PO-confirmed. See `resolveEnrollmentFeeExemption` in
  // `membership-application.table.ts` for the server-side mirror of this note.
  const campaignApplies = exemption?.kind === 'campaign';
  const rejoinApplies = exemption?.kind === 'rejoin';
  const alreadyStaffExempt = exemption?.kind === 'staff';
  const panelOpen = staffExemptionOpen || alreadyStaffExempt;
  const staffPanelEligible = Boolean(exemption) && !campaignApplies && !rejoinApplies;

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
          {feeRows.map((row) => {
            const isEnrollmentFee = row.key === 'enrollment_fee';
            const showExemptionUi = isEnrollmentFee && app.status === 'pending' && exemption;
            const discounted = isEnrollmentFee && (preview?.discountAmount ?? 0) > 0;

            return (
              <TableRow key={row.key}>
                <TableCell className="text-sm first:pl-4 last:pr-4">
                  {row.label}
                  {showExemptionUi && (
                    <div className="mt-2 flex flex-col gap-2">
                      {campaignApplies && (
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className="bg-info/15 text-info border-info/20 w-fit gap-1 text-[10px]"
                          >
                            <Info className="size-3" />
                            キャンペーン免除（自動）
                          </Badge>
                          <p className="text-info text-xs">適用: {exemption.campaign_name}</p>
                        </div>
                      )}
                      {!campaignApplies && (
                        <div className="flex flex-col gap-1">
                          <p className="text-muted-foreground text-[10px]">
                            再入会免除規則: 退会後{' '}
                            <span className="text-foreground font-medium">
                              {exemption.rejoin_window_days}日
                            </span>{' '}
                            以内
                          </p>
                          {exemption.previous_withdrawal_date ? (
                            rejoinApplies ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-success/15 text-success border-success/20 gap-1 text-[10px]"
                                >
                                  <CheckCircle className="size-3" />
                                  再入会免除に該当（自動）
                                </Badge>
                                <span className="text-muted-foreground text-[10px]">
                                  前回退会 {exemption.previous_withdrawal_date}・
                                  {exemption.rejoin_window_days}日以内
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="bg-muted text-muted-foreground border-border gap-1 text-[10px]"
                                >
                                  再入会免除 非該当
                                </Badge>
                                <span className="text-muted-foreground text-[10px]">
                                  前回退会 {exemption.previous_withdrawal_date}・
                                  {exemption.rejoin_window_days}日超過
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-muted-foreground text-[10px]">
                              前回退会履歴なし
                            </span>
                          )}
                        </div>
                      )}
                      {staffPanelEligible && (
                        <div className="flex flex-col gap-2">
                          {!panelOpen ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground h-6 w-fit px-2 text-xs"
                              onClick={() => onStaffExemptionOpenChange(true)}
                            >
                              個別に免除する
                            </Button>
                          ) : (
                            <div className="border-border/50 bg-muted/20 flex flex-col gap-2 rounded-md border p-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                  免除理由
                                  <RequiredMark />
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground h-5 px-1 text-[10px]"
                                  onClick={() => {
                                    onStaffExemptionOpenChange(false);
                                    onStaffExemptionReasonChange('');
                                  }}
                                >
                                  取消
                                </Button>
                              </div>
                              <Textarea
                                placeholder="免除理由を入力してください（必須）..."
                                rows={2}
                                maxLength={TEXTAREA_MAX_LENGTH}
                                className="text-xs"
                                value={staffExemptionReason || exemption.reason || ''}
                                onChange={(e) => onStaffExemptionReasonChange(e.target.value)}
                              />
                              <p className="text-muted-foreground text-[10px]">
                                スタッフの裁量による例外的な個別免除です。理由は承認ログに記録されます。
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right align-top text-sm first:pl-4 last:pr-4">
                  {discounted ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-muted-foreground text-xs line-through">
                        {formatYen(row.amount)}
                      </span>
                      <span className="text-success font-medium">¥0</span>
                      <span className="text-success text-[10px]">
                        -{formatYen(preview?.discountAmount ?? 0)}
                      </span>
                    </div>
                  ) : (
                    formatYen(row.amount)
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 border-t-2">
            <TableCell className="text-sm font-medium first:pl-4 last:pr-4">合計</TableCell>
            <TableCell className="text-right text-sm font-medium first:pl-4 last:pr-4">
              {(preview?.discountAmount ?? 0) > 0 ? (
                <span className="text-success">{formatYen(previewTotal)}</span>
              ) : (
                formatYen(rowsTotal)
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Separator className="my-0" />
      <div className="flex flex-col gap-3 px-4 py-3">
        <Field label="支払方法" value={paymentMethodLabel(app.payment_method)} />
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

function paymentMethodLabel(method: ApplicationDetail['payment_method']): string {
  return method === 'credit_card' ? 'クレジットカード（SBPS）' : '口座振替（JACCS）';
}
