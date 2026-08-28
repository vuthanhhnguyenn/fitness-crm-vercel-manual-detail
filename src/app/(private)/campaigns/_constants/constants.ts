import type {
  CampaignAcceptState,
  CampaignApplyStartMonth,
  CampaignPublishScope,
  CampaignTargetSex,
  PromoCodeEffectiveStatus,
  PromoCodeScope,
} from '@/lib/api/types.gen';

/**
 * infinite scroll で段階取得するマスタ（店舗・主契約の検索対応セレクト、条件/自動付与オプションのチェックボックスグリッド）の1ページあたり取得件数。
 * 100件を超える環境があるため、全件取得ではなく複数ページに分けて取得する前提の小さめの値。
 */
export const CAMPAIGN_SEARCH_PAGE_LIMIT = 30;

export const CAMPAIGN_ACCEPT_STATE_LABELS: Record<CampaignAcceptState, string> = {
  accepting: '受付中',
  stopped: '受付停止',
  capacity_reached: '上限到達',
};

/**
 * 受付状態の配色。一覧・詳細ヘッダー・StatusCard で共通に使う。
 *
 * V0 は同じ「上限到達」を一覧では warning (campaign-list.tsx:L80)、
 * 詳細ヘッダーでは destructive (campaign-detail.tsx:L1034) と描き分けており矛盾している。
 * 上限到達は受付がブロックされた終端状態なので destructive に一本化する
 * (プロモーションコードの同義ステータス `exhausted` とも揃う)。
 */
export const CAMPAIGN_ACCEPT_STATE_BADGE_CLASSES: Record<CampaignAcceptState, string> = {
  accepting: 'bg-success/15 text-success border-success/20',
  stopped: 'bg-muted text-muted-foreground border-border',
  capacity_reached: 'bg-destructive/15 text-destructive border-destructive/20',
};

/** 上と同じ意味づけを StatusCard の tone 語彙に写したもの。 */
export const CAMPAIGN_ACCEPT_STATE_TONES: Record<
  CampaignAcceptState,
  'success' | 'muted' | 'destructive'
> = {
  accepting: 'success',
  stopped: 'muted',
  capacity_reached: 'destructive',
};

export const CAMPAIGN_ACCEPT_STATE_VALUES = [
  'accepting',
  'stopped',
  'capacity_reached',
] as const satisfies readonly CampaignAcceptState[];

/** 「あり」を表すバッジ。自動付与・友達紹介連動で共用する。 */
export const CAMPAIGN_ENABLED_BADGE_CLASS = 'bg-success/15 text-success border-success/20';

/** 公開範囲「特定店舗のみ」/ 変更履歴「新規作成」の注意色。 */
export const CAMPAIGN_INFO_BADGE_CLASS = 'bg-info/15 text-info border-info/20';

export const CAMPAIGN_APPLY_START_MONTH_LABELS: Record<CampaignApplyStartMonth, string> = {
  first_month: '初月（利用開始月）',
  next_month: '翌月（利用開始月の翌月）',
  specific_month: 'X月指定',
};

export const CAMPAIGN_TARGET_SEX_LABELS: Record<CampaignTargetSex, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
};

export const CAMPAIGN_TARGET_SEX_BADGE_CLASSES: Record<CampaignTargetSex, string> = {
  male: 'bg-gender-male/15 text-gender-male border-gender-male/20',
  female: 'bg-gender-female/15 text-gender-female border-gender-female/20',
  other: 'bg-muted text-muted-foreground border-border',
};

export const CAMPAIGN_PUBLISH_SCOPE_LABELS: Record<CampaignPublishScope, string> = {
  all_stores: '全店舗公開',
  specific_stores: '特定店舗のみ公開',
};

export const PROMO_CODE_STATUS_LABELS: Record<PromoCodeEffectiveStatus, string> = {
  active: '有効',
  expired: '期限切れ',
  exhausted: '上限到達',
  disabled: '無効',
  campaign_unavailable: 'キャンペーン停止中',
};

/** V0 `statusClass` (campaign-detail.tsx:L776-780) の4値配色 + キャンペーン停止中。 */
export const PROMO_CODE_STATUS_BADGE_CLASSES: Record<PromoCodeEffectiveStatus, string> = {
  active: 'bg-success/15 text-success border-success/20',
  expired: 'bg-warning/15 text-warning border-warning/20',
  exhausted: 'bg-destructive/15 text-destructive border-destructive/20',
  disabled: 'bg-muted text-muted-foreground border-border',
  campaign_unavailable: 'bg-muted text-muted-foreground border-border',
};

/** 行を淡く落とすステータス (campaign-detail.tsx:L787)。 */
export const PROMO_CODE_INACTIVE_STATUSES: readonly PromoCodeEffectiveStatus[] = [
  'disabled',
  'expired',
  'exhausted',
  'campaign_unavailable',
];

export const PROMO_CODE_SCOPE_LABELS: Record<PromoCodeScope, string> = {
  brand_all: '全店舗',
  issuer_store_only: '発行店舗のみ',
  ogf_only: 'OGF会員のみ',
};

/** コード発行ダイアログの適用店舗タイプ選択肢 (campaign-detail.tsx:L739-740)。 */
export const PROMO_CODE_SCOPE_OPTIONS: { value: PromoCodeScope; label: string }[] = [
  { value: 'brand_all', label: 'タイプA: 全店舗で使用可能（本部のみ設定可）' },
  { value: 'issuer_store_only', label: 'タイプB: 発行店舗のみで使用可能' },
  { value: 'ogf_only', label: 'OGF会員限定' },
];

export const PROMO_CODE_ISSUER_OPTIONS = [
  { value: 'staff-hq-001', label: '本部' },
  { value: 'staff-store-001', label: '店舗スタッフ' },
];

/**
 * フィルター開閉でテーブル高さを切り替える (list 画面共通パターン)。
 * hasActiveFilters の +41px は FilterResultBanner (py-2 + h-6 ボタン + border-t) の分。
 */
export function getCampaignTableMaxHeightClass(
  isFilterOpen: boolean,
  hasActiveFilters: boolean,
): string {
  if (isFilterOpen && hasActiveFilters) return 'max-h-[calc(100vh-381px)]';
  if (isFilterOpen) return 'max-h-[calc(100vh-340px)]';
  if (hasActiveFilters) return 'max-h-[calc(100vh-327px)]';
  return 'max-h-[calc(100vh-286px)]';
}
