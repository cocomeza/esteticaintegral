/**
 * 🌍 CRÍTICO: Sistema de manejo de zonas horarias
 * 
 * Problema: Las fechas pueden cambiar al cruzar zonas horarias
 * Solución: Manejo consistente usando zona horaria de Argentina
 */

export interface TimezoneInfo {
  timezone: string
  offset: number // en minutos
  isDST: boolean // Daylight Saving Time
  abbreviation: string
}

export interface DateTimeResult {
  localDate: string // YYYY-MM-DD en zona local
  localTime: string // HH:MM en zona local
  utcDate: string // YYYY-MM-DD en UTC
  utcTime: string // HH:MM en UTC
  timestamp: number // Unix timestamp
  timezoneInfo: TimezoneInfo
}

// Zona horaria de Argentina (UTC-3, sin horario de verano desde 2009)
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires'
const ARGENTINA_OFFSET = -180 // -3 horas en minutos

/**
 * Convierte una fecha/hora a la zona horaria de Argentina
 */
export function toArgentinaTime(date: Date | string): DateTimeResult {
  const inputDate = typeof date === 'string' ? new Date(date) : date
  
  // Crear fecha en zona horaria de Argentina
  const argentinaDate = new Date(inputDate.toLocaleString("en-US", { timeZone: ARGENTINA_TIMEZONE }))
  
  // Obtener componentes locales
  const localDate = formatDateForAPI(argentinaDate)
  const localTime = formatTimeForAPI(argentinaDate)
  
  // Obtener componentes UTC
  const utcDate = inputDate.toISOString().split('T')[0]
  const utcTime = inputDate.toISOString().split('T')[1].substring(0, 5)
  
  return {
    localDate,
    localTime,
    utcDate,
    utcTime,
    timestamp: inputDate.getTime(),
    timezoneInfo: {
      timezone: ARGENTINA_TIMEZONE,
      offset: ARGENTINA_OFFSET,
      isDST: false, // Argentina no usa horario de verano
      abbreviation: 'ART' // Argentina Time
    }
  }
}

/**
 * Convierte una fecha/hora desde UTC a zona horaria de Argentina
 */
export function fromUTCToArgentina(utcDate: string, utcTime: string): DateTimeResult {
  const utcDateTime = new Date(`${utcDate}T${utcTime}:00.000Z`)
  return toArgentinaTime(utcDateTime)
}

/**
 * Obtiene la fecha/hora actual en zona horaria de Argentina
 */
export function getCurrentArgentinaTime(): DateTimeResult {
  return toArgentinaTime(new Date())
}

/**
 * Valida si una fecha está en formato correcto para Argentina
 */
export function validateArgentinaDate(dateString: string): { isValid: boolean; error?: string; correctedDate?: string } {
  try {
    // Parsear fecha como si fuera local (Argentina)
    const date = new Date(dateString + 'T00:00:00')
    
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: 'Fecha inválida'
      }
    }
    
    // Verificar que la fecha parseada coincida con la entrada
    const parsedDateString = formatDateForAPI(date)
    if (parsedDateString !== dateString) {
      return {
        isValid: false,
        error: 'Fecha fuera de rango válido',
        correctedDate: parsedDateString
      }
    }
    
    return {
      isValid: true
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Error procesando fecha'
    }
  }
}

/**
 * Convierte fecha del frontend (que puede venir en UTC) a Argentina
 */
export function normalizeFrontendDate(frontendDate: string): string {
  try {
    // Si viene como "YYYY-MM-DD", asumir que es local
    if (/^\d{4}-\d{2}-\d{2}$/.test(frontendDate)) {
      const validation = validateArgentinaDate(frontendDate)
      if (validation.isValid) {
        return frontendDate
      } else if (validation.correctedDate) {
        return validation.correctedDate
      }
    }
    
    // Si viene como ISO string o timestamp, convertir
    const date = new Date(frontendDate)
    if (isNaN(date.getTime())) {
      throw new Error('Fecha inválida')
    }
    
    const argentinaTime = toArgentinaTime(date)
    return argentinaTime.localDate
    
  } catch (error) {
    console.error('Error normalizando fecha del frontend:', error)
    return frontendDate // Devolver original si hay error
  }
}

/**
 * Convierte hora del frontend a formato consistente
 */
export function normalizeFrontendTime(frontendTime: string): string {
  try {
    // Validar formato HH:MM
    if (!/^\d{2}:\d{2}$/.test(frontendTime)) {
      throw new Error('Formato de hora inválido')
    }
    
    const [hours, minutes] = frontendTime.split(':').map(Number)
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Hora fuera de rango válido')
    }
    
    return frontendTime
    
  } catch (error) {
    console.error('Error normalizando hora del frontend:', error)
    return frontendTime
  }
}

/**
 * Obtiene el día de la semana en zona horaria de Argentina
 */
export function getArgentinaDayOfWeek(dateString: string): number {
  try {
    const date = new Date(dateString + 'T00:00:00')
    return date.getDay() // 0 = Domingo, 1 = Lunes, etc.
  } catch (error) {
    console.error('Error obteniendo día de la semana:', error)
    return 0
  }
}

/**
 * Compara dos fechas considerando zona horaria de Argentina
 */
export function compareArgentinaDates(date1: string, date2: string): number {
  try {
    const d1 = new Date(date1 + 'T00:00:00')
    const d2 = new Date(date2 + 'T00:00:00')
    
    return d1.getTime() - d2.getTime()
  } catch (error) {
    console.error('Error comparando fechas:', error)
    return 0
  }
}

/**
 * Obtiene información detallada de zona horaria para debugging
 */
export function getTimezoneDebugInfo(): {
  browserTimezone: string
  argentinaTimezone: string
  currentOffset: number
  argentinaOffset: number
  isDST: boolean
  currentTime: string
  argentinaTime: string
} {
  const now = new Date()
  
  return {
    browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    argentinaTimezone: ARGENTINA_TIMEZONE,
    currentOffset: now.getTimezoneOffset(),
    argentinaOffset: ARGENTINA_OFFSET,
    isDST: false, // Argentina no usa DST
    currentTime: now.toISOString(),
    argentinaTime: now.toLocaleString("en-US", { timeZone: ARGENTINA_TIMEZONE })
  }
}

/**
 * Formatea fecha para API (YYYY-MM-DD)
 */
function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formatea hora para API (HH:MM)
 */
function formatTimeForAPI(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Convierte timestamp Unix a fecha Argentina
 */
export function timestampToArgentina(timestamp: number): DateTimeResult {
  return toArgentinaTime(new Date(timestamp))
}

/**
 * Obtiene el inicio del día en Argentina
 */
export function getArgentinaDayStart(dateString: string): DateTimeResult {
  const date = new Date(dateString + 'T00:00:00')
  return toArgentinaTime(date)
}

/**
 * Obtiene el fin del día en Argentina
 */
export function getArgentinaDayEnd(dateString: string): DateTimeResult {
  const date = new Date(dateString + 'T23:59:59')
  return toArgentinaTime(date)
}

/**
 * Verifica si una fecha es hoy en Argentina
 */
export function isTodayInArgentina(dateString: string): boolean {
  const today = getCurrentArgentinaTime()
  return today.localDate === dateString
}

/**
 * Obtiene días de diferencia considerando zona horaria Argentina
 */
export function getDaysDifferenceInArgentina(date1: string, date2: string): number {
  try {
    const d1 = new Date(date1 + 'T00:00:00')
    const d2 = new Date(date2 + 'T00:00:00')
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('Error calculando diferencia de días:', error)
    return 0
  }
}
