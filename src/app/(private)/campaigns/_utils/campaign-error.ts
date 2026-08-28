/** API-088 / mock API のエラーコード。ハンドリング分岐に使う。 */
export const CAMPAIGN_ERROR_CODE = {
  validation: 'E-VAL-001',
  codeDuplicate: 'E-CMP-001',
  inUse: 'E-CMP-002',
  notFound: 'E-CMP-404',
} as const;

type CampaignApiError = {
  code?: unknown;
  userMessage?: unknown;
  message?: unknown;
};

function asCampaignApiError(error: unknown): CampaignApiError | null {
  if (typeof error !== 'object' || error === null) return null;
  return error as CampaignApiError;
}

export function getCampaignErrorCode(error: unknown): string | null {
  const typed = asCampaignApiError(error);
  return typeof typed?.code === 'string' ? typed.code : null;
}

/** 利用者向けメッセージ。API が返す日本語文言をそのまま優先する。 */
export function getCampaignErrorMessage(error: unknown, fallback: string): string {
  const typed = asCampaignApiError(error);
  if (typeof typed?.userMessage === 'string' && typed.userMessage) return typed.userMessage;
  return fallback;
}

/** コード重複はフォームの該当フィールドに紐づけて表示する。 */
export function getCampaignCodeServerErrorMessage(error: unknown): string | null {
  if (getCampaignErrorCode(error) !== CAMPAIGN_ERROR_CODE.codeDuplicate) return null;
  return getCampaignErrorMessage(error, 'このコードは既に使われています');
}

/**
 * 適用中の会員・申請があるキャンペーンは受付可否以外を更新できない (E-CMP-002)。
 * フォームは編集可能なままにし、送信時にこのガードを画面へ伝える。
 */
export function isCampaignInUseError(error: unknown): boolean {
  return getCampaignErrorCode(error) === CAMPAIGN_ERROR_CODE.inUse;
}
