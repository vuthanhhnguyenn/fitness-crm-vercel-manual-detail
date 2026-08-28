// ─── DB singleton ─────────────────────────────────────────────────────────────
import { createDb } from './_create-db';
import type { DbType } from './_db.types';

// ─── Type exports ────────────────────────────────────────────────────────────
export type { DbType } from './_db.types';
export type { UserRow } from './seeds/user.seed';
export type { TransferRow } from './seeds/transfer.seed';
export { TransferStatus, DEFAULT_MEMBER_MAIN_CONTRACT } from './seeds/transfer.seed';

// ─── Standalone exports used by route handlers ────────────────────────────────
export {
  getPaymentSummary,
  getBillingListForMember,
  filterPaymentHistoryByPeriod,
  PAYMENT_PERIOD_LABELS,
  getEntryExitEventsForMember,
  getLessonReservationsForMember,
  MOCK_MEMBER_ACCESS_SETTINGS,
} from './seeds/member.seed';
export { TRANSFER_SEED_DATA } from './seeds/transfer.seed';
export {
  memberToBasicInfo,
  memberToListItem,
  joinJapaneseName,
  splitJapaneseName,
} from './seeds/membership.seed';

declare global {
  var __fitnessDb_v18: DbType | undefined;
}

export const db: DbType = (globalThis.__fitnessDb_v18 ??= createDb() as unknown as DbType);
