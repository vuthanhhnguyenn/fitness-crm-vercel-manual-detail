import { toast } from 'sonner';
import Cookies from 'universal-cookie';

import { navigate } from '@/lib/routes/routes.util';

import { CookieNames } from '@/types/global.enum';

export async function handleLogout() {
  new Cookies().remove(CookieNames.Session);
  window.location.href = navigate('/login');
}

export const getLoginUrl = () => {
  return navigate('/login') + '?redirect=' + encodeURIComponent(window.location.href);
};

export const safeRedirect = (redirectUrl?: string) => {
  if (!redirectUrl) {
    return navigate('/');
  }

  try {
    // Decode URL to handle encoded URL strings
    const decodedUrl = decodeURIComponent(redirectUrl);

    // Create a URL object for validation
    const url = new URL(decodedUrl, window.location.origin);

    // Only allow same-origin redirects
    if (url.origin !== window.location.origin) {
      console.warn('Redirect to external domain blocked for security');
      return navigate('/');
    }

    // Check protocol to ensure it is HTTP/HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      console.warn('Invalid protocol for redirect');
      return navigate('/');
    }

    return decodedUrl;
  } catch (error) {
    console.warn('Invalid redirect URL:', error);
    return navigate('/');
  }
};

export const CAN_USE_DOM: boolean =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

/**
 * Copy text to clipboard and show success toast
 */
export async function copyToClipboard(
  text: string,
  successMessage: string = 'クリップボードにコピーしました',
) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

export function formatGenderLabel(gender: string | undefined) {
  switch (gender) {
    case 'male':
      return '男性';
    case 'female':
      return '女性';
    case 'other':
      return 'その他';
    default:
      return gender;
  }
}
