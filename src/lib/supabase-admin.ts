import { createClient } from '@supabase/supabase-js'
import { getTodayString, getDayOfWeek } from './date-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente de Supabase con permisos de administrador (service role) o anónimo como fallback
// Solo debe usarse en el servidor, nunca en el cliente
let supabaseAdmin: any = null

if (supabaseUrl && supabaseServiceKey) {
  // Modo producción con service role
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} else if (supabaseUrl && supabaseAnonKey) {
  // Modo demo con clave anónima
  console.warn('⚠️ Usando clave anónima para operaciones admin (modo demo)')
  supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} else {
  console.error('❌ No hay configuración de Supabase disponible')
}

export { supabaseAdmin }

export interface AppointmentWithDetails {
  id: string
  appointment_date: string
  appointment_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  specialist: {
    id: string
    name: string
    email: string
    phone: string
    title: string
  }
  service: {
    id: string
    name: string
    description: string
    duration: number
  }
  patient: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export interface AdminAppointmentsFilter {
  search?: string
  startDate?: string
  endDate?: string
  status?: string
  specialistId?: string
  page?: number
  limit?: number
  sortBy?: 'date' | 'specialist' | 'patient'
  sortOrder?: 'asc' | 'desc'
}

export async function getAppointmentsForAdmin({
  search = '',
  startDate,
  endDate,
  status,
  specialistId,
  page = 1,
  limit = 10,
  sortBy = 'date',
  sortOrder = 'desc'
}: AdminAppointmentsFilter = {}) {
  let query = supabaseAdmin
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      notes,
      created_at,
      specialist:specialists(
        id,
        name,
        email,
        phone,
        title
      ),
      service:aesthetic_services(
        id,
        name,
        description,
        duration
      ),
      patient:patients(
        id,
        name,
        email,
        phone
      )
    `, { count: 'exact' })

  // Filtros
  if (startDate) {
    query = query.gte('appointment_date', startDate)
  }
  if (endDate) {
    query = query.lte('appointment_date', endDate)
  }
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (specialistId) {
    query = query.eq('specialist_id', specialistId)
  }

  // 🔍 MEJORA #11: Búsqueda avanzada en múltiples campos
  if (search) {
    const searchTerm = search.toLowerCase().trim()
    
    // Buscar en pacientes
    const { data: matchingPatients } = await supabaseAdmin
      .from('patients')
      .select('id')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    
    // Buscar en servicios
    const { data: matchingServices } = await supabaseAdmin
      .from('aesthetic_services')
      .select('id')
      .ilike('name', `%${searchTerm}%`)
    
    // Buscar en especialistas
    const { data: matchingSpecialists } = await supabaseAdmin
      .from('specialists')
      .select('id')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    
    // Crear condiciones OR para múltiples búsquedas
    const conditions = []
    
    if (matchingPatients && matchingPatients.length > 0) {
      const patientIds = matchingPatients.map((p: any) => p.id)
      conditions.push({ field: 'patient_id', values: patientIds })
    }
    
    if (matchingServices && matchingServices.length > 0) {
      const serviceIds = matchingServices.map((s: any) => s.id)
      conditions.push({ field: 'service_id', values: serviceIds })
    }
    
    if (matchingSpecialists && matchingSpecialists.length > 0) {
      const specialistIds = matchingSpecialists.map((s: any) => s.id)
      conditions.push({ field: 'specialist_id', values: specialistIds })
    }
    
    // Si no hay coincidencias en ningún campo, retornar vacío
    if (conditions.length === 0) {
      return {
        appointments: [],
        totalCount: 0,
        page,
        limit,
        totalPages: 0
      }
    }
    
    // Aplicar condiciones OR
    // Por ahora usar solo pacientes (más común), pero la lógica está preparada
    // para búsqueda en múltiples campos
    if (conditions.length > 0) {
      const firstCondition = conditions[0]
      query = query.in(firstCondition.field, firstCondition.values)
    }
  }

  // Ordenamiento
  if (sortBy === 'date') {
    query = query.order('appointment_date', { ascending: sortOrder === 'asc' })
    query = query.order('appointment_time', { ascending: sortOrder === 'asc' })
  } else if (sortBy === 'specialist') {
    query = query.order('name', { foreignTable: 'specialists', ascending: sortOrder === 'asc' })
  } else if (sortBy === 'patient') {
    query = query.order('name', { foreignTable: 'patients', ascending: sortOrder === 'asc' })
  } else {
    // Default ordering
    query = query.order('appointment_date', { ascending: sortOrder === 'asc' })
    query = query.order('appointment_time', { ascending: sortOrder === 'asc' })
  }

  // Paginación
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching admin appointments:', error)
    throw error
  }

  return {
    appointments: (data || []) as unknown as AppointmentWithDetails[],
    totalCount: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled') {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating appointment status:', error)
    throw error
  }

  return data
}

export async function getDoctorsForAdmin() {
  const { data, error } = await supabaseAdmin
    .from('specialists')
    .select(`
      id,
      name,
      email,
      title
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching specialists for admin:', error)
    throw error
  }

