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
  LessonScheduleKpiSummary,
  LessonScheduleListItem,
  StoreScheduleSummary,
} from '@/app/api/_schemas/lesson-schedule.schema';

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
  SEED_LESSONS,
  SEED_LESSON_CONTENTS,
  SEED_LESSON_SCHEDULES,
  SEED_PERSONAL_PLANS,
  SEED_RESERVATIONS,
  SEED_RESERVATION_INSTRUCTORS,
  SEED_SESSION_MEMOS,
  SEED_STUDIOS,
  SEED_STUDIO_DETAILS,
  SEED_STUDIO_HISTORY,
  SEED_STUDIO_LIST,
  SEED_STUDIO_SPACES,
  StudioListSeed,
  lessonContentRowToDetail,
  normalizeLessonImages,
  personalPlanRowToDetail,
} from '../seeds/lesson.seed';

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
        const alert_count = day.filter((r) => r.is_alert).length;
        const cancelled_count = day.filter((r) => r.status === 'cancelled').length;
        return {
          date,
          total_lessons,
          total_booked,
          total_capacity,
          occupancy_rate,
          alert_count,
          cancelled_count,
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
        const newSchedule: LessonScheduleListItem = {
          id,
          lesson_name: input.lesson_id,
          lesson_type: input.lesson_type,
          studio_name: null,
          instructor_id: input.instructor_ids[0] ?? '',
          instructor_name: '',
          store_id: input.store_id,
          store_name: '',
          start_time: `${date}T${input.start_time}:00+09:00`,
          end_time: `${date}T${endTime}:00+09:00`,
          capacity: input.capacity ?? 0,
          booked_count: 0,
          waiting_count: 0,
          payment_status: 'unpaid',
          status: 'scheduled',
          is_alert: false,
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
        const maxNumericId = Object.keys(this._detailStore).reduce((max, key) => {
          const num = parseInt(key.replace('STU-', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const newId = `STU-${String(maxNumericId + 1).padStart(3, '0')}`;
        const now = new Date().toISOString();

        const newDetail: GetStudioDetailResponse = {
          data: {
            id: newId,
            name: input.name,
            studio_type: 'studio-lesson',
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
          studio_type: 'studio-lesson',
          capacity: input.capacity,
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
          SEED_STUDIO_LIST[listIdx].capacity = input.capacity ?? SEED_STUDIO_LIST[listIdx].capacity;
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
          per_use_fee: data.pricing_type === 'paid' ? (data.per_use_fee ?? 550) : undefined,
          usage_count: 0,
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
            data.pricing_type === 'paid' ? (data.per_use_fee ?? 550) : undefined;
        }
        LESSON_DETAIL_OVERRIDES[id] = override;
        return lessonContentRowToDetail(this._rows[index]!, LESSON_CONTENT_SCHEDULES);
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
          usage_count: 0,
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
      _rows: [] as Array<{
        instructor_id: string;
        instructor_name: string;
        store_id: string;
        role: string;
        photo_url?: string;
      }>,
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows = SEED_RESERVATION_INSTRUCTORS.map((inst) => ({
          ...inst,
          role: 'インストラクター',
          photo_url: undefined,
        }));
      },
      getList(storeId?: string, role?: string) {
        this._seed();
        let rows = [...this._rows];
        if (storeId) rows = rows.filter((i) => i.store_id === storeId);
        if (role) rows = rows.filter((i) => i.role === role);
        return rows;
      },
      getById(id: string) {
        this._seed();
        return this._rows.find((i) => i.instructor_id === id);
      },
    },

    templates: {
      _rows: [] as import('@/app/api/_schemas/lesson-schedule.schema').RepeatTemplate[],
      _seeded: false,
      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
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
        const reservations = filtered.slice(start, start + pageSize);
        return { reservations, total, page, pageSize, totalPages };
      },
      getById(id: string): Reservation | undefined {
        this._seed();
        return this._rows.find((r) => r.id === id);
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
        const seeded = SEED_STUDIO_SPACES[scheduleId];
        if (seeded) return seeded;

        const schedule = getDb().lessonSchedules.getById(scheduleId);
        const capacity = schedule?.capacity ?? 16;
        const gridCols = 8;
        const gridRows = Math.ceil(capacity / gridCols);
        const reservations = this._rows.filter(
          (r) => r.schedule_id === scheduleId && r.status !== 'cancelled' && r.space_number,
        );

        return {
          studio_name: schedule?.studio_name ?? 'スタジオ',
          total_capacity: capacity,
          grid_rows: gridRows,
          grid_cols: gridCols,
          spaces: Array.from({ length: capacity }, (_, i) => {
            const spaceNumber = `S${String(i + 1).padStart(2, '0')}`;
            const reservation = reservations.find((r) => r.space_number === spaceNumber);
            return {
              id: `SP-${scheduleId}-${i + 1}`,
              space_number: spaceNumber,
              row: Math.floor(i / gridCols),
              col: i % gridCols,
              type: reservation ? ('reserved' as const) : ('available' as const),
              reservation_id: reservation?.id ?? null,
              member_name: reservation?.member_name ?? null,
            };
          }),
        };
      },
      getMemos(scheduleId: string): SessionMemo[] {
        this._seed();
        return this._memoRows.filter((m) => m.schedule_id === scheduleId);
      },
      createMemo(scheduleId: string, data: { content: string }): SessionMemo {
        this._seed();
        const newId = `MEMO${String(this._memoRows.length + 1).padStart(3, '0')}`;
        const memo: SessionMemo = {
          id: newId,
          schedule_id: scheduleId,
          content: data.content,
          author_id: 'ST001',
          author_name: '田中 花子',
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
