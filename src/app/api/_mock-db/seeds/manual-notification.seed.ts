import type { ManualNotificationChannel } from '@/app/api/_schemas/manual-notification.schema';

import type { ManualNotificationRow } from '../types/manual-notifications.type';

const STAFF_IDS = {
  headquarter: 'U-001',
  manager: 'U-003',
  staff: 'U-002',
} as const;

const CHANNEL_ORDER = { sms: 0, push: 1, email: 2, in_app: 3 } as const;

type SeedInput = Omit<ManualNotificationRow, 'targetStoreIds' | 'contents'> & {
  targetStoreIds?: string[];
  bodies?: Partial<Record<ManualNotificationChannel, string>>;
};

function buildContents(input: SeedInput): ManualNotificationRow['contents'] {
  const contents: ManualNotificationRow['contents'] = {};
  for (const channel of input.channels) {
    const body =
      input.bodies?.[channel] ?? `「${input.title}」のお知らせです。詳細をご確認ください。`;
    if (channel === 'sms') contents.sms = { body };
    if (channel === 'push') contents.push = { title: input.title, body };
    if (channel === 'email') contents.email = { subject: input.title, body };
    if (channel === 'in_app') contents.in_app = { title: input.title, body };
  }
  return contents;
}

function notification(input: SeedInput): ManualNotificationRow {
  return {
    ...input,
    channels: [...input.channels].sort(
      (first, second) => CHANNEL_ORDER[first] - CHANNEL_ORDER[second],
    ),
    targetStoreIds: [...(input.targetStoreIds ?? [])],
    contents: buildContents(input),
  };
}

