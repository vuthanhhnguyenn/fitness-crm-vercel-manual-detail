/**
 * Token response from login API
 */
export type Token = {
  /**
   * Access Token
   */
  access_token: string;
  /**
   * Refresh Token
   */
  refresh_token: string;
  /**
   * Token Type
   */
  token_type: string;
  /**
   * Company Id
   */
  company_id?: number | null;
};

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: Token;
}
