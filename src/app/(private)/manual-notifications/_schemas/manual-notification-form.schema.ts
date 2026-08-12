import { z } from 'zod';

import type { ManualNotificationDetail, ManualNotificationUpsertBody } from '@/lib/api/types.gen';

import {
  MANUAL_NOTIFICATION_BRAND_OPTIONS,
  MANUAL_NOTIFICATION_CHANNEL_OPTIONS,
} from '../_constants/manual-notification.constants';

const optionalNumber = (message: string) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().positive(message).optional(),
  );

const targetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all_members') }),
  z.object({
    type: z.literal('brands'),
    brands: z
      .array(z.enum(MANUAL_NOTIFICATION_BRAND_OPTIONS))
      .min(1, 'ブランドを1つ以上選択してください'),
  }),
  z.object({
    type: z.literal('stores'),
    stores: z
      .array(z.object({ id: z.string().min(1), name: z.string().min(1) }))
      .min(1, '店舗を1つ以上選択してください'),
  }),
  z.object({
    type: z.literal('contract_type'),
    contractTypeId: z.string().min(1, '契約種別を選択してください'),
    contractTypeName: z.string().min(1),
  }),
  z.object({
    type: z.literal('membership_duration'),
    condition: z.enum(['within', 'at_least']),
    months: z.coerce.number().int().min(1, '1以上の月数を入力してください').max(60),
  }),
  z.object({
    type: z.literal('dynamic_attribute'),
    attribute: z.enum(['unpaid', 'dormant', 'withdrawal_pending', 'birthday_month', 'trial']),
  }),
  z.object({
    type: z.literal('members'),
    members: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          memberNumber: z.string().min(1).optional(),
          storeName: z.string().min(1).optional(),
        }),
      )
      .min(1, '会員を1名以上選択してください'),
  }),
]);

const timingSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('immediate') }),
  z.object({
    type: z.literal('scheduled'),
    scheduledAt: z.date({ error: '配信日時を選択してください' }),
  }),
  z
    .object({
      type: z.literal('recurring'),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
      startAt: z.date({ error: '開始日時を選択してください' }),
      intervalValue: optionalNumber('1以上の間隔を入力してください'),
      intervalUnit: z.enum(['day', 'week', 'month']).optional(),
      endDate: z.date().optional(),
      maxOccurrences: optionalNumber('1以上の配信回数を入力してください'),
      endMode: z.enum(['none', 'date', 'count']).default('none'),
    })
    .superRefine((value, context) => {
      if (value.endMode === 'date' && !value.endDate)
        context.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: '終了日を指定してください',
        });
      if (value.endMode === 'count' && !value.maxOccurrences)
        context.addIssue({
          code: 'custom',
          path: ['maxOccurrences'],
          message: '配信回数を指定してください',
        });
      if (value.frequency === 'custom' && (!value.intervalValue || !value.intervalUnit)) {
        context.addIssue({
          code: 'custom',
          path: ['intervalValue'],
          message: 'カスタム間隔では数値と単位を指定してください',
        });
      }
      if (value.endDate && value.endDate <= value.startAt) {
        context.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: '終了日は開始日より後にしてください',
        });
      }
    }),
]);

export const manualNotificationFormSchema = z
  .object({
    title: z.string().trim().min(1, 'タイトルは必須です').max(255),
    target: targetSchema,
    channels: z
      .array(z.enum(MANUAL_NOTIFICATION_CHANNEL_OPTIONS))
      .min(1, '配信チャネルを1つ以上選択してください'),
    contents: z.object({
      sms: z.object({ body: z.string().default('') }),
      push: z.object({ title: z.string().default(''), body: z.string().default('') }),
      email: z.object({ subject: z.string().default(''), body: z.string().default('') }),
      in_app: z.object({
        title: z.string().default(''),
        body: z.string().default(''),
        linkUrl: z.string().trim().url('正しいURLを入力してください').or(z.literal('')).default(''),
      }),
    }),
    timing: timingSchema,
  })
  .superRefine((value, context) => {
    for (const channel of value.channels) {
      const content = value.contents[channel];
      const body = content.body.replace(/<[^>]*>/g, '').trim();
      const heading =
        channel === 'push'
          ? value.contents.push.title.trim()
          : channel === 'in_app'
            ? value.contents.in_app.title.trim()
            : channel === 'email'
              ? value.contents.email.subject.trim()
              : true;
      const requiredText = body && heading;
      if (!requiredText) {
        context.addIssue({
          code: 'custom',
          path: ['contents', channel],
          message: '選択したチャネルの本文は必須です',
        });
      }
    }
  });

