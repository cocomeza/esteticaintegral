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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const { specialistId, dayOfWeek, newStartTime, newEndTime, newLunchStart, newLunchEnd } = req.body

    if (!specialistId || dayOfWeek === undefined || !newStartTime || !newEndTime) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos'
      })
    }

    // Obtener turnos futuros para ese día de la semana
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        duration,
        status,
        patients!inner(name, email),
        aesthetic_services!inner(name)
      `)
      .eq('specialist_id', specialistId)
      .eq('status', 'scheduled')
      .gte('appointment_date', new Date().toISOString().split('T')[0]) // Solo futuros

    if (aptError) {
      throw new Error(`Error obteniendo citas: ${aptError.message}`)
    }

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        validation: {
          hasConflicts: false,
          conflicts: [],
          affectedAppointmentsCount: 0,
          canProceed: true,
          recommendation: '✅ No hay turnos futuros que puedan verse afectados'
        }
      })
    }

    // Filtrar solo los turnos del día de la semana específico
    const dayAppointments = appointments.filter((apt: any) => {
      const appointmentDate = new Date(apt.appointment_date)
      return appointmentDate.getDay() === dayOfWeek
    })

    if (dayAppointments.length === 0) {
      return res.status(200).json({
        validation: {
          hasConflicts: false,
          conflicts: [],
          affectedAppointmentsCount: 0,
          canProceed: true,
          recommendation: '✅ No hay turnos futuros para este día de la semana'
        }
      })
    }

    // Convertir horarios a minutos para comparación
    const [newStartHour, newStartMin] = newStartTime.split(':').map(Number)
    const [newEndHour, newEndMin] = newEndTime.split(':').map(Number)
    const newStartMinutes = newStartHour * 60 + newStartMin
    const newEndMinutes = newEndHour * 60 + newEndMin

    const conflicts: any[] = []

    // Verificar cada turno
    for (const appointment of dayAppointments) {
      const [aptHour, aptMin] = appointment.appointment_time.split(':').map(Number)
      const aptStartMinutes = aptHour * 60 + aptMin
      const aptEndMinutes = aptStartMinutes + (appointment.duration || 45)

      // Verificar si el turno queda fuera del nuevo horario
      if (aptStartMinutes < newStartMinutes || aptEndMinutes > newEndMinutes) {
        conflicts.push({
          appointmentId: appointment.id,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          patientName: appointment.patients?.name || 'Desconocido',
          patientEmail: appointment.patients?.email || '',
          serviceName: appointment.aesthetic_services?.name || 'Desconocido',
          conflictType: 'outside_hours'
        })
      }

      // Verificar conflicto con horario de almuerzo
      if (newLunchStart && newLunchEnd) {
        const [lunchStartHour, lunchStartMin] = newLunchStart.split(':').map(Number)
        const [lunchEndHour, lunchEndMin] = newLunchEnd.split(':').map(Number)
        const lunchStartMinutes = lunchStartHour * 60 + lunchStartMin
        const lunchEndMinutes = lunchEndHour * 60 + lunchEndMin

        if (
          (aptStartMinutes >= lunchStartMinutes && aptStartMinutes < lunchEndMinutes) ||
          (aptEndMinutes > lunchStartMinutes && aptEndMinutes <= lunchEndMinutes) ||
          (aptStartMinutes <= lunchStartMinutes && aptEndMinutes >= lunchEndMinutes)
        ) {
          conflicts.push({
            appointmentId: appointment.id,
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.appointment_time,
            patientName: appointment.patients?.name || 'Desconocido',
            patientEmail: appointment.patients?.email || '',
            serviceName: appointment.aesthetic_services?.name || 'Desconocido',
            conflictType: 'lunch_conflict'
          })
        }
      }
    }

    const hasConflicts = conflicts.length > 0

    return res.status(200).json({
      validation: {
        hasConflicts,
        conflicts,
        affectedAppointmentsCount: conflicts.length,
        canProceed: !hasConflicts,
        recommendation: hasConflicts
          ? `⚠️ Este cambio afectará ${conflicts.length} turno(s) futuro(s). Debe contactar a los pacientes afectados antes de aplicar el cambio.`
          : '✅ El cambio de horario no afecta ningún turno futuro.'
      }
    })

  } catch (error) {
    console.error('Error validating schedule:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}

