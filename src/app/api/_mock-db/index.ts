// ─── DB singleton ─────────────────────────────────────────────────────────────
import { createDb } from './_create-db';
import type { DbType } from './_db.types';

// ─── Type exports ────────────────────────────────────────────────────────────
export type { DbType } from './_db.types';
export type {
  MembershipApplicationContractDetails,
  MembershipApplicationDetails,
} from './seeds/membership.seed';
export type { UserRow } from './seeds/user.seed';
export type { TransferRow, BlacklistRow } from './seeds/transfer.seed';
export { TransferStatus, DEFAULT_MEMBER_MAIN_CONTRACT } from './seeds/transfer.seed';

// ─── Standalone exports used by route handlers ────────────────────────────────
export {
  MOCK_PAYMENT_HISTORY,
  MOCK_BILLING_LIST,
  getPaymentSummary,
  MOCK_VISIT_RECORDS,
  MOCK_LESSON_RESERVATIONS,
  MOCK_MEMBER_ACCESS_SETTINGS,
} from './seeds/member.seed';
export { TRANSFER_SEED_DATA } from './seeds/transfer.seed';

declare global {
  var __fitnessDb_v18: DbType | undefined;
}

export const db: DbType = (globalThis.__fitnessDb_v18 ??= createDb() as unknown as DbType);
