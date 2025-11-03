import type { NextApiRequest, NextApiResponse } from 'next'
import { getAppointmentStats, getDoctorsForAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // La autenticación se maneja en el middleware

  try {
    const [stats, specialists] = await Promise.all([
      getAppointmentStats(),
      getDoctorsForAdmin()
    ])

    return res.status(200).json({
      stats,
      specialists
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}