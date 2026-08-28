import type {
  BufferSettings,
  CreateInstructorRequest,
  Instructor,
  InstructorChangeHistoryEntry,
  RoleClassification,
} from '@/app/api/_schemas/instructor.schema';
import type {
  GetInstructorsQuery,
  InstructorListItem,
} from '@/app/api/_schemas/lesson-schedule.schema';

/** Internal storage row for a full instructor profile (D-04). */
export type InstructorRow = {
  instructor_id: string;
  last_name: string;
  first_name: string;
  romaji_last_name: string | null;
  romaji_first_name: string | null;
  nickname: string | null;
  role_classifications: RoleClassification[];
  tab: 'studio' | 'pt';
  profile_text: string | null;
  instructing_history: string | null;
  photo_url: string | null;
  status: 'active' | 'inactive';
  buffer_settings: BufferSettings;
  crm_account_link_staff_id: string | null;
  store_id: string;
  average_rating: number | null;
  created_at: string;
  updated_at: string;
};

/** Legacy minimal shape kept for the D-01 lesson-schedule instructor picker. */
export type LegacyInstructorRow = {
  instructor_id: string;
  instructor_name: string;
  store_id: string;
  role: string;
  photo_url?: string;
};

export type InstructorDataScope = (instructor: {
  instructor_id: string;
  store_id?: string | null;
}) => boolean;

export type InstructorDetailAggregate = {
  data: Instructor;
  performance_summary: {
    weekly_lesson_count: number;
    average_reservation_rate: number;
    average_rating: number | null;
    monthly_participant_count: number;
  };
  assigned_lessons: Array<{
    lesson_id: string;
    lesson_name: string;
    weekdays: string[];
    time: string;
    reservation_rate: number;
  }>;
  upcoming_schedule: {
    recurring_summary: Array<{ pattern_text: string; active_count: number }>;
    entries: Array<{
      schedule_id: string;
      lesson_name: string;
      studio_name: string | null;
      date: string;
      time: string;
      booked_count: number;
      capacity: number;
      is_recurring: boolean;
    }>;
  };
};

export type InstructorsType = {
  _rows: InstructorRow[];
  _changeHistories: Array<InstructorChangeHistoryEntry & { instructor_id: string }>;
  _seeded: boolean;
  _seed(): void;

  // Legacy API — kept byte-for-byte compatible for the D-01 picker.
  getList(storeId?: string, role?: string): LegacyInstructorRow[];
  getById(id: string): LegacyInstructorRow | undefined;

  // D-04 API
  listForCrm(
    query: GetInstructorsQuery,
    scope: InstructorDataScope,
  ): { instructors: InstructorListItem[] };
  getDetail(id: string, scope: InstructorDataScope): InstructorDetailAggregate | undefined;
  create(input: CreateInstructorRequest, operator: string): Instructor;
  update(
    id: string,
    patch: Partial<CreateInstructorRequest>,
    operator: string,
    scope: InstructorDataScope,
  ): Instructor | 'not_found';
  updateStatus(
    id: string,
    status: 'active' | 'inactive',
    operator: string,
  ): { instructor_id: string; status: 'active' | 'inactive' } | 'not_found';
  delete(id: string): 'not_found' | 'in_use' | true;
  getHistory(
    id: string,
    scope: InstructorDataScope,
  ): { entries: InstructorChangeHistoryEntry[]; total: number } | undefined;
  toInstructor(row: InstructorRow): Instructor;
  computeBrandsAndCount(instructorId: string): { brands: string[]; assignedScheduleCount: number };
};
