
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejemplo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo.clave.temporal'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Función helper para verificar si Supabase está configurado correctamente
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://ejemplo.supabase.co' && supabaseKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo.clave.temporal'
}

// Tipos TypeScript para Centro de Estética
export interface AestheticService {
  id: string
  name: string
  description: string
  duration: number // en minutos
  category: 'facial' | 'corporal' | 'depilacion' | 'terapeutico' | 'estetico'
  is_active: boolean
}

export interface Specialist {
  id: string
  name: string
  email: string
  phone: string
  bio: string
  years_experience: number
  profile_image?: string
  title: string // ej: "Esteticista Profesional"
  license?: string // Matrícula profesional
  address?: string // Dirección del centro
  specialties: string[] // IDs de servicios que ofrece (como string para compatibilidad)
  is_active: boolean
}

// Mantenemos las interfaces originales para compatibilidad durante la migración
export interface Specialty {
  id: string
  name: string
  description: string
}

export interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialty_id: string
  bio: string
  years_experience: number
  profile_image?: string
  specialty?: Specialty
}

export interface Appointment {
  id: string
  specialist_id: string // Cambio de doctor_id a specialist_id
  patient_id: string
  service_id: string // Nuevo: ID del servicio estético
  appointment_date: string
  appointment_time: string
  duration: number // Duración del servicio en minutos
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  specialist?: Specialist
  service?: AestheticService
  // Mantener compatibilidad
  doctor_id?: string
  doctor?: Doctor
}

export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  date_of_birth?: string // Opcional para estética
  created_at: string
  updated_at: string
  notes?: string // Para observaciones del profesional
}