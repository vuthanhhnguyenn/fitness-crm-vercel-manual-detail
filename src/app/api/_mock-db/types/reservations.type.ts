import type {
  Reservation,
  ReservationListResponse,
  ReservationStats,
  SessionMemo,
  StudioSpaceGridResponse,
} from '@/app/api/_schemas/lesson-reservation.schema';

export type ReservationsType = {
  _rows: Reservation[];
  _memoRows: SessionMemo[];
  _seeded: boolean;
  _seed(): void;
  getByScheduleId(
    scheduleId: string,
    query?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string },
  ): ReservationListResponse;
  getById(id: string): Reservation | undefined;
  getStats(scheduleId: string): ReservationStats;
  getSpaces(scheduleId: string): StudioSpaceGridResponse;
  getMemos(scheduleId: string): SessionMemo[];
  createMemo(scheduleId: string, data: { content: string }): SessionMemo;
  deleteMemo(scheduleId: string, memoId: string): boolean;
  create(data: {
    member_id: string;
    schedule_id: string;
    space_number?: string;
    send_notification?: boolean;
  }): Reservation;
  update(id: string, patch: Partial<Reservation>): Reservation | undefined;
};
