import type {
  CreateInstructorRequest,
  Instructor,
  InstructorChangeHistoryEntry,
  RoleClassification,
} from '@/app/api/_schemas/instructor.schema';
import { joinFullName } from '@/app/api/_schemas/instructor.schema';
import type {
  ChangeHistory,
  LessonContentDetail,
  ScheduleSummary,
} from '@/app/api/_schemas/lesson-content-detail.schema';
import type { CreateLessonContentRequest } from '@/app/api/_schemas/lesson-content-form.schema';
import type { LessonContentItem, PersonalPlanItem } from '@/app/api/_schemas/lesson-content.schema';
import type {
  Reservation,
  ReservationListResponse,
  ReservationStats,
  ReservationStatus,
  SessionMemo,
  StudioSpaceGridResponse,
} from '@/app/api/_schemas/lesson-reservation.schema';
import type {
  AreaScheduleKpiSummary,
  CreateManualReservationRequest,
  CreateManualReservationResponse,
  GetInstructorsQuery,
  InstructorListItem,
  LessonScheduleKpiSummary,
  LessonScheduleListItem,
  ManualReservationMember,
  StoreScheduleSummary,
} from '@/app/api/_schemas/lesson-schedule.schema';
import { formatISODateLocal } from '@/utils/date.util';

import { StaffRole } from '@/lib/api';

import type {
  GetStudioDetailResponse,
  StudioChangeHistory,
} from '../../_schemas/studio-detail.schema';
import {
  type CreateStudioPayload,
  GetStudiosQuery,
  type UpdateStudioPayload,
} from '../../_schemas/studio.schema';
import type { DbType } from '../_db.types';
import {
  LESSON_CONTENT_HISTORY,
  LESSON_CONTENT_SCHEDULES,
  LESSON_DETAIL_OVERRIDES,
  LESSON_SCHEDULE_STORE_AREAS,
  type ManualReservationMemberSeed,
  SEED_INSTRUCTORS,
  SEED_LESSONS,
  SEED_LESSON_CONTENTS,
  SEED_LESSON_SCHEDULES,
  SEED_MANUAL_RESERVATION_MEMBERS,
  SEED_PERSONAL_PLANS,
  SEED_RESERVATIONS,
  SEED_SESSION_MEMOS,
  SEED_STUDIOS,
  SEED_STUDIO_DETAILS,
  SEED_STUDIO_HISTORY,
  SEED_STUDIO_LIST,
  SEED_TEMPLATES,
  StudioListSeed,
  appendLessonContentHistory,
  lessonContentRowToDetail,
  normalizeLessonImages,
  personalPlanRowToDetail,
} from '../seeds/lesson.seed';
import type { InstructorDataScope, InstructorRow } from '../types/instructors.type';

/** Mock-only store → brand lookup for D-04 brand derivation (schedule.store_id uses 'ST00N' ids). */
const INSTRUCTOR_STORE_BRAND_MAP: Record<
  string,
  Array<'joyfit' | 'joyfit24' | 'joyfit_yoga' | 'joyfit_plus' | 'fit365'>
> = {
  ST001: ['joyfit', 'joyfit24'],
  ST002: ['fit365'],
  ST003: ['fit365', 'joyfit_yoga'],
  ST004: ['joyfit'],
  ST005: ['joyfit_yoga'],
  ST006: ['joyfit_plus'],
};

const WEEKDAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** Deterministic per-id spread, mirroring the member-search route's hashToRange helper. */
function hashToRange(id: string, range: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + (id.codePointAt(i) ?? 0)) % 100000;
  }
  return hash % range;
}

const VISIT_FREQUENCIES = ['週4回以上', '週2〜3回', '週1回', '月2〜3回', '月1回未満'];
const HISTORY_LESSON_NAMES = [
  'ヨガ基礎クラス',
  'ピラティス入門',
  'ズンバ',
  'ストレッチ',
  'ボディコンバット',
];

/**
 * FR-015 limited-profile fields shown in the Trainer-facing member popover/PT card.
 * These are not modeled as real member data (mock has no body-composition/visit-log store) —
 * derived deterministically per member so the same member always shows the same values,
 * and `lesson_history` is scoped to the current schedule's own instructor per FR-015.
 */
function deriveMemberProfileFields(
  memberId: string,
): Pick<
  Reservation,
  | 'age'
  | 'gender'
  | 'visit_frequency'
  | 'last_visit_date'
  | 'lesson_history'
  | 'height_cm'
  | 'weight_kg'
  | 'body_fat_pct'
