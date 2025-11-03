import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // La autenticación se maneja en el middleware

  try {
    const { data: services, error } = await supabase
      .from('aesthetic_services')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching services:', error)
      return res.status(500).json({ error: 'Error al obtener servicios' })
    }

    return res.status(200).json({ services })
  } catch (error) {
    console.error('Error in services API:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

