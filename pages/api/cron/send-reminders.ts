/**
 * Cron Job: Envío de Recordatorios 24h Antes
 * 📧 MEJORA #9: Recordatorio automático a pacientes
 * 
 * Este endpoint debe ser llamado diariamente (ej: 10 AM)
 * Por Vercel Cron o servicio similar
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'
import { sendAppointmentReminder } from '../../../src/lib/email'
import { formatDateForAPI } from '../../../src/lib/date-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔒 Verificar autenticación del cron job
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('❌ CRON_SECRET no configurado')
    return res.status(500).json({ error: 'Configuración incompleta' })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Intento de acceso no autorizado al cron job')
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    // Calcular fecha de mañana
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = formatDateForAPI(tomorrow)

    console.log(`🔔 Buscando citas para mañana: ${tomorrowDate}`)

    // Obtener citas programadas para mañana
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        patient:patients(
          id,
          name,
          email,
          phone
        ),
        specialist:specialists(
          id,
          name,
          title
        ),
        service:aesthetic_services(
          id,
          name,
          duration
        )
      `)
      .eq('appointment_date', tomorrowDate)
      .eq('status', 'scheduled')

    if (error) {
      console.error('❌ Error obteniendo citas:', error)
      return res.status(500).json({ error: 'Error al obtener citas' })
    }

    if (!appointments || appointments.length === 0) {
      console.log('ℹ️ No hay citas para mañana')
      return res.status(200).json({ 
        success: true, 
        message: 'No hay citas para mañana',
        sent: 0 
      })
    }

    console.log(`📧 Enviando ${appointments.length} recordatorio(s)...`)

    // Enviar recordatorios
    const results = await Promise.allSettled(
      appointments.map(async (appointment: any) => {
        try {
          const success = await sendAppointmentReminder(appointment)
          return { appointmentId: appointment.id, success }
        } catch (error) {
          console.error(`❌ Error enviando recordatorio para cita ${appointment.id}:`, error)
          return { appointmentId: appointment.id, success: false, error }
        }
      })
    )

    // Contar éxitos y fallos
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`✅ Recordatorios enviados: ${successful}/${appointments.length}`)
    if (failed > 0) {
      console.warn(`⚠️ Fallos: ${failed}`)
    }

    return res.status(200).json({
      success: true,
      message: `Recordatorios procesados`,
      total: appointments.length,
      sent: successful,
      failed,
      results: results.map(r => ({
        status: r.status,
        appointmentId: r.status === 'fulfilled' ? r.value.appointmentId : null,
        success: r.status === 'fulfilled' ? r.value.success : false
      }))
    })

  } catch (error: any) {
    console.error('❌ Error en cron job de recordatorios:', error)
    return res.status(500).json({ 
      error: 'Error procesando recordatorios',
      details: error.message 
    })
  }
}

