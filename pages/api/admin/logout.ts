import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Limpiar cookie con configuración correcta
  const clearCookie = serialize('admin-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
    expires: new Date(0)
  })

  res.setHeader('Set-Cookie', clearCookie)

  return res.status(200).json({ 
    success: true, 
    message: 'Logout exitoso' 
  })
}