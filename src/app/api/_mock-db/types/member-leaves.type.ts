import type { LeaveDetail, LeaveListItem } from '@/app/api/_schemas/leave.schema';

export type MemberLeavesType = {
  _rows: LeaveListItem[];
  _details: Record<string, LeaveDetail>;
  _seeded: boolean;
  _seed(): void;
  list(): LeaveListItem[];
  getById(id: string): LeaveDetail | undefined;
  getActiveSuspensionByMemberId(memberId: string): LeaveDetail | undefined;
  approve(id: string, comment?: string): LeaveDetail | undefined;
  reject(id: string, reason: string): LeaveDetail | undefined;
  cancelWithdrawal(id: string, comment?: string): LeaveDetail | undefined;
  executeWithdrawal(id: string, comment?: string): LeaveDetail | undefined;
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
