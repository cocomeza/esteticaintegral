import { supabaseAdmin } from './supabase-admin'

export interface PerformanceMetrics {
  timestamp: Date
  operation: string
  duration: number
  memoryUsage: number
  databaseQueries: number
  cacheHits: number
  cacheMisses: number
  errors: number
}

export interface OptimizationResult {
  operation: string
  beforeOptimization: PerformanceMetrics
  afterOptimization: PerformanceMetrics
  improvement: {
    durationImprovement: number
    memoryImprovement: number
    queryReduction: number
    cacheHitImprovement: number
  }
  recommendations: string[]
}

/**
 * 🎨 BAJO: Sistema de optimizaciones de rendimiento
 * 
 * Implementa optimizaciones para mejorar el rendimiento:
 * - Cache inteligente
 * - Optimización de consultas
 * - Compresión de datos
 * - Lazy loading
 * - Connection pooling
 */

class PerformanceOptimizer {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private metrics: PerformanceMetrics[] = []
  private queryCache = new Map<string, { result: any; timestamp: number }>()

  /**
   * Cache inteligente con TTL
   */
  setCache(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Optimización de consultas con cache
   */
  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const startTime = Date.now()
    let memoryBefore = process.memoryUsage().heapUsed

    try {
      // Intentar obtener del cache primero
      const cached = this.getCache(queryKey)
      if (cached) {
        this.recordMetrics({
          timestamp: new Date(),
          operation: `cache_hit_${queryKey}`,
          duration: Date.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed - memoryBefore,
          databaseQueries: 0,
          cacheHits: 1,
          cacheMisses: 0,
          errors: 0
        })
        return cached
      }

      // Ejecutar consulta
      const result = await queryFn()
      
      // Guardar en cache
      this.setCache(queryKey, result, ttlSeconds)

      this.recordMetrics({
        timestamp: new Date(),
        operation: `query_${queryKey}`,
        duration: Date.now() - startTime,
        memoryUsage: process.memoryUsage().heapUsed - memoryBefore,
        databaseQueries: 1,
        cacheHits: 0,
        cacheMisses: 1,
        errors: 0
      })

      return result

    } catch (error) {
      this.recordMetrics({
        timestamp: new Date(),
        operation: `error_${queryKey}`,
        duration: Date.now() - startTime,
        memoryUsage: process.memoryUsage().heapUsed - memoryBefore,
        databaseQueries: 1,
        cacheHits: 0,
        cacheMisses: 1,
        errors: 1
      })
      throw error
    }
  }

  /**
   * Optimización de consultas de citas
   */
  async getOptimizedAppointments(
    filters: {
      specialistId?: string
      dateFrom?: string
      dateTo?: string
      status?: string
      limit?: number
    } = {}
  ): Promise<any[]> {
    const cacheKey = `appointments_${JSON.stringify(filters)}`
    
    return this.optimizedQuery(cacheKey, async () => {
      let query = supabaseAdmin
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
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

      if (filters.specialistId) {
        query = query.eq('specialist_id', filters.specialistId)
      }

      if (filters.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('appointment_date', filters.dateTo)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query.order('appointment_date', { ascending: true })

      if (error) throw error
      return data || []
    }, 60) // Cache por 1 minuto
  }

  /**
   * Optimización de consultas de horarios disponibles
   */
  async getOptimizedAvailableTimes(
    specialistId: string,
    date: string,
    serviceId?: string
  ): Promise<string[]> {
    const cacheKey = `available_times_${specialistId}_${date}_${serviceId || 'all'}`
    
    return this.optimizedQuery(cacheKey, async () => {
      // Implementar lógica optimizada para obtener horarios disponibles
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('appointment_time, duration')
        .eq('specialist_id', specialistId)
        .eq('appointment_date', date)
        .eq('status', 'scheduled')

      const { data: schedule } = await supabaseAdmin
        .from('work_schedules')
        .select('start_time, end_time, lunch_start, lunch_end')
        .eq('specialist_id', specialistId)
        .eq('day_of_week', new Date(date).getDay())
        .single()

      if (!schedule) return []

      // Generar horarios disponibles optimizado
      const availableTimes = this.generateAvailableTimes(schedule, appointments || [])
      return availableTimes
    }, 30) // Cache por 30 segundos
  }

  /**
   * Genera horarios disponibles de forma optimizada
   */
  private generateAvailableTimes(schedule: any, appointments: any[]): string[] {
    const availableTimes: string[] = []
    const slotDuration = 15 // 15 minutos por slot

    const startTime = this.timeToMinutes(schedule.start_time)
    const endTime = this.timeToMinutes(schedule.end_time)
    const lunchStart = schedule.lunch_start ? this.timeToMinutes(schedule.lunch_start) : null
    const lunchEnd = schedule.lunch_end ? this.timeToMinutes(schedule.lunch_end) : null

    // Crear mapa de citas ocupadas
    const occupiedSlots = new Set<number>()
    appointments.forEach((apt: any) => {
      const start = this.timeToMinutes(apt.appointment_time)
      const end = start + apt.duration
      for (let time = start; time < end; time += slotDuration) {
        occupiedSlots.add(time)
      }
    })

    // Generar slots disponibles
    for (let time = startTime; time < endTime; time += slotDuration) {
      // Verificar si está en horario de almuerzo
      if (lunchStart && lunchEnd && time >= lunchStart && time < lunchEnd) {
        continue
      }

      // Verificar si el slot está ocupado
      if (!occupiedSlots.has(time)) {
        availableTimes.push(this.minutesToTime(time))
      }
    }

    return availableTimes
  }

  /**
   * Convierte tiempo HH:MM a minutos
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Convierte minutos a tiempo HH:MM
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  /**
   * Optimización de paginación
   */
  async getPaginatedData<T>(
    tableName: string,
    page: number = 1,
    pageSize: number = 20,
    filters: Record<string, any> = {},
    orderBy: { column: string; ascending: boolean } = { column: 'created_at', ascending: false }
  ): Promise<{
    data: T[]
    totalCount: number
    totalPages: number
    currentPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }> {
    const offset = (page - 1) * pageSize
    const cacheKey = `paginated_${tableName}_${page}_${pageSize}_${JSON.stringify(filters)}_${JSON.stringify(orderBy)}`

    return this.optimizedQuery(cacheKey, async () => {
      // Obtener total de registros
      let countQuery = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true })
      
      Object.entries(filters).forEach(([key, value]) => {
        countQuery = countQuery.eq(key, value)
      })

      const { count } = await countQuery

      // Obtener datos paginados
      let dataQuery = supabaseAdmin
        .from(tableName)
        .select('*')
        .order(orderBy.column, { ascending: orderBy.ascending })
        .range(offset, offset + pageSize - 1)

      Object.entries(filters).forEach(([key, value]) => {
        dataQuery = dataQuery.eq(key, value)
      })

      const { data, error } = await dataQuery

      if (error) throw error

      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / pageSize)

      return {
        data: data || [],
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, 60) // Cache por 1 minuto
  }

