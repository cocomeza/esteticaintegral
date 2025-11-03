import type { NextApiRequest, NextApiResponse } from 'next'
import { getAvailableTimesForAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // La autenticación se maneja en el middleware

  try {
    const { specialistId, date, serviceId } = req.query

    if (!specialistId || !date) {
      return res.status(400).json({ error: 'specialistId y date son requeridos' })
    }

    const availableTimes = await getAvailableTimesForAdmin(
      specialistId as string,
      date as string,
      serviceId as string | undefined
    )

    return res.status(200).json({
      availableTimes
    })
  } catch (error) {
    console.error('Error fetching available times:', error)
    return res.status(500).json({ error: 'Error al obtener horarios disponibles' })
  }
}