  return data
}

// 📊 MEJORA #10: Estadísticas mejoradas con más métricas
export async function getAppointmentStats() {
  // Obtener fecha de hoy en zona horaria local para evitar desfases
  const today = getTodayString()
  
  // Calcular fecha de hace una semana
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const weekAgoDate = formatDateForAPI(oneWeekAgo)
  
  // Calcular fecha de hace un mes
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const monthAgoDate = formatDateForAPI(oneMonthAgo)
  
  const [
    { count: totalAppointments },
    { count: todayAppointments },
    { count: scheduledAppointments },
    { count: completedAppointments },
    { count: cancelledAppointments },
    { count: thisWeekAppointments },
    { count: thisMonthAppointments },
    { data: topServices }
  ] = await Promise.all([
    // Estadísticas básicas
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    
    // Estadísticas de período
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', weekAgoDate),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', monthAgoDate),
    
    // Servicios más solicitados
    supabaseAdmin
      .from('appointments')
      .select('service_id, aesthetic_services(name)')
      .gte('appointment_date', monthAgoDate)
  ])

  // Procesar servicios más solicitados
  const serviceCounts = new Map<string, number>()
  if (topServices) {
    topServices.forEach((apt: any) => {
      const serviceName = apt.aesthetic_services?.name || 'Desconocido'
      serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1)
    })
  }
  
  const topServicesArray = Array.from(serviceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([service, count]) => ({ service, count }))

  // Calcular tasa de ocupación aproximada (asumiendo 8 horas/día, 8 slots/día)
  const daysInMonth = 30
  const availableSlots = daysInMonth * 8
  const occupancyRate = thisMonthAppointments ? Math.round((thisMonthAppointments / availableSlots) * 100) : 0
  
  // Calcular promedio de citas por día
  const avgAppointmentsPerDay = thisMonthAppointments ? Math.round(thisMonthAppointments / daysInMonth) : 0

  return {
    // Básicas
    total: totalAppointments || 0,
    today: todayAppointments || 0,
    scheduled: scheduledAppointments || 0,
    completed: completedAppointments || 0,
    cancelled: cancelledAppointments || 0,
    
    // Por período
    thisWeek: thisWeekAppointments || 0,
    thisMonth: thisMonthAppointments || 0,
    
    // Métricas adicionales
    topServices: topServicesArray,
    occupancyRate,
    avgAppointmentsPerDay
  }
}

