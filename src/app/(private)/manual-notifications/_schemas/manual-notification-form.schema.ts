import { z } from 'zod';

import type { ManualNotificationDetail, ManualNotificationUpsertBody } from '@/lib/api/types.gen';
import { isSafeManualNotificationLinkUrl } from '@/lib/manual-notifications/manual-notification-link.util';

import {
  MANUAL_NOTIFICATION_BRAND_OPTIONS,
  MANUAL_NOTIFICATION_CHANNEL_OPTIONS,
  MANUAL_NOTIFICATION_CONTRACT_TYPE_OPTIONS,
} from '../_constants/manual-notification.constants';

const optionalNumber = (message: string, maximum?: { value: number; message: string }) => {
  let schema = z.coerce.number().int().positive(message);
  if (maximum) schema = schema.max(maximum.value, maximum.message);
  return z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    schema.optional(),
  );
};

const targetSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all_members') }),
  z.object({
    type: z.literal('brands'),
    brands: z.array(z.enum(MANUAL_NOTIFICATION_BRAND_OPTIONS)),
  }),
  z.object({
    type: z.literal('stores'),
    stores: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
  }),
  z.object({
    type: z.literal('contract_type'),
    contractType: z.enum(MANUAL_NOTIFICATION_CONTRACT_TYPE_OPTIONS),
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
    members: z.array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        memberNumber: z.string().min(1).optional(),
        storeName: z.string().min(1).optional(),
      }),
    ),
  }),
]);

const timingSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('immediate') }),
  z.object({
    type: z.literal('scheduled'),
    scheduledAt: z.date({ error: '配信日時を選択してください' }),
  }),
  z.object({
    type: z.literal('recurring'),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    startAt: z.date({ error: '開始日時を選択してください' }),
    intervalValue: optionalNumber('1以上の間隔を入力してください', {
      value: 365,
      message: '間隔は365以下で入力してください',
    }),
    intervalUnit: z.enum(['day', 'week', 'month']).optional(),
    endDate: z.date().optional(),
    maxOccurrences: optionalNumber('1以上の配信回数を入力してください'),
    endMode: z.enum(['none', 'date', 'count']).default('none'),
  }),
]);

export const manualNotificationFormSchema = z
  .object({
    intent: z.enum(['save', 'submit']).default('save'),
    title: z.string().trim().max(255),
    target: targetSchema,
    channels: z.array(z.enum(MANUAL_NOTIFICATION_CHANNEL_OPTIONS)),
    contents: z.object({
      sms: z.object({ body: z.string().default('') }),
      push: z.object({ title: z.string().default(''), body: z.string().default('') }),
      email: z.object({ subject: z.string().default(''), body: z.string().default('') }),
      in_app: z.object({
        title: z.string().default(''),
        body: z.string().default(''),
        linkUrl: z.string().trim().default(''),
      }),
    }),
    timing: timingSchema,
  })
  .superRefine((value, context) => {
    for (const channel of value.channels) {
      const heading =
        channel === 'push'
          ? value.contents.push.title
          : channel === 'in_app'
            ? value.contents.in_app.title
            : channel === 'email'
              ? value.contents.email.subject
              : undefined;
      if (heading && heading.trim().length > 255) {
        context.addIssue({
          code: 'custom',
          path: ['contents', channel, channel === 'email' ? 'subject' : 'title'],
          message: '255文字以内で入力してください',
        });
      }
    }

    if (value.intent === 'submit') {
      if (!value.title) {
        context.addIssue({ code: 'custom', path: ['title'], message: 'タイトルは必須です' });
      }
      if (value.channels.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['channels'],
          message: '配信チャネルを1つ以上選択してください',
        });
      }
      if (value.target.type === 'brands' && value.target.brands.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['target', 'brands'],
          message: 'ブランドを1つ以上選択してください',
        });
      }
      if (value.target.type === 'stores' && value.target.stores.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['target', 'stores'],
          message: '店舗を1つ以上選択してください',
        });
      }
      if (value.target.type === 'members' && value.target.members.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['target', 'members'],
          message: '会員を1名以上選択してください',
        });
      }
      if (value.channels.includes('in_app') && value.contents.in_app.linkUrl) {
        if (!isSafeManualNotificationLinkUrl(value.contents.in_app.linkUrl)) {
          context.addIssue({
            code: 'custom',
            path: ['contents', 'in_app', 'linkUrl'],
            message: 'HTTPSのURLを入力してください',
          });
        }
      }
      if (value.timing.type === 'recurring') {
        if (value.timing.endMode === 'date' && !value.timing.endDate) {
          context.addIssue({
            code: 'custom',
            path: ['timing', 'endDate'],
            message: '終了日を指定してください',
          });
        }
        if (value.timing.endMode === 'count' && !value.timing.maxOccurrences) {
          context.addIssue({
            code: 'custom',
            path: ['timing', 'maxOccurrences'],
            message: '配信回数を指定してください',
          });
        }
        if (
          value.timing.frequency === 'custom' &&
          (!value.timing.intervalValue || !value.timing.intervalUnit)
        ) {
          context.addIssue({
            code: 'custom',
            path: ['timing', 'intervalValue'],
            message: 'カスタム間隔では数値と単位を指定してください',
          });
        }
        if (
          value.timing.endMode === 'date' &&
          value.timing.endDate &&
          endOfDay(value.timing.endDate) <= value.timing.startAt
        ) {
          context.addIssue({
            code: 'custom',
            path: ['timing', 'endDate'],
            message: '終了日は開始日より後にしてください',
          });
        }
      }
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
        if (!body) {
          context.addIssue({
            code: 'custom',
            path: ['contents', channel, 'body'],
            message: '本文は必須です',
          });
        }
        if (!heading) {
          const headingField = channel === 'email' ? 'subject' : 'title';
          context.addIssue({
            code: 'custom',
            path: ['contents', channel, headingField],
            message: channel === 'email' ? '件名は必須です' : '通知タイトルは必須です',
          });
        }
      }

      const deliveryStart =
        value.timing.type === 'scheduled'
          ? value.timing.scheduledAt
          : value.timing.type === 'recurring'
            ? value.timing.startAt
            : undefined;
      if (deliveryStart && deliveryStart.getTime() <= Date.now()) {
        context.addIssue({
          code: 'custom',
          path: ['timing', value.timing.type === 'scheduled' ? 'scheduledAt' : 'startAt'],
          message: '配信日時は現在時刻より後を指定してください',
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
  if (target.type === 'members') {
    return { type: 'members', memberIds: target.members.map((member) => member.id) };
  }
  return target;
}

export const emptyManualNotificationFormValues: ManualNotificationFormValues = {
  intent: 'save',
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
  const contents: ManualNotificationUpsertBody['contents'] = {};
  for (const channel of values.channels) {
    if (channel === 'sms') contents.sms = values.contents.sms;
    if (channel === 'push') contents.push = values.contents.push;
    if (channel === 'email') contents.email = values.contents.email;
    if (channel === 'in_app') contents.in_app = values.contents.in_app;
  }

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
    contents,
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
    intent: 'save',
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
