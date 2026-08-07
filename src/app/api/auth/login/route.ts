import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  type LoginRequest,
  LoginRequestSchema,
  type LoginResponse,
  LoginResponseSchema,
  type Token,
} from '@/app/api/_schemas/auth.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation for this route
registerRoute({
  method: 'post',
  path: '/auth/login',
  summary: 'User login',
  description: 'Authenticate user and get access token',
  tags: ['Authentication'],
  requestBody: {
    schema: LoginRequestSchema,
    description: 'Login credentials',
  },
  responses: [
    {
      status: 200,
      schema: LoginResponseSchema,
      description: 'Login successful',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request - missing required fields',
    },
    {
      status: 401,
      schema: ErrorResponseSchema,
      description: 'Unauthorized - invalid credentials',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

// Simple JWT-like token generator (mock)
function generateToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa('mock-signature');
  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = LoginRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: LoginRequest = validationResult.data;

    // Find user from shared mock DB
    const user = db.users.getByEmail(validatedBody.email);
    if (!user || user.password !== validatedBody.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate tokens
    const accessTokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 1 day
    };

    const refreshTokenPayload = {
      id: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    };

    const token: Token = {
      access_token: generateToken(accessTokenPayload),
      refresh_token: generateToken(refreshTokenPayload),
      token_type: 'Bearer',
    };

    const response: LoginResponse = {
      token,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