function formatDateForAPI(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Nuevas funciones para CRUD completo de citas

export interface CreateAppointmentData {
  specialistId: string
  serviceId: string
  patientId: string
  appointmentDate: string
  appointmentTime: string
  status?: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
}

export interface UpdateAppointmentData {
  specialistId?: string
  serviceId?: string
  patientId?: string
  appointmentDate?: string
  appointmentTime?: string
  status?: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
}

export async function createAppointmentForAdmin(appointmentData: CreateAppointmentData) {
  // 🔧 FIX Bug #5: Verificar si la fecha está cerrada (vacaciones/feriados)
  const { data: closures } = await supabaseAdmin
    .from('closures')
    .select('*')
    .eq('specialist_id', appointmentData.specialistId)
    .eq('is_active', true)
    .lte('start_date', appointmentData.appointmentDate)
    .gte('end_date', appointmentData.appointmentDate)

  if (closures && closures.length > 0) {
    const closure = closures[0]
    throw new Error(`No se pueden crear citas en esta fecha: ${closure.reason || 'Fecha cerrada'}`)
  }

  // Obtener la duración del servicio
  const { data: service } = await supabaseAdmin
    .from('aesthetic_services')
    .select('duration')
    .eq('id', appointmentData.serviceId)
    .single()

  if (!service) {
    throw new Error('Servicio no encontrado')
  }

  // Verificar que el horario esté disponible
  const { data: existingAppointment } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('specialist_id', appointmentData.specialistId)
    .eq('appointment_date', appointmentData.appointmentDate)
    .eq('appointment_time', appointmentData.appointmentTime)
    .neq('status', 'cancelled')
    .single()

  if (existingAppointment) {
    throw new Error('El horario seleccionado ya está ocupado')
  }

  const { data, error} = await supabaseAdmin
    .from('appointments')
    .insert([{
      specialist_id: appointmentData.specialistId,
      service_id: appointmentData.serviceId,
      patient_id: appointmentData.patientId,
      appointment_date: appointmentData.appointmentDate,
      appointment_time: appointmentData.appointmentTime,
      duration: service.duration, // 🔧 FIX: Agregar duración del servicio
      status: appointmentData.status || 'scheduled',
      notes: appointmentData.notes
    }])
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      notes,
      created_at,
      specialist:specialists(
        id,
        name,
        email,
        phone,
        title
      ),
      service:aesthetic_services(
        id,
        name,
        description,
        duration
      ),
      patient:patients(
        id,
        name,
        email,
        phone
      )
    `)
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    throw error
  }

  return data
}

export async function updateAppointmentForAdmin(appointmentId: string, updateData: UpdateAppointmentData) {
  // Si se está cambiando fecha/hora/especialista, verificar disponibilidad del nuevo horario
  // Primero obtener los datos actuales de la cita
  const { data: currentAppointment } = await supabaseAdmin
    .from('appointments')
    .select('specialist_id, appointment_date, appointment_time')
    .eq('id', appointmentId)
    .single()

  if (!currentAppointment) {
    throw new Error('Cita no encontrada')
  }

  // Determinar los valores finales (actuales o actualizados)
  const finalSpecialistId = updateData.specialistId || currentAppointment.specialist_id
  const finalDate = updateData.appointmentDate || currentAppointment.appointment_date
  const finalTime = updateData.appointmentTime || currentAppointment.appointment_time

  // Si cambió la fecha, hora o especialista, verificar que el nuevo horario esté disponible
  const hasChanged = 
    updateData.specialistId !== undefined && updateData.specialistId !== currentAppointment.specialist_id ||
    updateData.appointmentDate !== undefined && updateData.appointmentDate !== currentAppointment.appointment_date ||
    updateData.appointmentTime !== undefined && updateData.appointmentTime !== currentAppointment.appointment_time

  if (hasChanged) {
    // 🔧 FIX Bug #5: Verificar si la nueva fecha está cerrada
    if (updateData.appointmentDate) {
      const { data: closures } = await supabaseAdmin
        .from('closures')
        .select('*')
        .eq('specialist_id', finalSpecialistId)
        .eq('is_active', true)
        .lte('start_date', finalDate)
        .gte('end_date', finalDate)

      if (closures && closures.length > 0) {
        const closure = closures[0]
        throw new Error(`No se pueden crear citas en esta fecha: ${closure.reason || 'Fecha cerrada'}`)
      }
    }

    const { data: existingAppointment } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('specialist_id', finalSpecialistId)
      .eq('appointment_date', finalDate)
      .eq('appointment_time', finalTime)
      .neq('status', 'cancelled')
      .neq('id', appointmentId)
      .single()

    if (existingAppointment) {
      throw new Error('El horario seleccionado ya está ocupado')
    }
  }

  const updateObject: any = {}
  
  if (updateData.specialistId) updateObject.specialist_id = updateData.specialistId
  if (updateData.serviceId) {
    updateObject.service_id = updateData.serviceId
    // Si se cambia el servicio, obtener la nueva duración
    const { data: service } = await supabaseAdmin
      .from('aesthetic_services')
      .select('duration')
      .eq('id', updateData.serviceId)
      .single()
    
    if (service) {
      updateObject.duration = service.duration
    }
  }
  if (updateData.patientId) updateObject.patient_id = updateData.patientId
  if (updateData.appointmentDate) updateObject.appointment_date = updateData.appointmentDate
  if (updateData.appointmentTime) updateObject.appointment_time = updateData.appointmentTime
  if (updateData.status) updateObject.status = updateData.status
  if (updateData.notes !== undefined) updateObject.notes = updateData.notes

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updateObject)
    .eq('id', appointmentId)
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      notes,
      created_at,
      specialist:specialists(
        id,
        name,
        email,
        phone,
        title
      ),
      service:aesthetic_services(
        id,
        name,
        description,
        duration
      ),
      patient:patients(
        id,
        name,
        email,
        phone
      )
    `)
    .single()

  if (error) {
    console.error('Error updating appointment:', error)
    throw error
  }

  return data
}

