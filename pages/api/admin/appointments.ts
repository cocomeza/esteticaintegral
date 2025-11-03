import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  getAppointmentsForAdmin, 
  createAppointmentForAdmin,
  updateAppointmentForAdmin,
  deleteAppointmentForAdmin,
  updateAppointmentStatus
} from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // La autenticación se maneja en el middleware

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res)
      case 'POST':
        return handlePost(req, res)
      case 'PUT':
        return handlePut(req, res)
      case 'PATCH':
        return handlePatch(req, res)
      case 'DELETE':
        return handleDelete(req, res)
      default:
        return res.status(405).json({ error: 'Método no permitido' })
    }
  } catch (error: any) {
    console.error('Error en /api/admin/appointments:', error)
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
}

// GET - Obtener citas
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = '1',
      search = '',
      status = 'all',
      specialistId = '',
      startDate = '',
      endDate = '',
      limit = '10'
    } = req.query

    const appointments = await getAppointmentsForAdmin({
      search: search as string,
      status: status as string,
      specialistId: specialistId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(200).json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return res.status(500).json({ error: 'Error al obtener citas' })
  }
}

// POST - Crear nueva cita
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { specialistId, serviceId, patientId, appointmentDate, appointmentTime, notes } = req.body

    if (!specialistId || !serviceId || !patientId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }

    const appointment = await createAppointmentForAdmin({
      specialistId,
      serviceId,
      patientId,
      appointmentDate,
      appointmentTime,
      notes
    })

    return res.status(201).json({ appointment })
  } catch (error: any) {
    console.error('Error creating appointment:', error)
    return res.status(500).json({ error: error.message || 'Error al crear la cita' })
  }
}

// PUT - Actualizar cita completa
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { appointmentId, specialistId, serviceId, patientId, appointmentDate, appointmentTime, notes, status } = req.body

    if (!appointmentId) {
      return res.status(400).json({ error: 'Se requiere appointmentId' })
    }

    // Normalizar fecha si viene del frontend
    let normalizedDate = appointmentDate
    if (appointmentDate && typeof appointmentDate === 'string') {
      // Asegurar formato YYYY-MM-DD
      const dateMatch = appointmentDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        normalizedDate = appointmentDate
      } else {
        // Intentar convertir si viene en otro formato
        const date = new Date(appointmentDate)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          normalizedDate = `${year}-${month}-${day}`
        }
      }
    }

    console.log('📝 Actualizando cita:', {
      appointmentId,
      appointmentDate: normalizedDate,
      appointmentTime,
      specialistId,
      serviceId
    })

    const appointment = await updateAppointmentForAdmin(appointmentId, {
      specialistId,
      serviceId,
      patientId,
      appointmentDate: normalizedDate,
      appointmentTime,
      notes,
      status
    })

    if (!appointment) {
      return res.status(404).json({ error: 'No se pudo obtener la cita actualizada' })
    }

    return res.status(200).json({ appointment })
  } catch (error: any) {
    console.error('❌ Error updating appointment:', error)
    console.error('Error stack:', error.stack)
    const errorMessage = error.message || 'Error al actualizar la cita'
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

// PATCH - Actualizar solo el estado de la cita
async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { appointmentId, status } = req.body

    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Se requiere appointmentId y status' })
    }

    const appointment = await updateAppointmentStatus(appointmentId, status)

    return res.status(200).json({ appointment })
  } catch (error: any) {
    console.error('Error updating appointment status:', error)
    return res.status(500).json({ error: error.message || 'Error al actualizar el estado' })
  }
}

// DELETE - Eliminar cita
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { appointmentId } = req.body

    if (!appointmentId) {
      return res.status(400).json({ error: 'Se requiere appointmentId' })
    }

    await deleteAppointmentForAdmin(appointmentId)

    return res.status(200).json({ message: 'Cita eliminada correctamente' })
  } catch (error: any) {
    console.error('Error deleting appointment:', error)
    return res.status(500).json({ error: error.message || 'Error al eliminar la cita' })
  }
}