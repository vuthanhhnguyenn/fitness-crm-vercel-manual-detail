'use client';
import { useState } from 'react';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { formatDate, formatYen } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarX2,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { MemberHeadupCard } from '@/components/common/member-headup-card';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmMembersByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import { MemberStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  MEMBER_STATUS_CLASSES,
  MEMBER_STATUS_LABELS,
  MEMBER_TYPE_LABELS,
  shouldShowMemberStatusDot,
} from '../_constants/constants';
import { BlacklistDialog } from './_components/blacklist-dialog';
import { ForceRetireDialog } from './_components/force-retire-dialog';
import { GateStopReleaseSheet } from './_components/gate-stop-release-sheet';
import { GateStopSetSheet } from './_components/gate-stop-set-sheet';
import { LeaveReleaseSheet } from './_components/leave-release-sheet';
import { LeaveSheet } from './_components/leave-sheet';
import { PenaltyReleaseSheet } from './_components/penalty-release-sheet';
import { PersonalDataDeleteDialog } from './_components/personal-data-delete-dialog';
import { ReEnrollSheet } from './_components/re-enroll-sheet';
import { BasicInfoTab } from './_components/tabs/basic-info-tab';
import { BodyDataTab } from './_components/tabs/body-data-tab';
import { ChangeHistoryTab } from './_components/tabs/change-history-tab';
import { ContractsTab } from './_components/tabs/contracts-tab';
import { PaymentHistoryTab } from './_components/tabs/payment-history-tab';
import { PointsTab } from './_components/tabs/points-tab';
import { ReferralTab } from './_components/tabs/referral-tab';
import { SurveyResponseHistoryTab } from './_components/tabs/survey-response-tab';
import { TrainingRecordsTab } from './_components/tabs/training-records-tab';
import { UsageHistoryTab } from './_components/tabs/usage-history-tab';
import { TransferSheet } from './_components/transfer-sheet';
import { WithdrawCancelDialog } from './_components/withdraw-cancel-dialog';
import { WithdrawSheet } from './_components/withdraw-sheet';
import {
  GATE_STOP_PATTERN_LABELS,
  GATE_STOP_PATTERN_RESTRICTION_TEXT,
  isGateStopRestricted,
} from './_constants/gate-stop';

const TABS = [
  'basic',
  'contracts',
  'payment',
  'usage',
  'points',
  'survey',
  'training',
  'body-data',
  'referral',
  'history',
] as const;

const isMemberTab = (value: string | null): value is (typeof TABS)[number] => {
  if (!value) return false;
  return TABS.includes(value as (typeof TABS)[number]);
};

