import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

/**
 * Login Request Schema
 */
export const LoginRequestSchema = z
  .object({
    email: z.string().email('Invalid email format').openapi({
      example: 'admin@amira.vn',
      description: 'User email address',
    }),
    password: z.string().min(6, 'Password must be at least 6 characters').openapi({
      example: 'password123',
      description: 'User password',
    }),
  })
  .openapi({
    title: 'LoginRequest',
    description: 'Login request payload',
  });

/**
 * Token Schema
 */
export const TokenSchema = z
  .object({
    access_token: z.string().openapi({
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'JWT access token',
    }),
    refresh_token: z.string().openapi({
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'JWT refresh token',
    }),
    token_type: z.string().openapi({
      example: 'Bearer',
      description: 'Token type',
    }),
    company_id: z.number().nullable().optional().openapi({
      example: 1,
      description: 'Company ID associated with the user',
    }),
  })
  .openapi({
    title: 'Token',
    description: 'Authentication token response',
  });

/**
 * Login Response Schema
 */
export const LoginResponseSchema = z
  .object({
    token: TokenSchema,
  })
  .openapi({
    title: 'LoginResponse',
    description: 'Login response with authentication tokens',
  });

/**
 * Refresh Token Request Schema
 */
export const RefreshRequestSchema = z
  .object({
    refresh_token: z.string().min(1, 'Refresh token is required').openapi({
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'JWT refresh token',
    }),
  })
  .openapi({
    title: 'RefreshRequest',
    description: 'Refresh token request payload',
  });

/**
 * Refresh Token Response Schema
 */
export const RefreshResponseSchema = z
  .object({
    accessToken: z.string().openapi({
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'New JWT access token',
    }),
    refresh_token: z.string().openapi({
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      description: 'New JWT refresh token',
    }),
    token_type: z.string().openapi({
      example: 'Bearer',
      description: 'Token type',
    }),
    company_id: z.number().nullable().optional().openapi({
      example: 1,
      description: 'Company ID associated with the user',
    }),
  })
  .openapi({
    title: 'RefreshResponse',
    description: 'Refresh token response with new authentication tokens',
  });

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: 'Invalid email or password',
      description: 'Error message',
    }),
  })
  .openapi({
    title: 'ErrorResponse',
    description: 'Error response',
  });

// Type exports for use in route handlers
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * GET /auth/me — current authenticated user
 */
export const MeResponseSchema = z
  .object({
    id: z.string().openapi({ example: 'U-001', description: 'User ID' }),
    email: z.string().email().openapi({ example: 'admin@example.com' }),
    name: z.string().openapi({ example: 'Admin User' }),
    role: z
      .enum(['System', 'Headquarter', 'Manager', 'Staff', 'Trainer', 'Observer'])
      .openapi({ example: 'Headquarter' }),
    position: z.string().openapi({ example: '本部管理者' }),
  })
  .openapi({ title: 'MeResponse', description: 'Current authenticated user' });

export type MeResponse = z.infer<typeof MeResponseSchema>;
