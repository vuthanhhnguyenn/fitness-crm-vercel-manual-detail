import { GateStopPattern, GateStopSetPattern } from '@/lib/api/types.gen';

/**
 * The patterns the 設定 form offers. A-01 FR-014 defines four, but
 * 常時入退館（ストップなし）is the *absence* of a gate stop, not a setting: the API
 * rejects it and the screen already has a dedicated 解除 action, so it is left out
 * here on purpose (backend design answer 2026-08-10, QA03 §2.2).
 *
 * Labels for all four (including the one omitted here) live in
 * `GATE_STOP_PATTERN_LABELS` below, which display code uses.
 */
export const GATE_STOP_SET_PATTERN_OPTIONS: ReadonlyArray<{
  value: GateStopSetPattern;
  label: string;
  description: string;
}> = [
  {
    value: GateStopSetPattern.STAFFED_HOURS_DENY,
    label: 'スタッフ常駐時間のみ入館不可',
    description: 'スタッフがいる時間帯は入館を制限',
  },
  {
    value: GateStopSetPattern.ALWAYS_DENY,
    label: '常時入館不可',
    description: '全ての時間帯で入館を制限',
  },
  {
    value: GateStopSetPattern.UNSTAFFED_HOURS_DENY,
    label: 'スタッフ常駐時間以外は入館不可',
    description: 'スタッフがいない時間帯は入館を制限',
  },
];

export const GATE_STOP_PATTERN_LABELS: Record<GateStopPattern, string> = {
  [GateStopPattern.ALWAYS_OPEN]: '常時入退館（ストップなし）',
  [GateStopPattern.STAFFED_HOURS_DENY]: 'スタッフ常駐時間のみ入館不可',
  [GateStopPattern.ALWAYS_DENY]: '常時入館不可',
  [GateStopPattern.UNSTAFFED_HOURS_DENY]: 'スタッフ常駐時間以外は入館不可',
};

/**
 * Whether the member's entry is actually restricted.
 *
 * Single source of truth for every gate-stop indicator on the member detail screen — the
 * status badge, the warning banner and the 入退館設定 card must all derive from this, so they
 * can never contradict each other. 常時入退館（ストップなし）is the normal state and is not a
 * restriction.
 *
 * Read exclusively from the gate-stop record: gate stop is orthogonal to
 * `memberStatus` (a 休会中 member can be gate-stopped too), so the member's status
 * says nothing about it — backend design answer 2026-08-10, QA01 §1-2.
 */
export function isGateStopRestricted(member: {
  gateStop?: { pattern?: GateStopPattern } | null;
}): boolean {
  const pattern = member.gateStop?.pattern;
  return !!pattern && pattern !== GateStopPattern.ALWAYS_OPEN;
}

/** Explanation of why entry is restricted, used in banners etc. */
export const GATE_STOP_PATTERN_RESTRICTION_TEXT: Record<GateStopPattern, string> = {
  [GateStopPattern.ALWAYS_OPEN]: '入館制限はありません',
  [GateStopPattern.STAFFED_HOURS_DENY]: 'スタッフ常駐時間帯の入館が制限されています',
  [GateStopPattern.ALWAYS_DENY]: '全ての時間帯で入館が制限されています',
  [GateStopPattern.UNSTAFFED_HOURS_DENY]: 'スタッフ常駐時間外の入館が制限されています',
};
