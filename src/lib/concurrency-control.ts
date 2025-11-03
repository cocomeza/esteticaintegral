import { supabaseAdmin } from './supabase-admin'

export interface ConcurrencyControl {
  version: number
  lastModified: Date
  modifiedBy: string
  checksum: string
}

export interface ConcurrencyResult<T> {
  success: boolean
  data?: T
  error?: string
  conflict?: {
    currentVersion: number
    attemptedVersion: number
    lastModified: Date
    modifiedBy: string
  }
}

/**
 * 🔄 MEDIO: Sistema de control de concurrencia
 * 
 * Previene conflictos cuando múltiples usuarios modifican el mismo recurso
 * simultáneamente usando optimistic locking con versionado.
 */

/**
 * Obtiene información de concurrencia para una cita
 */
export async function getAppointmentConcurrencyInfo(appointmentId: string): Promise<ConcurrencyControl | null> {
  try {
    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, updated_at, version')
      .eq('id', appointmentId)
      .single()

    if (!appointment) {
      return null
    }

    return {
      version: appointment.version || 1,
      lastModified: new Date(appointment.updated_at),
      modifiedBy: 'system', // Se puede expandir para trackear usuario
      checksum: generateChecksum(appointment)
    }
  } catch (error) {
    console.error('Error obteniendo información de concurrencia:', error)
    return null
  }
}

/**
 * Actualiza una cita con control de concurrencia
 */
