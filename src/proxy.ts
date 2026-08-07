import { NextRequest, NextResponse } from 'next/server';

import { routes } from './lib/routes/routes.config';
import { RouteConfig } from './lib/routes/routes.type';
import { navigate } from './lib/routes/routes.util';
import { CookieNames } from './types/global.enum';
import { UserRole } from './types/permission.type';
import { decodeJWT } from './utils/auth.util';
import { canRoleAccessPage } from './utils/permission.util';

// Convert a route pattern (e.g. `/members/:id`) into a RegExp.
function patternToRegExp(pattern: string): RegExp {
  const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/:[^/]+/g, '/[^/]+');
  return new RegExp(`^${source}/?$`);
}

const routerPatterns = Object.values(routes)
  .map((router: RouteConfig) => ({
    private: router.private,
    pattern: patternToRegExp(router.pattern),
    routePattern: router.pattern,
  }))
  // Sort so that static segments (no `:param`) are matched before parameterised ones.
  // This prevents /members/blacklist from being swallowed by /members/:id.
  .sort((a, b) => {
    const aParams = (a.routePattern.match(/:/g) ?? []).length;
    const bParams = (b.routePattern.match(/:/g) ?? []).length;
    return aParams - bParams;
  });

function getRoleFromSession(session: string): UserRole | null {
  try {
    const parsed = JSON.parse(session) as { access_token?: string };
    const token = parsed.access_token ?? session;
    const payload = decodeJWT(token) as { role?: string } | null;
    const role = payload?.role;
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      return role as UserRole;
    }
  } catch (error) {
    console.error('Failed to parse session or decode JWT:', error);
  }
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const router = routerPatterns.find((r) => r.pattern.test(pathname));
  if (!router) return NextResponse.next();

  const session = request.cookies.get(CookieNames.Session)?.value;

  // Redirect unauthenticated users away from private pages
  if (router.private && !session) {
    const loginUrl = navigate('/login') + '?redirect=' + encodeURIComponent(request.nextUrl.href);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Redirect authenticated users away from public-only pages (e.g. /login)
  if (router.private === false && session) {
    return NextResponse.redirect(new URL(navigate('/'), request.url));
  }

  // Enforce page-level role check for private pages
  if (router.private && session) {
    const role = getRoleFromSession(session);
    if (role) {
      const allowed = canRoleAccessPage(
        role,
        router.routePattern as Parameters<typeof canRoleAccessPage>[1],
      );
      if (!allowed) {
        return NextResponse.redirect(new URL(navigate('/403'), request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|svg).*)'],
};
