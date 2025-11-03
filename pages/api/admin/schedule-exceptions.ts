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
    console.error('Error en /api/admin/schedule-exceptions:', error)
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
}

// GET - Obtener excepciones
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { specialistId } = req.query

  if (!specialistId) {
    return res.status(400).json({ error: 'Se requiere specialistId' })
  }

  const { data: exceptions, error } = await supabase
    .from('schedule_exceptions')
    .select('*')
    .eq('specialist_id', specialistId)
    .order('exception_date', { ascending: true })

  if (error) {
    console.error('Error fetching exceptions:', error)
    return res.status(500).json({ error: 'Error al obtener excepciones' })
  }

  return res.status(200).json({ exceptions })
}

// POST - Crear excepción
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { specialistId, exceptionDate, startTime, endTime, lunchStart, lunchEnd, reason } = req.body

  if (!specialistId || !exceptionDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' })
  }

  // Verificar que no exista ya una excepción para esa fecha
  const { data: existing } = await supabase
    .from('schedule_exceptions')
    .select('id')
    .eq('specialist_id', specialistId)
    .eq('exception_date', exceptionDate)
    .single()

  if (existing) {
    return res.status(400).json({ error: 'Ya existe una excepción para esta fecha' })
  }

  const { data: exception, error } = await supabase
    .from('schedule_exceptions')
    .insert({
      specialist_id: specialistId,
      exception_date: exceptionDate,
      start_time: startTime,
      end_time: endTime,
      lunch_start: lunchStart || null,
      lunch_end: lunchEnd || null,
      reason: reason || null,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating exception:', error)
    return res.status(500).json({ error: 'Error al crear excepción' })
  }

  return res.status(201).json({ exception })
}

// PUT - Actualizar excepción
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { exceptionId, startTime, endTime, lunchStart, lunchEnd, reason, isActive } = req.body

  if (!exceptionId) {
    return res.status(400).json({ error: 'Se requiere exceptionId' })
  }

  const updateData: any = {}
  if (startTime !== undefined) updateData.start_time = startTime
  if (endTime !== undefined) updateData.end_time = endTime
  if (lunchStart !== undefined) updateData.lunch_start = lunchStart
  if (lunchEnd !== undefined) updateData.lunch_end = lunchEnd
  if (reason !== undefined) updateData.reason = reason
  if (isActive !== undefined) updateData.is_active = isActive

  const { data: exception, error } = await supabase
    .from('schedule_exceptions')
    .update(updateData)
    .eq('id', exceptionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating exception:', error)
    return res.status(500).json({ error: 'Error al actualizar excepción' })
  }

  return res.status(200).json({ exception })
}

// DELETE - Eliminar excepción
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { exceptionId } = req.body

  if (!exceptionId) {
    return res.status(400).json({ error: 'Se requiere exceptionId' })
  }

  const { error } = await supabase
    .from('schedule_exceptions')
    .delete()
    .eq('id', exceptionId)

  if (error) {
    console.error('Error deleting exception:', error)
    return res.status(500).json({ error: 'Error al eliminar excepción' })
  }

  return res.status(200).json({ message: 'Excepción eliminada correctamente' })
}