> {
  const age = 20 + hashToRange(memberId, 45);
  const gender = hashToRange(`${memberId}-g`, 2) === 0 ? 'male' : 'female';
  const lastVisitDaysAgo = hashToRange(`${memberId}-lv`, 14);
  const lastVisitDate = new Date(Date.now() - lastVisitDaysAgo * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const historyCount = 1 + hashToRange(`${memberId}-hc`, 3);
  const lesson_history = Array.from({ length: historyCount }, (_, i) => {
    const daysAgo = (i + 1) * 7 + hashToRange(`${memberId}-hd${i}`, 4);
    return {
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      lesson_name:
        HISTORY_LESSON_NAMES[hashToRange(`${memberId}-hn${i}`, HISTORY_LESSON_NAMES.length)]!,
      attendance: (hashToRange(`${memberId}-ha${i}`, 5) === 0 ? 'absent' : 'attended') as
        | 'attended'
        | 'absent',
    };
  });

  return {
    age,
    gender,
    visit_frequency: VISIT_FREQUENCIES[hashToRange(`${memberId}-vf`, VISIT_FREQUENCIES.length)],
    last_visit_date: lastVisitDate,
    lesson_history,
    height_cm:
      gender === 'male'
        ? 165 + hashToRange(`${memberId}-h`, 20)
        : 150 + hashToRange(`${memberId}-h`, 20),
    weight_kg:
      gender === 'male'
        ? 55 + hashToRange(`${memberId}-w`, 30)
        : 42 + hashToRange(`${memberId}-w`, 25),
    body_fat_pct:
      gender === 'male'
        ? 12 + hashToRange(`${memberId}-bf`, 15)
        : 18 + hashToRange(`${memberId}-bf`, 18),
  };
}

export function createLessonTables(getDb: () => DbType) {
  return {
    lessonSchedules: {
      _rows: [] as LessonScheduleListItem[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_LESSON_SCHEDULES];
      },
      getList(): LessonScheduleListItem[] {
        this._seed();
        return [...this._rows];
      },
      getById(id: string): LessonScheduleListItem | undefined {
        this._seed();
        return this._rows.find((r) => r.id === id);
      },
      update(
        id: string,
        patch: Partial<LessonScheduleListItem>,
      ): LessonScheduleListItem | undefined {
        this._seed();
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        this._rows[idx] = { ...this._rows[idx], ...patch };
        return this._rows[idx];
      },
      getKpiSummary(date: string): LessonScheduleKpiSummary {
        this._seed();
        const day = this._rows.filter((r) => r.start_time.startsWith(date));
        const total_lessons = day.length;
        const total_booked = day.reduce((s, r) => s + r.booked_count, 0);
        const total_capacity = day.reduce((s, r) => s + r.capacity, 0);
        const occupancy_rate =
          total_capacity > 0 ? Math.round((total_booked / total_capacity) * 1000) / 10 : 0;
        const cancelled_count = day.filter((r) => r.status === 'cancelled').length;
        const studio_lesson_count = day.filter((r) => r.lesson_type === 'studio').length;
        const personal_lesson_count = day.filter((r) => r.lesson_type === 'personal').length;
        const time_changed_count = day.filter((r) => r.last_change_type === 'time').length;
        const instructor_changed_count = day.filter(
          (r) => r.last_change_type === 'instructor',
        ).length;

        const staffIds = new Set(day.map((r) => r.instructor_id));
        const assigned_staff_count = staffIds.size;
        let instructor_staff_count = 0;
        let trainer_staff_count = 0;
        staffIds.forEach((id) => {
          const staff = SEED_INSTRUCTORS.find((i) => i.instructor_id === id);
          if (staff?.role_classifications.includes('trainer')) trainer_staff_count++;
          else instructor_staff_count++;
        });

        // No prior-week dataset is seeded (mock has only the current week); approximate
        // last week's occupancy from this week's own booked counts so the KPI card has
        // a real, data-derived week-over-week trend rather than a hardcoded string.
        const prevWeekBooked = day.reduce((s, r) => s + Math.max(0, r.booked_count - 1), 0);
        const prevOccupancyRate = total_capacity > 0 ? (prevWeekBooked / total_capacity) * 100 : 0;
        const occupancy_rate_change_pct =
          Math.round((occupancy_rate - prevOccupancyRate) * 10) / 10;

        return {
          date,
          total_lessons,
          total_booked,
          total_capacity,
          occupancy_rate,
          cancelled_count,
          studio_lesson_count,
          personal_lesson_count,
          occupancy_rate_change_pct,
          time_changed_count,
          instructor_changed_count,
          assigned_staff_count,
          instructor_staff_count,
          trainer_staff_count,
        };
      },
      getStoreSummary(date: string): {
        areas: AreaScheduleKpiSummary[];
        stores: StoreScheduleSummary[];
      } {
        this._seed();
        const day = this._rows.filter((r) => r.start_time.startsWith(date));
        const storeMap = new Map<string, StoreScheduleSummary>();
        const areaMap = new Map<string, AreaScheduleKpiSummary>();
        const instructorSets = new Map<string, Set<string>>();
        const inProgressMap = new Map<string, { lesson_name: string; start_time: string }>();
        const storeAreaMap = LESSON_SCHEDULE_STORE_AREAS;
        day.forEach((r) => {
          const area = storeAreaMap[r.store_id] ?? 'その他';
          if (!storeMap.has(r.store_id)) {
            storeMap.set(r.store_id, {
              store_id: r.store_id,
              store_name: r.store_name,
              area,
              total_lessons: 0,
              total_booked: 0,
              total_capacity: 0,
              occupancy_rate: 0,
              alert_count: 0,
              assigned_staff_count: 0,
              in_progress_lesson_name: null,
              in_progress_start_time: null,
            });
          }
          const s = storeMap.get(r.store_id)!;
          s.total_lessons++;
          s.total_booked += r.booked_count;
          s.total_capacity += r.capacity;
          if (r.is_alert) s.alert_count++;

          if (!instructorSets.has(r.store_id)) {
            instructorSets.set(r.store_id, new Set());
          }
          instructorSets.get(r.store_id)!.add(r.instructor_id);

          if (r.status === 'in_progress') {
            const timeMatch = r.start_time.match(/T(\d{1,2}):(\d{2})/);
            const startTime = timeMatch ? `${Number(timeMatch[1])}:${timeMatch[2]}` : null;
            if (startTime) {
              inProgressMap.set(r.store_id, {
                lesson_name: r.lesson_name,
                start_time: startTime,
              });
            }
          }

          if (!areaMap.has(area)) {
            areaMap.set(area, {
              area,
              total_lessons: 0,
              total_booked: 0,
              total_capacity: 0,
              occupancy_rate: 0,
              alert_count: 0,
              store_count: 0,
            });
          }
          const a = areaMap.get(area)!;
          a.total_lessons++;
          a.total_booked += r.booked_count;
          a.total_capacity += r.capacity;
          if (r.is_alert) a.alert_count++;
        });
        const stores = Array.from(storeMap.values()).map((s) => {
          const inProgress = inProgressMap.get(s.store_id);
          return {
            ...s,
            occupancy_rate:
              s.total_capacity > 0
                ? Math.round((s.total_booked / s.total_capacity) * 1000) / 10
                : 0,
            assigned_staff_count: instructorSets.get(s.store_id)?.size ?? 0,
            in_progress_lesson_name: inProgress?.lesson_name ?? null,
            in_progress_start_time: inProgress?.start_time ?? null,
          };
        });
        const storesByArea = stores.reduce<Record<string, number>>((acc, s) => {
          acc[s.area] = (acc[s.area] ?? 0) + 1;
          return acc;
        }, {});
        const areas = Array.from(areaMap.values()).map((a) => ({
          ...a,
          store_count: storesByArea[a.area] ?? 0,
          occupancy_rate:
            a.total_capacity > 0 ? Math.round((a.total_booked / a.total_capacity) * 1000) / 10 : 0,
        }));
        return { areas, stores };
      },
      _manualReservationMembers: [] as ManualReservationMemberSeed[],
      _manualReservationMembersSeeded: false,
      _seedManualReservationMembers(): void {
        if (this._manualReservationMembersSeeded) return;
        this._manualReservationMembersSeeded = true;
        this._manualReservationMembers = SEED_MANUAL_RESERVATION_MEMBERS.map((m) => ({ ...m }));
      },
      getManualReservationMembers(): ManualReservationMember[] {
        this._seedManualReservationMembers();
        return this._manualReservationMembers.map((m) => ({
          member_id: m.member_id,
          name: m.name,
          plan: m.plan,
          remaining: m.remaining,
          penalty_until: m.penalty_until,
        }));
      },
      createManualReservation(
        input: CreateManualReservationRequest,
      ): CreateManualReservationResponse | { error: string } {
        this._seedManualReservationMembers();
        const member = this._manualReservationMembers.find((m) => m.member_id === input.member_id);
        if (!member) {
          return { error: 'Member not found' };
        }
        if (member.plan === 'monthly' && member.remaining === 0) {
          return { error: '残回数が不足しています' };
        }
        if (
          member.penalty_until &&
          formatISODateLocal(new Date()) <= formatISODateLocal(member.penalty_until)
        ) {
          return { error: `予約不可期間中の会員です（${member.penalty_until}まで）` };
        }
        const schedule = this.getById(input.schedule_id);
        if (!schedule) {
          return { error: 'Lesson schedule not found' };
        }
        if (member.plan === 'monthly' && member.remaining !== null) {
          member.remaining -= 1;
        }
        this.update(input.schedule_id, { booked_count: schedule.booked_count + 1 });
        return {
          message: '予約を登録しました',
          description: `${member.name} 様の予約をスケジュールに反映しました。モバイルアプリへ予約確定通知を送信します`,
        };
      },
      create(
        input: import('@/app/api/_schemas/lesson-schedule.schema').CreateLessonScheduleRequest & {
          overrideId?: string;
        },
      ): import('@/app/api/_schemas/lesson-schedule.schema').CreateLessonScheduleResponse {
        this._seed();
        const id =
          input.overrideId ?? `LS-NEW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const startHour = Number.parseInt(input.start_time.split(':')[0], 10);
        const endHour = startHour + 1;
        const endTime = `${String(endHour).padStart(2, '0')}:${input.start_time.split(':')[1] ?? '00'}`;
        const date = input.date ?? input.start_date ?? '';

        const lesson = getDb().lessons.getById(input.lesson_id);
        const studio = input.studio_id
          ? SEED_STUDIO_LIST.find((s) => s.id === input.studio_id)
          : undefined;
        const store = getDb()
          .stores.getList()
          .find((s) => s.store_id === input.store_id || s.id === input.store_id);
        const primaryInstructorId = input.instructor_ids[0] ?? '';
        const instructor = SEED_INSTRUCTORS.find((i) => i.instructor_id === primaryInstructorId);

        const newSchedule: LessonScheduleListItem = {
          id,
          lesson_name: lesson?.name ?? input.lesson_id,
          lesson_type: input.lesson_type,
          studio_name: studio?.name ?? null,
          instructor_id: primaryInstructorId,
          instructor_name: instructor
            ? joinFullName(instructor.last_name, instructor.first_name)
            : '',
          store_id: input.store_id,
          store_name: store?.name ?? '',
          start_time: `${date}T${input.start_time}:00+09:00`,
          end_time: `${date}T${endTime}:00+09:00`,
          capacity: input.capacity ?? 0,
          booked_count: 0,
          waiting_count: 0,
          payment_status: 'unpaid',
          status: 'scheduled',
          is_alert: false,
          is_public: input.lesson_type === 'studio',
          last_change_type: null,
        };
        this._rows.push(newSchedule);
        return {
          id,
          message: 'スケジュールを登録しました',
          created_schedules: [{ id, date, start_time: input.start_time, end_time: endTime }],
        };
      },
      checkInstructorAvailability(
        instructorId: string,
        date: string,
        startTime: string,
      ): import('@/app/api/_schemas/lesson-schedule.schema').InstructorAvailabilityResponse {
        this._seed();
        const conflicts = this._rows.filter((r) => {
          if (r.instructor_id !== instructorId) return false;
          const rDate = r.start_time.split('T')[0];
          if (rDate !== date) return false;
          const rTime = r.start_time.split('T')[1]?.slice(0, 5);
          return rTime === startTime;
        });
        return {
          available: conflicts.length === 0,
          conflicts: conflicts.map((r) => ({
            schedule_id: r.id,
            lesson_name: r.lesson_name,
            start_time: r.start_time,
            end_time: r.end_time,
          })),
        };
      },
    },

    studios: {
      _rows: [] as Array<{
        id: string;
        name: string;
        physical_capacity: number;
        store_id: string;
      }>,
      _detailStore: {} as Record<string, GetStudioDetailResponse>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_STUDIOS];
        this._detailStore = { ...SEED_STUDIO_DETAILS };
      },
      getList() {
        this._seed();
        return [...this._rows];
      },
      getByStoreId(storeId: string) {
        this._seed();
        return this._rows.filter((s) => s.store_id === storeId);
      },
      /** FR-001: Full CRM studio list with search/filter/sort/pagination & role scoping */
      list(query: GetStudiosQuery, userRole: StaffRole, userStoreIds: string[]) {
        // Apply role-based scoping
        let filtered = SEED_STUDIO_LIST.filter((s) =>
          userRole === 'system' || userRole === 'headquarter'
            ? true
            : userStoreIds.includes(s.store_id),
        );

        // Apply search (case-insensitive partial match on studio name)
        if (query.search) {
          const search = query.search.toLowerCase();
          filtered = filtered.filter((s) => s.name.toLowerCase().includes(search));
        }

        // Apply filters
        if (query.store_id) filtered = filtered.filter((s) => s.store_id === query.store_id);
        if (query.studio_type)
          filtered = filtered.filter((s) => s.studio_type === query.studio_type);
        if (query.brand) filtered = filtered.filter((s) => s.brand === query.brand);
        if (query.status) filtered = filtered.filter((s) => s.status === query.status);

        // Apply sort
        const sorted = [...filtered].sort((a, b) => {
          const field = query.sort_by as keyof StudioListSeed;
          const aVal = a[field];
          const bVal = b[field];
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          return query.sort_order === 'asc' ? cmp : -cmp;
        });

        // Apply pagination
        const total = sorted.length;
        const start = (query.page - 1) * query.limit;
        const items = sorted.slice(start, start + query.limit);

        return {
          items: items.map((s) => ({
            id: s.id,
            name: s.name,
            store_id: s.store_id,
            store_name: s.store_name,
            studio_type: s.studio_type,
            capacity: s.capacity,
            buffer_value: s.buffer_value,
            available_hours: s.available_hours,
            brand: s.brand,
            status: s.status,
          })),
          total,
          page: query.page,
          limit: query.limit,
          has_next: query.page * query.limit < total,
        };
      },
      getStudioDetailById(id: string, userRole: StaffRole, userStoreIds: string[]) {
        this._seed();
        const detail = this._detailStore[id];
        if (!detail) {
          return undefined;
        }

        const isGlobalRole = userRole === 'system' || userRole === 'headquarter';
        if (!isGlobalRole && !userStoreIds.includes(detail.data.store_id)) {
          return undefined;
        }

        return {
          data: { ...detail.data },
          linked_lessons: detail.linked_lessons.map((lesson) => ({
            ...lesson,
          })),
          images: detail.images.map((image) => ({ ...image })),
          layout: {
            ...detail.layout,
            cells: detail.layout.cells?.map((cell) => ({ ...cell })) ?? null,
          },
          utilization: { ...detail.utilization },
        };
      },
      create(input: CreateStudioPayload) {
        this._seed();
        const knownIds = [
          ...Object.keys(this._detailStore),
          ...SEED_STUDIO_LIST.map((s) => s.id),
          ...this._rows.map((s) => s.id),
        ];
        const maxNumericId = knownIds.reduce((max, key) => {
          const num = parseInt(key.replace('STU-', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const newId = `STU-${String(maxNumericId + 1).padStart(3, '0')}`;
        const now = new Date().toISOString();

        const newDetail: GetStudioDetailResponse = {
          data: {
            id: newId,
            name: input.name,
            studio_type: input.studio_type,
            status: input.status,
            capacity: input.capacity,
            buffer_value: input.buffer_value,
            usage_hours: input.operating_hours.replace('~', '-'),
            store_id: input.store_id,
            store_name: '',
            equipment_notes: input.equipment_notes ?? null,
            internal_notes: input.internal_notes ?? null,
            created_at: now,
            updated_at: now,
            assigned_lesson_count: 0,
            change_history_enabled: false,
          },
          linked_lessons: [],
          images: (input.images ?? []).map((img, i) => ({
            image_id: `IMG-${newId}-${i + 1}`,
            url: img.url,
            alt: `${input.name} 画像 ${i + 1}`,
            sort_order: img.sort_order,
          })),
          layout: input.layout
            ? {
                state: 'configured',
                rows: input.layout.rows,
                columns: input.layout.columns,
                cells: input.layout.cells.filter((c) => c.kind !== 'empty') as Array<{
                  x: number;
                  y: number;
                  kind: 'normal_seat' | 'equipment_seat' | 'fixed_object';
                }>,
                configure_path: `/studios/${newId}/edit`,
              }
            : {
                state: 'not_configured',
                rows: null,
                columns: null,
                cells: null,
                configure_path: `/studios/${newId}/edit`,
              },
          utilization: {
            day_rate: 0,
            week_rate: 0,
            month_rate: 0,
            trend: null,
          },
        };

        // Add to detail store
        this._detailStore[newId] = newDetail;

        // Add to rows for list
        this._rows.push({
          id: newId,
          name: input.name,
          physical_capacity: input.capacity,
          store_id: input.store_id,
        });

        // Add to CRM list seed
        SEED_STUDIO_LIST.push({
          id: newId,
          name: input.name,
          store_id: input.store_id,
          store_name: '',
          studio_type: input.studio_type,
          capacity: input.capacity,
          buffer_value: input.buffer_value,
          available_hours: input.operating_hours.replace('~', '-'),
          brand: 'joyfit',
          status: input.status,
        });

        return { id: newId };
      },
      update(input: UpdateStudioPayload & { id: string }) {
        this._seed();
        const existing = this._detailStore[input.id];
        if (!existing) {
          throw new Error(`Studio ${input.id} not found`);
        }

        const now = new Date().toISOString();

        existing.data.name = input.name ?? existing.data.name;
        existing.data.store_id = input.store_id ?? existing.data.store_id;
        existing.data.studio_type = input.studio_type ?? existing.data.studio_type;
        existing.data.capacity = input.capacity ?? existing.data.capacity;
        existing.data.buffer_value = input.buffer_value ?? existing.data.buffer_value;
        existing.data.status = input.status ?? existing.data.status;
        existing.data.usage_hours = input.operating_hours
          ? input.operating_hours.replace('~', '-')
          : existing.data.usage_hours;
        existing.data.equipment_notes =
          input.equipment_notes !== undefined
            ? input.equipment_notes
            : existing.data.equipment_notes;
        existing.data.internal_notes =
          input.internal_notes !== undefined ? input.internal_notes : existing.data.internal_notes;
        existing.data.updated_at = now;

        // Update images
        if (input.images !== undefined) {
          existing.images = input.images.map((img, i) => ({
            image_id: `IMG-${input.id}-${i + 1}`,
            url: img.url,
            alt: `${existing.data.name} 画像 ${i + 1}`,
            sort_order: img.sort_order,
          }));
        }

        // Update layout
        if (input.layout !== undefined) {
          existing.layout = {
            state: 'configured',
            rows: input.layout.rows,
            columns: input.layout.columns,
            cells: input.layout.cells.filter((c) => c.kind !== 'empty') as Array<{
              x: number;
              y: number;
              kind: 'normal_seat' | 'equipment_seat' | 'fixed_object';
            }>,
            configure_path: `/studios/${input.id}/edit`,
          };
        }

        // Update _rows
        const rowIdx = this._rows.findIndex((r) => r.id === input.id);
        if (rowIdx !== -1) {
          this._rows[rowIdx].name = input.name ?? this._rows[rowIdx].name;
          this._rows[rowIdx].physical_capacity =
            input.capacity ?? this._rows[rowIdx].physical_capacity;
          this._rows[rowIdx].store_id = input.store_id ?? this._rows[rowIdx].store_id;
        }

        // Update SEED_STUDIO_LIST
        const listIdx = SEED_STUDIO_LIST.findIndex((s) => s.id === input.id);
        if (listIdx !== -1) {
          SEED_STUDIO_LIST[listIdx].name = input.name ?? SEED_STUDIO_LIST[listIdx].name;
          SEED_STUDIO_LIST[listIdx].studio_type =
            input.studio_type ?? SEED_STUDIO_LIST[listIdx].studio_type;
          SEED_STUDIO_LIST[listIdx].capacity = input.capacity ?? SEED_STUDIO_LIST[listIdx].capacity;
          SEED_STUDIO_LIST[listIdx].buffer_value =
            input.buffer_value ?? SEED_STUDIO_LIST[listIdx].buffer_value;
          SEED_STUDIO_LIST[listIdx].status = input.status ?? SEED_STUDIO_LIST[listIdx].status;
          SEED_STUDIO_LIST[listIdx].store_id = input.store_id ?? SEED_STUDIO_LIST[listIdx].store_id;
        }

        return { success: true };
      },
      getHistoryByStudioId(
        id: string,
        userRole: StaffRole,
        userStoreIds: string[],
      ): StudioChangeHistory | undefined {
        this._seed();
        const detail = this._detailStore[id];
        if (!detail) return undefined;

        const isGlobalRole = userRole === 'system' || userRole === 'headquarter';
        if (!isGlobalRole && !userStoreIds.includes(detail.data.store_id)) {
          return undefined;
        }

        const entries = (SEED_STUDIO_HISTORY[id] ?? []).map((entry) => ({
          ...entry,
          diffs: entry.diffs?.map((diff) => ({ ...diff })),
        }));

        return { entries, total: entries.length };
      },
      delete(id: string): 'not_found' | 'in_use' | true {
        this._seed();
        const existing = this._detailStore[id];
        if (!existing) return 'not_found';
        if (existing.data.assigned_lesson_count > 0) return 'in_use';

        delete this._detailStore[id];

        const rowIdx = this._rows.findIndex((r) => r.id === id);
        if (rowIdx !== -1) this._rows.splice(rowIdx, 1);

        const listIdx = SEED_STUDIO_LIST.findIndex((s) => s.id === id);
        if (listIdx !== -1) SEED_STUDIO_LIST.splice(listIdx, 1);

        return true;
      },
    },

    lessons: {
      _rows: [] as Array<{
        id: string;
        name: string;
        lesson_type: 'studio' | 'personal';
        duration: number;
      }>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_LESSONS];
      },
      getList(lessonType?: 'studio' | 'personal') {
        this._seed();
        if (lessonType) return this._rows.filter((l) => l.lesson_type === lessonType);
        return [...this._rows];
      },
      getById(id: string) {
        this._seed();
        return this._rows.find((l) => l.id === id);
      },
    },

    lessonContents: {
      _rows: [] as LessonContentItem[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_LESSON_CONTENTS];
      },
      getList(): LessonContentItem[] {
        this._seed();
        return [...this._rows];
      },
      getRowById(id: string): LessonContentItem | undefined {
        this._seed();
        return this._rows.find((r) => r.id === id);
      },
      getDetail(id: string): LessonContentDetail | undefined {
        this._seed();
        const row = this._rows.find((r) => r.id === id);
        return row ? lessonContentRowToDetail(row, LESSON_CONTENT_SCHEDULES) : undefined;
      },
      create(
        data: Omit<CreateLessonContentRequest, 'lesson_type'> & {
          lesson_type: 'studio' | 'bodycare';
        },
      ): LessonContentDetail {
        this._seed();
        const maxNumericId = this._rows.reduce((max, row) => {
          const num = parseInt(row.id.replace(/^(LSN|BDC)-/, ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const prefix = data.lesson_type === 'bodycare' ? 'BDC' : 'LSN';
        const id = `${prefix}-${String(maxNumericId + 1).padStart(4, '0')}`;
        const kind = data.lesson_type;
        const item: LessonContentItem = {
          id,
          name: data.name,
          kind,
          brand: data.brand,
          duration: data.duration,
          pricing_type: data.pricing_type,
          status: data.status,
          gender_restriction: 'none',
          lesson_category: kind === 'bodycare' ? 'ボディケア' : 'スタジオレッスン',
          category: kind === 'bodycare' ? 'ボディケア' : 'スタジオレッスン',
          store_id: 'store-001',
          is_deleted: false,
          reservation_count: 0,
          max_reservation_count: 20,
        };
        this._rows.unshift(item);
        LESSON_DETAIL_OVERRIDES[id] = {
          imageCount: data.description ? 3 : undefined,
          images: data.images?.length ? normalizeLessonImages(data.images) : [],
          description: data.description || undefined,
          internal_memo: data.internal_memo || undefined,
          restricted_main_contracts: data.restricted_main_contracts ?? [],
          restricted_option_contracts: data.restricted_option_contracts ?? [],
          per_use_fee: data.pricing_type === 'per_use' ? (data.per_use_fee ?? 550) : undefined,
        };
        return lessonContentRowToDetail(item, LESSON_CONTENT_SCHEDULES);
      },
      update(
        id: string,
        data: Partial<CreateLessonContentRequest>,
      ): LessonContentDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((r) => r.id === id);
        if (index === -1) return undefined;
        const existing = this._rows[index];
        const updated = { ...existing };
        if (data.name !== undefined) updated.name = data.name;
        if (data.brand !== undefined) updated.brand = data.brand;
        if (data.duration !== undefined) updated.duration = data.duration;
        if (data.pricing_type !== undefined) updated.pricing_type = data.pricing_type;
        if (data.status !== undefined) updated.status = data.status;
        this._rows[index] = updated;
        const override = LESSON_DETAIL_OVERRIDES[id] ?? {};
        if (data.images !== undefined) override.images = normalizeLessonImages(data.images);
        if (data.description !== undefined) override.description = data.description;
        if (data.internal_memo !== undefined) override.internal_memo = data.internal_memo;
        if (data.restricted_main_contracts !== undefined)
          override.restricted_main_contracts = data.restricted_main_contracts;
        if (data.restricted_option_contracts !== undefined)
          override.restricted_option_contracts = data.restricted_option_contracts;
        if (data.per_use_fee != null) override.per_use_fee = data.per_use_fee ?? undefined;
        if (data.pricing_type !== undefined) {
          override.per_use_fee =
            data.pricing_type === 'per_use' ? (data.per_use_fee ?? 550) : undefined;
        }
        LESSON_DETAIL_OVERRIDES[id] = override;
        return lessonContentRowToDetail(this._rows[index]!, LESSON_CONTENT_SCHEDULES);
      },
      updateStatus(
        id: string,
        status: 'active' | 'inactive',
        reason?: string | null,
      ): LessonContentDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((r) => r.id === id);
        if (index === -1) return undefined;
        this._rows[index] = { ...this._rows[index], status };
        appendLessonContentHistory(id, status === 'inactive' ? '無効化' : '有効化', reason);
        return lessonContentRowToDetail(this._rows[index]!, LESSON_CONTENT_SCHEDULES);
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((r) => r.id === id);
        if (index === -1) return false;
        this._rows[index] = { ...this._rows[index], is_deleted: true };
        return true;
      },
    },

    personalPlans: {
      _rows: [] as PersonalPlanItem[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = [...SEED_PERSONAL_PLANS];
      },
      getList(): PersonalPlanItem[] {
        this._seed();
        return [...this._rows];
      },
      getRowById(id: string): PersonalPlanItem | undefined {
        this._seed();
        return this._rows.find((r) => r.id === id);
      },
      getDetail(id: string): LessonContentDetail | undefined {
        this._seed();
        const row = this._rows.find((r) => r.id === id);
        return row ? personalPlanRowToDetail(row, LESSON_CONTENT_SCHEDULES) : undefined;
      },
      create(data: {
        name: string;
        lesson_type: 'personal';
        brand: 'joyfit' | 'fit365';
        duration: number;
        pricing_type: string;
        per_use_fee?: number | null;
        images?: { order: number; url: string }[];
        description?: string;
        internal_memo?: string;
        status: 'active' | 'inactive';
        restricted_main_contracts?: string[];
        restricted_option_contracts?: string[];
        store_id?: string;
      }): LessonContentDetail {
        this._seed();
        const maxNumericId = this._rows.reduce((max, row) => {
          const num = parseInt(row.id.replace('PLN-', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const id = `PLN-${String(maxNumericId + 1).padStart(4, '0')}`;
        const price = data.per_use_fee ?? 5500;
        const item: PersonalPlanItem = {
          id,
          name: data.name,
          description: data.description,
          category: 'パーソナルトレーニング',
          duration: data.duration,
          price,
          reservations: 0,
          max_reservations: 10,
          brand: data.brand,
          status: data.status,
          store_id: data.store_id ?? 'store-001',
          is_deleted: false,
        };
        this._rows.unshift(item);
        LESSON_DETAIL_OVERRIDES[id] = {
          imageCount: data.description ? 3 : undefined,
          images: data.images?.length ? normalizeLessonImages(data.images) : [],
          description: data.description || undefined,
          internal_memo: data.internal_memo || undefined,
          restricted_main_contracts: data.restricted_main_contracts ?? [],
          restricted_option_contracts: data.restricted_option_contracts ?? [],
          per_use_fee: price,
        };
        return personalPlanRowToDetail(item, LESSON_CONTENT_SCHEDULES);
      },
      update(
        id: string,
        data: Partial<{
          name: string;
          brand: 'joyfit' | 'fit365';
          duration: number;
          pricing_type: string;
          per_use_fee?: number | null;
          images?: { order: number; url: string }[];
          description?: string;
          internal_memo?: string;
          status: 'active' | 'inactive';
          restricted_main_contracts?: string[];
          restricted_option_contracts?: string[];
        }>,
      ): LessonContentDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((r) => r.id === id);
        if (index === -1) return undefined;
        const existing = this._rows[index];
        const updated = { ...existing };
        if (data.name !== undefined) updated.name = data.name;
        if (data.brand !== undefined) updated.brand = data.brand;
        if (data.duration !== undefined) updated.duration = data.duration;
        if (data.status !== undefined) updated.status = data.status;
        if (data.per_use_fee !== undefined) updated.price = data.per_use_fee ?? 5500;
        this._rows[index] = updated;
        const override = LESSON_DETAIL_OVERRIDES[id] ?? {};
        if (data.images !== undefined) override.images = normalizeLessonImages(data.images);
        if (data.description !== undefined) override.description = data.description;
        if (data.internal_memo !== undefined) override.internal_memo = data.internal_memo;
        if (data.restricted_main_contracts !== undefined)
          override.restricted_main_contracts = data.restricted_main_contracts;
        if (data.restricted_option_contracts !== undefined)
          override.restricted_option_contracts = data.restricted_option_contracts;
        if (data.per_use_fee !== undefined) override.per_use_fee = data.per_use_fee ?? undefined;
        LESSON_DETAIL_OVERRIDES[id] = override;
        return personalPlanRowToDetail(this._rows[index]!, LESSON_CONTENT_SCHEDULES);
      },
      updateStatus(
        id: string,
        status: 'active' | 'inactive',
        reason?: string | null,
      ): LessonContentDetail | undefined {
        this._seed();
        const index = this._rows.findIndex((r) => r.id === id);
        if (index === -1) return undefined;
        this._rows[index] = { ...this._rows[index], status };
        appendLessonContentHistory(id, status === 'inactive' ? '無効化' : '有効化', reason);
        return personalPlanRowToDetail(this._rows[index]!, LESSON_CONTENT_SCHEDULES);
      },
      delete(id: string): boolean {
        this._seed();
        const index = this._rows.findIndex((r) => r.id === id);
        if (index === -1) return false;
        this._rows[index] = { ...this._rows[index], is_deleted: true };
        return true;
      },
    },

    lessonContentDetails: {
      getDetail(id: string): LessonContentDetail | undefined {
        return getDb().lessonContents.getDetail(id) ?? getDb().personalPlans.getDetail(id);
      },
      exists(id: string): boolean {
        return Boolean(getDb().lessonContents.getDetail(id) ?? getDb().personalPlans.getDetail(id));
      },
      update(
        id: string,
        data: Partial<CreateLessonContentRequest>,
      ): LessonContentDetail | undefined {
        return getDb().lessonContents.update(id, data) ?? getDb().personalPlans.update(id, data);
      },
      updateStatus(
        id: string,
        status: 'active' | 'inactive',
        reason?: string | null,
      ): LessonContentDetail | undefined {
        return (
          getDb().lessonContents.updateStatus(id, status, reason) ??
          getDb().personalPlans.updateStatus(id, status, reason)
        );
      },
      delete(id: string, reason: string): boolean {
        const deleted = getDb().lessonContents.delete(id) || getDb().personalPlans.delete(id);
        if (deleted) appendLessonContentHistory(id, '削除', reason);
        return deleted;
      },
    },

    lessonContentSchedules: {
      getByMasterId(id: string): ScheduleSummary {
        return (
          LESSON_CONTENT_SCHEDULES[id] ?? {
            recurring_patterns: [],
            sessions: [],
            total: 0,
          }
        );
      },
    },

    lessonContentHistory: {
      getByMasterId(id: string): ChangeHistory {
        return LESSON_CONTENT_HISTORY[id] ?? { entries: [], total: 0 };
      },
    },

    instructors: {
      _rows: [] as InstructorRow[],
      _changeHistories: [] as Array<InstructorChangeHistoryEntry & { instructor_id: string }>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_INSTRUCTORS.map((s) => ({
          instructor_id: s.instructor_id,
          last_name: s.last_name,
          first_name: s.first_name,
          romaji_last_name: s.romaji_last_name,
          romaji_first_name: s.romaji_first_name,
          nickname: s.nickname,
          role_classifications: [...s.role_classifications],
          tab: s.tab,
          profile_text: s.profile_text,
          instructing_history: s.instructing_history,
          photo_url: s.photo_url,
          status: s.status,
          buffer_settings: { ...s.buffer_settings },
          crm_account_link_staff_id: s.crm_account_link_staff_id,
          store_id: s.store_id,
          average_rating: s.average_rating,
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));
        this._changeHistories = SEED_INSTRUCTORS.map((s) => ({
          instructor_id: s.instructor_id,
          timestamp: s.created_at,
          operator: 'システム移行',
          is_creation: true,
        }));
      },

      // ---- Legacy API (D-01 lesson-schedule instructor picker) ----
      getList(storeId?: string, role?: string) {
        this._seed();
        let rows = this._rows.map((r) => ({
          instructor_id: r.instructor_id,
          instructor_name: joinFullName(r.last_name, r.first_name),
          store_id: r.store_id,
          role: r.role_classifications[0],
          photo_url: r.photo_url ?? undefined,
        }));
        if (storeId) rows = rows.filter((i) => i.store_id === storeId);
        if (role) rows = rows.filter((i) => i.role === role);
        return rows;
      },
      getById(id: string) {
        this._seed();
        const row = this._rows.find((i) => i.instructor_id === id);
        if (!row) return undefined;
        return {
          instructor_id: row.instructor_id,
          instructor_name: joinFullName(row.last_name, row.first_name),
          store_id: row.store_id,
          role: row.role_classifications[0],
          photo_url: row.photo_url ?? undefined,
        };
      },

      // ---- D-04 helpers ----
      computeBrandsAndCount(instructorId: string) {
        const schedules = getDb()
          .lessonSchedules.getList()
          .filter((s) => s.instructor_id === instructorId && s.status !== 'cancelled');
        const brandSet = new Set<string>();
        schedules.forEach((s) => {
          (INSTRUCTOR_STORE_BRAND_MAP[s.store_id] ?? []).forEach((b) => brandSet.add(b));
        });
        return { brands: Array.from(brandSet), assignedScheduleCount: schedules.length };
      },
      toInstructor(row: InstructorRow): Instructor {
        const staff = row.crm_account_link_staff_id
          ? getDb()
              .staffs.getList()
              .find((s) => s.staff_id === row.crm_account_link_staff_id)
          : undefined;
        const { assignedScheduleCount } = this.computeBrandsAndCount(row.instructor_id);
        return {
          instructor_id: row.instructor_id,
          last_name: row.last_name,
          first_name: row.first_name,
          romaji_last_name: row.romaji_last_name,
          romaji_first_name: row.romaji_first_name,
          nickname: row.nickname,
          role_classifications: row.role_classifications,
          profile_text: row.profile_text,
          instructing_history: row.instructing_history,
          photo_url: row.photo_url,
          status: row.status,
          buffer_settings: row.buffer_settings,
          crm_account_link: staff
            ? { staff_id: staff.staff_id, staff_name: staff.name, staff_role: staff.role }
            : null,
          assigned_schedule_count: assignedScheduleCount,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      },

      // ---- D-04 CRM list/detail/CRUD/history ----
      listForCrm(query: GetInstructorsQuery, scope: InstructorDataScope) {
        this._seed();
        let rows = this._rows.filter((r) =>
          scope({ instructor_id: r.instructor_id, store_id: r.store_id }),
        );
        if (query.store_id) rows = rows.filter((r) => r.store_id === query.store_id);
        if (query.role) {
          rows = rows.filter((r) =>
            r.role_classifications.includes(query.role as RoleClassification),
          );
        }
        if (query.tab) rows = rows.filter((r) => r.tab === query.tab);
        if (query.search) {
          const stripSpaces = (s: string) => s.replace(/[\s　]/g, '');
          const q = query.search.toLowerCase();
          // Whitespace-insensitive query variant so "タムタタム" matches "タムタ タム".
          const qNoSpace = stripSpaces(q);
          rows = rows.filter((r) => {
            const fullName = joinFullName(r.last_name, r.first_name).toLowerCase();
            return (
              r.last_name.toLowerCase().includes(q) ||
              r.first_name.toLowerCase().includes(q) ||
              fullName.includes(q) ||
              stripSpaces(fullName).includes(qNoSpace) ||
              (r.romaji_last_name?.toLowerCase().includes(q) ?? false) ||
              (r.romaji_first_name?.toLowerCase().includes(q) ?? false) ||
              (r.nickname?.toLowerCase().includes(q) ?? false) ||
              r.instructor_id.toLowerCase().includes(q)
            );
          });
        }
        if (query.status) rows = rows.filter((r) => r.status === query.status);

        const withBrand = rows.map((row) => ({
          row,
          ...this.computeBrandsAndCount(row.instructor_id),
        }));
        const filtered = query.brand
          ? withBrand.filter((x) => x.brands.includes(query.brand as string))
          : withBrand;

        const instructors: InstructorListItem[] = filtered.map(({ row, brands }) => ({
          instructor_id: row.instructor_id,
          instructor_name: joinFullName(row.last_name, row.first_name),
          store_id: row.store_id,
          role: row.role_classifications[0],
          photo_url: row.photo_url ?? undefined,
          nickname: row.nickname,
          romaji_name:
            joinFullName(row.romaji_last_name ?? '', row.romaji_first_name ?? '') || null,
          role_classifications: row.role_classifications,
          tab: row.tab,
          brands: brands as InstructorListItem['brands'],
          status: row.status,
        }));
        return { instructors };
      },
      getDetail(id: string, scope: InstructorDataScope) {
        this._seed();
        const row = this._rows.find((r) => r.instructor_id === id);
        if (!row) return undefined;
        if (!scope({ instructor_id: row.instructor_id, store_id: row.store_id })) return undefined;

        const scheduleRows = getDb()
          .lessonSchedules.getList()
          .filter((s) => s.instructor_id === id && s.status !== 'cancelled')
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        const lessonGroups = new Map<
          string,
          {
            lesson_id: string;
            lesson_name: string;
            weekdays: Set<string>;
            time: string;
            rates: number[];
          }
        >();
        scheduleRows.forEach((s) => {
          const timePart = s.start_time.split('T')[1]?.slice(0, 5) ?? '00:00';
          const weekday = WEEKDAY_CODES[new Date(s.start_time).getDay()];
          const g = lessonGroups.get(s.lesson_name) ?? {
            lesson_id: s.id,
            lesson_name: s.lesson_name,
            weekdays: new Set<string>(),
            time: timePart,
            rates: [],
          };
          g.weekdays.add(weekday);
          const rate = s.capacity > 0 ? Math.round((s.booked_count / s.capacity) * 100) : 0;
          g.rates.push(rate);
          lessonGroups.set(s.lesson_name, g);
        });

        const assigned_lessons = Array.from(lessonGroups.values()).map((g) => ({
          lesson_id: g.lesson_id,
          lesson_name: g.lesson_name,
          weekdays: Array.from(g.weekdays),
          time: g.time,
          reservation_rate: g.rates.length
            ? Math.round(g.rates.reduce((a, b) => a + b, 0) / g.rates.length)
            : 0,
        }));

        const entries = scheduleRows.map((s) => {
          const [datePart, rest] = s.start_time.split('T');
          return {
            schedule_id: s.id,
            lesson_name: s.lesson_name,
            studio_name: s.studio_name,
            date: datePart!,
            time: (rest ?? '00:00:00').slice(0, 5),
            booked_count: s.booked_count,
            capacity: s.capacity,
            is_recurring: false,
          };
        });

        const summaryGroups = new Map<string, number>();
        entries.forEach((e) => {
          const key = `${e.lesson_name}__${e.time}`;
          summaryGroups.set(key, (summaryGroups.get(key) ?? 0) + 1);
        });
        const recurring_summary = Array.from(summaryGroups.entries())
          .filter(([, count]) => count > 1)
          .map(([key, count]) => {
            const [lessonName, time] = key.split('__');
            return { pattern_text: `${lessonName} ${time}`, active_count: count };
          });

        const monthly_participant_count = scheduleRows.reduce((sum, s) => sum + s.booked_count, 0);
        const average_reservation_rate = assigned_lessons.length
          ? Math.round(
              assigned_lessons.reduce((sum, l) => sum + l.reservation_rate, 0) /
                assigned_lessons.length,
            )
          : 0;

        return {
          data: this.toInstructor(row),
          performance_summary: {
            weekly_lesson_count: scheduleRows.length,
            average_reservation_rate,
            average_rating: row.average_rating,
            monthly_participant_count,
          },
          assigned_lessons,
          upcoming_schedule: { recurring_summary, entries },
        };
      },
      create(input: CreateInstructorRequest, operator: string): Instructor {
        this._seed();
        const maxNum = this._rows.reduce((max, r) => {
          const m = r.instructor_id.match(/^INS-(\d+)$/);
          return m ? Math.max(max, parseInt(m[1]!, 10)) : max;
        }, 0);
        const id = `INS-${String(maxNum + 1).padStart(4, '0')}`;
        const now = new Date().toISOString();
        const hasTrainer = input.role_classifications.includes('trainer');
        const hasInstructor = input.role_classifications.includes('instructor');
        const row: InstructorRow = {
          instructor_id: id,
          last_name: input.last_name,
          first_name: input.first_name,
          romaji_last_name: input.romaji_last_name ?? null,
          romaji_first_name: input.romaji_first_name ?? null,
          nickname: input.nickname ?? null,
          role_classifications: input.role_classifications,
          tab: hasTrainer && !hasInstructor ? 'pt' : 'studio',
          profile_text: input.profile_text ?? null,
          instructing_history: input.instructing_history ?? null,
          photo_url: input.photo_url ?? null,
          status: 'active',
          buffer_settings: {
            min_booking_lead_hours: input.buffer_settings?.min_booking_lead_hours ?? 0,
            pre_buffer_minutes: input.buffer_settings?.pre_buffer_minutes ?? 0,
            post_buffer_minutes: input.buffer_settings?.post_buffer_minutes ?? 0,
          },
          crm_account_link_staff_id: input.crm_account_link_staff_id ?? null,
          store_id: this._rows[0]?.store_id ?? 'ST001',
          average_rating: null,
          created_at: now,
          updated_at: now,
        };
        this._rows.push(row);
        this._changeHistories.push({
          instructor_id: id,
          timestamp: now,
          operator,
          is_creation: true,
        });
        return this.toInstructor(row);
      },
      update(
        id: string,
        patch: Partial<CreateInstructorRequest>,
        operator: string,
        scope: InstructorDataScope,
      ): Instructor | 'not_found' {
        this._seed();
        const idx = this._rows.findIndex((r) => r.instructor_id === id);
        if (idx === -1) return 'not_found';
        const existing = this._rows[idx]!;
        if (!scope({ instructor_id: existing.instructor_id, store_id: existing.store_id })) {
          return 'not_found';
        }

        const now = new Date().toISOString();
        const changes: Array<{ field: string; before: string; after: string }> = [];
        const trackField = (field: string, beforeVal: unknown, afterVal: unknown) => {
          if (afterVal === undefined) return;
          const beforeStr = beforeVal == null ? '' : String(beforeVal);
          const afterStr = afterVal == null ? '' : String(afterVal);
          if (beforeStr === afterStr) return;
          changes.push({ field, before: beforeStr, after: afterStr });
        };

        const next: InstructorRow = { ...existing };
        if (patch.last_name !== undefined) {
          trackField('last_name', existing.last_name, patch.last_name);
          next.last_name = patch.last_name;
        }
        if (patch.first_name !== undefined) {
          trackField('first_name', existing.first_name, patch.first_name);
          next.first_name = patch.first_name;
        }
        if (patch.romaji_last_name !== undefined) {
          trackField('romaji_last_name', existing.romaji_last_name, patch.romaji_last_name);
          next.romaji_last_name = patch.romaji_last_name;
        }
        if (patch.romaji_first_name !== undefined) {
          trackField('romaji_first_name', existing.romaji_first_name, patch.romaji_first_name);
          next.romaji_first_name = patch.romaji_first_name;
        }
        if (patch.nickname !== undefined) {
          trackField('nickname', existing.nickname, patch.nickname);
          next.nickname = patch.nickname;
        }
        if (patch.role_classifications !== undefined) {
          trackField(
            'role_classifications',
            existing.role_classifications.join('/'),
            patch.role_classifications.join('/'),
          );
          next.role_classifications = patch.role_classifications;
        }
        if (patch.profile_text !== undefined) {
          trackField('profile_text', existing.profile_text, patch.profile_text);
          next.profile_text = patch.profile_text;
        }
        if (patch.instructing_history !== undefined) {
          trackField(
            'instructing_history',
            existing.instructing_history,
            patch.instructing_history,
          );
          next.instructing_history = patch.instructing_history;
        }
        if (patch.photo_url !== undefined) {
          trackField('photo_url', existing.photo_url, patch.photo_url);
          next.photo_url = patch.photo_url;
        }
        if (patch.buffer_settings !== undefined) {
          const merged = { ...existing.buffer_settings, ...patch.buffer_settings };
          trackField(
            'buffer_settings.min_booking_lead_hours',
            existing.buffer_settings.min_booking_lead_hours,
            merged.min_booking_lead_hours,
          );
          trackField(
            'buffer_settings.pre_buffer_minutes',
            existing.buffer_settings.pre_buffer_minutes,
            merged.pre_buffer_minutes,
          );
          trackField(
            'buffer_settings.post_buffer_minutes',
            existing.buffer_settings.post_buffer_minutes,
            merged.post_buffer_minutes,
          );
          next.buffer_settings = merged;
        }
        if (patch.crm_account_link_staff_id !== undefined) {
          trackField(
            'crm_account_link_staff_id',
            existing.crm_account_link_staff_id,
            patch.crm_account_link_staff_id,
          );
          next.crm_account_link_staff_id = patch.crm_account_link_staff_id;
        }

        next.updated_at = now;
        this._rows[idx] = next;
        changes.forEach((c) =>
          this._changeHistories.push({
            instructor_id: id,
            timestamp: now,
            operator,
            field: c.field,
            before: c.before,
            after: c.after,
            is_creation: false,
          }),
        );
        return this.toInstructor(next);
      },
      updateStatus(
        id: string,
        status: 'active' | 'inactive',
        operator: string,
      ): { instructor_id: string; status: 'active' | 'inactive' } | 'not_found' {
        this._seed();
        const idx = this._rows.findIndex((r) => r.instructor_id === id);
        if (idx === -1) return 'not_found';
        const before = this._rows[idx]!.status;
        const now = new Date().toISOString();
        this._rows[idx] = { ...this._rows[idx]!, status, updated_at: now };
        if (before !== status) {
          this._changeHistories.push({
            instructor_id: id,
            timestamp: now,
            operator,
            field: 'status',
            before,
            after: status,
            is_creation: false,
          });
        }
        return { instructor_id: id, status };
      },
      delete(id: string): 'not_found' | 'in_use' | true {
        this._seed();
        const idx = this._rows.findIndex((r) => r.instructor_id === id);
        if (idx === -1) return 'not_found';
        const { assignedScheduleCount } = this.computeBrandsAndCount(id);
        if (assignedScheduleCount > 0) return 'in_use';
        this._rows.splice(idx, 1);
        return true;
      },
      getHistory(id: string, scope: InstructorDataScope) {
        this._seed();
        const row = this._rows.find((r) => r.instructor_id === id);
        if (!row) return undefined;
        if (!scope({ instructor_id: row.instructor_id, store_id: row.store_id })) return undefined;
        const entries: InstructorChangeHistoryEntry[] = this._changeHistories
          .filter((h) => h.instructor_id === id)
          .map((h) => ({
            timestamp: h.timestamp,
            operator: h.operator,
            field: h.field,
            before: h.before,
            after: h.after,
            is_creation: h.is_creation,
          }))
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        return { entries, total: entries.length };
      },
    },

    templates: {
      _rows: [] as import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_TEMPLATES.map((t) => ({ ...t }));
      },
      getList() {
        this._seed();
        return [...this._rows];
      },
      getById(id: string) {
        this._seed();
        return this._rows.find((t) => t.id === id);
      },
      create(
        input: import('@/app/api/_schemas/lesson-schedule.schema').CreateTemplateRequest,
      ): import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate {
        this._seed();
        const id = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const template: import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate = {
          ...input,
          id,
        };
        this._rows.unshift(template);
        return template;
      },
      deleteById(id: string): boolean {
        this._seed();
        const idx = this._rows.findIndex((t) => t.id === id);
        if (idx === -1) return false;
        this._rows.splice(idx, 1);
        return true;
      },
    },

    reservations: {
      _rows: [] as Reservation[],
      _memoRows: [] as SessionMemo[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_RESERVATIONS.map((r) => ({ ...r }));
        this._memoRows = SEED_SESSION_MEMOS.map((m) => ({ ...m }));
      },
      getByScheduleId(
        scheduleId: string,
        query?: {
          page?: number;
          pageSize?: number;
          sortBy?: string;
          sortOrder?: string;
        },
      ): ReservationListResponse {
        this._seed();
        let filtered = this._rows.filter((r) => r.schedule_id === scheduleId);
        const page = query?.page ?? 1;
        const pageSize = query?.pageSize ?? 7;
        const sortBy = query?.sortBy;
        const sortOrder = query?.sortOrder ?? 'asc';
        if (sortBy) {
          filtered = [...filtered].sort((a, b) => {
            const aVal = (a as any)[sortBy] ?? '';
            const bVal = (b as any)[sortBy] ?? '';
            const cmp = String(aVal).localeCompare(String(bVal), 'ja');
            return sortOrder === 'desc' ? -cmp : cmp;
          });
        }
        const total = filtered.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const reservations = filtered
          .slice(start, start + pageSize)
          .map((r) => ({ ...r, ...deriveMemberProfileFields(r.member_id) }));
        return { reservations, total, page, pageSize, totalPages };
      },
      getById(id: string): Reservation | undefined {
        this._seed();
        const row = this._rows.find((r) => r.id === id);
        if (!row) return undefined;
        return { ...row, ...deriveMemberProfileFields(row.member_id) };
      },
      getStats(scheduleId: string): ReservationStats {
        this._seed();
        const reservations = this._rows.filter((r) => r.schedule_id === scheduleId);
        const total_capacity =
          getDb().lessonSchedules.getById(scheduleId)?.capacity ?? reservations.length;
        const total_reserved = reservations.filter(
          (r) => r.status !== 'cancelled' && r.status !== 'no_show',
        ).length;
        const remaining_seats = Math.max(0, total_capacity - total_reserved);
        const statusCounts: Record<string, number> = {};
        for (const r of reservations) {
          statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
        }
        const status_breakdown = (
          ['confirmed', 'tentative', 'attended', 'no_show', 'cancelled'] as ReservationStatus[]
        ).map((status) => ({
          status,
          count: statusCounts[status] ?? 0,
          percentage:
            reservations.length > 0
              ? Math.round(((statusCounts[status] ?? 0) / reservations.length) * 1000) / 10
              : 0,
        }));
        return {
          schedule_id: scheduleId,
          total_capacity,
          total_reserved,
          remaining_seats,
          status_breakdown,
        };
      },
      getSpaces(scheduleId: string): StudioSpaceGridResponse {
        this._seed();

        const schedule = getDb().lessonSchedules.getById(scheduleId);
        const capacity = schedule?.capacity ?? 16;
        const gridCols = 8;
        const gridRows = Math.ceil(capacity / gridCols);
        const totalCells = gridRows * gridCols;
        const reservations = this._rows.filter(
          (r) => r.schedule_id === scheduleId && r.status !== 'cancelled' && r.space_number,
        );

        return {
          studio_name: schedule?.studio_name ?? 'スタジオ',
          total_capacity: capacity,
          grid_rows: gridRows,
          grid_cols: gridCols,
          spaces: Array.from({ length: totalCells }, (_, i) => {
            const spaceNumber = `S${String(i + 1).padStart(2, '0')}`;
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;
            if (i >= capacity) {
              // Non-bookable overflow cell (grid rectangle padding beyond real capacity):
              // split between the two fixed non-seat categories so both legend entries stay reachable.
              const type = (i - capacity) % 2 === 0 ? 'equipment' : 'fixed_structure';
              return {
                id: `SP-${scheduleId}-${i + 1}`,
                space_number: spaceNumber,
                row,
                col,
                type: type as 'equipment' | 'fixed_structure',
                reservation_id: null,
                member_name: null,
              };
            }
            const reservation = reservations.find((r) => r.space_number === spaceNumber);
            return {
              id: `SP-${scheduleId}-${i + 1}`,
              space_number: spaceNumber,
              row,
              col,
              type: reservation ? ('reserved' as const) : ('available' as const),
              reservation_id: reservation?.id ?? null,
              member_id: reservation?.member_id ?? null,
              member_name: reservation?.member_name ?? null,
            };
          }),
        };
      },
      getMemos(scheduleId: string): SessionMemo[] {
        this._seed();
        return this._memoRows.filter((m) => m.schedule_id === scheduleId);
      },
      createMemo(
        scheduleId: string,
        data: { content: string; author_id?: string; author_name?: string },
      ): SessionMemo {
        this._seed();
        const newId = `MEMO${String(this._memoRows.length + 1).padStart(3, '0')}`;
        const memo: SessionMemo = {
          id: newId,
          schedule_id: scheduleId,
          content: data.content,
          author_id: data.author_id ?? 'ST001',
          author_name: data.author_name ?? '田中 花子',
          created_at: new Date().toISOString(),
          updated_at: null,
        };
        this._memoRows.push(memo);
        return memo;
      },
      deleteMemo(scheduleId: string, memoId: string): boolean {
        this._seed();
        const idx = this._memoRows.findIndex(
          (m) => m.id === memoId && m.schedule_id === scheduleId,
        );
        if (idx === -1) return false;
        this._memoRows.splice(idx, 1);
        return true;
      },
      create(data: {
        member_id: string;
        schedule_id: string;
        space_number?: string;
        send_notification?: boolean;
      }): Reservation {
        this._seed();
        const newId = `R${String(this._rows.length + 1).padStart(3, '0')}`;
        const schedule = getDb().lessonSchedules.getById(data.schedule_id);
        const memberName =
          getDb()
            .members.getList()
            .find((m) => m.id === data.member_id)?.name_kanji ?? '新規会員';
        const reservation: Reservation = {
          id: newId,
          schedule_id: data.schedule_id,
          member_id: data.member_id,
          member_name: memberName,
          plan_type: schedule?.lesson_type === 'personal' ? '都度' : '月額8回',
          space_number: data.space_number ?? null,
          reservation_date: new Date().toISOString().slice(0, 10),
          reservation_time: new Date().toTimeString().slice(0, 5),
          status: 'confirmed',
          attendance_status: 'unconfirmed',
          cancel_type: null,
          penalty_active: false,
          penalty_end_date: null,
          remaining_sessions: 5,
          sent_notification: data.send_notification ?? false,
        };
        this._rows.push(reservation);
        return reservation;
      },
      update(id: string, patch: Partial<Reservation>): Reservation | undefined {
        this._seed();
        const idx = this._rows.findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        this._rows[idx] = { ...this._rows[idx], ...patch };
        return this._rows[idx];
      },
    },
  };
}
