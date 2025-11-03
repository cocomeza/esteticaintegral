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
      newAllowedServices,
      forceApply = false
    } = req.body

    // Validar parámetros requeridos
    if (!specialistId || dayOfWeek === undefined || !newStartTime || !newEndTime) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: specialistId, dayOfWeek, newStartTime, newEndTime'
      })
    }

    // Aplicar el cambio de horario en la base de datos
    const updateData: any = {
      start_time: newStartTime,
      end_time: newEndTime,
      updated_at: new Date().toISOString()
    }

    if (newLunchStart && newLunchEnd) {
      updateData.lunch_start = newLunchStart
      updateData.lunch_end = newLunchEnd
    } else {
      updateData.lunch_start = null
      updateData.lunch_end = null
    }

    if (newAllowedServices !== undefined) {
      updateData.allowed_services = newAllowedServices
    }

    const { data: updatedSchedule, error: updateError } = await supabaseAdmin
      .from('work_schedules')
      .update(updateData)
      .eq('specialist_id', specialistId)
      .eq('day_of_week', dayOfWeek)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Error actualizando horario: ${updateError.message}`)
    }

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Cambio de horario aplicado exitosamente',
      schedule: updatedSchedule
    })

  } catch (error) {
    console.error('Error applying schedule change:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}