import { supabaseAdmin } from './supabase-admin'

export interface AppointmentLock {
  id: string
  specialistId: string
  appointmentDate: string
  appointmentTime: string
  lockedBy: string // IP address o session ID
  lockedAt: Date
  expiresAt: Date
}

export interface LockResult {
  success: boolean
  lockId?: string
  error?: string
  existingLock?: AppointmentLock
}

/**
 * 🔒 CRÍTICO: Sistema de locks para prevenir race conditions
 * 
 * Este sistema previene que múltiples usuarios reserven el mismo horario
 * simultáneamente mediante locks temporales en la base de datos.
 */

const LOCK_DURATION_MINUTES = 5 // Lock por 5 minutos
const CLEANUP_INTERVAL_MINUTES = 10 // Limpiar locks expirados cada 10 min

/**
 * Intenta obtener un lock para un horario específico
 */
export async function acquireAppointmentLock(
  specialistId: string,
  appointmentDate: string,
  appointmentTime: string,
  clientIdentifier: string // IP o session ID
): Promise<LockResult> {
  
  try {
    console.log(`🔒 Intentando adquirir lock para ${appointmentDate} ${appointmentTime}`)
    
    // 1. Limpiar locks expirados primero
    await cleanupExpiredLocks()
    
    // 2. Verificar si ya existe un lock activo
    const { data: existingLock } = await supabaseAdmin
      .from('appointment_locks')
      .select('*')
      .eq('specialist_id', specialistId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingLock) {
      console.log(`❌ Lock ya existe para ${appointmentDate} ${appointmentTime}`)
      return {
        success: false,
        error: 'Este horario está siendo reservado por otro usuario. Intenta en unos minutos.',
        existingLock: {
          id: existingLock.id,
          specialistId: existingLock.specialist_id,
          appointmentDate: existingLock.appointment_date,
          appointmentTime: existingLock.appointment_time,
          lockedBy: existingLock.locked_by,
          lockedAt: new Date(existingLock.locked_at),
          expiresAt: new Date(existingLock.expires_at)
        }
      }
    }

    // 3. Crear nuevo lock
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)

    const { data: newLock, error } = await supabaseAdmin
      .from('appointment_locks')
      .insert([{
        id: lockId,
        specialist_id: specialistId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        locked_by: clientIdentifier,
        locked_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creando lock:', error)
      return {
        success: false,
        error: 'Error interno al reservar horario'
      }
    }

    console.log(`✅ Lock adquirido: ${lockId}`)
    return {
      success: true,
      lockId: lockId
    }

  } catch (error) {
    console.error('Error en acquireAppointmentLock:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

/**
 * Libera un lock específico
 */
export async function releaseAppointmentLock(lockId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('appointment_locks')
      .delete()
      .eq('id', lockId)

    if (error) {
      console.error('Error liberando lock:', error)
      return false
    }

    console.log(`🔓 Lock liberado: ${lockId}`)
    return true
  } catch (error) {
    console.error('Error en releaseAppointmentLock:', error)
    return false
  }
}

/**
 * Verifica si un lock sigue siendo válido
 */
export async function isLockValid(lockId: string): Promise<boolean> {
  try {
    const { data: lock } = await supabaseAdmin
      .from('appointment_locks')
      .select('expires_at')
      .eq('id', lockId)
      .gt('expires_at', new Date().toISOString())
      .single()

    return !!lock
  } catch (error) {
    console.error('Error verificando lock:', error)
    return false
  }
}

/**
 * Limpia locks expirados
 */
export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const { data: deletedLocks, error } = await supabaseAdmin
      .from('appointment_locks')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Error limpiando locks expirados:', error)
      return 0
    }

    const cleanedCount = deletedLocks?.length || 0
    if (cleanedCount > 0) {
      console.log(`🧹 Limpiados ${cleanedCount} locks expirados`)
    }

    return cleanedCount
  } catch (error) {
    console.error('Error en cleanupExpiredLocks:', error)
    return 0
  }
}

/**
 * Obtiene información de locks activos (para debugging)
 */
export async function getActiveLocks(): Promise<AppointmentLock[]> {
  try {
    const { data: locks } = await supabaseAdmin
      .from('appointment_locks')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('locked_at', { ascending: false })

    return locks?.map((lock: any) => ({
      id: lock.id,
      specialistId: lock.specialist_id,
      appointmentDate: lock.appointment_date,
      appointmentTime: lock.appointment_time,
      lockedBy: lock.locked_by,
      lockedAt: new Date(lock.locked_at),
      expiresAt: new Date(lock.expires_at)
    })) || []
  } catch (error) {
    console.error('Error obteniendo locks activos:', error)
    return []
  }
}

/**
 * Extiende la duración de un lock existente
 */
export async function extendLock(lockId: string, additionalMinutes: number = 5): Promise<boolean> {
  try {
    const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000)
    
    const { error } = await supabaseAdmin
      .from('appointment_locks')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', lockId)

    if (error) {
      console.error('Error extendiendo lock:', error)
      return false
    }

    console.log(`⏰ Lock extendido: ${lockId} hasta ${newExpiresAt.toISOString()}`)
    return true
  } catch (error) {
    console.error('Error en extendLock:', error)
    return false
  }
}

/**
 * Obtiene el identificador del cliente (IP + User Agent)
 */
export function getClientIdentifier(req: any): string {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress ||
             'unknown'
  
  const userAgent = req.headers['user-agent'] || 'unknown'
  
  // Crear hash simple del identificador
  const identifier = `${ip}_${userAgent}`
  return Buffer.from(identifier).toString('base64').substring(0, 32)
}

/**
 * Función de utilidad para manejar locks en transacciones
 */
export async function withAppointmentLock<T>(
  specialistId: string,
  appointmentDate: string,
  appointmentTime: string,
  clientIdentifier: string,
  operation: (lockId: string) => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  
  // 1. Adquirir lock
  const lockResult = await acquireAppointmentLock(
    specialistId,
    appointmentDate,
    appointmentTime,
    clientIdentifier
  )

  if (!lockResult.success) {
    return {
      success: false,
      error: lockResult.error
    }
  }

  try {
    // 2. Ejecutar operación
    const result = await operation(lockResult.lockId!)
    
    // 3. Liberar lock
    await releaseAppointmentLock(lockResult.lockId!)
    
    return {
      success: true,
      result
    }
  } catch (error) {
    // 4. En caso de error, liberar lock
    await releaseAppointmentLock(lockResult.lockId!)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