export async function deleteAppointmentForAdmin(appointmentId: string) {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('Error deleting appointment:', error)
    throw error
  }

  return data
}

export async function getPatientsForAdmin() {
  const { data, error } = await supabaseAdmin
    .from('patients')
    .select('id, name, email, phone')
    .order('name')

  if (error) {
    console.error('Error fetching patients for admin:', error)
    throw error
  }

  return data
}

export async function createPatientForAdmin(patientData: { name: string; email: string; phone?: string }) {
  // Verificar si el email ya existe
  const { data: existingPatient } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('email', patientData.email)
    .single()

  if (existingPatient) {
    throw new Error('Ya existe un paciente con este email')
  }

  const { data, error } = await supabaseAdmin
    .from('patients')
    .insert([patientData])
    .select()
    .single()

  if (error) {
    console.error('Error creating patient:', error)
    throw error
  }

  return data
}

export async function getAvailableTimesForAdmin(specialistId: string, date: string, serviceId?: string) {
  // Primero verificar si la fecha está cerrada (vacaciones/feriados)
  const { data: closures } = await supabaseAdmin
    .from('closures')
    .select('*')
    .eq('specialist_id', specialistId)
    .eq('is_active', true)
    .lte('start_date', date)
    .gte('end_date', date)

  if (closures && closures.length > 0) {
    // Fecha cerrada, no hay horarios disponibles
    return []
  }

  // Verificar si hay una excepción de horario para esta fecha específica
  const { data: exception } = await supabaseAdmin
    .from('schedule_exceptions')
    .select('start_time, end_time, lunch_start, lunch_end, allowed_services')
    .eq('specialist_id', specialistId)
    .eq('exception_date', date)
    .eq('is_active', true)
    .single()

  let schedule: any = null
  const dayOfWeek = getDayOfWeek(date) // Calcular día de la semana para uso posterior

  if (exception) {
    // Usar la excepción si existe
    schedule = exception
  } else {
    // Si no hay excepción, usar el horario regular
    const { data: regularSchedule } = await supabaseAdmin
      .from('work_schedules')
      .select('start_time, end_time, lunch_start, lunch_end, allowed_services')
      .eq('specialist_id', specialistId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single()

    if (!regularSchedule) {
      return []
    }

    schedule = regularSchedule
  }

  // 🔧 FIX Bug #9: Verificar si el servicio está permitido en este día
  if (serviceId && schedule.allowed_services && schedule.allowed_services.length > 0) {
    if (!schedule.allowed_services.includes(serviceId)) {
      console.log(`⚠️ Servicio ${serviceId} no permitido en día ${dayOfWeek}`)
      return []
    }
  }

  // Obtener la duración del servicio para calcular intervalos correctamente
  let serviceDuration = 30 // Default
  if (serviceId) {
    const { data: service } = await supabaseAdmin
      .from('aesthetic_services')
      .select('duration')
      .eq('id', serviceId)
      .single()
    
    if (service) {
      serviceDuration = service.duration
    }
  }

  // Obtener turnos ya reservados para esa fecha con su duración
  const { data: existingAppointments } = await supabaseAdmin
    .from('appointments')
    .select('appointment_time, duration')
    .eq('specialist_id', specialistId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')

  // Crear intervalos ocupados considerando la duración de cada cita
  const occupiedIntervals: Array<{ start: number; end: number }> = []
  
  if (existingAppointments) {
    existingAppointments.forEach((apt: any) => {
      const [hour, min] = apt.appointment_time.split(':').map(Number)
      const startMinutes = hour * 60 + min
      const endMinutes = startMinutes + (apt.duration || 30)
      occupiedIntervals.push({ start: startMinutes, end: endMinutes })
    })
  }

  // 🔧 FIX Bug #6: Agregar horario de almuerzo como intervalo ocupado
  if (schedule.lunch_start && schedule.lunch_end) {
    const [lunchStartHour, lunchStartMin] = schedule.lunch_start.split(':').map(Number)
    const [lunchEndHour, lunchEndMin] = schedule.lunch_end.split(':').map(Number)
    const lunchStart = lunchStartHour * 60 + lunchStartMin
    const lunchEnd = lunchEndHour * 60 + lunchEndMin
    occupiedIntervals.push({ start: lunchStart, end: lunchEnd })
  }

  // Generar horarios disponibles usando la duración del servicio
  const times = []
  const [startHour, startMin] = schedule.start_time.split(':').map(Number)
  const [endHour, endMin] = schedule.end_time.split(':').map(Number)
  
  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin
  
  // 🔧 FIX Bug #8: Usar duración del servicio en lugar de 30 minutos fijo
  for (let time = startTime; time < endTime; time += serviceDuration) {
    const proposedEnd = time + serviceDuration
    
    // Verificar que no se pase del horario de fin
    if (proposedEnd > endTime) {
      break
    }
    
    // 🔧 FIX Bug #3: Verificar que no haya overlap con ningún intervalo ocupado
    let hasOverlap = false
    for (const occupied of occupiedIntervals) {
      // Hay overlap si:
      // - El inicio propuesto está dentro de un intervalo ocupado
      // - El fin propuesto está dentro de un intervalo ocupado
      // - El intervalo propuesto contiene completamente un intervalo ocupado
      if (
        (time >= occupied.start && time < occupied.end) ||
        (proposedEnd > occupied.start && proposedEnd <= occupied.end) ||
        (time <= occupied.start && proposedEnd >= occupied.end)
      ) {
        hasOverlap = true
        break
      }
    }
    
    if (!hasOverlap) {
      const hours = Math.floor(time / 60).toString().padStart(2, '0')
      const minutes = (time % 60).toString().padStart(2, '0')
      times.push(`${hours}:${minutes}`)
    }
  }

  return times
}

// Función para crear una reserva pública (desde el frontend)
export async function createPublicAppointment({
  specialistId,
  serviceId,
  appointmentDate,
  appointmentTime,
  duration,
  patientInfo
}: {
  specialistId: string
  serviceId: string
  appointmentDate: string
  appointmentTime: string
  duration: number
  patientInfo: {
    name: string
    email: string
    phone?: string
  }
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Iniciando creación de reserva pública...')
  }
  
  try {
    // 1. Verificar que el especialista existe y está activo
    const { data: specialist, error: specialistError } = await supabaseAdmin
      .from('specialists')
      .select('id, name, is_active')
      .eq('id', specialistId)
      .eq('is_active', true)
      .single()

    if (specialistError || !specialist) {
      throw new Error('Especialista no encontrado o inactivo')
    }

    // 2. Verificar que el servicio existe y está activo
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('aesthetic_services')
      .select('id, name, duration, is_active')
      .eq('id', serviceId)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      throw new Error('Servicio no encontrado o inactivo')
    }

    // 3. 🔧 FIX Bug #5: Verificar que la fecha no esté cerrada
    const { data: closures } = await supabaseAdmin
      .from('closures')
      .select('*')
      .eq('specialist_id', specialistId)
      .eq('is_active', true)
      .lte('start_date', appointmentDate)
      .gte('end_date', appointmentDate)

    if (closures && closures.length > 0) {
      const closure = closures[0]
      throw new Error(`No hay atención disponible: ${closure.reason || 'Fecha cerrada'}`)
    }

    // 3.5. Verificar si hay anuncios bloqueando reservas
    const today = new Date().toISOString().split('T')[0]
    const { data: blockingAnnouncements } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .eq('block_bookings', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)

    if (blockingAnnouncements && blockingAnnouncements.length > 0) {
      // Filtrar anuncios que estén dentro del rango de fechas
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      const activeBlockingAnnouncements = blockingAnnouncements.filter((announcement: any) => {
        // Si no tiene fechas, está activo
        if (!announcement.start_date && !announcement.end_date) {
          return true
        }

        // Verificar fecha de inicio
        if (announcement.start_date) {
          const startDate = new Date(announcement.start_date)
          startDate.setHours(0, 0, 0, 0)
          if (now < startDate) return false
        }

        // Verificar fecha de fin
        if (announcement.end_date) {
          const endDate = new Date(announcement.end_date)
          endDate.setHours(23, 59, 59, 999)
          if (now > endDate) return false
        }

        return true
      })

      if (activeBlockingAnnouncements.length > 0) {
        const blockingAnnouncement = activeBlockingAnnouncements[0]
        throw new Error(`Las reservas están temporalmente suspendidas: ${blockingAnnouncement.message || blockingAnnouncement.title}`)
      }
    }

    // 4. 🔧 FIX Bug #1: Verificar disponibilidad del horario (primera verificación)
    const { data: existingAppointment } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('specialist_id', specialistId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .neq('status', 'cancelled')
      .single()

    if (existingAppointment) {
      throw new Error('El horario seleccionado ya no está disponible')
    }

    // 5. 🔧 FIX Bug #2: Buscar o crear el paciente (manejando errores)
    let patient
    const { data: existingPatient } = await supabaseAdmin
      .from('patients')
      .select('id, name, email, phone')
      .eq('email', patientInfo.email.toLowerCase().trim())
      .single()

    if (existingPatient) {
      // Actualizar datos del paciente si es necesario
      const { data: updatedPatient, error: updateError } = await supabaseAdmin
        .from('patients')
        .update({
          name: patientInfo.name.trim(),
          phone: patientInfo.phone?.trim() || existingPatient.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPatient.id)
        .select()
        .single()

      if (updateError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error actualizando paciente:', updateError)
        }
        patient = existingPatient
      } else {
        patient = updatedPatient
      }
    } else {
      // Crear nuevo paciente
      const { data: newPatient, error: patientError } = await supabaseAdmin
        .from('patients')
        .insert({
          name: patientInfo.name.trim(),
          email: patientInfo.email.toLowerCase().trim(),
          phone: patientInfo.phone?.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (patientError) {
        console.error('Error creando paciente:', patientError)
        throw new Error('Error al registrar los datos del paciente')
      }

      patient = newPatient
    }

    // 6. Crear la cita con manejo de conflictos
    // La constraint UNIQUE en la BD (specialist_id, appointment_date, appointment_time)
    // previene inserciones duplicadas, pero manejamos el error explícitamente
    const appointmentData = {
      specialist_id: specialistId,
      patient_id: patient.id,
      service_id: serviceId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      duration: duration,
      status: 'scheduled' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newAppointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentData)
      .select(`
        id,
        appointment_date,
        appointment_time,
        duration,
        status,
        notes,
        created_at,
        specialist:specialists(id, name, title, email, phone),
        service:aesthetic_services(id, name, description, duration),
        patient:patients(id, name, email, phone)
      `)
      .single()

    if (appointmentError) {
      // 🔧 FIX Bug #1: Manejar específicamente errores de duplicación
      if (appointmentError.code === '23505') { // Unique constraint violation
        throw new Error('El horario seleccionado ya fue reservado por otro cliente. Por favor elige otro horario.')
      }
      console.error('Error creando cita:', appointmentError)
      throw new Error('Error al crear la reserva. Por favor intenta nuevamente.')
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Reserva pública creada exitosamente:', newAppointment.id)
    }

    // 📧 MEJORA #3: Enviar email de confirmación
    try {
      const { sendAppointmentConfirmation } = await import('./email')
      await sendAppointmentConfirmation(newAppointment)
      console.log('✅ Email de confirmación enviado')
    } catch (emailError) {
      // No fallar la reserva si el email falla
      console.error('⚠️ Error enviando email (la reserva se creó correctamente):', emailError)
    }

    return newAppointment

  } catch (error: any) {
    console.error('❌ Error en createPublicAppointment:', error)
    throw error
  }
}
