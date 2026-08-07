/**
 * Decode a JWT token payload
 * @param token JWT token string
 * @returns Decoded payload object or null if invalid
 */
export function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get the expiration date from a JWT token
 * @param token JWT token string
 * @returns Date object or null if invalid/no exp claim
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token);
  if (payload && payload.exp) {
    // JWT exp is in seconds, Date constructor expects milliseconds
    return new Date(payload.exp * 1000);
  }
  return null;
}
