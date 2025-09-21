import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Если пользователь не аутентифицирован
    if (!token) {
      // Разрешаем доступ к публичным страницам
      if (
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api/auth') ||
        pathname === '/' ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico')
      ) {
        return NextResponse.next()
      }
      
      // Перенаправляем на страницу входа для всех остальных страниц
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Если пользователь аутентифицирован
    // Перенаправляем с корня на дашборд
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Разрешаем доступ к аутентифицированным страницам
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Всегда разрешаем выполнение middleware
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
