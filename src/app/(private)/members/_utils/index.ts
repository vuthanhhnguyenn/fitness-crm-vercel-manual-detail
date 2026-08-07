export const normalizePostalCode = (value?: string) => trimOrUndefined(value)?.replace(/\D/g, '');

export const trimOrUndefined = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getTenureLabel = (joinedAt?: string): string => {
  if (!joinedAt) {
    return '—';
  }

  const joinedDate = new Date(joinedAt);
  if (Number.isNaN(joinedDate.getTime())) {
    return '—';
  }

  const now = new Date();
  const totalMonths =
    (now.getFullYear() - joinedDate.getFullYear()) * 12 + (now.getMonth() - joinedDate.getMonth());

  if (totalMonths < 0) {
    return '—';
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months}ヶ月`;
  }

  return `${years}年${months}ヶ月`;
};
