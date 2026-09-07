import { NextResponse } from 'next/server';

import type { ManualNotificationErrorResponse } from '@/app/api/_schemas/manual-notification.schema';
import type { z } from 'zod';

const SUBMISSION_FIELD_LABELS: Readonly<Record<string, string>> = {
  title: 'タイトル（管理用）',
  channels: '配信チャネル',
  target: '配信対象',
  'target.brands': 'ブランド',
  'target.storeIds': '店舗',
  'target.memberIds': '会員',
  'contents.sms.body': 'SMS本文',
  'contents.push.title': 'プッシュ通知タイトル',
  'contents.push.body': 'プッシュ通知本文',
  'contents.email.subject': 'メール件名',
  'contents.email.body': 'メール本文',
  'contents.in_app.title': 'アプリ内通知タイトル',
  'contents.in_app.body': 'アプリ内通知本文',
  'contents.in_app.linkUrl': 'アプリ内通知リンクURL',
  'timing.scheduledAt': '配信日時',
  'timing.startAt': '配信開始日時',
  'timing.intervalValue': '配信間隔',
  'timing.intervalUnit': '配信間隔の単位',
  'timing.endAt': '終了日',
  'timing.maxOccurrences': '配信回数',
};

function getSubmissionFieldLabel(path: PropertyKey[]): string {
  const normalizedPath = path.map(String).join('.');
  const exactLabel = SUBMISSION_FIELD_LABELS[normalizedPath];
  if (exactLabel) return exactLabel;

  if (normalizedPath.startsWith('target')) return '配信対象';
  if (normalizedPath.startsWith('contents.sms')) return 'SMS通知内容';
  if (normalizedPath.startsWith('contents.push')) return 'プッシュ通知内容';
  if (normalizedPath.startsWith('contents.email')) return 'メール通知内容';
  if (normalizedPath.startsWith('contents.in_app')) return 'アプリ内通知内容';
  if (normalizedPath.startsWith('timing')) return '配信タイミング';
  return '通知内容';
}

export function formatManualNotificationSubmissionValidationError(
  issues: readonly z.core.$ZodIssue[],
): string {
  if (issues.length === 0) return '通知内容に未入力または不正な項目があります';

  const fieldLabels = [...new Set(issues.map((issue) => getSubmissionFieldLabel(issue.path)))];
  return `通知内容を確認してください。未入力または不正な項目：${fieldLabels.join('、')}`;
}

/**
 * Shared error envelope for all /crm/notifications/* routes.
 *
 * Matches the surveys convention: `{ error, detail: { message } }`. The
 * global toast reads `body.error` via `api-error.util.ts:getApiErrorMessage`.
 * The `isNotificationNotFoundError` discriminator checks `status` (attached
 * by the error interceptor on every rejection), so the 404 case is still
 * distinguishable from a generic 400/403.
 */
export function manualNotificationErrorResponse(
  status: 400 | 401 | 403 | 404,
  message: string,
): NextResponse<ManualNotificationErrorResponse> {
  const body: ManualNotificationErrorResponse = {
    error: message,
    detail: { message },
  };
  return NextResponse.json(body, { status });
}
