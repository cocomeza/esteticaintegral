import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { getJwtSecret } from './src/lib/admin-auth'

export async function middleware(request: NextRequest) {
  // Proteger rutas /admin y /api/admin (excepto /admin/login)
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin')
  
  if (isAdminPage || isAdminApi) {
    // Permitir acceso a la página de login y API de login
    if (request.nextUrl.pathname === '/admin/login' || 
        request.nextUrl.pathname === '/api/admin/login') {
      return NextResponse.next()
    }

    // Verificar token de admin
    const token = request.cookies.get('admin-session')?.value

    if (!token) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const secret = getJwtSecret()
      await jwtVerify(token, new TextEncoder().encode(secret))
      return NextResponse.next()
    } catch {
      // Token inválido, limpiar cookie y redirigir
      const response = isAdminApi 
        ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        : NextResponse.redirect(new URL('/admin/login', request.url))
      
      response.cookies.set('admin-session', '', { 
        maxAge: 0,
        path: '/',
        httpOnly: true,
        sameSite: 'strict'
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}