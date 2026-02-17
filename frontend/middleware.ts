import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/account', '/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the auth token and user data from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const authUserCookie = request.cookies.get('auth_user')?.value;

  // User is authenticated if token exists
  const isAuthenticated = !!authToken;

  // Try to get user role from cookie
  let userRole: string | undefined;
  if (authUserCookie) {
    try {
      const userData = JSON.parse(authUserCookie);
      userRole = userData.role;
    } catch (e) {
      console.log('🔒 Middleware: Failed to parse user cookie');
    }
  }

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route));

  console.log('🔒 Middleware:', { pathname, isAuthenticated, userRole, isProtectedRoute, isAuthRoute });

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    console.log('🔒 Middleware: Redirecting to login - no auth token');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to appropriate dashboard if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/account/dashboard';

    console.log('🔒 Middleware: Redirecting to', dashboardPath, '- already authenticated');
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
