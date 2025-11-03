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
    const { specialistId, exceptionDate, newStartTime, newEndTime } = req.body

    if (!specialistId || !exceptionDate || !newStartTime || !newEndTime) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos'
      })
    }

    // Obtener turnos existentes para esa fecha
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_time,
        duration,
        status,
        patient:patients(name, email),
        service:aesthetic_services(name)
      `)
      .eq('specialist_id', specialistId)
      .eq('appointment_date', exceptionDate)
      .eq('status', 'scheduled')

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
          recommendation: '✅ No hay turnos existentes para esta fecha'
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
    console.log(`🔍 Validando ${appointments.length} turno(s) contra nuevo horario: ${newStartTime} - ${newEndTime}`)
    
    for (const appointment of appointments) {
      const [aptHour, aptMin] = appointment.appointment_time.split(':').map(Number)
      const aptStartMinutes = aptHour * 60 + aptMin
      const aptEndMinutes = aptStartMinutes + (appointment.duration || 45)

      console.log(`  - Turno: ${appointment.appointment_time} (${aptStartMinutes}-${aptEndMinutes} min) vs Nuevo: (${newStartMinutes}-${newEndMinutes} min)`)

      // Verificar si el turno queda fuera del nuevo horario
      const isBeforeStart = aptStartMinutes < newStartMinutes
      const isAfterEnd = aptEndMinutes > newEndMinutes
      
      if (isBeforeStart || isAfterEnd) {
        const patient = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient
        const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service
        
        const conflictReason = isBeforeStart 
          ? `Inicia antes del nuevo horario (${appointment.appointment_time} < ${newStartTime})`
          : `Termina después del nuevo horario (${appointment.appointment_time} + ${appointment.duration}min > ${newEndTime})`
        
        conflicts.push({
          appointmentId: appointment.id,
          appointmentTime: appointment.appointment_time,
          duration: appointment.duration || 45,
          patientName: patient?.name || 'Desconocido',
          patientEmail: patient?.email || '',
          serviceName: service?.name || 'Desconocido',
          conflictType: 'outside_hours',
          reason: conflictReason
        })
        
        console.log(`    ⚠️  CONFLICTO: ${patient?.name || 'Desconocido'} - ${appointment.appointment_time} (${conflictReason})`)
      } else {
        console.log(`    ✅ OK: Turno dentro del nuevo horario`)
      }
    }
    
    console.log(`📊 Total de conflictos encontrados: ${conflicts.length}`)

    const hasConflicts = conflicts.length > 0

    return res.status(200).json({
      validation: {
        hasConflicts,
        conflicts,
        affectedAppointmentsCount: conflicts.length,
        canProceed: !hasConflicts,
        recommendation: hasConflicts
          ? `⚠️ Este cambio afectará ${conflicts.length} turno(s) existente(s). Debe contactar a los pacientes afectados antes de aplicar el cambio.`
          : '✅ El cambio de horario no afecta ningún turno existente.'
      }
    })

  } catch (error) {
    console.error('Error validating exception:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}

