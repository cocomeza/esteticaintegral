import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // La autenticación se maneja en el middleware

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res)
      case 'POST':
        return handlePost(req, res)
      case 'PUT':
        return handlePut(req, res)
      case 'DELETE':
        return handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Método no permitido' })
    }
  } catch (error: any) {
    console.error('Error en /api/admin/schedules:', error)
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
}

// GET - Obtener horarios
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { specialistId } = req.query

  if (!specialistId) {
    return res.status(400).json({ error: 'Se requiere specialistId' })
  }

  const { data: schedules, error } = await supabase
    .from('work_schedules')
    .select('*')
    .eq('specialist_id', specialistId)
    .order('day_of_week')

  if (error) {
    console.error('Error fetching schedules:', error)
    return res.status(500).json({ error: 'Error al obtener horarios' })
  }

  return res.status(200).json({ schedules })
}

// POST - Crear horario
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { specialistId, dayOfWeek, startTime, endTime, lunchStart, lunchEnd, allowedServices } = req.body

  if (!specialistId || dayOfWeek === undefined || !startTime || !endTime) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' })
  }

  // Verificar que no exista ya un horario para ese día
  const { data: existing } = await supabase
    .from('work_schedules')
    .select('id')
    .eq('specialist_id', specialistId)
    .eq('day_of_week', dayOfWeek)
    .single()

  if (existing) {
    return res.status(400).json({ error: 'Ya existe un horario para este día' })
  }

  const { data: schedule, error } = await supabase
    .from('work_schedules')
    .insert({
      specialist_id: specialistId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      lunch_start: lunchStart || null,
      lunch_end: lunchEnd || null,
      allowed_services: allowedServices || null,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating schedule:', error)
    return res.status(500).json({ error: 'Error al crear horario' })
  }

  return res.status(201).json({ schedule })
}

// PUT - Actualizar horario
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { scheduleId, startTime, endTime, lunchStart, lunchEnd, allowedServices, isActive } = req.body

  if (!scheduleId) {
    return res.status(400).json({ error: 'Se requiere scheduleId' })
  }

  const updateData: any = {}
  if (startTime !== undefined) updateData.start_time = startTime
  if (endTime !== undefined) updateData.end_time = endTime
  if (lunchStart !== undefined) updateData.lunch_start = lunchStart
  if (lunchEnd !== undefined) updateData.lunch_end = lunchEnd
  if (allowedServices !== undefined) updateData.allowed_services = allowedServices
  if (isActive !== undefined) updateData.is_active = isActive

  const { data: schedule, error } = await supabase
    .from('work_schedules')
    .update(updateData)
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating schedule:', error)
    return res.status(500).json({ error: 'Error al actualizar horario' })
  }

  return res.status(200).json({ schedule })
}

// DELETE - Eliminar horario
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { scheduleId } = req.body

  if (!scheduleId) {
    return res.status(400).json({ error: 'Se requiere scheduleId' })
  }

  const { error } = await supabase
    .from('work_schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) {
    console.error('Error deleting schedule:', error)
    return res.status(500).json({ error: 'Error al eliminar horario' })
  }

  return res.status(200).json({ message: 'Horario eliminado correctamente' })
}

