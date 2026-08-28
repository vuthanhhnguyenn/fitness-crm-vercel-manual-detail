/**
 * G-03 キャンペーン管理 / G-06 プロモーションコード管理のモックテーブル。
 *
 * シードは `seeds/campaign.seed.ts`。3テーブルがそれぞれ `buildCampaignSeed()` を呼ぶが、
 * 各自が自分のスライスしか読まないため重複はしない。メモ化しないのは、
 * `_changeHistory` のように後から書き換わるオブジェクトを共有させないため。
 *
 * 派生ロジック (受付状態・実効ステータス等) は他テーブル同様この層に置き、
 * `db` を参照しない純関数として公開する。名前解決が必要なものは resolver を受け取る。
 */
import { HQ_ACTOR, buildCampaignSeed } from '@/app/api/_mock-db/seeds/campaign.seed';
import type {
  CampaignAcceptState,
  CampaignChangeHistoryItem,
  CampaignRow,
  StoreCampaignLinkRow,
} from '@/app/api/_schemas/campaign.schema';
import type { PromoCodeEffectiveStatus, PromoCodeRow } from '@/app/api/_schemas/promo-code.schema';

function nowIso(): string {
  return new Date().toISOString();
}

/** `CP012` のような可読IDを採番する。 */
function nextCampaignId(rows: CampaignRow[]): string {
  const maxNumber = rows.reduce((max, row) => {
    const parsed = Number(row.id.replace(/^CP/, ''));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
  return `CP${String(maxNumber + 1).padStart(3, '0')}`;
}

function nextPromoCodeId(rows: PromoCodeRow[]): string {
  const maxNumber = rows.reduce((max, row) => {
    const parsed = Number(row.id.replace(/^PC/, ''));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
  return `PC${String(maxNumber + 1).padStart(3, '0')}`;
}

export function deriveAcceptState(row: CampaignRow): CampaignAcceptState {
  if (row.entry_cap !== null && row.pending_application_count >= row.entry_cap) {
    return 'capacity_reached';
  }
  return row.is_accepting ? 'accepting' : 'stopped';
}

export function buildLockInExample(row: CampaignRow): string | null {
  if (row.lock_in_months === null || row.lock_in_months <= 0) return null;
  const start = new Date(`${row.recruitment_start}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + row.lock_in_months);
  end.setUTCDate(0); // 前月末日
  const fmt = (date: Date) =>
    `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${fmt(start)}入会の場合 → ${fmt(end)}末まで解約手数料対象`;
}

export function isCampaignInUse(row: CampaignRow): boolean {
  return row.active_contract_count > 0 || row.pending_application_count > 0;
}

const ACCEPT_ONLY_KEYS = new Set(['isAccepting']);

export function isAcceptingOnlyPayload(body: Record<string, unknown>): boolean {
  const keys = Object.keys(body);
  return keys.length > 0 && keys.every((key) => ACCEPT_ONLY_KEYS.has(key));
}

export function deriveEffectiveStatus(
  row: PromoCodeRow,
  campaign: CampaignRow | undefined,
): PromoCodeEffectiveStatus {
  if (row.status === 'disabled') return 'disabled';

  if (!campaign || campaign.deleted_at || !campaign.is_accepting) {
    return 'campaign_unavailable';
  }

  if (row.max_uses !== null && row.used_count >= row.max_uses) return 'exhausted';

  const today = new Date().toISOString().slice(0, 10);
  if (row.valid_to < today) return 'expired';

  return 'active';
}

export function promoCodeUsageRate(row: PromoCodeRow): number | null {
  if (row.max_uses === null || row.max_uses <= 0) return null;
  return Math.round((row.used_count / row.max_uses) * 100);
}

export function promoCodeRemaining(row: PromoCodeRow): number | null {
  if (row.max_uses === null) return null;
  return Math.max(0, row.max_uses - row.used_count);
}

/** G-06 FR-002 / G-03 FR-007: 命名規則「店舗ID＋英数字5桁」。OGF向けは「OGF＋英数字5桁」。 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePromoCode(
  scopeType: PromoCodeRow['scope_type'],
  storeCode: string,
): string {
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  const prefix = scopeType === 'ogf_only' ? 'OGF' : storeCode;
  return `${prefix}-${suffix}`;
}

/** 変更履歴・詳細レスポンスで必要になる名前解決。呼び出し側が `db` から組み立てる。 */
export type CampaignNameResolver = {
  planName(planId: string): string;
  optionName(optionId: string): string;
  storeName(storeId: string): string;
};

export function buildChangeHistoryEntries(
  before: CampaignRow,
  after: CampaignRow,
  actor: string,
  changedAt: string,
  resolve: CampaignNameResolver,
): CampaignChangeHistoryItem[] {
  const fields: { label: string; format: (row: CampaignRow) => string }[] = [
    { label: 'キャンペーン名', format: (row) => row.name },
    { label: 'キャンペーンコード', format: (row) => row.campaign_code ?? '—' },
    { label: '受付可否', format: (row) => (row.is_accepting ? '受付中' : '受付停止') },
    { label: '備考', format: (row) => row.remarks ?? '—' },
    {
      label: '募集期間',
      format: (row) => `${row.recruitment_start} 〜 ${row.recruitment_end}`,
    },
    {
      label: '利用開始期間',
      format: (row) => `${row.usage_start ?? '—'} 〜 ${row.usage_end ?? '—'}`,
    },
    { label: '適用主契約', format: (row) => resolve.planName(row.plan_id) },
    {
      label: '先着件数上限',
      format: (row) => (row.entry_cap === null ? '—' : `${row.entry_cap}件`),
    },
    {
      label: '縛り期間',
      format: (row) => (row.lock_in_months === null ? '—' : `${row.lock_in_months}ヶ月`),
    },
    {
      label: '月額割引（初月）',
      format: (row) => {
        if (!row.plan_discount_month1) return '設定なし';
        if (row.plan_discount_month1_type === null || row.plan_discount_month1_value === null)
          return '設定なし';
        return row.plan_discount_month1_type === 'percentage'
          ? `${row.plan_discount_month1_value}%OFF`
          : `${row.plan_discount_month1_value.toLocaleString()}円引き`;
      },
    },
    {
      label: '月額割引（翌月）',
      format: (row) => {
        if (!row.plan_discount_month2) return '設定なし';
        if (row.plan_discount_month2_type === null || row.plan_discount_month2_value === null)
          return '設定なし';
        return row.plan_discount_month2_type === 'percentage'
          ? `${row.plan_discount_month2_value}%OFF`
          : `${row.plan_discount_month2_value.toLocaleString()}円引き`;
      },
    },
    {
      label: '公開店舗',
      format: (row) =>
        row.publish_scope === 'all_stores'
          ? '全店舗に公開'
          : row.publish_store_ids.map((id) => resolve.storeName(id)).join(', ') || '特定店舗のみ',
    },
    {
      label: '紹介キャンペーン',
      format: (row) => (row.referral.enabled ? `あり（${row.referral.points ?? 0}pt）` : 'なし'),
    },
  ];

  return fields
    .map(({ label, format }) => ({ label, from: format(before), to: format(after) }))
    .filter((entry) => entry.from !== entry.to)
    .map((entry) => ({
      date: changedAt,
      user: actor,
      field: entry.label,
      from: entry.from,
      to: entry.to,
    }));
}

export function createCampaignTables() {
  return {
    campaigns: {
      _rows: [] as CampaignRow[],
      _changeHistory: {} as Record<string, CampaignChangeHistoryItem[]>,
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const seed = buildCampaignSeed();
        this._rows.push(...seed.campaigns);
        this._changeHistory = seed.changeHistory;
      },

      getList(includeDeleted = false): CampaignRow[] {
        this._seed();
        return includeDeleted ? [...this._rows] : this._rows.filter((row) => !row.deleted_at);
      },

      getById(id: string, includeDeleted = false): CampaignRow | undefined {
        this._seed();
        const row = this._rows.find((item) => item.id === id);
        if (!row) return undefined;
        return includeDeleted || !row.deleted_at ? row : undefined;
      },

      getChangeHistory(id: string): CampaignChangeHistoryItem[] {
        this._seed();
        return this._changeHistory[id] ?? [];
      },

      appendChangeHistory(id: string, entries: CampaignChangeHistoryItem[]): void {
        this._seed();
        if (entries.length === 0) return;
        this._changeHistory[id] = [...entries, ...(this._changeHistory[id] ?? [])];
      },

      nextId(): string {
        this._seed();
        return nextCampaignId(this._rows);
      },

      isCodeTaken(code: string, exceptId?: string): boolean {
        this._seed();
        const normalized = code.trim().toLowerCase();
        return this._rows.some(
          (row) =>
            !row.deleted_at &&
            row.id !== exceptId &&
            (row.campaign_code ?? '').toLowerCase() === normalized,
        );
      },

      create(row: CampaignRow): CampaignRow {
        this._seed();
        this._rows.push(row);
        this._changeHistory[row.id] = [
          {
            date: row.created_at,
            user: row.created_by ?? HQ_ACTOR,
            field: null,
            from: null,
            to: '新規作成',
          },
        ];
        return row;
      },

      update(id: string, patch: Partial<CampaignRow>): CampaignRow | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return undefined;
        const next: CampaignRow = {
          ...this._rows[index]!,
          ...patch,
          id,
          updated_at: patch.updated_at ?? nowIso(),
        };
        this._rows[index] = next;
        return next;
      },

      softDelete(id: string): CampaignRow | undefined {
        this._seed();
        const row = this._rows.find((item) => item.id === id && !item.deleted_at);
        if (!row) return undefined;
        return this.update(id, { deleted_at: nowIso() });
      },
    },

    storeCampaignLinks: {
      _rows: [] as StoreCampaignLinkRow[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows.push(...buildCampaignSeed().storeCampaignLinks);
      },

      getByCampaignId(campaignId: string): StoreCampaignLinkRow[] {
        this._seed();
        return this._rows.filter((row) => row.campaign_id === campaignId);
      },
    },

    promoCodes: {
      _rows: [] as PromoCodeRow[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        this._rows.push(...buildCampaignSeed().promoCodes);
      },

      getList(): PromoCodeRow[] {
        this._seed();
        return [...this._rows];
      },

      getListByCampaignId(campaignId: string): PromoCodeRow[] {
        this._seed();
        return this._rows.filter((row) => row.campaign_id === campaignId);
      },

      getById(id: string): PromoCodeRow | undefined {
        this._seed();
        return this._rows.find((row) => row.id === id);
      },

      getByCode(code: string): PromoCodeRow | undefined {
        this._seed();
        const normalized = code.trim().toLowerCase();
        return this._rows.find((row) => row.code.toLowerCase() === normalized);
      },

      nextId(): string {
        this._seed();
        return nextPromoCodeId(this._rows);
      },

      create(row: PromoCodeRow): PromoCodeRow {
        this._seed();
        this._rows.push(row);
        return row;
      },

      update(id: string, patch: Partial<PromoCodeRow>): PromoCodeRow | undefined {
        this._seed();
        const index = this._rows.findIndex((row) => row.id === id);
        if (index === -1) return undefined;
        const next: PromoCodeRow = {
          ...this._rows[index]!,
          ...patch,
          id,
          updated_at: patch.updated_at ?? nowIso(),
        };
        this._rows[index] = next;
        return next;
      },

      /** キャンペーン単位の発行数。詳細の `promotionCodeCount` に使う。 */
      countActiveByCampaignId(campaignId: string): number {
        this._seed();
        return this._rows.filter((row) => row.campaign_id === campaignId && row.status === 'active')
          .length;
      },

      hasAnyByCampaignId(campaignId: string): boolean {
        this._seed();
        return this._rows.some((row) => row.campaign_id === campaignId);
      },
    },
  };
}
