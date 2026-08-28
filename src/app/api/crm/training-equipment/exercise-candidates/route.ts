import { NextRequest, NextResponse } from 'next/server';

import { getAuthUserFromRequest } from '@/app/api/_lib/auth';
import { db } from '@/app/api/_mock-db';
import { ErrorResponseSchema } from '@/app/api/_schemas/auth.schema';
import {
  ListEquipmentExerciseCandidatesQuerySchema,
  ListEquipmentExerciseCandidatesResponseSchema,
} from '@/app/api/_schemas/training-equipment.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

/** Difficulty is a progression, not an alphabet. */
const DIFFICULTY_ORDER = ['初級', '中級', '上級'] as const;

/** Body parts follow the exercise-category master's `sortOrder`. */
const BODY_PART_ORDER = ['胸', '背中', '肩', '腕', '脚', '体幹'] as const;

registerRoute({
  method: 'get',
  path: '/crm/training-equipment/exercise-candidates',
  summary: 'List exercise candidates for the link dialog',
  description:
    'E-03 FR-008 「エクササイズを追加」モーダルの候補一覧。キーワード・難易度・部位はサーバ側で絞り込み、ページ単位で返す。Phase 2 で Y-08 /admin/exercises に置き換える',
  tags: ['Training Equipment Management'],
  query: ListEquipmentExerciseCandidatesQuerySchema,
  responses: [
    {
      status: 200,
      schema: ListEquipmentExerciseCandidatesResponseSchema,
      description: 'Exercise candidates',
    },
    { status: 400, schema: ErrorResponseSchema, description: 'Validation failure' },
  ],
});

export async function GET(request: NextRequest) {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const parsed = ListEquipmentExerciseCandidatesQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: '検索条件に誤りがあります',
        details: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    );
  }

  const query = parsed.data;
  const catalog = db.trainingEquipment.listExerciseCandidates();

  // Difficulty / body-part options are derived from the whole catalog before filtering, so
  // picking one does not make the other options disappear. They follow the master's own order
  // (difficulty is a progression, body parts follow the exercise-category master) — sorting the
  // labels by code point would list 初級 / 上級 / 中級, which reads as an error to the user.
  const distinct = (values: Array<string | null>, order: readonly string[]) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))].sort((left, right) => {
      const leftIndex = order.indexOf(left);
      const rightIndex = order.indexOf(right);
      if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
      // Anything outside the master keeps a stable place after the known values.
      if (leftIndex !== -1) return -1;
      if (rightIndex !== -1) return 1;
      return left.localeCompare(right, 'ja');
    });

  let items = catalog;

  if (query.excludeLinkedEquipmentId) {
    const linked = new Set(
      db.trainingEquipment.getLinks(query.excludeLinkedEquipmentId).map((link) => link.exerciseId),
    );
    items = items.filter((item) => !linked.has(item.exerciseId));
  }
  if (query.mstToolId) {
    items = items.filter((item) => item.mstToolId === query.mstToolId);
  }
  if (query.difficulty) {
    items = items.filter((item) => item.difficulty === query.difficulty);
  }
  if (query.bodyPart) {
    items = items.filter((item) => item.bodyPart === query.bodyPart);
  }
  if (query.keyword) {
    const needle = query.keyword.trim().toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(needle));
  }

  const totalItems = items.length;
  const start = (query.page - 1) * query.limit;

  return NextResponse.json({
    items: items.slice(start, start + query.limit),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
    },
    filters: {
      difficulties: distinct(
        catalog.map((item) => item.difficulty),
        DIFFICULTY_ORDER,
      ),
      bodyParts: distinct(
        catalog.map((item) => item.bodyPart),
        BODY_PART_ORDER,
      ),
    },
  });
}
