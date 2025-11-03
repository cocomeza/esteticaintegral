import { formatDateForAPI } from './date-utils'

export interface TimeValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
  suggestedTime?: string
}

export interface TimeValidationConfig {
  minAdvanceHours: number // Mínimo de horas de anticipación
  maxAdvanceDays: number // Máximo de días de anticipación
  businessHours: {
    start: string // "09:00"
    end: string // "18:00"
  }
  workingDays: number[] // [1,2,3,4,5,6] = Lunes a Sábado
  holidays: string[] // ["2024-12-25", "2024-01-01"]
}

/**
 * ⏰ CRÍTICO: Sistema de validación de horarios temporales
 * 
 * Previene reservas en horarios inválidos:
 * - Horarios pasados
 * - Horarios muy cercanos (menos de X horas)
 * - Horarios muy lejanos (más de X días)
 * - Días no laborales
 * - Feriados
 */

const DEFAULT_CONFIG: TimeValidationConfig = {
  minAdvanceHours: 2, // Mínimo 2 horas de anticipación
  maxAdvanceDays: 30, // Máximo 30 días de anticipación
  businessHours: {
    start: "09:00",
    end: "18:45"
  },
  workingDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
  holidays: [
    "2024-01-01", // Año Nuevo
    "2024-03-24", // Día Nacional de la Memoria
    "2024-03-29", // Viernes Santo
    "2024-04-01", // Día del Veterano y de los Caídos en la Guerra de Malvinas
    "2024-04-02", // Día del Veterano y de los Caídos en la Guerra de Malvinas
    "2024-05-01", // Día del Trabajador
    "2024-05-25", // Día de la Revolución de Mayo
    "2024-06-17", // Paso a la Inmortalidad del General Martín Miguel de Güemes
    "2024-06-20", // Paso a la Inmortalidad del General Manuel Belgrano
    "2024-07-09", // Día de la Independencia
    "2024-08-17", // Paso a la Inmortalidad del General José de San Martín
    "2024-10-12", // Día del Respeto a la Diversidad Cultural
    "2024-11-18", // Día de la Soberanía Nacional
    "2024-12-08", // Inmaculada Concepción de María
    "2024-12-25", // Navidad
    "2025-01-01", // Año Nuevo
    "2025-03-24", // Día Nacional de la Memoria
    "2025-04-18", // Viernes Santo
    "2025-04-21", // Día del Veterano y de los Caídos en la Guerra de Malvinas
    "2025-05-01", // Día del Trabajador
    "2025-05-25", // Día de la Revolución de Mayo
    "2025-06-16", // Paso a la Inmortalidad del General Martín Miguel de Güemes
    "2025-06-20", // Paso a la Inmortalidad del General Manuel Belgrano
    "2025-07-09", // Día de la Independencia
    "2025-08-18", // Paso a la Inmortalidad del General José de San Martín
    "2025-10-12", // Día del Respeto a la Diversidad Cultural
    "2025-11-17", // Día de la Soberanía Nacional
    "2025-12-08", // Inmaculada Concepción de María
    "2025-12-25"  // Navidad
  ]
}

/**
 * Valida si un horario es válido para reservar
 */
export function validateAppointmentTime(
  appointmentDate: string,
  appointmentTime: string,
  config: TimeValidationConfig = DEFAULT_CONFIG
): TimeValidationResult {
  
  try {
    console.log(`⏰ Validando horario: ${appointmentDate} ${appointmentTime}`)
    
    const warnings: string[] = []
    
    // 1. Parsear fecha y hora
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)
    const now = new Date()
    
    if (isNaN(appointmentDateTime.getTime())) {
      return {
        isValid: false,
        error: 'Fecha u hora inválida'
      }
    }
    
    // 2. Verificar que no sea en el pasado
    if (appointmentDateTime <= now) {
      return {
        isValid: false,
        error: 'No se pueden reservar horarios en el pasado'
      }
    }
    
    // 3. Verificar anticipación mínima
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursDifference < config.minAdvanceHours) {
      const suggestedTime = new Date(now.getTime() + config.minAdvanceHours * 60 * 60 * 1000)
      return {
        isValid: false,
        error: `Debe reservar con al menos ${config.minAdvanceHours} horas de anticipación`,
        suggestedTime: formatDateForAPI(suggestedTime) + ' ' + suggestedTime.toTimeString().substring(0, 5)
      }
    }
    
    // 4. Verificar anticipación máxima
    const daysDifference = hoursDifference / 24
    if (daysDifference > config.maxAdvanceDays) {
      return {
        isValid: false,
        error: `No se pueden reservar con más de ${config.maxAdvanceDays} días de anticipación`
      }
    }
    
    // 5. Verificar día de la semana
    const dayOfWeek = appointmentDateTime.getDay()
    if (!config.workingDays.includes(dayOfWeek)) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      return {
        isValid: false,
        error: `No hay atención los ${dayNames[dayOfWeek]}s`
      }
    }
    
    // 6. Verificar feriados
    const dateString = formatDateForAPI(appointmentDateTime)
    if (config.holidays.includes(dateString)) {
      return {
        isValid: false,
        error: 'No hay atención en días feriados'
      }
    }
    
    // 7. Verificar horario de atención
    const timeString = appointmentTime
    if (timeString < config.businessHours.start || timeString > config.businessHours.end) {
      return {
        isValid: false,
        error: `Horario de atención: ${config.businessHours.start} - ${config.businessHours.end}`
      }
    }
    
    // 8. Advertencias adicionales
    if (hoursDifference < 24) {
      warnings.push('Recuerda que tienes menos de 24 horas para tu cita')
    }
    
    if (dayOfWeek === 6) { // Sábado
      warnings.push('Los sábados el horario es de 9:00 a 13:00')
    }
    
    // 9. Verificar si es muy temprano en la mañana
    const hour = parseInt(timeString.split(':')[0])
    if (hour < 10) {
      warnings.push('Horarios muy tempranos pueden tener mayor demanda')
    }
    
    console.log(`✅ Horario válido: ${appointmentDate} ${appointmentTime}`)
    
    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    }
    
  } catch (error) {
    console.error('Error validando horario:', error)
    return {
      isValid: false,
      error: 'Error interno validando horario'
    }
  }
}

