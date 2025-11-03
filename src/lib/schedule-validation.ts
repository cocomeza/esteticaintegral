import { supabaseAdmin } from './supabase-admin'

export interface ScheduleConflict {
  appointmentId: string
  appointmentDate: string
  appointmentTime: string
  patientName: string
  patientEmail: string
  serviceName: string
  conflictType: 'outside_hours' | 'lunch_conflict' | 'service_not_allowed'
}

export interface ScheduleChangeValidation {
  hasConflicts: boolean
  conflicts: ScheduleConflict[]
  affectedAppointmentsCount: number
  canProceed: boolean
  recommendation: string
}

/**
 * Valida si un cambio de horario afecta turnos existentes
 */
export async function validateScheduleChange(
  specialistId: string,
  dayOfWeek: number,
  newStartTime: string,
  newEndTime: string,
  newLunchStart?: string,
  newLunchEnd?: string,
  newAllowedServices?: string[]
): Promise<ScheduleChangeValidation> {
  
  // Obtener turnos existentes para ese día de la semana
  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      duration,
      status,
      patient:patients(
        name,
        email
      ),
      service:aesthetic_services(
        name
      )
    `)
    .eq('specialist_id', specialistId)
    .eq('status', 'scheduled')
    .gte('appointment_date', new Date().toISOString().split('T')[0]) // Solo futuros

  if (!appointments || appointments.length === 0) {
    return {
      hasConflicts: false,
      conflicts: [],
      affectedAppointmentsCount: 0,
      canProceed: true,
      recommendation: 'No hay turnos futuros que puedan verse afectados'
    }
  }

  // Filtrar solo los turnos del día de la semana específico
  const dayAppointments = appointments.filter((apt: any) => {
    const appointmentDate = new Date(apt.appointment_date)
    return appointmentDate.getDay() === dayOfWeek
  })

  const conflicts: ScheduleConflict[] = []

  // Convertir horarios a minutos para comparación
  const [newStartHour, newStartMin] = newStartTime.split(':').map(Number)
  const [newEndHour, newEndMin] = newEndTime.split(':').map(Number)
  const newStartMinutes = newStartHour * 60 + newStartMin
  const newEndMinutes = newEndHour * 60 + newEndMin

  // Verificar cada turno
  for (const appointment of dayAppointments) {
    const [aptHour, aptMin] = appointment.appointment_time.split(':').map(Number)
    const aptStartMinutes = aptHour * 60 + aptMin
    const aptEndMinutes = aptStartMinutes + (appointment.duration || 30)

    // 1. Verificar si el turno queda fuera del nuevo horario
    if (aptStartMinutes < newStartMinutes || aptEndMinutes > newEndMinutes) {
      conflicts.push({
        appointmentId: appointment.id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        patientName: appointment.patient?.name || 'Desconocido',
        patientEmail: appointment.patient?.email || '',
        serviceName: appointment.service?.name || 'Desconocido',
        conflictType: 'outside_hours'
      })
    }

    // 2. Verificar conflicto con horario de almuerzo
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
          patientName: appointment.patient?.name || 'Desconocido',
          patientEmail: appointment.patient?.email || '',
          serviceName: appointment.service?.name || 'Desconocido',
          conflictType: 'lunch_conflict'
        })
      }
    }

    // 3. Verificar si el servicio sigue siendo permitido
    if (newAllowedServices && newAllowedServices.length > 0) {
      const serviceId = appointment.service_id
      if (!newAllowedServices.includes(serviceId)) {
        conflicts.push({
          appointmentId: appointment.id,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          patientName: appointment.patient?.name || 'Desconocido',
          patientEmail: appointment.patient?.email || '',
          serviceName: appointment.service?.name || 'Desconocido',
          conflictType: 'service_not_allowed'
        })
      }
    }
  }

  const hasConflicts = conflicts.length > 0
  const affectedAppointmentsCount = conflicts.length

  let recommendation = ''
  if (hasConflicts) {
    recommendation = `⚠️ Este cambio afectará ${affectedAppointmentsCount} turno(s) existente(s). `
    recommendation += 'Debe contactar a los pacientes afectados antes de aplicar el cambio.'
  } else {
    recommendation = '✅ El cambio de horario no afecta ningún turno existente.'
  }

  return {
    hasConflicts,
    conflicts,
    affectedAppointmentsCount,
    canProceed: !hasConflicts,
    recommendation
  }
}

/**
 * Obtiene información detallada de turnos afectados por un cambio de horario
 */
export async function getAffectedAppointments(
  specialistId: string,
  dayOfWeek: number
): Promise<ScheduleConflict[]> {
  const validation = await validateScheduleChange(
    specialistId,
    dayOfWeek,
    '00:00', // Horario mínimo para detectar todos los conflictos
    '23:59',
    '12:00', // Almuerzo que cubre todo el día
    '13:00',
    [] // Sin servicios permitidos para detectar conflictos de servicios
  )

  return validation.conflicts
}

/**
 * Genera mensaje de notificación para pacientes afectados
 */
export function generateNotificationMessage(conflicts: ScheduleConflict[]): string {
  if (conflicts.length === 0) return ''

  const conflictTypes = {
    outside_hours: 'fuera del nuevo horario de atención',
    lunch_conflict: 'en conflicto con el horario de almuerzo',
    service_not_allowed: 'con un servicio que ya no se ofrece en este día'
  }

  let message = `Estimado/a paciente,\n\n`
  message += `Le informamos que su turno del ${conflicts[0].appointmentDate} a las ${conflicts[0].appointmentTime} `
  message += `para ${conflicts[0].serviceName} se encuentra ${conflictTypes[conflicts[0].conflictType]}.\n\n`
  message += `Por favor, contáctenos para reprogramar su cita.\n\n`
  message += `Saludos cordiales,\n`
  message += `Estética Integral`

  return message
}
