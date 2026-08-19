import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import {
  Bell,
  BellOff,
  CalendarClock,
  Clock,
  Mail,
  MessageSquare,
  RotateCcw,
  Smartphone,
  Users,
} from 'lucide-react';

import { StatusCard, type StatusTone } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { GetCrmNotificationsByIdResponse } from '@/lib/api/types.gen';

import {
  MANUAL_NOTIFICATION_BRAND_LABELS,
  MANUAL_NOTIFICATION_CHANNEL_LABELS,
  MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS,
  MANUAL_NOTIFICATION_FREQUENCY_LABELS,
  MANUAL_NOTIFICATION_STATUS_LABELS,
  MANUAL_NOTIFICATION_TARGET_LABELS,
  getManualNotificationDynamicAttributeLabel,
} from '../../_constants/manual-notification.constants';

type Detail = GetCrmNotificationsByIdResponse['item'];
type Channel = Detail['channels'][number];

const CHANNEL_ICONS = { sms: MessageSquare, push: Bell, email: Mail, in_app: Smartphone } as const;

function emailHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li(?:\s[^>]*)?>/gi, '・')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function channelBody(item: Detail, channel: Channel): string {
  const body = item.contents[channel]?.body ?? '';
  const displayBody = channel === 'email' ? emailHtmlToPlainText(body) : body;
  return displayBody || '本文未設定';
}

export function timingName(timing: Detail['timing']) {
  if (timing.type === 'immediate') return '即時';
  if (timing.type === 'scheduled') return '予約';
  return '繰り返し';
}

function formatTarget(target: Detail['target']) {
  switch (target.type) {
    case 'all_members':
      return '全会員対象';
    case 'brands':
      return (
        target.brands.map((brand) => MANUAL_NOTIFICATION_BRAND_LABELS[brand]).join(' · ') ||
        '配信対象未設定'
      );
    case 'stores':
      return target.stores.map((store) => store.name).join(' · ') || '配信対象未設定';
    case 'contract_type':
      return MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS[target.contractType];
    case 'membership_duration':
      return target.condition === 'within'
        ? `入会後${target.months}ヶ月以内`
        : `入会後${target.months}ヶ月以上`;
    case 'dynamic_attribute':
      return getManualNotificationDynamicAttributeLabel(target.attribute);
    case 'members':
      return target.members.length > 0 ? `${target.members.length}名を指定` : '配信対象未設定';
  }
}

function statusTone(status: Detail['status']): StatusTone {
  if (status === 'pending_approval') return 'warning';
  if (status === 'returned') return 'destructive';
  if (status === 'scheduled') return 'info';
  if (status === 'sending') return 'success';
  return 'muted';
}

function statusIcon(status: Detail['status']) {
  if (status === 'draft') return BellOff;
  if (status === 'pending_approval') return Clock;
  if (status === 'scheduled') return CalendarClock;
  return Bell;
}

function TimingIcon({ timing }: { timing: Detail['timing'] }) {
  if (timing.type === 'immediate') return <Clock className="text-muted-foreground size-4" />;
  if (timing.type === 'scheduled')
    return <CalendarClock className="text-muted-foreground size-4" />;
  return <RotateCcw className="text-muted-foreground size-4" />;
}

function targetBadgeVariant(
  targetType: Detail['target']['type'],
): 'default' | 'secondary' | 'outline' {
  if (targetType === 'all_members') return 'default';
  if (targetType === 'brands') return 'secondary';
  return 'outline';
}

interface Props {
  item: Detail;
  isDeliveryActive: boolean;
}

