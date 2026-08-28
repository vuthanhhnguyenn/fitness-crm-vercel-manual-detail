import type { DbType } from '../_db.types';
import type { EntryExitLogRow } from '../types/entry-exit-logs.type';

const GATES = ['ゲートA', 'ゲートB'];
const AUTH_METHODS: EntryExitLogRow['auth_method'][] = ['qr', 'nfc'];

function isoAt(base: Date, hour: number, minute: number): string {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysBefore(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Builds Phase 1 seed rows for the entry-exit activity baseline (feature 013)
 * and its B-01-01 history extension (feature 015).
 * Covers every case from data-model.md's Phase 1 Seed Requirements:
 * both frequency badges, an inviter/invitee pair, a first-time visitor
 * (visit_count resolves to 0), an orphaned exit (no matching entry), rows
 * spanning 2+ stores, both auth methods, a denied entry, an in-progress
 * visit, and a cross-store (home store ≠ visiting store) completed visit.
 */
export function buildEntryExitLogSeed(db: DbType): EntryExitLogRow[] {
  db.members._seed();
  db.stores._seed();

  const members = db.members.getList();
  const stores = db.stores.getList().slice(0, 2);
  const [storeA, storeB] = stores.length >= 2 ? stores : [stores[0], stores[0]];

  const today = new Date();
  const rows: EntryExitLogRow[] = [];
  let seq = 1;
  const nextId = () => `EEL-${String(seq++).padStart(6, '0')}`;
  const authFor = (i: number) => AUTH_METHODS[i % AUTH_METHODS.length]!;

  const pick = (index: number) => members[index % members.length]!;

  // Backdated exit-only history for two members, purely to build up a
  // realistic prior visit_count ("N回") without appearing in today's tables.
  const regular = pick(0);
  const longAbsence = pick(1);
  for (let i = 1; i <= 6; i++) {
    rows.push({
      id: nextId(),
      member_id: regular.id,
      store_id: storeA!.id,
      direction: 'exit',
      occurred_at: isoAt(daysBefore(today, i * 3), 13, 0),
      gate: GATES[0]!,
      frequency_badge: null,
      companion_role: null,
      auth_method: authFor(i),
      result: 'success',
    });
  }
  for (let i = 1; i <= 3; i++) {
    rows.push({
      id: nextId(),
      member_id: longAbsence.id,
      store_id: storeB!.id,
      direction: 'exit',
      occurred_at: isoAt(daysBefore(today, 35 + i * 4), 14, 0),
      gate: GATES[1]!,
      frequency_badge: null,
      companion_role: null,
      auth_method: authFor(i),
      result: 'success',
    });
  }

  // ── Today's entries (>= 5) ────────────────────────────────────────────────
  // regular/longAbsence have only backdated exits above, so today's entry has
  // no later same-store exit yet → resolves to an in-progress (在館中) visit.
  rows.push({
    id: nextId(),
    member_id: regular.id,
    store_id: storeA!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 12, 45),
    gate: GATES[0]!,
    frequency_badge: 'regular',
    companion_role: null,
    auth_method: 'qr',
    result: 'success',
  });
  rows.push({
    id: nextId(),
    member_id: longAbsence.id,
    store_id: storeB!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 13, 20),
    gate: GATES[1]!,
    frequency_badge: 'longAbsence',
    companion_role: null,
    auth_method: 'nfc',
    result: 'success',
  });

  const inviter = pick(2);
  const invitee = pick(3);
  rows.push({
    id: nextId(),
    member_id: inviter.id,
    store_id: storeA!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 13, 35),
    gate: GATES[0]!,
    frequency_badge: null,
    companion_role: 'inviter',
    auth_method: 'qr',
    result: 'success',
  });
  rows.push({
    id: nextId(),
    member_id: invitee.id,
    store_id: storeA!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 13, 39),
    gate: GATES[0]!,
    frequency_badge: null,
    companion_role: 'invitee',
    auth_method: 'qr',
    result: 'success',
  });

  // First-time visitor: only row in the entire table for this member, so
  // getQuickView's prior-visit count resolves to 0 ("初回").
  const firstTimer = pick(4);
  rows.push({
    id: nextId(),
    member_id: firstTimer.id,
    store_id: storeB!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 13, 50),
    gate: GATES[1]!,
    frequency_badge: null,
    companion_role: null,
    auth_method: 'nfc',
    result: 'success',
  });

  const plainEntryMembers = [pick(5), pick(6), pick(7)];
  plainEntryMembers.forEach((member, i) => {
    rows.push({
      id: nextId(),
      member_id: member.id,
      store_id: (i % 2 === 0 ? storeA : storeB)!.id,
      direction: 'entry',
      occurred_at: isoAt(today, 14 + i, 0),
      gate: GATES[i % 2]!,
      frequency_badge: null,
      companion_role: null,
      auth_method: authFor(i),
      result: 'success',
    });
  });

  // ── Today's exits (>= 5) ──────────────────────────────────────────────────
  const exitedMembers = [pick(8), pick(9), pick(10), pick(11)];
  exitedMembers.forEach((member, i) => {
    // Same-day entry earlier, so duration_minutes resolves for these
    // (also B-01-01's "completed" visit_status coverage).
    rows.push({
      id: nextId(),
      member_id: member.id,
      store_id: (i % 2 === 0 ? storeA : storeB)!.id,
      direction: 'entry',
      occurred_at: isoAt(today, 10 + i, 30),
      gate: GATES[i % 2]!,
      frequency_badge: null,
      companion_role: null,
      auth_method: authFor(i),
      result: 'success',
    });
    rows.push({
      id: nextId(),
      member_id: member.id,
      store_id: (i % 2 === 0 ? storeA : storeB)!.id,
      direction: 'exit',
      occurred_at: isoAt(today, 12 + i, 45),
      gate: GATES[i % 2]!,
      frequency_badge: null,
      companion_role: null,
      auth_method: authFor(i),
      result: 'success',
    });
  });

  // Orphaned exit: no matching same-day entry for this member today.
  const orphan = pick(12);
  rows.push({
    id: nextId(),
    member_id: orphan.id,
    store_id: storeA!.id,
    direction: 'exit',
    occurred_at: isoAt(today, 13, 30),
    gate: GATES[0]!,
    frequency_badge: null,
    companion_role: null,
    auth_method: 'qr',
    result: 'success',
  });

  // ── B-01-01 history-specific coverage ─────────────────────────────────────

  // Denied entry attempt: no exit row is ever produced for a denied entry.
  const deniedMember = pick(13);
  rows.push({
    id: nextId(),
    member_id: deniedMember.id,
    store_id: storeA!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 9, 30),
    gate: GATES[0]!,
    frequency_badge: null,
    companion_role: null,
    auth_method: 'qr',
    result: 'denied',
  });

  // Cross-store visit: a member whose home store differs from the store they
  // visited today, exercising the 所属店舗/入館店舗 two-column display.
  const crossStoreMember = members.find((m) => m.store_id !== storeA!.id) ?? pick(14);
  rows.push({
    id: nextId(),
    member_id: crossStoreMember.id,
    store_id: storeA!.id,
    direction: 'entry',
    occurred_at: isoAt(today, 11, 10),
    gate: GATES[0]!,
    frequency_badge: null,
    companion_role: null,
    auth_method: 'nfc',
    result: 'success',
  });
  rows.push({
    id: nextId(),
    member_id: crossStoreMember.id,
    store_id: storeA!.id,
    direction: 'exit',
    occurred_at: isoAt(today, 12, 40),
    gate: GATES[0]!,
    frequency_badge: null,
    companion_role: null,
    auth_method: 'nfc',
    result: 'success',
  });

  return rows;
}