/**
 * Obtiene el próximo horario disponible válido
 */
export function getNextValidTime(
  config: TimeValidationConfig = DEFAULT_CONFIG
): { date: string; time: string } {
  
  const now = new Date()
  const minTime = new Date(now.getTime() + config.minAdvanceHours * 60 * 60 * 1000)
  
  // Buscar el próximo día laboral
  let nextDate = new Date(minTime)
  let attempts = 0
  const maxAttempts = 14 // Buscar máximo 2 semanas
  
  while (attempts < maxAttempts) {
    const dayOfWeek = nextDate.getDay()
    const dateString = formatDateForAPI(nextDate)
    
    // Verificar si es día laboral y no es feriado
    if (config.workingDays.includes(dayOfWeek) && !config.holidays.includes(dateString)) {
      // Si es el mismo día, verificar que no sea muy temprano
      if (nextDate.toDateString() === minTime.toDateString()) {
        const timeString = minTime.toTimeString().substring(0, 5)
        if (timeString >= config.businessHours.start) {
          return {
            date: dateString,
            time: timeString
          }
        }
      } else {
        // Día diferente, usar horario de inicio
        return {
          date: dateString,
          time: config.businessHours.start
        }
      }
    }
    
    // Pasar al siguiente día
    nextDate.setDate(nextDate.getDate() + 1)
    attempts++
  }
  
  // Fallback: devolver tiempo mínimo
  return {
    date: formatDateForAPI(minTime),
    time: minTime.toTimeString().substring(0, 5)
  }
}

/**
 * Valida múltiples horarios y devuelve solo los válidos
 */
export function filterValidTimes(
  times: string[],
  appointmentDate: string,
  config: TimeValidationConfig = DEFAULT_CONFIG
): { validTimes: string[]; invalidTimes: { time: string; reason: string }[] } {
  
  const validTimes: string[] = []
  const invalidTimes: { time: string; reason: string }[] = []
  
  for (const time of times) {
    const validation = validateAppointmentTime(appointmentDate, time, config)
    
    if (validation.isValid) {
      validTimes.push(time)
    } else {
      invalidTimes.push({
        time,
        reason: validation.error || 'Horario inválido'
      })
    }
  }
  
  return { validTimes, invalidTimes }
}

/**
 * Obtiene configuración personalizada para un especialista
 */
export async function getSpecialistTimeConfig(specialistId: string): Promise<TimeValidationConfig> {
  // Por ahora devolver configuración por defecto
  // En el futuro se puede personalizar por especialista
  return DEFAULT_CONFIG
}

/**
 * Verifica si un horario está dentro del horario de almuerzo
 */
export function isLunchTime(
  appointmentTime: string,
  lunchStart: string = "12:45",
  lunchEnd: string = "14:15"
): boolean {
  return appointmentTime >= lunchStart && appointmentTime < lunchEnd
}

/**
 * Obtiene estadísticas de horarios válidos/inválidos
 */
export function getTimeValidationStats(
  appointments: Array<{ appointment_date: string; appointment_time: string }>
): {
  total: number
  valid: number
  invalid: number
  pastTimes: number
  tooClose: number
  holidays: number
  weekends: number
} {
  
  let valid = 0
  let invalid = 0
  let pastTimes = 0
  let tooClose = 0
  let holidays = 0
  let weekends = 0
  
  const now = new Date()
  
  for (const appointment of appointments) {
    const validation = validateAppointmentTime(appointment.appointment_date, appointment.appointment_time)
    
    if (validation.isValid) {
      valid++
    } else {
      invalid++
      
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
      const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      if (appointmentDateTime <= now) {
        pastTimes++
      } else if (hoursDifference < DEFAULT_CONFIG.minAdvanceHours) {
        tooClose++
      } else if (DEFAULT_CONFIG.holidays.includes(appointment.appointment_date)) {
        holidays++
      } else if (!DEFAULT_CONFIG.workingDays.includes(appointmentDateTime.getDay())) {
        weekends++
      }
    }
  }
  
  return {
    total: appointments.length,
    valid,
    invalid,
    pastTimes,
    tooClose,
    holidays,
    weekends
  }
}