export const MANUAL_NOTIFICATION_SEED: ManualNotificationRow[] = [
  notification({
    id: 'N-001',
    title: '夏キャンペーン告知',
    bodies: {
      push: '【JOYFIT】サマーキャンペーン開催中！オプション料金が最大30%オフ。詳細はアプリでチェック',
      email:
        '会員の皆様へ\n\nこの夏、JOYFITでは「サマーキャンペーン」を開催いたします！\n\n期間中はオプション料金が最大30%オフとなります。\n\nこの機会にぜひ新しいオプションをお試しください。\n\n詳細・お申し込みはアプリ内キャンペーンページをご確認ください。\n\n▼キャンペーンページはこちら\nhttps://joyfit.example.com/campaign/summer2026\n今後ともJOYFITをよろしくお願いいたします。',
      in_app:
        '夏のサマーキャンペーン開催中。オプション料金が最大30%オフになります。詳細をご確認ください。',
    },
    target: { type: 'all_members' },
    channels: ['push', 'email', 'in_app'],
    timing: { type: 'scheduled', scheduledAt: '2026-07-01T10:00:00+09:00' },
    targetCount: 42580,
    status: 'pending_approval',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.manager,
    createdAt: '2026-06-15T14:30:00+09:00',
    updatedAt: '2026-06-18T09:15:00+09:00',
    deletedAt: null,
  }),
  notification({
    id: 'N-002',
    title: '料金改定リマインド',
    target: { type: 'all_members' },
    channels: ['sms', 'push', 'email'],
    timing: { type: 'immediate' },
    targetCount: 42580,
    status: 'sent',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.headquarter,
    approvedBy: 'Headquarter',
    approvedAt: '2026-06-25T10:05:00+09:00',
    deliveryResult: {
      deliveredAt: '2026-06-25T10:06:00+09:00',
      deliveredCount: 41250,
      reachedCount: 39820,
      openedCount: 28600,
      channelResults: [
        { channel: 'sms', deliveredCount: 41250, reachedCount: 40100 },
        { channel: 'push', deliveredCount: 41250, reachedCount: 40100, openedCount: 24500 },
        { channel: 'email', deliveredCount: 41250, reachedCount: 39740, openedCount: 12800 },
      ],
    },
    createdAt: '2026-06-25T10:00:00+09:00',
    updatedAt: '2026-08-02T09:00:00+09:00',
    deletedAt: null,
  }),
  notification({
    id: 'N-003',
    title: 'メンテナンス通知（JOYFIT24）',
    target: { type: 'brands', brands: ['joyfit24'] },
    channels: ['push', 'in_app'],
    timing: { type: 'scheduled', scheduledAt: '2026-05-20T08:00:00+09:00' },
    targetCount: 8420,
    status: 'scheduled',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.manager,
    approvedBy: 'Headquarter',
    approvedAt: '2026-05-10T11:10:00+09:00',
    createdAt: '2026-05-10T11:00:00+09:00',
    updatedAt: '2026-08-01T09:00:00+09:00',
    deletedAt: null,
  }),
  notification({
    id: 'N-004',
    title: '新店舗オープンのお知らせ',
    target: {
      type: 'stores',
      stores: [{ id: 'store-joyfit-shinjuku', name: 'JOYFIT新宿店' }],
    },
    channels: ['push', 'in_app'],
    timing: { type: 'immediate' },
    targetCount: 1240,
    status: 'sent',
    requiresApproval: false,
    createdByUserId: STAFF_IDS.staff,
    deliveryResult: {
      deliveredCount: 960,
      reachedCount: 940,
      channelResults: [
        { channel: 'push', deliveredCount: 960, reachedCount: 940, openedCount: 620 },
      ],
    },
    targetStoreIds: ['store-joyfit-shinjuku'],
    createdAt: '2026-06-05T09:00:00+09:00',
    updatedAt: '2026-07-31T09:00:00+09:00',
    deletedAt: null,
  }),
  notification({
    id: 'N-005',
    title: '入会後フォローアップ',
    target: { type: 'membership_duration', condition: 'within', months: 3 },
    channels: ['push'],
    timing: {
      type: 'recurring',
      frequency: 'custom',
      startAt: '2026-05-01T09:00:00+09:00',
      intervalValue: 2,
      intervalUnit: 'week',
      maxOccurrences: 12,
    },
    targetCount: 3180,
    status: 'sending',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.staff,
    approvedBy: 'Headquarter',
    approvedAt: '2026-05-01T08:30:00+09:00',
    createdAt: '2026-05-01T09:00:00+09:00',
    updatedAt: '2026-07-30T09:00:00+09:00',
    deletedAt: null,
  }),
  notification({
    id: 'N-006',
    title: '会員様限定イベントご案内',
    target: {
      type: 'contract_type',
      contractTypeId: 'MC009',
      contractTypeName: 'プレミアム会員',
    },
    channels: ['email', 'in_app'],
    timing: { type: 'scheduled', scheduledAt: '2026-06-15T12:00:00+09:00' },
    targetCount: 5640,
    status: 'draft',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.manager,
    createdAt: '2026-06-01T10:00:00+09:00',
    updatedAt: '2026-07-29T09:00:00+09:00',
    deletedAt: null,
  }),
  notification({
    id: 'N-007',
    title: '年末感謝キャンペーン',
    target: { type: 'brands', brands: ['joyfit', 'fit365'] },
    channels: ['sms', 'push', 'email', 'in_app'],
    timing: { type: 'scheduled', scheduledAt: '2026-12-01T09:00:00+09:00' },
    targetCount: 28900,
    status: 'returned',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.manager,
    createdAt: '2026-07-01T10:00:00+09:00',
    updatedAt: '2026-07-28T09:00:00+09:00',
    returnReason: '配信対象の範囲を確認して再申請してください。',
    deletedAt: null,
  }),
  notification({
    id: 'N-008',
    title: 'システムメンテナンスのお知らせ',
    target: { type: 'all_members' },
    channels: ['push', 'in_app'],
    timing: { type: 'immediate' },
    targetCount: 42580,
    status: 'draft',
    requiresApproval: true,
    createdByUserId: STAFF_IDS.headquarter,
    createdAt: '2026-06-30T09:00:00+09:00',
    updatedAt: '2026-07-27T09:00:00+09:00',
    deletedAt: null,
  }),
];
