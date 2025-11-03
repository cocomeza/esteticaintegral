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
    console.error('Error en /api/admin/announcements:', error)
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
}

// GET - Obtener anuncios
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { active } = req.query

  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (active === 'true') {
    query = query.eq('is_active', true)
  }

  const { data: announcements, error } = await query

  if (error) {
    console.error('Error fetching announcements:', error)
    return res.status(500).json({ error: 'Error al obtener anuncios' })
  }

  return res.status(200).json({ announcements })
}

// POST - Crear anuncio
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { title, message, type, startDate, endDate, showOnHome, blockBookings } = req.body

  if (!title || !message || !type) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' })
  }

  // Validar tipo
  const validTypes = ['info', 'warning', 'alert', 'success', 'vacation']
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Tipo de anuncio inválido' })
  }

  // Validar fechas si se proporcionan
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' })
  }

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title,
      message,
      type,
      start_date: startDate || null,
      end_date: endDate || null,
      show_on_home: showOnHome !== undefined ? showOnHome : true,
      block_bookings: blockBookings || false,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating announcement:', error)
    return res.status(500).json({ error: 'Error al crear anuncio' })
  }

  return res.status(201).json({ announcement })
}

// PUT - Actualizar anuncio
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { announcementId, title, message, startDate, endDate, showOnHome, blockBookings, isActive } = req.body

  if (!announcementId) {
    return res.status(400).json({ error: 'Se requiere announcementId' })
  }

  const updateData: any = {}
  if (title !== undefined) updateData.title = title
  if (message !== undefined) updateData.message = message
  if (startDate !== undefined) updateData.start_date = startDate
  if (endDate !== undefined) updateData.end_date = endDate
  if (showOnHome !== undefined) updateData.show_on_home = showOnHome
  if (blockBookings !== undefined) updateData.block_bookings = blockBookings
  if (isActive !== undefined) updateData.is_active = isActive
  updateData.updated_at = new Date().toISOString()

  // Validar fechas si se actualizan
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' })
  }

  const { data: announcement, error } = await supabase
    .from('announcements')
    .update(updateData)
    .eq('id', announcementId)
    .select()
    .single()

  if (error) {
    console.error('Error updating announcement:', error)
    return res.status(500).json({ error: 'Error al actualizar anuncio' })
  }

  return res.status(200).json({ announcement })
}

// DELETE - Eliminar anuncio
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { announcementId } = req.body

  if (!announcementId) {
    return res.status(400).json({ error: 'Se requiere announcementId' })
  }

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (error) {
    console.error('Error deleting announcement:', error)
    return res.status(500).json({ error: 'Error al eliminar anuncio' })
  }

  return res.status(200).json({ message: 'Anuncio eliminado correctamente' })
}

