'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { calcAge } from '@/utils/age.util';
import { formatDate } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { Bell, User } from 'lucide-react';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { JargonTip } from '@/components/common/jargon-tip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { getCrmMembersByIdUsageHistoryAccessSettingsOptions } from '@/lib/api/@tanstack/react-query.gen';
import {
  GetMemberDetailResponse,
  NotificationPreference,
  NotificationTopic,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  BRAND_GROUP_LABELS,
  BRAND_LABELS,
  GENDER_CLASSES,
  GENDER_LABELS,
} from '../../../../_constants/constants';
import { getTenureLabel } from '../../../../_utils';
import { getAuthMethodLabel } from '../../../_constants/auth-method';
import { isGateStopRestricted } from '../../../_constants/gate-stop';

type PersonalInfo = GetMemberDetailResponse['personalInfo'];

function composeFullAddress(personalInfo: PersonalInfo): string {
  const cityLine = [personalInfo.prefecture, personalInfo.city, personalInfo.streetAddress]
    .filter(Boolean)
    .join('');
  const parts = [
    personalInfo.postalCode ? `〒${personalInfo.postalCode}` : undefined,
    cityLine || undefined,
    personalInfo.building || undefined,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '—';
}

export function BasicInfoTab({ member }: { member: GetMemberDetailResponse }) {
  const router = useRouter();
  const memberId = member.memberId;
  const personalInfo = member.personalInfo;

  const currentMemberName = `${personalInfo.lastName} ${personalInfo.firstName}`.trim();
  const referrer = member.referral.byMember;
  const gender = personalInfo.gender;
  const gateStopRestricted = isGateStopRestricted(member);

  // The family group now arrives with the member detail: `members` already
  // includes this member (flagged `isSelf`) in a guaranteed order, and
  // `remainingSlots` is computed server-side — so the screen must not prepend the
  // current member or do its own arithmetic (QA02 §2.1).
  const family = member.family;
  const familyMembers = family.members;
  const remainingFamilySlots = family.remainingSlots;

  return (
    <div className="flex flex-col items-start gap-4 md:flex-row">
      <div className="w-full md:w-[60%]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">個人情報</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">生年月日</p>
                  <p className="text-sm font-medium">
                    {personalInfo.dateOfBirth
                      ? `${formatDate(personalInfo.dateOfBirth)}（${calcAge(personalInfo.dateOfBirth)}歳）`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">性別</p>
                  {gender ? (
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${GENDER_CLASSES[gender]}`}
                    >
                      {GENDER_LABELS[gender]}
                    </Badge>
                  ) : (
                    <p className="text-muted-foreground text-sm font-medium">—</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground mb-1 text-xs">住所</p>
                  <p className="text-sm font-medium">{composeFullAddress(personalInfo)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">電話番号</p>
                  <p className="text-sm font-medium">{personalInfo.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">メールアドレス</p>
                  <p className="text-sm font-medium">{personalInfo.email || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">入会情報</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">入会日</p>
                  <p className="text-sm font-medium">{formatDate(member.enrolledAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">入会店舗</p>
                  <p className="text-sm font-medium">{member.primaryStore.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">ブランド</p>
                  {/* The member row carries the brand GROUP; the sub-brand belongs to
                      the store, so both are shown from their own source (QA01 §1-4). */}
                  <p className="text-sm font-medium">
                    {BRAND_GROUP_LABELS[member.brandGroup] || '—'}
                    {member.primaryStore.brandEnum &&
                      member.primaryStore.brandEnum !== member.brandGroup && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          （{BRAND_LABELS[member.primaryStore.brandEnum]}）
                        </span>
                      )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">紹介者</p>
                  {referrer ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-medium"
                      nativeButton={false}
                      render={
                        <Link
                          href={navigate('/members/[id]', referrer.memberId, {
                            parentMemberId: memberId,
                            parentName: currentMemberName,
                          })}
                        />
                      }
                    >
                      {referrer.displayName
                        ? `${referrer.displayName}（${referrer.memberNumber}）`
                        : referrer.memberNumber}
                    </Button>
                  ) : (
                    <p className="text-muted-foreground text-sm font-medium">—</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground mb-1 text-xs">入会キャンペーン</p>
                  {/* The campaign applied at enrollment, not the one on today's contract */}
                  <p className="text-sm font-medium">{member.enrollmentCampaign?.name || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">家族会員</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {familyMembers.length === 0 ? (
                <p className="text-muted-foreground text-sm">家族会員はいません</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {familyMembers.map((m) => (
                    <div key={m.memberId} className="flex items-center gap-2">
                      <User className="text-muted-foreground size-4 shrink-0" />
                      {m.isSelf ? (
                        <span className="text-sm font-medium">{m.displayName}</span>
                      ) : (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm font-medium"
                          onClick={() =>
                            router.push(
                              navigate('/members/[id]', m.memberId, {
                                parentMemberId: memberId,
                                parentName: currentMemberName,
                              }),
                            )
                          }
                        >
                          {m.displayName}（{m.memberNumber}）
                        </Button>
                      )}
                      {m.isSelf && (
                        <Badge
                          variant="outline"
                          className="bg-primary/15 text-primary border-primary/20 text-[10px]"
                        >
                          本人
                        </Badge>
                      )}
                    </div>
                  ))}

                  {remainingFamilySlots != null && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      あと{remainingFamilySlots}名追加可能
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-full md:w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">来館情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">在籍期間</p>
                  <p className="text-sm font-semibold">{getTenureLabel(member.enrolledAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">最終来館日</p>
                  <p className="text-sm font-semibold">{formatDate(member.lastEntryAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">今月来館回数</p>
                  <p className="text-sm font-semibold">{member.monthlyVisitCount}回</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">累計来館回数</p>
                  <p className="text-sm font-semibold">{member.totalVisitCount}回</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <AccessSettingsCard memberId={memberId} gateStopRestricted={gateStopRestricted} />

          <NotificationSettingsCard preferences={member.notificationPreferences} />
        </div>
      </div>
    </div>
  );
}

function AccessSettingsCard({
  memberId,
  gateStopRestricted,
}: {
  memberId: string;
  gateStopRestricted: boolean;
}) {
  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getCrmMembersByIdUsageHistoryAccessSettingsOptions({
      path: { id: memberId },
    }),
    enabled: Boolean(memberId),
  });

  return (
    <DataStateBoundary
      isLoading={isLoading}
      isError={isError}
      isEmpty={!settings}
      onRetry={() => {
        void refetch();
      }}
      skeleton={
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">入退館設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`access-settings-skeleton-${index}`} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">入退館設定</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">認証方法</p>
              <p className="text-sm font-medium">
                {settings ? getAuthMethodLabel(settings.authMethod) : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">ICカード番号</p>
              <p className="font-mono text-sm font-medium">{settings?.icCardNumber ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">QRコード</p>
              <p className="text-sm font-medium">{settings?.qrCode ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">
                <JargonTip term="ゲートストップ" />
              </p>
              <p
                className={`text-sm font-medium ${gateStopRestricted ? 'text-warning' : 'text-muted-foreground'}`}
              >
                {gateStopRestricted ? '設定中' : '設定なし'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DataStateBoundary>
  );
}

/**
 * Notification opt-ins are per TOPIC, not per channel (push / mail / …) — the
 * axis changed with the backend answer 2026-08-10 (QA02 §2.3). All 10 topics
 * always come back, in this order, so no sorting or filling in is needed here.
 */
const NOTIFICATION_TOPIC_LABELS: Record<NotificationTopic, string> = {
  visit_stamp: '来館・スタンプ',
  points: 'ポイント',
  achievements: '称号',
  training_reminder: 'トレーニングリマインダー',
  body_measurement_reminder: '体組成測定リマインダー',
  condition_record: 'コンディション記録',
  follow_request: 'フォロー申請',
  news: 'お知らせ',
  campaign: 'キャンペーン',
  reservation_reminder: '予約リマインダー',
};

function NotificationSettingsCard({ preferences }: { preferences: NotificationPreference[] }) {
  const header = (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-base font-semibold">通知受信設定</CardTitle>
        <Badge variant="outline" className="text-muted-foreground text-[10px]">
          参照のみ
        </Badge>
      </div>
    </CardHeader>
  );

  return (
    <Card>
      {header}
      <CardContent className="px-4">
        <p className="text-muted-foreground mb-3 text-xs">
          会員がアプリ側で設定したトピック別の通知受信ON/OFFです。管理者は参照のみ可能です。
        </p>
        <div className="flex flex-col divide-y">
          {preferences.map((preference) => (
            <div key={preference.topic} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Bell className="text-muted-foreground size-4" />
                <span className="text-sm">
                  {NOTIFICATION_TOPIC_LABELS[preference.topic] ?? preference.topic}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    preference.isOptedIn
                      ? 'bg-success/15 text-success border-success/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {preference.isOptedIn ? 'ON' : 'OFF'}
                </Badge>
                {/* Null until the member changes the topic themselves */}
                <span className="text-muted-foreground text-[10px]">
                  {preference.updatedAt ? formatDate(preference.updatedAt) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