export async function updateAppointmentWithConcurrency<T>(
  appointmentId: string,
  updateData: any,
  expectedVersion: number,
  modifiedBy: string = 'system'
): Promise<ConcurrencyResult<T>> {
  
  try {
    console.log(`🔄 Actualizando cita ${appointmentId} con versión ${expectedVersion}`)

    // 1. Verificar versión actual
    const currentInfo = await getAppointmentConcurrencyInfo(appointmentId)
    if (!currentInfo) {
      return {
        success: false,
        error: 'Cita no encontrada'
      }
    }

    if (currentInfo.version !== expectedVersion) {
      return {
        success: false,
        error: 'La cita ha sido modificada por otro usuario',
        conflict: {
          currentVersion: currentInfo.version,
          attemptedVersion: expectedVersion,
          lastModified: currentInfo.lastModified,
          modifiedBy: currentInfo.modifiedBy
        }
      }
    }

    // 2. Preparar datos de actualización
    const updatePayload = {
      ...updateData,
      version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
      modified_by: modifiedBy
    }

    // 3. Actualizar con condición de versión
    const { data: updatedAppointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)
      .eq('version', expectedVersion) // Condición crítica para evitar conflictos
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        notes,
        version,
        updated_at,
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
      // Verificar si es error de concurrencia
      if (error.code === 'PGRST116' || error.message.includes('No rows returned')) {
        return {
          success: false,
          error: 'La cita ha sido modificada por otro usuario. Por favor recarga y vuelve a intentar.',
          conflict: {
            currentVersion: currentInfo.version + 1,
            attemptedVersion: expectedVersion,
            lastModified: new Date(),
            modifiedBy: 'unknown'
          }
        }
      }

      return {
        success: false,
        error: `Error actualizando cita: ${error.message}`
      }
    }

    console.log(`✅ Cita actualizada exitosamente: versión ${expectedVersion + 1}`)

    return {
      success: true,
      data: updatedAppointment as T
    }

  } catch (error) {
    console.error('Error en updateAppointmentWithConcurrency:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtiene historial de cambios de una cita
 */
export async function getAppointmentChangeHistory(appointmentId: string): Promise<Array<{
  version: number
  changes: any
  modifiedBy: string
  modifiedAt: Date
  reason?: string
}>> {
  try {
    const { data: history } = await supabaseAdmin
      .from('appointment_changes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('version', { ascending: false })

    return history?.map((change: any) => ({
      version: change.version,
      changes: change.changes,
      modifiedBy: change.modified_by,
      modifiedAt: new Date(change.modified_at),
      reason: change.reason
    })) || []
  } catch (error) {
    console.error('Error obteniendo historial de cambios:', error)
    return []
  }
}

/**
 * Registra un cambio en el historial
 */
export async function logAppointmentChange(
  appointmentId: string,
  version: number,
  changes: any,
  modifiedBy: string,
  reason?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('appointment_changes')
      .insert([{
        appointment_id: appointmentId,
        version,
        changes,
        modified_by: modifiedBy,
        reason,
        modified_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error registrando cambio:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error en logAppointmentChange:', error)
    return false
  }
}

/**
 * Resuelve conflictos de concurrencia automáticamente
 */
export async function resolveConcurrencyConflict(
  appointmentId: string,
  conflictData: any,
  resolutionStrategy: 'merge' | 'override' | 'manual' = 'manual'
): Promise<ConcurrencyResult<any>> {
  
  try {
    console.log(`🔄 Resolviendo conflicto para cita ${appointmentId}`)

    switch (resolutionStrategy) {
      case 'merge':
        return await mergeConflictingChanges(appointmentId, conflictData)
      
      case 'override':
        return await overrideConflictingChanges(appointmentId, conflictData)
      
      case 'manual':
      default:
        return {
          success: false,
          error: 'Conflicto requiere resolución manual',
          conflict: conflictData
        }
    }
  } catch (error) {
    console.error('Error resolviendo conflicto:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error resolviendo conflicto'
    }
  }
}

/**
 * Fusiona cambios conflictivos inteligentemente
 */
async function mergeConflictingChanges(appointmentId: string, conflictData: any): Promise<ConcurrencyResult<any>> {
  // Implementar lógica de fusión inteligente
  // Por ahora, devolver error para resolución manual
  return {
    success: false,
    error: 'Fusión automática no implementada. Resolución manual requerida.'
  }
}

/**
 * Sobrescribe cambios conflictivos
 */
async function overrideConflictingChanges(appointmentId: string, conflictData: any): Promise<ConcurrencyResult<any>> {
  // Implementar lógica de sobrescritura
  // Por ahora, devolver error para resolución manual
  return {
    success: false,
    error: 'Sobrescritura automática no implementada. Resolución manual requerida.'
  }
}

/**
 * Genera checksum para detectar cambios
 */
function generateChecksum(data: any): string {
  const str = JSON.stringify(data, Object.keys(data).sort())
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convertir a 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Verifica si hay cambios pendientes en una cita
 */
export async function hasPendingChanges(appointmentId: string): Promise<boolean> {
  try {
    const { data: pendingChanges } = await supabaseAdmin
      .from('appointment_changes')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending')
      .limit(1)

    return pendingChanges && pendingChanges.length > 0
  } catch (error) {
    console.error('Error verificando cambios pendientes:', error)
    return false
  }
}

/**
 * Obtiene estadísticas de conflictos de concurrencia
 */
export async function getConcurrencyStats(): Promise<{
  totalConflicts: number
  resolvedConflicts: number
  pendingConflicts: number
  conflictsByType: Record<string, number>
}> {
  try {
    const { data: conflicts } = await supabaseAdmin
      .from('concurrency_conflicts')
      .select('status, conflict_type')

    const stats = {
      totalConflicts: conflicts?.length || 0,
      resolvedConflicts: conflicts?.filter((c: any) => c.status === 'resolved').length || 0,
      pendingConflicts: conflicts?.filter((c: any) => c.status === 'pending').length || 0,
      conflictsByType: {} as Record<string, number>
    }

    // Contar por tipo
    conflicts?.forEach((conflict: any) => {
      const type = conflict.conflict_type || 'unknown'
      stats.conflictsByType[type] = (stats.conflictsByType[type] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error obteniendo estadísticas de concurrencia:', error)
    return {
      totalConflicts: 0,
      resolvedConflicts: 0,
      pendingConflicts: 0,
      conflictsByType: {}
    }
  }
}

/**
 * Limpia conflictos antiguos resueltos
 */
export async function cleanupResolvedConflicts(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data: deletedConflicts } = await supabaseAdmin
      .from('concurrency_conflicts')
      .delete()
      .eq('status', 'resolved')
      .lt('resolved_at', cutoffDate.toISOString())
      .select('id')

    const deletedCount = deletedConflicts?.length || 0
    if (deletedCount > 0) {
      console.log(`🧹 Limpiados ${deletedCount} conflictos resueltos`)
    }

    return deletedCount
  } catch (error) {
    console.error('Error limpiando conflictos resueltos:', error)
    return 0
  }
}
