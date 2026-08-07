export const CAMPAIGN_CODE_DUPLICATE_ERROR_CODE = 'campaign_code_duplicate';

export function getCampaignCodeServerErrorMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;

  const typedError = error as { code?: unknown; error?: unknown };
  if (typedError.code === CAMPAIGN_CODE_DUPLICATE_ERROR_CODE) {
    return 'キャンペーンコードが重複しています';
  }

  if (typeof typedError.error === 'string' && typedError.error.includes('キャンペーンコード')) {
    return typedError.error;
  }

  return null;
}
