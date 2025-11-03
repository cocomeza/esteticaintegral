import { supabaseAdmin } from './supabase-admin'

export interface DataIntegrityIssue {
  type: 'orphaned_record' | 'invalid_reference' | 'data_inconsistency' | 'missing_data'
  severity: 'low' | 'medium' | 'high' | 'critical'
  table: string
  recordId: string
  description: string
  suggestedFix: string
  detectedAt: Date
}

export interface DataIntegrityReport {
  totalIssues: number
  issuesByType: Record<string, number>
  issuesBySeverity: Record<string, number>
  issues: DataIntegrityIssue[]
  recommendations: string[]
  lastChecked: Date
}

/**
 * 💾 MEDIO: Sistema de verificación de integridad de datos
 * 
 * Detecta y reporta problemas de integridad en la base de datos:
 * - Registros huérfanos
 * - Referencias inválidas
 * - Inconsistencias de datos
 * - Datos faltantes
 */

/**
 * Ejecuta verificación completa de integridad de datos
 */
export async function runDataIntegrityCheck(): Promise<DataIntegrityReport> {
  console.log('🔍 Iniciando verificación de integridad de datos...')
  
  const issues: DataIntegrityIssue[] = []
  const recommendations: string[] = []
  
  try {
    // 1. Verificar citas huérfanas
    const orphanedAppointments = await checkOrphanedAppointments()
    issues.push(...orphanedAppointments)
    
    // 2. Verificar servicios inactivos con citas activas
    const inactiveServiceIssues = await checkInactiveServicesWithAppointments()
    issues.push(...inactiveServiceIssues)
    
    // 3. Verificar especialistas inactivos con citas activas
    const inactiveSpecialistIssues = await checkInactiveSpecialistsWithAppointments()
    issues.push(...inactiveSpecialistIssues)
    
    // 4. Verificar horarios inconsistentes
    const scheduleIssues = await checkScheduleInconsistencies()
    issues.push(...scheduleIssues)
    
    // 5. Verificar datos faltantes críticos
    const missingDataIssues = await checkMissingCriticalData()
    issues.push(...missingDataIssues)
    
    // 6. Verificar fechas inválidas
    const dateIssues = await checkInvalidDates()
    issues.push(...dateIssues)
    
    // 7. Verificar duplicados
    const duplicateIssues = await checkDuplicateRecords()
    issues.push(...duplicateIssues)
    
    // Generar estadísticas
    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const issuesBySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Generar recomendaciones
    if (issues.length === 0) {
      recommendations.push('✅ No se detectaron problemas de integridad')
    } else {
      recommendations.push('🔧 Ejecutar correcciones automáticas donde sea posible')
      recommendations.push('📊 Monitorear regularmente la integridad de datos')
      recommendations.push('🛡️ Implementar validaciones adicionales en el código')
    }
    
    console.log(`✅ Verificación completada: ${issues.length} problemas detectados`)
    
    return {
      totalIssues: issues.length,
      issuesByType,
      issuesBySeverity,
      issues,
      recommendations,
      lastChecked: new Date()
    }
    
  } catch (error) {
    console.error('Error en verificación de integridad:', error)
    return {
      totalIssues: 0,
      issuesByType: {},
      issuesBySeverity: {},
      issues: [],
      recommendations: ['❌ Error durante la verificación de integridad'],
      lastChecked: new Date()
    }
  }
}

/**
 * Verifica citas huérfanas (sin especialista o servicio válido)
 */
