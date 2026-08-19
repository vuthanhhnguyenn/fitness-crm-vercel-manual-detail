export function isSafeManualNotificationLinkUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
//Check the link is a valid HTTPS URL
