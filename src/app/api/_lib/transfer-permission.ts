/**
 * A-02 移籍管理 row-level authorization.
 *
 * This is the authority for "may this user act on this transfer?". The browser cannot answer
 * it — `AuthUser` carries no store linkage — so the result travels to the client as the row's
 * `can_act` flag and the UI merely renders it. Holding `MembersTransfersApprove` is necessary
 * but not sufficient: a Staff user may only act on their own store's side, at the stage where
 * that side is the one being asked.
 */
import { NextRequest, NextResponse } from 'next/server';

import { ROLE_PERMISSIONS } from '@/constants/permission.constants';

import { Permission, UserRole } from '@/types/permission.type';

import { db } from '../_mock-db';
import type { TransferRow } from '../_mock-db/seeds/transfer.seed';
import {
  ORIGIN_STAGE_STATUSES,
  TERMINAL_STATUSES,
  TransferStatus,
} from '../_mock-db/seeds/transfer.seed';
import { type AuthenticatedUser, getAllowedStoreIds, getAuthUserFromRequest } from './auth';

/** Unscoped roles decide on behalf of either store. */
const UNSCOPED_ROLES = new Set<string>([UserRole.System, UserRole.Headquarter, UserRole.Manager]);

export function roleHasPermission(user: AuthenticatedUser, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[user.role as UserRole] as readonly Permission[] | undefined;
  return granted?.includes(permission) ?? false;
}

/** Which side of the transfer is being decided on, for the decision audit record. */
export function resolveActorStoreType(transfer: TransferRow): 'from' | 'to' | null {
  if (ORIGIN_STAGE_STATUSES.includes(transfer.status as TransferStatus)) return 'from';
  if (transfer.status === TransferStatus.FromStoreApproved) return 'to';
  return null;
}

/** Builds the audit actor for an approve / reject / unlock performed by this user on this row. */
export function toTransferActor(user: AuthenticatedUser, transfer: TransferRow) {
  return { name: user.name, role: user.role, store_type: resolveActorStoreType(transfer) };
}

export function canActOnTransfer(user: AuthenticatedUser, transfer: TransferRow): boolean {
  if (TERMINAL_STATUSES.includes(transfer.status as TransferStatus)) return false;
  if (!roleHasPermission(user, Permission.MembersTransfersApprove)) return false;
  // Visibility scoping has already narrowed the rows these roles can see.
  if (UNSCOPED_ROLES.has(user.role)) return true;
  if (user.role !== UserRole.Staff) return false;

  const allowed = getAllowedStoreIds(user);
  if (allowed === null) return true;

  if (ORIGIN_STAGE_STATUSES.includes(transfer.status as TransferStatus)) {
    return allowed.includes(transfer.from_store_id);
  }
  if (transfer.status === TransferStatus.FromStoreApproved && transfer.brand === 'fit365') {
    return allowed.includes(transfer.to_store_id);
  }
  return false;
}

/**
 * OR-across-both-sides visibility, unique to this feature: a transfer concerns two stores, so
 * seeing either end is enough. `allowed === null` means unrestricted (System / Headquarter).
 */
export function isTransferVisible(transfer: TransferRow, allowed: string[] | null): boolean {
  return (
    allowed === null ||
    allowed.includes(transfer.from_store_id) ||
    allowed.includes(transfer.to_store_id)
  );
}

/** Serialises a stored row for a specific caller, attaching their row-level actionability. */
export function withCanAct<T extends TransferRow>(
  transfer: T,
  user: AuthenticatedUser,
): T & { can_act: boolean } {
  return { ...transfer, can_act: canActOnTransfer(user, transfer) };
}

/**
 * Attaches the member head-up fields (PAR046) from the member record. Resolved here rather than
 * stored on the transfer so the head-up can never show a name or contract that the member
 * record has since changed.
 */
export function withMemberHeadup<T extends TransferRow>(transfer: T) {
  const member = db.members.get(transfer.member_id);
  const kana = member
    ? [member.personalInfo.lastNameKana, member.personalInfo.firstNameKana]
        .filter(Boolean)
        .join(' ')
        .trim()
    : '';
  return {
    ...transfer,
    member_name_kana: kana || null,
    old_member_no: member?.legacyMemberCode ?? null,
    member_type: member?.memberType ?? null,
    contract_name: member?.contractName ?? null,
  };
}

/** Full detail serialisation: caller-specific actionability plus the member head-up fields. */
export function toTransferDetailResponse<T extends TransferRow>(
  transfer: T,
  user: AuthenticatedUser,
) {
  return withMemberHeadup(withCanAct(transfer, user));
}

export type TransferGuard =
  | { ok: true; user: AuthenticatedUser; transfer: TransferRow }
  | { ok: false; response: NextResponse };

/**
 * Shared entry guard for every single-row transfer endpoint.
 *
 * Order matters: an out-of-scope row returns **404, not 403**, so a Staff user cannot probe
 * for the existence of transfers between two stores they have nothing to do with.
 *
 * @param requireRowAction when true, also enforces row-level `canActOnTransfer` (the write
 *   endpoints); the read endpoint only needs visibility.
 */
export function guardTransferRequest(
  request: NextRequest,
  id: string,
  requiredPermission: Permission,
  requireRowAction: boolean,
): TransferGuard {
  const authResult = getAuthUserFromRequest(request);
  if (!authResult.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: authResult.error }, { status: authResult.status }),
    };
  }
  const user = authResult.user;

  if (!roleHasPermission(user, requiredPermission)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const allowed = getAllowedStoreIds(user);
  if (allowed !== null && allowed.length === 0) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const transfer = db.transfers.getById(id);
  const notFound = NextResponse.json({ error: 'Transfer request not found' }, { status: 404 });
  if (!transfer || !isTransferVisible(transfer, allowed)) {
    return { ok: false, response: notFound };
  }

  if (requireRowAction) {
    // A terminal row is a bad request, not a permissions problem — check it before the
    // row-level rule so the caller gets 400 rather than a misleading 403.
    if (TERMINAL_STATUSES.includes(transfer.status as TransferStatus)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'すでに完了または否認された移籍申請は変更できません' },
          { status: 400 },
        ),
      };
    }
    if (!canActOnTransfer(user, transfer)) {
      return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
  }

  return { ok: true, user, transfer };
}
