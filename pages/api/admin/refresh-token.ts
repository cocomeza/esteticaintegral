/**
 * API Endpoint: Refresh Token
 * 🔄 MEJORA #8: Permite renovar el access token usando el refresh token
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { refreshAccessToken } from '../../../src/lib/admin-auth'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    // Obtener refresh token de las cookies
    const refreshToken = req.cookies['admin-refresh']

    if (!refreshToken) {
      return res.status(401).json({ error: 'No se encontró refresh token' })
    }

    // Intentar refrescar el access token
    const newAccessToken = await refreshAccessToken(refreshToken)

    if (!newAccessToken) {
      // Refresh token inválido o expirado
      return res.status(401).json({ error: 'Refresh token inválido o expirado' })
    }

    // Crear nueva cookie de sesión
    const accessCookie = serialize('admin-session', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hora
      path: '/'
    })

    res.setHeader('Set-Cookie', accessCookie)
    
    return res.status(200).json({ 
      success: true,
      message: 'Token refrescado exitosamente' 
    })

  } catch (error: any) {
    console.error('❌ Error refrescando token:', error)
    return res.status(500).json({ error: 'Error al refrescar token' })
  }
}

