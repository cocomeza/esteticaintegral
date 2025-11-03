import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    // Verificar autorización (solo para admin)
    const authHeader = req.headers.authorization
    const adminSecret = process.env.ADMIN_SECRET
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const { action = 'metrics' } = req.query

    switch (action) {
      case 'metrics':
        // Obtener métricas básicas del sistema
        const { data: appointments, error: aptError } = await supabaseAdmin
          .from('appointments')
          .select('id, status, created_at')
          .limit(1000)

        if (aptError) {
          throw new Error(`Error obteniendo métricas: ${aptError.message}`)
        }

        const metrics = {
          totalAppointments: appointments?.length || 0,
          scheduledAppointments: appointments?.filter((a: any) => a.status === 'scheduled').length || 0,
          completedAppointments: appointments?.filter((a: any) => a.status === 'completed').length || 0,
          cancelledAppointments: appointments?.filter((a: any) => a.status === 'cancelled').length || 0,
          systemHealth: 'healthy',
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }

        return res.status(200).json({
          success: true,
          metrics
        })

      case 'alerts':
        // Obtener alertas del sistema
        const alerts = {
          activeAlerts: 0,
          alerts: [],
          lastCheck: new Date().toISOString()
        }

        return res.status(200).json({
          success: true,
          alerts
        })

      default:
        return res.status(400).json({
          error: 'Acción no válida. Usar: metrics, alerts'
        })
    }

  } catch (error) {
    console.error('Error en monitoreo del sistema:', error)
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}