import { NextRequest, NextResponse } from 'next/server';

import { LoginRequest, LoginResponse, Token } from '../../_schemas/auth.schema';

// Mock user database
const MOCK_USERS = [
  {
    email: 'admin@example.com',
    password: 'password123',
    companyId: 1,
  },
  {
    email: 'staff@example.com',
    password: 'password123',
    companyId: 2,
  },
  {
    email: 'user@example.com',
    password: 'password123',
    companyId: null,
  },
];

// Simple JWT-like token generator (mock)
function generateToken(payload: Record<string, any>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa('mock-signature');
  return `${header}.${body}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Validate request body
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user in mock database
    const user = MOCK_USERS.find((u) => u.email === body.email && u.password === body.password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate tokens
    const accessTokenPayload = {
      sub: body.email,
      email: body.email,
      company_id: user.companyId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const refreshTokenPayload = {
      sub: body.email,
      email: body.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    };

    const token: Token = {
      access_token: generateToken(accessTokenPayload),
      refresh_token: generateToken(refreshTokenPayload),
      token_type: 'Bearer',
      company_id: user.companyId,
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
