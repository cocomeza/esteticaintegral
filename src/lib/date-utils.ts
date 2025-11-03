/**
 * Utilidades para el manejo correcto de fechas sin problemas de zona horaria
 * Este archivo centraliza todas las funciones de manejo de fechas para evitar
 * desfases entre la fecha guardada en la base de datos y la mostrada en la UI
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD usando la zona horaria local
 * Evita problemas de desfase que ocurren con toISOString()
 */
export function getTodayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
}

/**
 * Formatea una fecha en formato YYYY-MM-DD para mostrar en la UI
 * Sin problemas de zona horaria - VERSIÓN MEJORADA
 */
export function formatDateForDisplay(ymd: string): string {
  if (!ymd) return ymd
  
  try {
    // Validar formato de fecha
    if (!isValidDateString(ymd)) {
      console.warn('Fecha inválida recibida:', ymd)
      return ymd
    }
    
    // Parsear la fecha directamente sin crear objeto Date para evitar conversiones de zona horaria
    const [year, month, day] = ymd.split('-').map(Number)
    
    const weekdays = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
    
    // Crear fecha local directamente para obtener el día de la semana correcto
    // Usar mediodía para evitar problemas de zona horaria
    const localDate = new Date(year, month - 1, day, 12, 0, 0)
    const weekday = weekdays[localDate.getDay()]
    const monthName = months[month - 1]
    const dayStr = day.toString().padStart(2, '0')
    
    const result = `${weekday}, ${dayStr} ${monthName} ${year}`
    
    // Depuración adicional
    console.log(`📅 formatDateForDisplay: ${ymd} -> ${result}`)
    
    return result
  } catch (error) {
    console.error('Error formateando fecha:', ymd, error)
    return ymd
  }
}

/**
 * Formatea una fecha Date para enviar a la API en formato YYYY-MM-DD
 * Usa la zona horaria local para evitar desfases
 */
export function formatDateForAPI(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a un objeto Date local
 * Evita problemas de zona horaria al crear el objeto Date
 */
export function parseLocalDate(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Obtiene el día de la semana (0-6) para una fecha en formato YYYY-MM-DD
 * Usando zona horaria local
 */
export function getDayOfWeek(ymd: string): number {
  const localDate = parseLocalDate(ymd)
  return localDate.getDay()
}

/**
 * Valida si una fecha en formato YYYY-MM-DD es válida
 */
export function isValidDateString(ymd: string): boolean {
  if (!ymd || typeof ymd !== 'string') return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(ymd)) return false
  
  const [year, month, day] = ymd.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day
}

/**
 * Función específica para corregir fechas que pueden venir con problemas de zona horaria
 * desde la base de datos
 */
export function fixDateFromDatabase(dateString: string): string {
  if (!dateString) return dateString
  
  console.log(`🔧 Corrigiendo fecha de BD: ${dateString}`)
  
  try {
    // Si ya está en formato YYYY-MM-DD, validarlo y devolverlo
    if (isValidDateString(dateString)) {
      console.log(`✅ Fecha ya válida: ${dateString}`)
      return dateString
    }
    
    // Si viene como timestamp o ISO string, extraer solo la fecha
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      console.warn(`❌ Fecha inválida: ${dateString}`)
      return dateString
    }
    
    // Usar métodos locales para evitar problemas de zona horaria
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    const correctedDate = `${year}-${month}-${day}`
    console.log(`🔧 Fecha corregida: ${dateString} -> ${correctedDate}`)
    
    return correctedDate
  } catch (error) {
    console.error('Error corrigiendo fecha:', dateString, error)
    return dateString
  }
}

/**
 * Función de depuración para investigar problemas de fechas
 */
export function debugDateProblem(originalDate: string, context: string = 'unknown') {
  console.log(`\n🔍 DEPURACIÓN DE FECHA [${context}]:`)
  console.log(`   Fecha original: ${originalDate}`)
  
  try {
    const date = new Date(originalDate)
    console.log(`   Objeto Date: ${date.toString()}`)
    console.log(`   toISOString(): ${date.toISOString()}`)
    console.log(`   toISOString().split('T')[0]: ${date.toISOString().split('T')[0]}`)
    console.log(`   Métodos locales:`)
    console.log(`     getFullYear(): ${date.getFullYear()}`)
    console.log(`     getMonth() + 1: ${date.getMonth() + 1}`)
    console.log(`     getDate(): ${date.getDate()}`)
    console.log(`   Métodos UTC:`)
    console.log(`     getUTCFullYear(): ${date.getUTCFullYear()}`)
    console.log(`     getUTCMonth() + 1: ${date.getUTCMonth() + 1}`)
    console.log(`     getUTCDate(): ${date.getUTCDate()}`)
    
    const localFormatted = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    const utcFormatted = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`
    
    console.log(`   Formateo local: ${localFormatted}`)
    console.log(`   Formateo UTC: ${utcFormatted}`)
    console.log(`   ¿Diferencia? ${localFormatted !== utcFormatted}`)
    
  } catch (error) {
    console.error(`   Error en depuración: ${error}`)
  }
}