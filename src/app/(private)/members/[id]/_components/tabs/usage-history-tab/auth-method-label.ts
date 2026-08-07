/**
 * Helper function to map entry_method enum values to Japanese labels.
 */
export function getAuthMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    qr_code: 'QRコード',
    ic_card: 'ICカード',
    face_recognition: '顔認証',
    member_card: '会員カード',
  };
  return labels[method] ?? method;
}
