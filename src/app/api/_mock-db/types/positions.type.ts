import type {
  CreatePositionBody,
  CreatePositionResponse,
  GetPositionPermissionsResponse,
  GetPositionsQuery,
  GetPositionsResponse,
  Position,
  PositionDetail,
  PositionListItem,
  UpdatePositionBody,
  UpdatePositionResponse,
} from '@/app/api/_schemas/position.schema';

export type PositionTableError = {
  status: 404 | 409 | 422;
  error: string;
  code: string;
};

export type PositionTableResult<T> = { ok: true; data: T } | ({ ok: false } & PositionTableError);

export type PositionsType = {
  _rows: Position[];
  _seeded: boolean;
  _seed(): void;
  _toListItem(row: Position): PositionListItem;
  _findDuplicateName(
    role: Position['role'],
    name: string,
    excludeId?: number,
  ): Position | undefined;
  getList(): Position[];
  getById(id: number): Position | undefined;
  list(query: GetPositionsQuery): GetPositionsResponse;
  getDetail(id: number): PositionDetail | undefined;
  getPermissionsPreview(id: number): GetPositionPermissionsResponse | undefined;
  staffCount(id: number): number;
  create(body: CreatePositionBody): PositionTableResult<CreatePositionResponse>;
  update(id: number, body: UpdatePositionBody): PositionTableResult<UpdatePositionResponse>;
  remove(id: number): PositionTableResult<null>;
};