  /**
   * Compresión de datos para respuestas grandes
   */
  compressData(data: any): string {
    // Implementación básica de compresión JSON
    return JSON.stringify(data, null, 0) // Sin espacios para reducir tamaño
  }

  /**
   * Lazy loading de imágenes
   */
  createLazyImageLoader(): {
    loadImage: (src: string) => Promise<HTMLImageElement>
    preloadImages: (srcs: string[]) => Promise<void>
  } {
    const imageCache = new Map<string, HTMLImageElement>()

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        if (imageCache.has(src)) {
          resolve(imageCache.get(src)!)
          return
        }

        const img = new Image()
        img.onload = () => {
          imageCache.set(src, img)
          resolve(img)
        }
        img.onerror = reject
        img.src = src
      })
    }

    const preloadImages = async (srcs: string[]): Promise<void> => {
      await Promise.all(srcs.map(loadImage))
    }

    return { loadImage, preloadImages }
  }

  /**
   * Registra métricas de rendimiento
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)
    
    // Mantener solo las últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  /**
   * Obtiene estadísticas de rendimiento
   */
  getPerformanceStats(): {
    totalOperations: number
    averageDuration: number
    cacheHitRate: number
    errorRate: number
    memoryUsage: number
    recommendations: string[]
  } {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        cacheHitRate: 0,
        errorRate: 0,
        memoryUsage: 0,
        recommendations: ['No hay métricas disponibles']
      }
    }

    const totalOperations = this.metrics.length
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations
    const totalCacheHits = this.metrics.reduce((sum, m) => sum + m.cacheHits, 0)
    const totalCacheMisses = this.metrics.reduce((sum, m) => sum + m.cacheMisses, 0)
    const cacheHitRate = totalCacheHits / (totalCacheHits + totalCacheMisses) || 0
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errors, 0)
    const errorRate = totalErrors / totalOperations
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB

    const recommendations: string[] = []
    
    if (averageDuration > 1000) {
      recommendations.push('Optimizar consultas lentas (>1s)')
    }
    
    if (cacheHitRate < 0.7) {
      recommendations.push('Mejorar estrategia de cache')
    }
    
    if (errorRate > 0.05) {
      recommendations.push('Reducir tasa de errores')
    }
    
    if (memoryUsage > 100) {
      recommendations.push('Optimizar uso de memoria')
    }

    return {
      totalOperations,
      averageDuration,
      cacheHitRate,
      errorRate,
      memoryUsage,
      recommendations
    }
  }

  /**
   * Limpia métricas antiguas
   */
  cleanupOldMetrics(hours: number = 24): void {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours)
    
    this.metrics = this.metrics.filter((m: any) => m.timestamp > cutoffTime)
  }
}

// Instancia singleton
export const performanceOptimizer = new PerformanceOptimizer()

// Funciones de conveniencia
export function getOptimizedAppointments(filters?: any): Promise<any[]> {
  return performanceOptimizer.getOptimizedAppointments(filters)
}

export function getOptimizedAvailableTimes(specialistId: string, date: string, serviceId?: string): Promise<string[]> {
  return performanceOptimizer.getOptimizedAvailableTimes(specialistId, date, serviceId)
}

export function getPaginatedData<T>(
  tableName: string,
  page?: number,
  pageSize?: number,
  filters?: Record<string, any>,
  orderBy?: { column: string; ascending: boolean }
): Promise<any> {
  return performanceOptimizer.getPaginatedData<T>(tableName, page, pageSize, filters, orderBy)
}

export function getPerformanceStats() {
  return performanceOptimizer.getPerformanceStats()
}

export function clearCache(pattern?: string): void {
  performanceOptimizer.clearCache(pattern)
}
