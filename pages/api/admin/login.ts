import type { NextApiRequest, NextApiResponse } from 'next'
import { setAdminSession } from '../../../src/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'
const bcrypt = require('bcryptjs')

// Validar que las variables de entorno existan
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔵 Login API called:', req.method, req.url)
  
  // Rate limiting simplificado para Vercel Edge Runtime
  if (req.method === 'POST') {
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown'
    console.log('🔍 Client IP:', clientIP)
  }
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return res.status(405).json({ error: 'Método no permitido', method: req.method })
  }

  try {
    const { email, password } = req.body
    console.log('📧 Login attempt for:', email)
    console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET)
    console.log('🔑 JWT_SECRET value:', process.env.JWT_SECRET ? 'SET' : 'NOT SET')

    if (!email || !password) {
      console.log('❌ Missing credentials')
      return res.status(400).json({ error: 'Email y contraseña son requeridos' })
    }

    // Buscar admin en la base de datos
    console.log('🔍 Querying database for user...')
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return res.status(401).json({ error: 'Credenciales inválidas', details: error.message })
    }

    if (!admin) {
      console.log('❌ User not found')
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    console.log('✅ User found, verifying password...')
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password')
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    console.log('✅ Password valid, creating session...')
    
    // 🔄 MEJORA #8: Crear sesión con access token y refresh token
    // Para Pages Router API routes, necesitamos crear las cookies manualmente
    try {
      const { generateAdminToken, generateRefreshToken } = await import('../../../src/lib/admin-auth')
      
      const accessToken = await generateAdminToken(email, '1h')
      const refreshToken = await generateRefreshToken(email)
      
      // Configurar cookies para Pages Router
      const isProduction = process.env.NODE_ENV === 'production'
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict' as const,
        path: '/'
      }
      
      // Set access token cookie (1 hora)
      res.setHeader('Set-Cookie', [
        `admin-session=${accessToken}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=${60 * 60}`,
        `admin-refresh=${refreshToken}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
      ])
      
      console.log('✅ Login successful')
      res.status(200).json({ success: true, user: { email: admin.email, role: admin.role } })
    } catch (sessionError: any) {
      console.error('❌ Error creating session:', sessionError)
      res.status(500).json({ error: 'Error al crear sesión', details: sessionError?.message || 'Unknown error' })
    }
  } catch (error: any) {
    console.error('❌ Error in admin login:', error)
    res.status(500).json({ error: 'Error interno del servidor', details: error.message })
  }
}