export default function MemberDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  // Show a two-level-back breadcrumb when navigated from a referrer / family member
  const parentMemberId = searchParams.get('parentMemberId');
  const parentName = searchParams.get('parentName');

  const memberId = params.id as string;
  const activeTab = isMemberTab(tab) ? tab : 'basic';

  const [showReEnrollSheet, setShowReEnrollSheet] = useState(false);
  const [showWithdrawSheet, setShowWithdrawSheet] = useState(false);
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);
  const [showPersonalDataDeleteDialog, setShowPersonalDataDeleteDialog] = useState(false);
  const [showWithdrawCancelDialog, setShowWithdrawCancelDialog] = useState(false);
  const [showGateStopSetSheet, setShowGateStopSetSheet] = useState(false);
  const [showGateStopReleaseSheet, setShowGateStopReleaseSheet] = useState(false);
  const [showLeaveReleaseSheet, setShowLeaveReleaseSheet] = useState(false);
  const [showTransferSheet, setShowTransferSheet] = useState(false);
  const [showForceRetireDialog, setShowForceRetireDialog] = useState(false);
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [showPenaltyReleaseSheet, setShowPenaltyReleaseSheet] = useState(false);

  // A-01 権限マトリクス: a read-only role (Observer) must not be offered the operation
  // menus at all — gating only the items inside still exposes the triggers.
  const { hasPermission } = useAuthUser();
  const canChangeStatus = [
    Permission.MembersSuspend,
    Permission.MembersWithdraw,
    Permission.MembersTransfer,
    Permission.MembersGateStop,
  ].some((permission) => hasPermission(permission));
  const canManageMember = [
    Permission.MembersGateStop,
    Permission.MembersForceWithdraw,
    Permission.BlacklistCreate,
  ].some((permission) => hasPermission(permission));
  const canDeletePersonalData = hasPermission(Permission.MembersPersonalDataDelete);

  const {
    data: member,
    isLoading,
    isError,
    refetch,
  } = useQuery(getCrmMembersByIdOptions({ path: { id: memberId } }));

  if (isLoading || isError || !member) {
    return (
      <DataStateBoundary
        isLoading={isLoading}
        isError={isError}
        isEmpty={!member}
        onRetry={() => refetch()}
      />
    );
  }

  const personalInfo = member.personalInfo;
  const displayName = [personalInfo.lastName, personalInfo.firstName].filter(Boolean).join(' ');
  const nameKana = [personalInfo.lastNameKana, personalInfo.firstNameKana]
    .filter(Boolean)
    .join(' ');
  const avatarFallback = `${personalInfo.lastName?.[0] ?? ''}${personalInfo.firstName?.[0] ?? ''}`;

  const status = member.memberStatus;
  const memberStatusLabel = MEMBER_STATUS_LABELS[status];
  const isWithdrawnStatus =
    status === MemberStatus.WITHDRAWN || status === MemberStatus.FORCED_WITHDRAWAL;
  const isBlacklisted = Boolean(member.blacklist?.isActive);

  // A-01 FR-014: 常時入退館（ストップなし）is the normal state, so it must not raise the banner.
  // Shared helper so the banner, the badge and the 基本情報 入退館設定 card can never disagree.
  const gateStopRestricted = isGateStopRestricted(member);

  // Only the three statuses below contribute status-change items; the transitional
  // ones (仮会員 / 休会予定 / 退会処理待ち) are driven by other flows and offer none.
  // Gate stop adds its own item independently of the status. Without this guard the
  // trigger would open an empty menu.
  const hasStatusChangeItems =
    gateStopRestricted ||
    status === MemberStatus.ACTIVE ||
    status === MemberStatus.SUSPENDED ||
    status === MemberStatus.PENDING_WITHDRAWAL;

  // Application / adjustment labels for the current-status summary strip
  const contract = member.currentMainContract;
  // The 退会取り消し menu item is gated on the member status, so the banner and the
  // 退会予定 badge read the same condition: once the application is cancelled the
  // status is back to 有効 and neither may keep advertising a withdrawal.
  const pendingWithdrawal =
    status === MemberStatus.PENDING_WITHDRAWAL ? contract?.pendingWithdrawal : undefined;
  const applicationBadges: string[] = [];
  if (pendingWithdrawal) applicationBadges.push('退会予定');
  if (contract?.activeSuspension) applicationBadges.push('休会予定');
  if (contract?.activeFeeAdjustment) applicationBadges.push('個別会費調整中');

  // FR-023: re-enrollment bypasses C-01's blacklist screening, so the same blockers that stop
  // 個人情報削除 also stop 再入会
  const hasUnpaidBalance = member.constraints.hasUnpaidFee || member.unpaidAmount > 0;
  const reEnrollBlockedReason = isBlacklisted
    ? 'ブラックリスト登録者のため再入会できません'
    : hasUnpaidBalance
      ? '未納金があるため再入会できません'
      : undefined;

  const handleEdit = () => {
    router.push(navigate('/members/[id]/edit', memberId));
  };

  const handleTabChange = (value: string) => {
    if (!isMemberTab(value)) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === 'basic') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', value);
    }
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        breadcrumb={
          parentMemberId ? (
            <BreadcrumbNav
              items={[
                { url: navigate('/members'), label: '会員管理' },
                {
                  url: navigate('/members/[id]', parentMemberId),
                  label: parentName ?? '会員詳細',
                },
                { label: displayName },
              ]}
            />
          ) : (
            <BackLink label="会員管理に戻る" href={navigate('/members')} />
          )
        }
        title={displayName}
        actions={
          <>
            {!isWithdrawnStatus && (
              <RoleGatedButton
                size="sm"
                requiredPermission={Permission.MembersEdit}
                className="gap-1"
                onClick={handleEdit}
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedButton>
            )}

            {/* Status change */}
            {!isWithdrawnStatus && canChangeStatus && hasStatusChangeItems && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" className="gap-1" />}
                >
                  ステータス変更
                  <ChevronDown className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {status === MemberStatus.ACTIVE && (
                    <>
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersSuspend}
                        disabled={member.constraints.hasUnpaidFee}
                        onClick={() => setShowLeaveSheet(true)}
                      >
                        <div className="flex flex-col">
                          <span>休会申請</span>
                          {member.constraints.hasUnpaidFee && (
                            <span className="text-destructive text-xs">
                              未納金があるため操作できません
                            </span>
                          )}
                        </div>
                      </RoleGatedMenuItem>
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersWithdraw}
                        className="text-destructive"
                        onClick={() => setShowWithdrawSheet(true)}
                      >
                        退会申請
                      </RoleGatedMenuItem>
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersTransfer}
                        disabled={
                          member.constraints.hasUnpaidFee || member.constraints.inCancellationPeriod
                        }
                        onClick={() => setShowTransferSheet(true)}
                      >
                        <div className="flex flex-col">
                          <span>移籍申請</span>
                          {member.constraints.inCancellationPeriod && (
                            <span className="text-destructive text-xs">
                              解約手数料期間中のため移籍できません
                            </span>
                          )}
                          {!member.constraints.inCancellationPeriod &&
                            member.constraints.hasUnpaidFee && (
                              <span className="text-destructive text-xs">
                                未納金があるため操作できません
                              </span>
                            )}
                        </div>
                      </RoleGatedMenuItem>
                    </>
                  )}
                  {status === MemberStatus.SUSPENDED && (
                    <>
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersSuspend}
                        onClick={() => setShowLeaveReleaseSheet(true)}
                      >
                        休会解除
                      </RoleGatedMenuItem>
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersWithdraw}
                        className="text-destructive"
                        onClick={() => setShowWithdrawSheet(true)}
                      >
                        退会申請
                      </RoleGatedMenuItem>
                    </>
                  )}
                  {/* Gate stop is orthogonal to the member status, so its release
                      entry is driven by the gate-stop record and appears alongside
                      whatever the member's own status offers (e.g. a 休会中 member who
                      is also gate-stopped gets 休会解除 AND ゲートストップ解除). */}
                  {gateStopRestricted && (
                    <RoleGatedMenuItem
                      requiredPermission={Permission.MembersGateStop}
                      onClick={() => setShowGateStopReleaseSheet(true)}
                    >
                      ゲートストップ解除
                    </RoleGatedMenuItem>
                  )}
                  {/* 退会申請の取り消し is always available while the member is 退会予定: it only
                      revokes the pending application, so it is unrelated to the contract's usage
                      start date (that date gates 入会取り消し, a separate flow on 入会申請詳細). */}
                  {status === MemberStatus.PENDING_WITHDRAWAL && (
                    <RoleGatedMenuItem
                      requiredPermission={Permission.MembersWithdraw}
                      onClick={() => setShowWithdrawCancelDialog(true)}
                    >
                      退会取り消し
                    </RoleGatedMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Member operations (admin actions) */}
            {!isWithdrawnStatus && canManageMember && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-input bg-background hover:bg-accent hover:text-accent-foreground size-8"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                      管理操作
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!gateStopRestricted && (
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersGateStop}
                        onClick={() => setShowGateStopSetSheet(true)}
                      >
                        ゲートストップ設定
                      </RoleGatedMenuItem>
                    )}
                    <RoleGatedMenuItem
                      requiredPermission={Permission.MembersForceWithdraw}
                      className="text-destructive"
                      onClick={() => setShowForceRetireDialog(true)}
                    >
                      強制退会
                    </RoleGatedMenuItem>
                    <RoleGatedMenuItem
                      requiredPermission={Permission.BlacklistCreate}
                      className="text-destructive"
                      disabled={isBlacklisted}
                      onClick={() => setShowBlacklistDialog(true)}
                    >
                      <div className="flex flex-col">
                        <span>ブラックリスト登録</span>
                        {isBlacklisted && (
                          <span className="text-destructive text-xs">
                            既にブラックリスト登録済みのため操作できません
                          </span>
                        )}
                      </div>
                    </RoleGatedMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Withdrawn member */}
            {isWithdrawnStatus && (
              <>
                <RoleGatedButton
                  requiredPermission={Permission.MembersReEnroll}
                  denyTooltip="再入会登録の権限がありません"
                  size="sm"
                  disabled={!!reEnrollBlockedReason}
                  title={reEnrollBlockedReason}
                  onClick={() => !reEnrollBlockedReason && setShowReEnrollSheet(true)}
                >
                  <UserCheck className="mr-1 size-4" />
                  再入会
                </RoleGatedButton>
                {canDeletePersonalData && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-input bg-background hover:bg-accent hover:text-accent-foreground size-8"
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <RoleGatedMenuItem
                        requiredPermission={Permission.MembersPersonalDataDelete}
                        className="text-destructive"
                        onClick={() => setShowPersonalDataDeleteDialog(true)}
                      >
                        個人情報削除
                      </RoleGatedMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </>
        }
      />

      {/* Warning banners + member head-up card */}
      <div className="p-4">
        {/* Gate-stop warning banner */}
        {gateStopRestricted && (
          <Alert className="border-destructive/50 bg-destructive/10 mb-4">
            <ShieldAlert className="text-destructive size-4" />
            <AlertDescription className="text-xs">
              ゲートストップ中 —{' '}
              {member.gateStop
                ? `${GATE_STOP_PATTERN_LABELS[member.gateStop.pattern]}（${GATE_STOP_PATTERN_RESTRICTION_TEXT[member.gateStop.pattern]}）`
                : '入館が制限されています'}
              {/* The badge above shows ゲートストップ, so the member's own status is
                  restated here — the two are independent and both matter. */}
              <span className="ml-1">／ 会員ステータス: {memberStatusLabel}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Reservation-penalty warning banner */}
        {member.activePenalty && (
          <Alert className="border-destructive/50 bg-destructive/15 mb-4">
            <CalendarX2 className="text-destructive size-4" />
            <AlertDescription className="flex w-full items-center justify-between gap-2 text-xs">
              <span>
                予約ペナルティ中 — {formatDate(member.activePenalty.endAt)} までレッスン予約不可
                {(member.activePenalty.noShowCount != null || member.activePenalty.appliedAt) && (
                  <>
                    （
                    {member.activePenalty.noShowCount != null &&
                      `無断キャンセル${member.activePenalty.noShowCount}回`}
                    {member.activePenalty.noShowCount != null &&
                      member.activePenalty.appliedAt &&
                      ' / '}
                    {member.activePenalty.appliedAt &&
                      `適用日 ${formatDate(member.activePenalty.appliedAt)}`}
                    ）
                  </>
                )}
              </span>
              <RoleGatedButton
                size="sm"
                variant="outline"
                className="h-6 text-xs"
                requiredPermission={Permission.LessonsPenaltyRelease}
                onClick={() => setShowPenaltyReleaseSheet(true)}
              >
                解除...
              </RoleGatedButton>
            </AlertDescription>
          </Alert>
        )}

        {/* Pending-application banner (withdrawal / suspension scheduled) */}
        {pendingWithdrawal && (
          <Alert className="border-warning/50 bg-warning/15 mb-4">
            <ShieldAlert className="text-warning size-4" />
            <AlertDescription className="flex w-full items-center justify-between gap-2 text-xs">
              <span>
                退会申請中 — {formatDate(pendingWithdrawal.scheduledWithdrawalDate)} 退会予定
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => handleTabChange('history')}
                >
                  詳細を見る
                </Button>
                <RoleGatedButton
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  requiredPermission={Permission.MembersWithdraw}
                  onClick={() => setShowWithdrawCancelDialog(true)}
                >
                  取り消す
                </RoleGatedButton>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <MemberHeadupCard
          className="mb-0"
          memberId={member.memberNumber}
          oldMemberNo={member.legacyMemberCode}
          name={displayName}
          nameKana={nameKana}
          memberType={MEMBER_TYPE_LABELS[member.memberType]}
          contractName={member.contractName}
          facePhotoUrl={personalInfo.facePhotoUrl}
          avatarFallback={avatarFallback}
          statusBadge={
            <Badge variant="outline" className={`text-[10px] ${MEMBER_STATUS_CLASSES[status]}`}>
              {shouldShowMemberStatusDot(status) && (
                <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
              )}
              {memberStatusLabel}
            </Badge>
          }
        >
          {/* Current-status summary strip */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground mb-1 text-xs">来館頻度</dt>
              <dd className="text-sm font-medium">直近30日 {member.recentVisitCount}回</dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1 text-xs">未納額</dt>
              <dd
                className={`text-sm font-medium ${member.unpaidAmount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {member.unpaidAmount > 0 ? formatYen(member.unpaidAmount) : 'なし'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1 text-xs">申請・調整</dt>
              <dd className="flex flex-wrap items-center gap-1">
                {applicationBadges.length > 0 ? (
                  applicationBadges.map((label) => (
                    <Badge
                      key={label}
                      variant="outline"
                      className="border-warning/30 bg-warning/15 text-warning gap-1 text-[10px]"
                    >
                      <span className="bg-warning inline-block size-1.5 rounded-full" />
                      {label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm font-medium">なし</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground mb-1 text-xs">直近のイベント</dt>
              <dd className="text-sm font-medium">最終来館 {formatDate(member.lastEntryAt)}</dd>
            </div>
          </dl>
        </MemberHeadupCard>
      </div>

      {/* Tabs */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 pt-0">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 overflow-x-auto overflow-y-hidden">
            <TabsList variant="line" className="inline-flex min-w-max">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="contracts">契約操作</TabsTrigger>
              <TabsTrigger value="payment">支払い履歴</TabsTrigger>
              <TabsTrigger value="usage">利用履歴</TabsTrigger>
              <TabsTrigger value="points">ポイント履歴</TabsTrigger>
              <TabsTrigger value="survey">アンケート回答</TabsTrigger>
              <TabsTrigger value="training">トレーニング記録</TabsTrigger>
              <TabsTrigger value="body-data">ボディーデータ</TabsTrigger>
              <TabsTrigger value="referral">紹介関係</TabsTrigger>
              <TabsTrigger value="history">変更履歴</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="mt-2 min-h-0 min-w-0 flex-1 overflow-hidden pr-2">
            <TabsContent value="basic">
              <BasicInfoTab member={member} />
            </TabsContent>

            <TabsContent value="contracts">
              <ContractsTab
                memberId={memberId}
                memberStatus={status}
                constraints={member.constraints}
              />
            </TabsContent>

            <TabsContent value="payment">
              <PaymentHistoryTab memberId={memberId} />
            </TabsContent>

            <TabsContent value="usage">
              <UsageHistoryTab memberId={memberId} />
            </TabsContent>

            <TabsContent value="points">
              <PointsTab memberId={memberId} />
            </TabsContent>

            <TabsContent value="survey">
              <SurveyResponseHistoryTab memberId={memberId} />
            </TabsContent>

            <TabsContent value="training">
              <TrainingRecordsTab memberId={memberId} />
            </TabsContent>

            <TabsContent value="body-data">
              <BodyDataTab memberId={memberId} consentStatus={member.bodyDataConsentStatus} />
            </TabsContent>

            <TabsContent value="referral">
              <ReferralTab memberId={memberId} memberName={displayName} />
            </TabsContent>

            <TabsContent value="history">
              <ChangeHistoryTab memberId={memberId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {showReEnrollSheet && (
        <ReEnrollSheet
          open={showReEnrollSheet}
          onOpenChange={setShowReEnrollSheet}
          memberId={memberId}
          blockedReason={reEnrollBlockedReason}
          storeId={member.primaryStore.storeId}
          withdrawnAt={member.withdrawnAt}
          lastPlan={member.currentMainContract ? member.contractName : undefined}
        />
      )}

      {showLeaveSheet && (
        <LeaveSheet
          open={showLeaveSheet}
          onOpenChange={setShowLeaveSheet}
          memberId={memberId}
          hasUnpaidFee={member.constraints.hasUnpaidFee}
          activeFeeAdjustment={contract?.activeFeeAdjustment}
          activePointDiscount={contract?.activePointDiscount}
        />
      )}

      {showLeaveReleaseSheet && (
        <LeaveReleaseSheet
          open={showLeaveReleaseSheet}
          onOpenChange={setShowLeaveReleaseSheet}
          memberId={memberId}
        />
      )}

      {showWithdrawSheet && (
        <WithdrawSheet
          open={showWithdrawSheet}
          onOpenChange={setShowWithdrawSheet}
          memberId={memberId}
          memberName={displayName}
          usageStartDate={contract?.usageStartDate}
        />
      )}

      {showPersonalDataDeleteDialog && (
        <PersonalDataDeleteDialog
          open={showPersonalDataDeleteDialog}
          onOpenChange={setShowPersonalDataDeleteDialog}
          memberId={memberId}
          isBlacklisted={isBlacklisted}
          hasUnpaidFee={member.constraints.hasUnpaidFee}
        />
      )}

      {showWithdrawCancelDialog && (
        <WithdrawCancelDialog
          open={showWithdrawCancelDialog}
          onOpenChange={setShowWithdrawCancelDialog}
          memberId={memberId}
        />
      )}

      {showGateStopSetSheet && (
        <GateStopSetSheet
          open={showGateStopSetSheet}
          onOpenChange={setShowGateStopSetSheet}
          memberId={memberId}
        />
      )}

      {showGateStopReleaseSheet && (
        <GateStopReleaseSheet
          open={showGateStopReleaseSheet}
          onOpenChange={setShowGateStopReleaseSheet}
          memberId={memberId}
          gateStopInfo={member.gateStop}
        />
      )}

      {showTransferSheet && (
        <TransferSheet
          open={showTransferSheet}
          onOpenChange={setShowTransferSheet}
          memberId={memberId}
          currentStoreId={member.primaryStore.storeId}
          currentStoreName={member.primaryStore.name}
          hasUnpaidFee={member.constraints.hasUnpaidFee}
          inCancellationPeriod={member.constraints.inCancellationPeriod}
        />
      )}

      {showForceRetireDialog && (
        <ForceRetireDialog
          open={showForceRetireDialog}
          onOpenChange={setShowForceRetireDialog}
          memberId={memberId}
          memberBrand={member.brandGroup}
        />
      )}

      {showBlacklistDialog && (
        <BlacklistDialog
          open={showBlacklistDialog}
          onOpenChange={setShowBlacklistDialog}
          memberId={memberId}
          memberName={displayName}
          memberNumber={member.memberNumber}
        />
      )}

      {showPenaltyReleaseSheet && (
        <PenaltyReleaseSheet
          open={showPenaltyReleaseSheet}
          onOpenChange={setShowPenaltyReleaseSheet}
          memberId={memberId}
          penalty={member.activePenalty}
        />
      )}
    </div>
  );
}
