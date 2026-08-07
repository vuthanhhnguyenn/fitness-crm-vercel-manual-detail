'use client';

import { useMemo, useState } from 'react';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { AlertTriangle, Bell, Send } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';

import {
  LOCKER_REMINDER_METHOD_LABELS,
  LOCKER_REMINDER_STATUS_BADGE_CLASSES,
  LOCKER_REMINDER_STATUS_LABELS,
} from '../../_constants/constants';

type ReminderNotification =
  GetCrmLockersByIdResponse['locker']['slot_items'][number]['reminder_notifications'][number];
type NotificationStatus = ReminderNotification['status'];

interface ReminderNotificationSectionProps {
  cancelDate: string;
  notifications: ReminderNotification[];
  isSending?: boolean;
  onSend: (reminderDays: 7 | 14 | 30) => Promise<unknown>;
}

export function ReminderNotificationSection({
  cancelDate,
  notifications,
  isSending = false,
  onSend,
}: ReminderNotificationSectionProps) {
  const [reminderDays, setReminderDays] = useState('7');

  const notificationStatus = useMemo<NotificationStatus>(() => {
    if (notifications.length === 0) return 'unsent';
    if (notifications.some((item) => item.status === 'failed')) return 'failed';
    return 'sent';
  }, [notifications]);

  const hasSendFailure = notifications.some((item) => item.status === 'failed');

  return (
    <div className="py-4">
      <h3 className="text-muted-foreground mb-3 flex items-center gap-1 text-xs font-semibold">
        <Bell className="size-3" />
        リマインド通知
      </h3>

      <Card className="gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold">忘れ物確認リマインド</CardTitle>
            <Badge
              variant="outline"
              className={`gap-1 text-[10px] font-medium ${LOCKER_REMINDER_STATUS_BADGE_CLASSES[notificationStatus]}`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  notificationStatus === 'unsent'
                    ? 'bg-muted-foreground'
                    : notificationStatus === 'sent'
                      ? 'bg-success'
                      : 'bg-destructive'
                }`}
              />
              {LOCKER_REMINDER_STATUS_LABELS[notificationStatus]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">解約予定日</span>
            <span className="text-warning font-medium">{formatDateYYYYMMDD(cancelDate)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">通知タイミング</Label>
            <Select value={reminderDays} onValueChange={(value) => value && setReminderDays(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">解約日の7日前</SelectItem>
                <SelectItem value="14">解約日の14日前</SelectItem>
                <SelectItem value="30">解約日の30日前</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">通知手段:</span>
            <Badge variant="secondary" className="text-[10px] font-normal">
              プッシュ通知
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-normal">
              アプリ内通知
            </Badge>
          </div>

          {hasSendFailure ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription className="text-xs">
                通知の送信に失敗しました。スタッフによる電話連絡で対応してください。
              </AlertDescription>
            </Alert>
          ) : null}

          <Button
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={() => onSend(Number(reminderDays) as 7 | 14 | 30)}
            disabled={isSending}
          >
            <Send className="size-3" />
            {isSending ? '送信中...' : '通知を送信'}
          </Button>

          {notifications.length > 0 ? (
            <div className="mt-1">
              <p className="text-muted-foreground mb-2 text-xs font-semibold">通知履歴</p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-7 px-2 text-[10px] font-semibold">日時</TableHead>
                      <TableHead className="h-7 px-2 text-[10px] font-semibold">手段</TableHead>
                      <TableHead className="h-7 px-2 text-[10px] font-semibold">状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground px-2 py-2 text-[10px]">
                          {formatDateYYYYMMDD(item.sent_at)}
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {LOCKER_REMINDER_METHOD_LABELS[item.method]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${LOCKER_REMINDER_STATUS_BADGE_CLASSES[item.status]}`}
                          >
                            {LOCKER_REMINDER_STATUS_LABELS[item.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
