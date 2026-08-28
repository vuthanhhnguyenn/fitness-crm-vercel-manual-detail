import type {
  DirectEnrollmentRequest,
  GetApplicationDetailResponse,
  GetMembershipApplicationsQuery,
  GetMembershipApplicationsResponse,
  MembershipApplication,
  RejectionReason,
  TimelineEntry,
} from '@/app/api/_schemas/membership-application.schema';

import type {
  MembershipApplicationDetailRow,
  MembershipApplicationRow,
} from '../seeds/membership-application.seed';

export type MembershipApplicationDetail = GetApplicationDetailResponse['application'];

/** Discriminated result sentinels returned by the guarded mutations (data-model §5). */
export type MembershipApplicationMutationFailure =
  | 'not_found'
  | 'invalid_status'
  | 'agreement_missing'
  | 'usage_start_reached'
  | 'same_day_limit'
  | 'not_a_memo';

export type ApproveFailure = 'not_found' | 'invalid_status' | 'agreement_missing';
export type RejectFailure = 'not_found' | 'invalid_status';
export type CancelFailure =
  | 'not_found'
  | 'invalid_status'
  | 'usage_start_reached'
  | 'same_day_limit';
export type MemoFailure = 'not_found' | 'not_a_memo';

export type MembershipApplicationsType = {
  _rows: MembershipApplicationRow[];
  _details: Record<string, MembershipApplicationDetailRow>;
  _seeded: boolean;
  _seed(): void;
  _enrollmentFeeAmount(detail: MembershipApplicationDetailRow): number;
  _scoped(allowedStoreIds: string[] | null): MembershipApplicationRow[];
  _sameDayCount(detail: MembershipApplicationDetailRow): number;
  _toDetail(row: MembershipApplicationRow): MembershipApplicationDetail;
  _patchRow(id: string, patch: Partial<MembershipApplicationRow>): MembershipApplicationRow;
  _prependTimeline(id: string, entries: TimelineEntry[]): void;

  list(
    query: GetMembershipApplicationsQuery,
    allowedStoreIds: string[] | null,
  ): GetMembershipApplicationsResponse;

  getRow(id: string, allowedStoreIds: string[] | null): MembershipApplicationRow | undefined;
  getDetail(
    id: string,
    allowedStoreIds: string[] | null,
  ): MembershipApplicationDetail | 'not_found';

  approve(
    id: string,
    operator: string,
    allowedStoreIds: string[] | null,
    staffExemptionReason?: string,
  ): MembershipApplicationDetail | ApproveFailure;

  reject(
    id: string,
    reason: RejectionReason,
    supplement: string | undefined,
    operator: string,
    allowedStoreIds: string[] | null,
  ): MembershipApplicationDetail | RejectFailure;

  cancel(
    id: string,
    reason: string,
    operator: string,
    allowedStoreIds: string[] | null,
  ): { application: MembershipApplicationDetail; same_day_cancel_count: number } | CancelFailure;

  addMemo(
    id: string,
    content: string,
    operator: string,
    allowedStoreIds: string[] | null,
  ): TimelineEntry[] | 'not_found';

  deleteMemo(
    id: string,
    memoId: string,
    allowedStoreIds: string[] | null,
  ): TimelineEntry[] | MemoFailure;

  createDirect(
    data: DirectEnrollmentRequest,
    blacklistState: MembershipApplicationRow['blacklist_state'],
    staff: { id: string; name: string },
  ): MembershipApplication;

  hasActiveApplicationForEmail(email: string): boolean;
  brandMinAge(brandName: string): number;
};
