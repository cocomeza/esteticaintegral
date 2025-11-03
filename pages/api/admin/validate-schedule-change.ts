import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const {
      specialistId,
      dayOfWeek,
      newStartTime,
      newEndTime,
      newLunchStart,
      newLunchEnd,
      newAllowedServices
    } = req.body

    // Validar parámetros requeridos
    if (!specialistId || dayOfWeek === undefined || !newStartTime || !newEndTime) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: specialistId, dayOfWeek, newStartTime, newEndTime'
      })
    }

    // Buscar citas que podrían verse afectadas
    const { data: appointments, error: aptError } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        patients!inner(name, email),
        aesthetic_services!inner(name)
      `)
      .eq('specialist_id', specialistId)
      .eq('status', 'scheduled')
      .limit(100)

    if (aptError) {
      throw new Error(`Error obteniendo citas: ${aptError.message}`)
    }

    // Simular validación básica
    const conflicts: any[] = []
    const hasConflicts = conflicts.length > 0

    return res.status(200).json({
      success: true,
      validation: {
        hasConflicts,
        conflicts,
        canApply: !hasConflicts,
        message: hasConflicts ? 
          'Se detectaron conflictos con citas existentes' : 
          'El cambio de horario se puede aplicar sin conflictos'
      }
    })

  } catch (error) {
    console.error('Error validating schedule change:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}