export function ManualNotificationDetailContent({ item, isDeliveryActive }: Readonly<Props>) {
  return (
    <main className="bg-background flex-1 overflow-auto px-6 py-4">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-6 lg:w-[60%]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">通知内容</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-muted-foreground mb-2 text-xs">管理タイトル</p>
              <p className="text-sm font-medium">{item.title || '無題の下書き'}</p>
              <Separator className="my-4" />
              <p className="text-muted-foreground mb-2 text-xs">
                本文（メッセージ）<span className="ml-1">— チャネルごとに文言を確認できます</span>
              </p>
              {item.channels.length > 0 ? (
                <Tabs defaultValue={item.channels[0]}>
                  <TabsList className="h-auto max-w-full flex-wrap justify-start">
                    {item.channels.map((channel) => {
                      const Icon = CHANNEL_ICONS[channel];
                      return (
                        <TabsTrigger key={channel} value={channel} className="gap-1 text-xs">
                          <Icon className="size-3" />
                          {MANUAL_NOTIFICATION_CHANNEL_LABELS[channel]}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  {item.channels.map((channel) => (
                    <TabsContent key={channel} value={channel}>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-line">
                        {channelBody(item, channel)}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <p className="text-muted-foreground bg-muted/50 rounded-lg p-4 text-sm">
                  配信チャネル未設定
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">配信チャネル</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-4">
              {(['push', 'in_app', 'email', 'sms'] as Channel[]).map((channel) => {
                const Icon = CHANNEL_ICONS[channel];
                const enabled = item.channels.includes(channel);
                return (
                  <div
                    key={channel}
                    className="flex items-center justify-between border-b py-2 last:border-0"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="text-muted-foreground size-4" />
                      {MANUAL_NOTIFICATION_CHANNEL_LABELS[channel]}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        enabled
                          ? 'border-success/20 bg-success/15 text-success text-[10px]'
                          : 'bg-muted text-muted-foreground text-[10px]'
                      }
                    >
                      {enabled ? '有効' : '無効'}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">配信設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div>
                <p className="text-muted-foreground mb-2 text-xs">タイミング</p>
                <div className="flex items-center gap-2">
                  <TimingIcon timing={item.timing} />
                  <span className="text-sm font-medium">{timingName(item.timing)}</span>
                </div>
                {item.timing.type === 'scheduled' && (
                  <p className="text-muted-foreground mt-1 ml-6 text-xs">
                    {formatDateYYYYMMDD_HHMM(item.timing.scheduledAt, '—')}
                  </p>
                )}
                {item.timing.type === 'recurring' && (
                  <div className="bg-muted/50 mt-2 ml-6 space-y-2 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">配信間隔</span>
                      <span className="font-medium">
                        {MANUAL_NOTIFICATION_FREQUENCY_LABELS[item.timing.frequency]}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">終了条件</span>
                      <span className="font-medium">
                        {item.timing.maxOccurrences
                          ? `${item.timing.maxOccurrences}回で終了`
                          : item.timing.endAt
                            ? `${formatDateYYYYMMDD_HHMM(item.timing.endAt, '—')}まで`
                            : '終了日なし'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2 text-xs">使用チャネル</p>
                <div className="flex flex-wrap gap-1">
                  {item.channels.map((channel) => {
                    const Icon = CHANNEL_ICONS[channel];
                    return (
                      <Badge key={channel} variant="outline" className="gap-1 text-[10px]">
                        <Icon className="size-3" />
                        <span>{MANUAL_NOTIFICATION_CHANNEL_LABELS[channel]}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">配信対象</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">セグメント</p>
                <Badge variant={targetBadgeVariant(item.target.type)}>
                  {MANUAL_NOTIFICATION_TARGET_LABELS[item.target.type]}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">対象詳細</p>
                <p className="text-sm">{formatTarget(item.target)}</p>
              </div>
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <Users className="text-muted-foreground size-5" />
                <div>
                  <p className="text-muted-foreground text-[10px]">配信対象件数</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {item.targetCount.toLocaleString('ja-JP')}
                    <span className="text-muted-foreground ml-1 text-sm font-normal">名</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="w-full lg:w-[40%]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-0">
            <StatusCard
              tone={statusTone(item.status)}
              icon={statusIcon(item.status)}
              label={MANUAL_NOTIFICATION_STATUS_LABELS[item.status]}
              meta={[
                `作成: ${formatDateYYYYMMDD_HHMM(item.createdAt, '—')}`,
                `更新: ${formatDateYYYYMMDD_HHMM(item.updatedAt, '—')}`,
                ...(item.status === 'pending_approval'
                  ? ['本部承認待ちです。承認後に配信予約が確定します。']
                  : []),
                ...(item.approvedBy && item.approvedAt
                  ? [`承認: ${formatDateYYYYMMDD_HHMM(item.approvedAt, '—')}（${item.approvedBy}）`]
                  : []),
                ...(item.deliveryResult?.deliveredAt
                  ? [`配信: ${formatDateYYYYMMDD_HHMM(item.deliveryResult.deliveredAt, '—')}`]
                  : []),
              ]}
            />
            {item.status === 'returned' && item.returnReason && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">差し戻し理由</CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                  <p className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm whitespace-pre-line">
                    {item.returnReason}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    差し戻し理由は通知作成者に送信されました。内容を修正して再度承認依頼してください。
                  </p>
                </CardContent>
              </Card>
            )}
            {isDeliveryActive && item.deliveryResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">配信実績</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['配信数', item.deliveryResult.deliveredCount],
                      ['到達数', item.deliveryResult.reachedCount],
                      ['開封数', item.deliveryResult.openedCount],
                    ].map(
                      ([label, value]) =>
                        value !== undefined && (
                          <div key={label as string}>
                            <p className="text-muted-foreground text-[10px]">{label}</p>
                            <p className="text-xl font-semibold tabular-nums">
                              {(value as number).toLocaleString('ja-JP')}
                              <span className="text-muted-foreground ml-1 text-sm font-normal">
                                件
                              </span>
                            </p>
                          </div>
                        ),
                    )}
                  </div>
                  {item.deliveryResult.channelResults?.map((result) => (
                    <div key={result.channel} className="border-t pt-3">
                      <p className="mb-2 text-xs font-medium">
                        {MANUAL_NOTIFICATION_CHANNEL_LABELS[result.channel]}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <span>配信 {result.deliveredCount.toLocaleString('ja-JP')}</span>
                        <span>到達 {result.reachedCount?.toLocaleString('ja-JP') ?? '—'}</span>
                        <span>開封 {result.openedCount?.toLocaleString('ja-JP') ?? '—'}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
