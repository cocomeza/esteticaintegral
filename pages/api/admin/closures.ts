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
    console.error('Error en /api/admin/closures:', error)
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
}

// GET - Obtener cierres
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { specialistId, active } = req.query

  let query = supabase
    .from('closures')
    .select('*')
    .order('start_date', { ascending: false })

  if (specialistId) {
    query = query.eq('specialist_id', specialistId)
  }

  if (active === 'true') {
    query = query.eq('is_active', true)
  }

  const { data: closures, error } = await query

  if (error) {
    console.error('Error fetching closures:', error)
    return res.status(500).json({ error: 'Error al obtener cierres' })
  }

  return res.status(200).json({ closures })
}

// POST - Crear cierre
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { specialistId, closureType, startDate, endDate, reason } = req.body

  if (!specialistId || !closureType || !startDate || !endDate) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' })
  }

  // Validar que la fecha de fin sea posterior o igual a la de inicio
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'La fecha de fin debe ser posterior o igual a la de inicio' })
  }

  // Verificar si hay turnos programados en ese periodo
  const { data: existingAppointments } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, patient:patients(name)')
    .eq('specialist_id', specialistId)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .eq('status', 'scheduled')

  if (existingAppointments && existingAppointments.length > 0) {
    return res.status(400).json({ 
      error: `Hay ${existingAppointments.length} turno(s) programado(s) en este periodo. Por favor, reprograma o cancela los turnos antes de crear el cierre.`,
      appointments: existingAppointments
    })
  }

  const { data: closure, error } = await supabase
    .from('closures')
    .insert({
      specialist_id: specialistId,
      closure_type: closureType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating closure:', error)
    return res.status(500).json({ error: 'Error al crear cierre' })
  }

  return res.status(201).json({ closure })
}

// PUT - Actualizar cierre
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { closureId, startDate, endDate, reason, isActive } = req.body

  if (!closureId) {
    return res.status(400).json({ error: 'Se requiere closureId' })
  }

  const updateData: any = {}
  if (startDate !== undefined) updateData.start_date = startDate
  if (endDate !== undefined) updateData.end_date = endDate
  if (reason !== undefined) updateData.reason = reason
  if (isActive !== undefined) updateData.is_active = isActive

  // Validar fechas si se actualizan
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'La fecha de fin debe ser posterior o igual a la de inicio' })
  }

  const { data: closure, error } = await supabase
    .from('closures')
    .update(updateData)
    .eq('id', closureId)
    .select()
    .single()

  if (error) {
    console.error('Error updating closure:', error)
    return res.status(500).json({ error: 'Error al actualizar cierre' })
  }

  return res.status(200).json({ closure })
}

// DELETE - Eliminar cierre
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { closureId } = req.body

  if (!closureId) {
    return res.status(400).json({ error: 'Se requiere closureId' })
  }

  const { error } = await supabase
    .from('closures')
    .delete()
    .eq('id', closureId)

  if (error) {
    console.error('Error deleting closure:', error)
    return res.status(500).json({ error: 'Error al eliminar cierre' })
  }

  return res.status(200).json({ message: 'Cierre eliminado correctamente' })
}

