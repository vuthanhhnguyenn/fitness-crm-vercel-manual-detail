// Types for Membership Applications API (snake_case)

export type MembershipApplicationStatus =
  | 'pending'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type RiskReason =
  | 'blacklist_match'
  | 'duplicate_application'
  | 'payment_failure'
  | 'high_risk_score'
  | 'document_issue'
  | 'other';

export interface MembershipApplication {
  id: string;
  applicant_name: string;
  status: MembershipApplicationStatus;
  blacklist_match: boolean;
  brand_name: string;
  store_name: string;
  plan_name: string;
  campaign: string;
  application_date: string;
  start_date: string;
  is_minor?: boolean;
  is_proxy?: boolean;
}
