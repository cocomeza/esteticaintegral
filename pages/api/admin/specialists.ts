import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    console.log('🔍 Obteniendo especialistas...')
    
    const { data: specialists, error } = await supabaseAdmin
      .from('specialists')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('❌ Error fetching specialists:', error)
      return res.status(500).json({ error: 'Error al obtener especialistas' })
    }

    console.log('✅ Especialistas obtenidos:', specialists?.length || 0)
    
    return res.status(200).json({ 
      success: true, 
      specialists: specialists || [] 
    })
  } catch (error) {
    console.error('❌ Error in specialists API:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
