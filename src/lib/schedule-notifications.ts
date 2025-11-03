import { supabaseAdmin } from './supabase-admin'
import { sendAppointmentConfirmation } from './email'

export interface ScheduleChangeNotification {
  appointmentId: string
  patientEmail: string
  patientName: string
  originalDate: string
  originalTime: string
  serviceName: string
  conflictType: string
  newSchedule?: {
    startTime: string
    endTime: string
    lunchStart?: string
    lunchEnd?: string
  }
}

/**
 * Envía notificaciones a pacientes afectados por cambios de horario
 */
export async function notifyAffectedPatients(
  conflicts: ScheduleChangeNotification[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  
  let successCount = 0
  let failedCount = 0
  const errors: string[] = []

  console.log(`📧 Enviando notificaciones a ${conflicts.length} pacientes afectados...`)

  for (const conflict of conflicts) {
    try {
      const emailContent = generateScheduleChangeEmail(conflict)
      
      // Enviar email de notificación
      await sendAppointmentConfirmation({
        id: conflict.appointmentId,
        patient: {
          name: conflict.patientName,
          email: conflict.patientEmail
        },
        specialist: {
          name: 'Lorena Esquivel',
          title: 'Esteticista Profesional'
        },
        service: {
          name: conflict.serviceName,
          duration: 45
        },
        appointment_date: conflict.originalDate,
        appointment_time: conflict.originalTime
      })

      // Registrar la notificación en la base de datos
      await supabaseAdmin
        .from('system_settings')
        .upsert([{
          key: `schedule_notification_${conflict.appointmentId}`,
          value: JSON.stringify({
            sentAt: new Date().toISOString(),
            conflictType: conflict.conflictType,
            patientEmail: conflict.patientEmail
          }),
          description: 'Notificación de cambio de horario enviada'
        }])

      successCount++
      console.log(`✅ Notificación enviada a ${conflict.patientEmail}`)

    } catch (error) {
      failedCount++
      const errorMessage = `Error enviando notificación a ${conflict.patientEmail}: ${error instanceof Error ? error.message : 'Error desconocido'}`
      errors.push(errorMessage)
      console.error(`❌ ${errorMessage}`)
    }
  }

  return { success: successCount, failed: failedCount, errors }
}

/**
 * Genera el contenido del email de notificación
 */
function generateScheduleChangeEmail(conflict: ScheduleChangeNotification): string {
  const conflictMessages = {
    outside_hours: 'fuera del nuevo horario de atención',
    lunch_conflict: 'en conflicto con el horario de almuerzo',
    service_not_allowed: 'con un servicio que ya no se ofrece en este día'
  }

  let message = `Estimado/a ${conflict.patientName},\n\n`
  message += `Le informamos que su turno programado para el ${conflict.originalDate} a las ${conflict.originalTime} `
  message += `para ${conflict.serviceName} se encuentra ${conflictMessages[conflict.conflictType as keyof typeof conflictMessages]}.\n\n`

  if (conflict.newSchedule) {
    message += `NUEVO HORARIO DE ATENCIÓN:\n`
    message += `• Horario: ${conflict.newSchedule.startTime} - ${conflict.newSchedule.endTime}\n`
    if (conflict.newSchedule.lunchStart && conflict.newSchedule.lunchEnd) {
      message += `• Almuerzo: ${conflict.newSchedule.lunchStart} - ${conflict.newSchedule.lunchEnd}\n`
    }
    message += `\n`
  }

  message += `Es necesario reprogramar su cita. Por favor, contáctenos lo antes posible para coordinar un nuevo horario.\n\n`
  message += `OPCIONES DE CONTACTO:\n`
  message += `• Teléfono: +54 11 1234-5678\n`
  message += `• Email: lorena@esteticaintegral.com.ar\n`
  message += `• WhatsApp: +54 11 1234-5678\n\n`
  message += `Disculpe las molestias ocasionadas.\n\n`
  message += `Saludos cordiales,\n`
  message += `Lorena Esquivel\n`
  message += `Estética Integral`

  return message
}

/**
 * Obtiene el historial de notificaciones enviadas
 */
export async function getNotificationHistory(): Promise<any[]> {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .like('key', 'schedule_notification_%')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo historial de notificaciones:', error)
    return []
  }

  return data || []
}

/**
 * Marca una notificación como leída por el paciente
 */
export async function markNotificationAsRead(appointmentId: string): Promise<void> {
  await supabaseAdmin
    .from('system_settings')
    .upsert([{
      key: `schedule_notification_read_${appointmentId}`,
      value: JSON.stringify({
        readAt: new Date().toISOString()
      }),
      description: 'Notificación de cambio de horario leída por el paciente'
    }])
}

/**
 * Verifica si un paciente ya fue notificado sobre un cambio específico
 */
export async function wasPatientNotified(appointmentId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', `schedule_notification_${appointmentId}`)
    .single()

  return !!data
}
