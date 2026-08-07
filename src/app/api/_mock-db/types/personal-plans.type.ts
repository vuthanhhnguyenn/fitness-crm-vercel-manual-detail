import type { LessonContentDetail } from '@/app/api/_schemas/lesson-content-detail.schema';
import type { PersonalPlanItem } from '@/app/api/_schemas/lesson-content.schema';

export type PersonalPlansType = {
  _rows: PersonalPlanItem[];
  _seeded: boolean;
  _seed(): void;
  getList(): PersonalPlanItem[];
  getRowById(id: string): PersonalPlanItem | undefined;
  getDetail(id: string): LessonContentDetail | undefined;
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
  }): LessonContentDetail;
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
  ): LessonContentDetail | undefined;
};
