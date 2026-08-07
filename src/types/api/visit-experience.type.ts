export type VisitExperienceStatus =
  | 'application_received'
  | 'info_missing'
  | 'bl_checking'
  | 'visiting'
  | 'visit_completed'
  | 'membership_applied'
  | 'cancelled';

export const VISIT_EXPERIENCE_STATUS_LABELS: Record<VisitExperienceStatus, string> = {
  application_received: '申込受付',
  info_missing: '確認待ち',
  bl_checking: 'BL照合中',
  visiting: '見学中',
  visit_completed: '見学終了',
  membership_applied: '入会申請済',
  cancelled: 'キャンセル',
};

export interface VisitExperience {
  id: string;
  customer_name: string;
  status: VisitExperienceStatus;
  bl_match: boolean;
  brand_name: string;
  store_name: string;
  reserved_at: string;
  visit_start_at: string | null;
  visit_end_scheduled_at: string;
  visit_end_actual_at: string | null;
}

export type VisitExperienceDateRangeFilter = 'today' | 'last_3_days' | 'last_7_days';

export interface GetVisitExperiencesQuery {
  search?: string;
  status?: VisitExperienceStatus;
  brand_name?: string;
  store_name?: string;
  date_range?: VisitExperienceDateRangeFilter;
  page?: number;
  limit?: 25 | 50 | 100 | 200;
}

export interface GetVisitExperiencesResponse {
  items: VisitExperience[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface GetVisitExperiencesSummaryResponse {
  today_applications: number;
  visiting_count: number;
  today_membership_count: number;
  today_cancelled_count: number;
}

export interface VisitTimelineEntry {
  timestamp: string;
  operator: string;
  content: string;
}

export interface VisitExperienceDetail extends VisitExperience {
  customer_name_kana: string;
  birth_date: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  id_document_type: string | null;
  id_document_verified: boolean;
  bl_match_reason: string | null;
  permit_issued_at: string | null;
  b01_auth_method: string | null;
  b01_gate: string | null;
  b01_entry_at: string | null;
  b01_exit_at: string | null;
  timeline: VisitTimelineEntry[];
}

export interface PermitVisitExperienceResponse {
  record: VisitExperienceDetail;
}
