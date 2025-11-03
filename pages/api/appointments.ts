import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  getAppointmentsForAdmin, 
  updateAppointmentStatus, 
  createAppointmentForAdmin,
  updateAppointmentForAdmin,
  deleteAppointmentForAdmin 
} from '../../src/lib/supabase-admin'
import { applyRateLimit, appointmentLimiter } from '../../src/lib/rate-limit'
import { verifyRecaptcha } from '../../src/lib/recaptcha'
import { withAppointmentLock, getClientIdentifier } from '../../src/lib/appointment-locks'
import { validateAppointmentTime } from '../../src/lib/time-validation'
import { normalizeFrontendDate, normalizeFrontendTime, getCurrentArgentinaTime } from '../../src/lib/timezone-handler'
import { validateRequestSecurity, sanitizeInput } from '../../src/lib/security-validations'
import { getOptimizedAppointments } from '../../src/lib/performance-optimizer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🛡️ CRÍTICO: Validación de seguridad
  const securityValidation = validateRequestSecurity(req)
  if (securityValidation.blocked) {
    console.error('🚫 Request bloqueado por seguridad:', securityValidation.threats)
    return res.status(403).json({
      error: 'Request bloqueado por políticas de seguridad',
      threats: securityValidation.threats,
      riskLevel: securityValidation.riskLevel
    })
  }

  // 🛡️ MEJORA #1: Aplicar rate limiting para reservas públicas
  if (req.method === 'POST') {
    try {
      await applyRateLimit(req, res, appointmentLimiter)
    } catch {
      return // El rate limiter ya envió la respuesta
    }
  }

  // La autenticación se maneja en el middleware

  if (req.method === 'GET') {
    try {
      const {
        search,
        startDate,
        endDate,
        status,
        specialistId,
        page = '1',
        limit = '10',
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query

      const filters = {
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
        specialistId: specialistId as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'date' | 'specialist' | 'patient',
        sortOrder: sortOrder as 'asc' | 'desc'
      }

      // 🎨 BAJO: Usar consultas optimizadas
      const optimizedFilters = {
        specialistId: filters.specialistId,
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        status: filters.status,
        limit: filters.limit
      }

      // Filtrar valores undefined
      const cleanFilters = Object.fromEntries(
        Object.entries(optimizedFilters).filter(([_, value]) => value !== undefined)
      )

      const appointments = await getOptimizedAppointments(cleanFilters)
      
      // Formatear resultado para mantener compatibilidad
      const result = {
        appointments,
        totalCount: appointments.length,
        totalPages: Math.ceil(appointments.length / filters.limit),
        currentPage: filters.page,
        hasNextPage: filters.page < Math.ceil(appointments.length / filters.limit),
        hasPrevPage: filters.page > 1
      }
      
      return res.status(200).json(result)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      return res.status(500).json({ error: 'Error al obtener citas' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { appointmentId, status } = req.body

      if (!appointmentId || !status) {
        return res.status(400).json({ error: 'ID de cita y estado requeridos' })
      }

      if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' })
      }

      const updatedAppointment = await updateAppointmentStatus(appointmentId, status)
      return res.status(200).json({ 
        success: true, 
        appointment: updatedAppointment 
      })
    } catch (error) {
      console.error('Error updating appointment:', error)
      return res.status(500).json({ error: 'Error al actualizar cita' })
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('🔵 POST /api/appointments - Body recibido:', JSON.stringify(req.body, null, 2))
      
      // Verificar si es una reserva pública (desde el frontend) o admin
      const { specialistId, serviceId, patientInfo, appointmentDate, appointmentTime, duration, recaptchaToken } = req.body
      
      // 🛡️ MEDIO: Sanitizar datos de entrada
      const sanitizedData = sanitizeInput({
        specialistId,
        serviceId,
        appointmentDate,
        appointmentTime,
        patientInfo
      })
      
      const {
        specialistId: sanitizedSpecialistId,
        serviceId: sanitizedServiceId,
        appointmentDate: sanitizedAppointmentDate,
        appointmentTime: sanitizedAppointmentTime,
        patientInfo: sanitizedPatientInfo
      } = sanitizedData
      
      console.log('🔍 Verificando campos:', { 
        hasSpecialistId: !!sanitizedSpecialistId, 
        hasServiceId: !!sanitizedServiceId, 
        hasPatientInfo: !!sanitizedPatientInfo,
        patientInfo: sanitizedPatientInfo 
      })
      
      if (sanitizedSpecialistId && sanitizedServiceId && sanitizedPatientInfo) {
        // Reserva pública desde el frontend
        console.log('✅ Es reserva pública - procesando...')
        
        if (!sanitizedSpecialistId || !sanitizedServiceId || !sanitizedAppointmentDate || !sanitizedAppointmentTime || !sanitizedPatientInfo?.name || !sanitizedPatientInfo?.email) {
          return res.status(400).json({ error: 'Especialista, servicio, fecha, hora y datos del paciente son requeridos' })
        }

        // 🌍 CRÍTICO: Normalizar fechas y horas a zona horaria de Argentina
        const normalizedDate = normalizeFrontendDate(sanitizedAppointmentDate)
        const normalizedTime = normalizeFrontendTime(sanitizedAppointmentTime)
        
        console.log(`🌍 Fecha normalizada: ${sanitizedAppointmentDate} → ${normalizedDate}`)
        console.log(`🌍 Hora normalizada: ${sanitizedAppointmentTime} → ${normalizedTime}`)

        // ⏰ CRÍTICO: Validar horario antes de proceder
        const timeValidation = validateAppointmentTime(normalizedDate, normalizedTime)
        if (!timeValidation.isValid) {
          console.error('❌ Horario inválido:', timeValidation.error)
          return res.status(400).json({ 
            error: timeValidation.error,
            suggestedTime: timeValidation.suggestedTime,
            warnings: timeValidation.warnings
          })
        }
        
        if (timeValidation.warnings && timeValidation.warnings.length > 0) {
          console.log('⚠️ Advertencias de horario:', timeValidation.warnings)
        }

        // 🤖 MEJORA #2: Verificar token de reCAPTCHA (opcional para Lorena)
        if (recaptchaToken) {
          const captchaResult = await verifyRecaptcha(recaptchaToken, 'submit_appointment')
          if (!captchaResult.success) {
            console.error('❌ Verificación de CAPTCHA fallida:', captchaResult.error)
            return res.status(400).json({ 
              error: 'Verificación de seguridad fallida. Por favor recarga la página e intenta nuevamente.' 
            })
          }
          console.log('✅ CAPTCHA verificado con score:', captchaResult.score)
        } else {
          // Sistema simplificado sin reCAPTCHA para Lorena
          console.log('ℹ️ Reserva sin reCAPTCHA - sistema simplificado')
        }

        // 🔒 CRÍTICO: Usar locks para prevenir race conditions
        const clientIdentifier = getClientIdentifier(req)
        console.log('🔒 Cliente identificado:', clientIdentifier)
        
        const lockResult = await withAppointmentLock(
          sanitizedSpecialistId,
          normalizedDate,
          normalizedTime,
          clientIdentifier,
          async (lockId) => {
            console.log(`🔒 Lock adquirido: ${lockId}`)
            
            // Crear el appointment usando la función pública
            const { createPublicAppointment } = await import('../../src/lib/supabase-admin')
            const newAppointment = await createPublicAppointment({
              specialistId: sanitizedSpecialistId,
              serviceId: sanitizedServiceId,
              appointmentDate: normalizedDate,
              appointmentTime: normalizedTime,
              duration: duration || 45,
              patientInfo: sanitizedPatientInfo
            })
            
            console.log('✅ Reserva creada exitosamente:', newAppointment)
            return newAppointment
          }
        )

        if (!lockResult.success) {
          console.error('❌ Error con lock:', lockResult.error)
          return res.status(409).json({ 
            error: lockResult.error || 'Este horario está siendo reservado por otro usuario. Intenta nuevamente.' 
          })
        }

        const newAppointment = lockResult.result
        return res.status(201).json({ 
          success: true, 
          appointment: newAppointment 
        })
      } else {
        // Reserva desde admin (formato anterior)
        const { specialistId, serviceId, patientId, appointmentDate, appointmentTime, status, notes } = req.body

        if (!specialistId || !serviceId || !patientId || !appointmentDate || !appointmentTime) {
          return res.status(400).json({ error: 'Especialista, servicio, paciente, fecha y hora son requeridos' })
        }

        const newAppointment = await createAppointmentForAdmin({
          specialistId,
          serviceId,
          patientId,
          appointmentDate,
          appointmentTime,
          status,
          notes
        })

        return res.status(201).json({ 
          success: true, 
          appointment: newAppointment 
        })
      }
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error)
      return res.status(400).json({ error: error.message || 'Error al crear la cita' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { appointmentId, specialistId, serviceId, patientId, appointmentDate, appointmentTime, status, notes } = req.body

      if (!appointmentId) {
        return res.status(400).json({ error: 'ID de cita requerido' })
      }

      const updatedAppointment = await updateAppointmentForAdmin(appointmentId, {
        specialistId,
        serviceId,
        patientId,
        appointmentDate,
        appointmentTime,
        status,
        notes
      })

      return res.status(200).json({ 
        success: true, 
        appointment: updatedAppointment 
      })
    } catch (error: any) {
      console.error('Error updating appointment:', error)
      return res.status(400).json({ error: error.message || 'Error al actualizar la cita' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { appointmentId } = req.body

      if (!appointmentId) {
        return res.status(400).json({ error: 'ID de cita requerido' })
      }

      const deletedAppointment = await deleteAppointmentForAdmin(appointmentId)

      return res.status(200).json({ 
        success: true, 
        appointment: deletedAppointment 
      })
    } catch (error: any) {
      console.error('Error deleting appointment:', error)
      return res.status(400).json({ error: error.message || 'Error al eliminar la cita' })
    }
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
