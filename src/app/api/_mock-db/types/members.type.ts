import type { FamilyRelationship } from '@/app/api/_schemas/family-registration.schema';
import type {
  GateStopReason,
  GateStopSetPattern,
  GetMemberDetailResponse,
  UpdateBasicInfoRequest,
  UpdateHealthInfoRequest,
  UpdateMarketingConsentRequest,
  UpdateMemberRequest,
} from '@/app/api/_schemas/member.schema';

import type { GetMembersResponseMember, Member, MemberRow } from '../seeds/membership.seed';
import type { MembershipApplicationDetail } from './membership-applications.type';

export type MemberType = {
  _members: MemberRow[];
  _seeded: boolean;
  _seed(): void;
  get(id: string): Member | undefined;
  getList(): GetMembersResponseMember[];
  getSummary(): {
    active_count: number;
    active_change_percent: number;
    suspended_count: number;
    suspended_percent: number;
    unpaid_count: number;
    unpaid_total_yen: number;
    scheduled_withdrawal_count: number;
    withdrawal_rate_percent: number;
  };
  createFromApplication(application: MembershipApplicationDetail): Member;
  createFromFamilyRegistration(registration: {
    applicant_name: string;
    relationship: FamilyRelationship;
    applicant?: { birthday?: string; phone?: string; email?: string };
    primary_member_id: string;
  }): MemberRow;
  update(id: string, body: UpdateMemberRequest): Member | undefined;
  updateBasicInfo(id: string, body: UpdateBasicInfoRequest): Member | undefined;
  updateProfileInfo(
    id: string,
    body: NonNullable<UpdateMemberRequest['profile_info']>,
  ): Member | undefined;
  updateHealthInfo(id: string, body: UpdateHealthInfoRequest): Member | undefined;
  updateMarketingConsent(id: string, body: UpdateMarketingConsentRequest): Member | undefined;
  anonymizePersonalData(id: string): Member | undefined;
  handleWithdrawal(input: {
    id: string;
    scheduled_date: string;
    reason: string;
  }): Member | undefined;
  handleWithdrawCancel(id: string): Member | undefined;
  handleForceWithdrawal(input: {
    id: string;
    reason: string;
  }): { member: Member; blacklistId: string } | undefined;
  handleTransfer(input: {
    id: string;
    to_store_id: string;
    to_store_name: string;
    reason?: string;
    // A-01 FR-017: 代理申請の証跡
    is_proxy?: boolean;
    proxy_agreed_at?: string;
    proxy_method?: string;
  }): { member: Member; transfer_id: string } | undefined;
  handleSuspension(input: {
    id: string;
    start_month: string;
    end_month: string;
    reason?: string;
    is_proxy?: boolean;
    proxy_agreed_at?: string;
    proxy_method?: string;
  }): Member | undefined;
  handleSuspendRelease(input: { id: string; resume_month: string }): Member | undefined;
  setGateStop(input: {
    id: string;
    pattern: GateStopSetPattern;
    reasonCategory: GateStopReason;
    message?: string;
    messageType: 'allow_after_confirm' | 'deny_after_confirm';
    set_by?: string;
  }): Member | undefined;
  buildFamilyBundle(member_id: string): GetMemberDetailResponse['family'];
  releaseGateStop(id: string): Member | undefined;
};
