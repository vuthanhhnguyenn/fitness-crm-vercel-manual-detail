const RISK_REASON_LABELS_JA: Record<string, string> = {
  blacklist_match: 'ブラックリスト一致',
  duplicate_application: '重複申込',
  payment_failure: '決済失敗',
  high_risk_score: '高リスクスコア',
  document_issue: '書類問題',
  family_registration: '家族入会',
  other: 'その他',
};

export const getRiskReasonLabelJa = (riskReason?: string | null): string => {
  if (!riskReason) return '—';
  return RISK_REASON_LABELS_JA[riskReason] ?? riskReason;
};
