import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { serialize } from 'cookie'

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET debe estar configurado en producción')
    }
    return 'dev-secret-key-change-in-production'
  }
  return secret
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hospital.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export interface AdminUser {
  email: string
  role: 'admin'
  iat: number
  exp: number
}

export async function validateAdminCredentials(email: string, password: string): Promise<boolean> {
  if (email !== ADMIN_EMAIL) return false
  
  // En desarrollo, comparación directa; en producción, usar hash
  if (process.env.NODE_ENV === 'production' && process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH)
  }
  
  return password === ADMIN_PASSWORD
}

// 🔄 MEJORA #8: Tokens con expiración más corta y refresh tokens
export async function generateAdminToken(email: string, expiresIn: string = '1h'): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret())
  
  return await new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function generateRefreshToken(email: string): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret())
  
  return await new SignJWT({ email, role: 'admin', type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Refresh token válido por 7 días
    .sign(secret)
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecret())
    const { payload } = await jwtVerify(refreshToken, secret)
    
    // Verificar que sea un refresh token
    if (payload.type !== 'refresh') {
      return null
    }
    
    // Generar nuevo access token
    return await generateAdminToken(payload.email as string, '1h')
  } catch {
    return null
  }
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecret())
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AdminUser
  } catch {
    return null
  }
}

// 🔄 MEJORA #8: Sesión con access token (1h) y refresh token (7d)
export async function setAdminSession(email: string): Promise<string[]> {
  const accessToken = await generateAdminToken(email, '1h')
  const refreshToken = await generateRefreshToken(email)
  
  const accessCookie = serialize('admin-session', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hora
    path: '/'
  })
  
  const refreshCookie = serialize('admin-refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 días
    path: '/'
  })
  
  return [accessCookie, refreshCookie]
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-session')?.value
  
  if (!token) return null
  return await verifyAdminToken(token)
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })
}