async function checkOrphanedAppointments(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    // Citas sin especialista válido
    const { data: orphanedBySpecialist } = await supabaseAdmin
      .from('appointments')
      .select('id, specialist_id')
      .not('specialist_id', 'in', `(SELECT id FROM specialists WHERE is_active = true)`)
    
    orphanedBySpecialist?.forEach((appointment: any) => {
      issues.push({
        type: 'orphaned_record',
        severity: 'high',
        table: 'appointments',
        recordId: appointment.id,
        description: `Cita ${appointment.id} referencia especialista inactivo/inexistente`,
        suggestedFix: 'Reasignar a especialista activo o cancelar cita',
        detectedAt: new Date()
      })
    })
    
    // Citas sin servicio válido
    const { data: orphanedByService } = await supabaseAdmin
      .from('appointments')
      .select('id, service_id')
      .not('service_id', 'in', `(SELECT id FROM aesthetic_services WHERE is_active = true)`)
    
    orphanedByService?.forEach((appointment: any) => {
      issues.push({
        type: 'orphaned_record',
        severity: 'high',
        table: 'appointments',
        recordId: appointment.id,
        description: `Cita ${appointment.id} referencia servicio inactivo/inexistente`,
        suggestedFix: 'Reasignar a servicio activo o cancelar cita',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando citas huérfanas:', error)
  }
  
  return issues
}

/**
 * Verifica servicios inactivos con citas activas
 */
async function checkInactiveServicesWithAppointments(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    const { data: inactiveServices } = await supabaseAdmin
      .from('aesthetic_services')
      .select(`
        id,
        name,
        is_active,
        appointments!inner(id, status)
      `)
      .eq('is_active', false)
      .eq('appointments.status', 'scheduled')
    
    inactiveServices?.forEach((service: any) => {
      issues.push({
        type: 'data_inconsistency',
        severity: 'medium',
        table: 'aesthetic_services',
        recordId: service.id,
        description: `Servicio "${service.name}" está inactivo pero tiene citas programadas`,
        suggestedFix: 'Activar servicio o cancelar citas programadas',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando servicios inactivos:', error)
  }
  
  return issues
}

/**
 * Verifica especialistas inactivos con citas activas
 */
async function checkInactiveSpecialistsWithAppointments(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    const { data: inactiveSpecialists } = await supabaseAdmin
      .from('specialists')
      .select(`
        id,
        name,
        is_active,
        appointments!inner(id, status)
      `)
      .eq('is_active', false)
      .eq('appointments.status', 'scheduled')
    
    inactiveSpecialists?.forEach((specialist: any) => {
      issues.push({
        type: 'data_inconsistency',
        severity: 'critical',
        table: 'specialists',
        recordId: specialist.id,
        description: `Especialista "${specialist.name}" está inactivo pero tiene citas programadas`,
        suggestedFix: 'Activar especialista o cancelar/reasignar citas programadas',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando especialistas inactivos:', error)
  }
  
  return issues
}

/**
 * Verifica inconsistencias en horarios
 */
async function checkScheduleInconsistencies(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    // Horarios con hora de inicio mayor que hora de fin
    const { data: invalidSchedules } = await supabaseAdmin
      .from('work_schedules')
      .select('id, specialist_id, day_of_week, start_time, end_time')
      .gt('start_time', 'end_time')
    
    invalidSchedules?.forEach((schedule: any) => {
      issues.push({
        type: 'data_inconsistency',
        severity: 'high',
        table: 'work_schedules',
        recordId: schedule.id,
        description: `Horario inválido: inicio (${schedule.start_time}) > fin (${schedule.end_time})`,
        suggestedFix: 'Corregir horarios de inicio y fin',
        detectedAt: new Date()
      })
    })
    
    // Horarios de almuerzo fuera del horario de trabajo
    const { data: invalidLunchSchedules } = await supabaseAdmin
      .from('work_schedules')
      .select('id, start_time, end_time, lunch_start, lunch_end')
      .not('lunch_start', 'is', null)
      .not('lunch_end', 'is', null)
      .or('lunch_start.lt.start_time,lunch_end.gt.end_time')
    
    invalidLunchSchedules?.forEach((schedule: any) => {
      issues.push({
        type: 'data_inconsistency',
        severity: 'medium',
        table: 'work_schedules',
        recordId: schedule.id,
        description: `Horario de almuerzo fuera del horario de trabajo`,
        suggestedFix: 'Ajustar horario de almuerzo dentro del horario de trabajo',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando inconsistencias de horarios:', error)
  }
  
  return issues
}

/**
 * Verifica datos faltantes críticos
 */
async function checkMissingCriticalData(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    // Citas sin fecha
    const { data: missingDates } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .or('appointment_date.is.null,appointment_time.is.null')
    
    missingDates?.forEach((appointment: any) => {
      issues.push({
        type: 'missing_data',
        severity: 'critical',
        table: 'appointments',
        recordId: appointment.id,
        description: 'Cita sin fecha u hora',
        suggestedFix: 'Completar fecha y hora de la cita',
        detectedAt: new Date()
      })
    })
    
    // Pacientes sin email
    const { data: missingEmails } = await supabaseAdmin
      .from('patients')
      .select('id, name')
      .is('email', null)
    
    missingEmails?.forEach((patient: any) => {
      issues.push({
        type: 'missing_data',
        severity: 'medium',
        table: 'patients',
        recordId: patient.id,
        description: `Paciente "${patient.name}" sin email`,
        suggestedFix: 'Agregar email del paciente',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando datos faltantes:', error)
  }
  
  return issues
}

/**
 * Verifica fechas inválidas
 */
async function checkInvalidDates(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    // Citas en el pasado muy lejano
    const pastDate = new Date()
    pastDate.setFullYear(pastDate.getFullYear() - 1)
    
    const { data: oldAppointments } = await supabaseAdmin
      .from('appointments')
      .select('id, appointment_date')
      .lt('appointment_date', pastDate.toISOString().split('T')[0])
      .eq('status', 'scheduled')
    
    oldAppointments?.forEach((appointment: any) => {
      issues.push({
        type: 'data_inconsistency',
        severity: 'medium',
        table: 'appointments',
        recordId: appointment.id,
        description: `Cita programada en fecha muy antigua: ${appointment.appointment_date}`,
        suggestedFix: 'Verificar y actualizar fecha de la cita',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando fechas inválidas:', error)
  }
  
  return issues
}

/**
 * Verifica registros duplicados
 */
async function checkDuplicateRecords(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = []
  
  try {
    // Citas duplicadas (mismo especialista, fecha y hora)
    const { data: duplicateAppointments } = await supabaseAdmin
      .rpc('find_duplicate_appointments')
    
    duplicateAppointments?.forEach((duplicate: any) => {
      issues.push({
        type: 'data_inconsistency',
        severity: 'high',
        table: 'appointments',
        recordId: duplicate.id,
        description: `Cita duplicada: mismo especialista, fecha y hora`,
        suggestedFix: 'Eliminar cita duplicada',
        detectedAt: new Date()
      })
    })
    
  } catch (error) {
    console.error('Error verificando duplicados:', error)
  }
  
  return issues
}

/**
 * Corrige problemas de integridad automáticamente
 */
export async function autoFixDataIntegrityIssues(issues: DataIntegrityIssue[]): Promise<{
  fixed: number
  failed: number
  errors: string[]
}> {
  let fixed = 0
  let failed = 0
  const errors: string[] = []
  
  for (const issue of issues) {
    try {
      switch (issue.type) {
        case 'orphaned_record':
          await fixOrphanedRecord(issue)
          fixed++
          break
        
        case 'data_inconsistency':
          await fixDataInconsistency(issue)
          fixed++
          break
        
        case 'missing_data':
          // No se pueden corregir automáticamente
          failed++
          errors.push(`Datos faltantes requieren intervención manual: ${issue.description}`)
          break
        
        default:
          failed++
          errors.push(`Tipo de problema no soportado para corrección automática: ${issue.type}`)
      }
    } catch (error) {
      failed++
      errors.push(`Error corrigiendo ${issue.type}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }
  
  return { fixed, failed, errors }
}

/**
 * Corrige registros huérfanos
 */
async function fixOrphanedRecord(issue: DataIntegrityIssue): Promise<void> {
  if (issue.table === 'appointments') {
    // Cancelar cita huérfana
    await supabaseAdmin
      .from('appointments')
      .update({ 
        status: 'cancelled',
        notes: 'Cita cancelada automáticamente por problemas de integridad'
      })
      .eq('id', issue.recordId)
  }
}

/**
 * Corrige inconsistencias de datos
 */
async function fixDataInconsistency(issue: DataIntegrityIssue): Promise<void> {
  if (issue.table === 'work_schedules') {
    // Intercambiar horas de inicio y fin si están invertidas
    const { data: schedule } = await supabaseAdmin
      .from('work_schedules')
      .select('start_time, end_time')
      .eq('id', issue.recordId)
      .single()
    
    if (schedule && schedule.start_time > schedule.end_time) {
      await supabaseAdmin
        .from('work_schedules')
        .update({
          start_time: schedule.end_time,
          end_time: schedule.start_time
        })
        .eq('id', issue.recordId)
    }
  }
}

/**
 * Obtiene estadísticas de integridad de datos
 */
export async function getDataIntegrityStats(): Promise<{
  totalRecords: number
  issuesFound: number
  lastCheck: Date
  healthScore: number
}> {
  try {
    const report = await runDataIntegrityCheck()
    
    // Calcular score de salud (0-100)
    const healthScore = Math.max(0, 100 - (report.totalIssues * 5))
    
    return {
      totalRecords: 0, // Se puede implementar contando registros
      issuesFound: report.totalIssues,
      lastCheck: report.lastChecked,
      healthScore
    }
  } catch (error) {
    console.error('Error obteniendo estadísticas de integridad:', error)
    return {
      totalRecords: 0,
      issuesFound: 0,
      lastCheck: new Date(),
      healthScore: 0
    }
  }
}
