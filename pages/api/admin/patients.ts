import type { NextApiRequest, NextApiResponse } from 'next'
import { getPatientsForAdmin, createPatientForAdmin } from '../../../src/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // La autenticación se maneja en el middleware

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res)
      case 'POST':
        return handlePost(req, res)
      default:
        return res.status(405).json({ error: 'Método no permitido' })
    }
  } catch (error: any) {
    console.error('Error en /api/admin/patients:', error)
    return res.status(500).json({ error: error.message || 'Error interno del servidor' })
  }
}

// GET - Obtener pacientes
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const patients = await getPatientsForAdmin()
    return res.status(200).json({ patients })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return res.status(500).json({ error: 'Error al obtener pacientes' })
  }
}

// POST - Crear nuevo paciente
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, email, phone } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' })
    }

    const patient = await createPatientForAdmin({
      name,
      email,
      phone
    })

    return res.status(201).json({ patient })
  } catch (error: any) {
    console.error('Error creating patient:', error)
    return res.status(500).json({ error: error.message || 'Error al crear el paciente' })
  }
}