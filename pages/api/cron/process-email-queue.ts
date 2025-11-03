import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    // Verificar autorización (solo para cron jobs)
    const authHeader = req.headers.authorization
    const cronSecret = process.env.CRON_SECRET
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const { action = 'process' } = req.body

    switch (action) {
      case 'process':
        // Procesar cola de emails pendientes
        const { data: pendingEmails, error: emailError } = await supabaseAdmin
          .from('email_queue')
          .select('*')
          .eq('status', 'pending')
          .limit(10)

        if (emailError) {
          throw new Error(`Error obteniendo emails pendientes: ${emailError.message}`)
        }

        let processedCount = 0
        let failedCount = 0

        for (const email of pendingEmails || []) {
          try {
            // Simular procesamiento de email
            console.log(`Procesando email para: ${email.recipient_email}`)
            
            // Marcar como enviado
            await supabaseAdmin
              .from('email_queue')
              .update({ 
                status: 'sent',
                updated_at: new Date().toISOString()
              })
              .eq('id', email.id)

            processedCount++
          } catch (error) {
            console.error(`Error procesando email ${email.id}:`, error)
            
            // Marcar como fallido
            await supabaseAdmin
              .from('email_queue')
              .update({ 
                status: 'failed',
                retries: email.retries + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', email.id)

            failedCount++
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Procesamiento de cola de emails completado',
          processed: processedCount,
          failed: failedCount,
          timestamp: new Date().toISOString()
        })

      case 'stats':
        // Obtener estadísticas de la cola
        const { data: queueStats, error: statsError } = await supabaseAdmin
          .from('email_queue')
          .select('status')
          .limit(1000)

        if (statsError) {
          throw new Error(`Error obteniendo estadísticas: ${statsError.message}`)
        }

        const stats = {
          pending: queueStats?.filter((e: any) => e.status === 'pending').length || 0,
          sent: queueStats?.filter((e: any) => e.status === 'sent').length || 0,
          failed: queueStats?.filter((e: any) => e.status === 'failed').length || 0,
          total: queueStats?.length || 0
        }

        return res.status(200).json({
          success: true,
          stats
        })

      default:
        return res.status(400).json({
          error: 'Acción no válida. Usar: process, stats'
        })
    }

  } catch (error) {
    console.error('Error procesando cola de emails:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}