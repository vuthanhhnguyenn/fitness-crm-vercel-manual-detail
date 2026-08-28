import type {
  GetRoutineCategoriesResponse,
  RoutineCategory,
} from '@/app/api/_schemas/routine-category.schema';

import {
  type RoutineCategoryRecord,
  SEED_ROUTINE_CATEGORIES,
} from '../seeds/routine-category.seed';

// Y-09 FR-010: ルーティンカテゴリは Phase 1 では参照専用（CRUD はスコープ外）。
// 一覧フィルタ／作成・編集フォームのカテゴリ選択のデータソースとして提供する。
export function createRoutineCategoryTables() {
  return {
    routineCategories: {
      _seeded: false,
      _rows: [] as RoutineCategoryRecord[],

      _seed() {
        if (this._seeded) return;
        this._rows = SEED_ROUTINE_CATEGORIES.map((record) => ({ ...record }));
        this._seeded = true;
      },

      _toModel(record: RoutineCategoryRecord): RoutineCategory {
        return {
          id: record.id,
          name: record.name,
          sortOrder: record.sortOrder,
        };
      },

      list(): GetRoutineCategoriesResponse {
        this._seed();
        return {
          items: this._rows
            .filter((record) => record.deletedAt === null)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((record) => this._toModel(record)),
        };
      },

      getById(id: string): RoutineCategory | undefined {
        this._seed();
        const row = this._rows.find((record) => record.id === id && record.deletedAt === null);
        return row ? this._toModel(row) : undefined;
      },
    },
  };
}