export type ManualNotificationFormValues = z.infer<typeof manualNotificationFormSchema>;

function manualNotificationTargetToRequest(
  target: ManualNotificationFormValues['target'],
): ManualNotificationUpsertBody['target'] {
  if (target.type === 'stores') {
    return { type: 'stores', storeIds: target.stores.map((store) => store.id) };
  }
  if (target.type === 'contract_type') {
    return { type: 'contract_type', contractTypeId: target.contractTypeId };
  }
  if (target.type === 'members') {
    return { type: 'members', memberIds: target.members.map((member) => member.id) };
  }
  return target;
}

export const emptyManualNotificationFormValues: ManualNotificationFormValues = {
  title: '',
  target: { type: 'all_members' },
  channels: ['push', 'in_app'],
  contents: {
    sms: { body: '' },
    push: { title: '', body: '' },
    email: { subject: '', body: '' },
    in_app: { title: '', body: '', linkUrl: '' },
  },
  timing: { type: 'immediate' },
};

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function manualNotificationFormValuesToRequestBody(
  values: ManualNotificationFormValues,
  intent: NonNullable<ManualNotificationUpsertBody['intent']>,
): ManualNotificationUpsertBody {
  const timing: ManualNotificationUpsertBody['timing'] =
    values.timing.type === 'immediate'
      ? { type: 'immediate' }
      : values.timing.type === 'scheduled'
        ? { type: 'scheduled', scheduledAt: values.timing.scheduledAt.toISOString() }
        : {
            type: 'recurring',
            frequency: values.timing.frequency,
            startAt: values.timing.startAt.toISOString(),
            ...(values.timing.frequency === 'custom'
              ? {
                  intervalValue: values.timing.intervalValue,
                  intervalUnit: values.timing.intervalUnit,
                }
              : {}),
            ...(values.timing.endMode === 'date' && values.timing.endDate
              ? { endAt: endOfDay(values.timing.endDate).toISOString() }
              : {}),
            ...(values.timing.endMode === 'count' && values.timing.maxOccurrences
              ? { maxOccurrences: values.timing.maxOccurrences }
              : {}),
          };

  return {
    title: values.title.trim(),
    target: manualNotificationTargetToRequest(values.target),
    channels: values.channels as ManualNotificationUpsertBody['channels'],
    contents: values.contents,
    timing,
    intent,
  };
}

export function manualNotificationDetailToFormValues(detail: {
  title: string;
  target: ManualNotificationDetail['target'];
  channels: ManualNotificationUpsertBody['channels'];
  contents: ManualNotificationUpsertBody['contents'];
  timing: ManualNotificationUpsertBody['timing'];
}): ManualNotificationFormValues {
  const timing: ManualNotificationFormValues['timing'] =
    detail.timing.type === 'immediate'
      ? { type: 'immediate' }
      : detail.timing.type === 'scheduled'
        ? { type: 'scheduled', scheduledAt: new Date(detail.timing.scheduledAt) }
        : {
            type: 'recurring',
            frequency: detail.timing.frequency,
            startAt: new Date(detail.timing.startAt),
            intervalValue: detail.timing.intervalValue,
            intervalUnit: detail.timing.intervalUnit,
            endDate: detail.timing.endAt ? new Date(detail.timing.endAt) : undefined,
            maxOccurrences: detail.timing.maxOccurrences,
            endMode: detail.timing.endAt ? 'date' : detail.timing.maxOccurrences ? 'count' : 'none',
          };

  return {
    title: detail.title,
    target: detail.target,
    channels: detail.channels as ManualNotificationFormValues['channels'],
    contents: {
      sms: { body: detail.contents.sms?.body ?? '' },
      push: {
        title: detail.contents.push?.title ?? '',
        body: detail.contents.push?.body ?? '',
      },
      email: {
        subject: detail.contents.email?.subject ?? '',
        body: detail.contents.email?.body ?? '',
      },
      in_app: {
        title: detail.contents.in_app?.title ?? '',
        body: detail.contents.in_app?.body ?? '',
        linkUrl: detail.contents.in_app?.linkUrl ?? '',
      },
    },
    timing,
  };
}
