import { TermsBrand, TermsStatus, TermsType } from '@/lib/api/types.gen';
import type { TermsVersionEntry } from '@/lib/api/types.gen';

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const TERMS_DEFAULT_PAGE_SIZE = 50;

export const TERMS_TYPE_LABELS: Record<TermsType, string> = {
  [TermsType.MEMBERSHIP]: '会員規約',
  [TermsType.PRIVACY_POLICY]: 'プライバシーポリシー',
  [TermsType.PAYMENT]: '決済規約',
  [TermsType.COMPANION]: '同伴規約',
  [TermsType.WITHDRAWAL]: '退会規約',
  [TermsType.LEAVE_OF_ABSENCE]: '休会規約',
};

export const TERMS_BRAND_LABELS: Record<TermsBrand, string> = {
  [TermsBrand.JOYFIT]: 'JOYFIT',
  [TermsBrand.FIT365]: 'FIT365',
};

export const TERMS_STATUS_LABELS: Record<TermsStatus, string> = {
  [TermsStatus.PUBLISHED]: '公開中',
  [TermsStatus.EXPIRED]: '適用終了',
  [TermsStatus.DRAFT]: '下書き',
};

/**
 * Status vocabulary differs by location: the document-level badge (header + 管理情報) uses
 * `公開中`, but the version-history timeline entry badge uses `適用中` for the same underlying
 * `published` status (Y-04 spec, terms-detail vocabulary note). See BUG-Y04D-03.
 */
export const TERMS_TIMELINE_STATUS_LABELS: Record<TermsStatus, string> = {
  ...TERMS_STATUS_LABELS,
  [TermsStatus.PUBLISHED]: '適用中',
};

export const TERMS_STATUS_BADGE_CLASSES: Record<TermsStatus, string> = {
  [TermsStatus.PUBLISHED]: 'bg-success/15 text-success border-success/20',
  [TermsStatus.EXPIRED]: 'bg-muted text-muted-foreground border-border',
  [TermsStatus.DRAFT]: 'bg-warning/15 text-warning border-warning/20',
};

export type TermsVersionKind = TermsVersionEntry['versionKind'];

export const VERSION_KIND_LABELS: Record<TermsVersionKind, string> = {
  original: 'オリジナル規約',
  version: 'バージョン規約',
};

export const VERSION_KIND_BADGE_CLASSES: Record<TermsVersionKind, string> = {
  original: 'bg-primary/15 text-primary border-primary/20',
  version: 'bg-info/15 text-info border-info/20',
};
