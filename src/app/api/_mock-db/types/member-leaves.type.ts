import type { LeaveDetail, LeaveListItem } from '@/app/api/_schemas/leave.schema';

import type { CancelWithdrawalResult } from '../tables/member-leave.table';

/**
 * A-03 休会・退会 table.
 *
 * `cancelWithdrawal` is the only mutation A-03 owns. Approve / reject /
 * execute-withdrawal were removed together with their route handlers — approval
 * and rejection belong to A-01-01, and withdrawal execution is a System batch.
 *
 * `create` / `createSuspension` are **member-side** entry points (A-01-01) consumed
 * by `members.table.ts`; they are not reachable from the A-03 screens and must stay.
 */
export type MemberLeavesType = {
  _rows: LeaveListItem[];
  _details: Record<string, LeaveDetail>;
  _seeded: boolean;
  _seed(): void;
  list(): LeaveListItem[];
  getById(id: string): LeaveDetail | undefined;
  getActiveSuspensionByMemberId(memberId: string): LeaveDetail | undefined;
  _updateDetail(id: string, patch: Partial<LeaveDetail>): LeaveDetail | undefined;
  /** `executor` is the session user's name, recorded on the application (FR-002). */
  cancelWithdrawal(id: string, executor: string): CancelWithdrawalResult;
  create(input: { member_id: string; scheduled_date: string; reason: string }): LeaveDetail;
  createSuspension(input: {
    member_id: string;
    start_month: string;
    end_month: string;
    reason?: string;
    is_proxy?: boolean;
    proxy_agreed_at?: string;
    proxy_method?: string;
  }): LeaveDetail;
};
