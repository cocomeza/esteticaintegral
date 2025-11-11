import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(
  supabaseUrl!,
  serviceRoleKey || anonKey!,
  serviceRoleKey
    ? {
        auth: {
          persistSession: false
        }
      }
    : undefined
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    // Obtener anuncios activos que estén en el rango de fechas o sin fecha
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return res.status(500).json({ error: 'Error al obtener anuncios' })
    }

    // Filtrar anuncios que estén dentro del rango de fechas
    const activeAnnouncements = (announcements || []).filter((announcement: any) => {
      // Si no tiene fechas, siempre está activo
      if (!announcement.start_date && !announcement.end_date) {
        return true
      }

      const now = new Date()
      now.setHours(0, 0, 0, 0)

      // Si tiene fecha de inicio
      if (announcement.start_date) {
        const startDate = new Date(announcement.start_date)
        startDate.setHours(0, 0, 0, 0)
        if (now < startDate) return false
      }

      // Si tiene fecha de fin
      if (announcement.end_date) {
        const endDate = new Date(announcement.end_date)
        endDate.setHours(23, 59, 59, 999)
        if (now > endDate) return false
      }

      return true
    })

    return res.status(200).json({ 
      announcements: activeAnnouncements,
      hasBlockingAnnouncement: activeAnnouncements.some((a: any) => a.block_bookings)
    })
  } catch (error) {
    console.error('Error in announcements API:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

