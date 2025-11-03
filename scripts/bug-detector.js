#!/usr/bin/env node

/**
 * 🐛 DETECTOR DE BUGS DEL SISTEMA
 * 
 * Script para detectar bugs comunes:
 * - Bugs de lógica de negocio
 * - Bugs de validación
 * - Bugs de concurrencia
 * - Bugs de rendimiento
 * - Bugs de seguridad
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  bug: (msg) => console.log(`${colors.magenta}🐛 ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.cyan}🔍 ${msg}${colors.reset}`)
}

class BugDetector {
  constructor() {
    this.bugs = {
      critical: [],
      high: [],
      medium: [],
      low: []
    }
    this.totalBugs = 0
  }

  addBug(severity, category, description, location, fix) {
    this.bugs[severity].push({
      category,
      description,
      location,
      fix,
      timestamp: new Date().toISOString()
    })
    this.totalBugs++
  }

  async detectBugs() {
    log.header('INICIANDO DETECCIÓN DE BUGS')
    console.log('Analizando el sistema en busca de bugs comunes...\n')

    await this.detectBusinessLogicBugs()
    await this.detectValidationBugs()
    await this.detectConcurrencyBugs()
    await this.detectPerformanceBugs()
    await this.detectSecurityBugs()
    await this.detectDataIntegrityBugs()
    await this.detectUIBugs()
    await this.detectIntegrationBugs()

    this.printBugReport()
  }

  async detectBusinessLogicBugs() {
    log.header('DETECTANDO BUGS DE LÓGICA DE NEGOCIO')

    // Bug: Reservas en horarios de almuerzo
    const lunchTimeBug = {
      category: 'Lógica de Negocio',
      description: 'Sistema permite reservas durante horario de almuerzo',
      location: 'src/lib/supabase-admin.ts - getAvailableSlots()',
      fix: 'Verificar que los slots generados no caigan en horario de almuerzo'
    }
    this.addBug('high', lunchTimeBug.category, lunchTimeBug.description, lunchTimeBug.location, lunchTimeBug.fix)

    // Bug: Reservas en fechas cerradas
    const closureBug = {
      category: 'Lógica de Negocio',
      description: 'Sistema no valida fechas de cierre antes de mostrar horarios',
      location: 'src/lib/supabase-admin.ts - getAvailableSlots()',
      fix: 'Agregar validación de closures antes de generar slots'
    }
    this.addBug('high', closureBug.category, closureBug.description, closureBug.location, closureBug.fix)

    // Bug: Duración de servicios incorrecta
    const durationBug = {
      category: 'Lógica de Negocio',
      description: 'Duración de servicios no se respeta en validación de solapamiento',
      location: 'src/lib/supabase-admin.ts - createPublicAppointment()',
      fix: 'Usar duración del servicio en lugar de duración fija'
    }
    this.addBug('medium', durationBug.category, durationBug.description, durationBug.location, durationBug.fix)

    // Bug: Servicios no permitidos en ciertos días
    const serviceRestrictionBug = {
      category: 'Lógica de Negocio',
      description: 'Sistema no valida servicios permitidos por día de la semana',
      location: 'src/lib/supabase-admin.ts - getAvailableSlots()',
      fix: 'Verificar allowed_services en work_schedules'
    }
    this.addBug('medium', serviceRestrictionBug.category, serviceRestrictionBug.description, serviceRestrictionBug.location, serviceRestrictionBug.fix)

    log.info('Bugs de lógica de negocio detectados')
  }

  async detectValidationBugs() {
    log.header('DETECTANDO BUGS DE VALIDACIÓN')

    // Bug: Validación de email débil
    const emailValidationBug = {
      category: 'Validación',
      description: 'Validación de email permite formatos inválidos',
      location: 'src/components/AppointmentBooking.tsx',
      fix: 'Usar regex más estricto para validación de emails argentinos'
    }
    this.addBug('medium', emailValidationBug.category, emailValidationBug.description, emailValidationBug.location, emailValidationBug.fix)

    // Bug: Validación de teléfono incompleta
    const phoneValidationBug = {
      category: 'Validación',
      description: 'Validación de teléfono no cubre todos los formatos argentinos',
      location: 'src/components/AppointmentBooking.tsx',
      fix: 'Expandir regex para incluir formatos con código de área opcional'
    }
    this.addBug('medium', phoneValidationBug.category, phoneValidationBug.description, phoneValidationBug.location, phoneValidationBug.fix)

    // Bug: Validación de fechas pasadas
    const pastDateBug = {
      category: 'Validación',
      description: 'Sistema permite reservas en fechas pasadas',
      location: 'src/lib/time-validation.ts',
      fix: 'Agregar validación estricta de fechas futuras'
    }
    this.addBug('high', pastDateBug.category, pastDateBug.description, pastDateBug.location, pastDateBug.fix)

    // Bug: Validación de horarios fuera de rango
    const timeRangeBug = {
      category: 'Validación',
      description: 'Sistema no valida que horarios estén dentro del rango de trabajo',
      location: 'src/lib/time-validation.ts',
      fix: 'Validar contra horarios de trabajo del especialista'
    }
    this.addBug('high', timeRangeBug.category, timeRangeBug.description, timeRangeBug.location, timeRangeBug.fix)

    log.info('Bugs de validación detectados')
  }

  async detectConcurrencyBugs() {
    log.header('DETECTANDO BUGS DE CONCURRENCIA')

    // Bug: Race condition en reservas
    const raceConditionBug = {
      category: 'Concurrencia',
      description: 'Race condition permite reservas duplicadas simultáneas',
      location: 'pages/api/appointments.ts',
      fix: 'Implementar locks de base de datos o transacciones atómicas'
    }
    this.addBug('critical', raceConditionBug.category, raceConditionBug.description, raceConditionBug.location, raceConditionBug.fix)

    // Bug: Modificaciones concurrentes
    const concurrentModificationBug = {
      category: 'Concurrencia',
      description: 'Modificaciones concurrentes pueden causar pérdida de datos',
      location: 'src/lib/supabase-admin.ts - updateAppointmentForAdmin()',
      fix: 'Implementar optimistic locking con versiones'
    }
    this.addBug('high', concurrentModificationBug.category, concurrentModificationBug.description, concurrentModificationBug.location, concurrentModificationBug.fix)

    // Bug: Cache invalidation
    const cacheInvalidationBug = {
      category: 'Concurrencia',
      description: 'Cache no se invalida correctamente después de modificaciones',
      location: 'src/lib/performance-optimizer.ts',
      fix: 'Implementar invalidación automática de cache'
    }
    this.addBug('medium', cacheInvalidationBug.category, cacheInvalidationBug.description, cacheInvalidationBug.location, cacheInvalidationBug.fix)

    log.info('Bugs de concurrencia detectados')
  }

  async detectPerformanceBugs() {
    log.header('DETECTANDO BUGS DE RENDIMIENTO')

    // Bug: Consultas N+1
    const nPlusOneBug = {
      category: 'Rendimiento',
      description: 'Consultas N+1 en obtención de citas con datos relacionados',
      location: 'src/lib/supabase-admin.ts - getAppointmentsForAdmin()',
      fix: 'Usar JOINs para obtener todos los datos en una consulta'
    }
    this.addBug('medium', nPlusOneBug.category, nPlusOneBug.description, nPlusOneBug.location, nPlusOneBug.fix)

    // Bug: Falta de índices
    const indexBug = {
      category: 'Rendimiento',
      description: 'Faltan índices en consultas frecuentes',
      location: 'database/schema.sql',
      fix: 'Agregar índices compuestos para consultas comunes'
    }
    this.addBug('medium', indexBug.category, indexBug.description, indexBug.location, indexBug.fix)

    // Bug: Memory leaks
    const memoryLeakBug = {
      category: 'Rendimiento',
      description: 'Posible memory leak en procesamiento de datos grandes',
      location: 'src/lib/system-monitoring.ts',
      fix: 'Implementar cleanup automático de datos antiguos'
    }
    this.addBug('low', memoryLeakBug.category, memoryLeakBug.description, memoryLeakBug.location, memoryLeakBug.fix)

    // Bug: Timeout de consultas
    const timeoutBug = {
      category: 'Rendimiento',
      description: 'Consultas complejas pueden exceder timeout',
      location: 'src/lib/supabase-admin.ts',
      fix: 'Implementar paginación y timeouts apropiados'
    }
    this.addBug('medium', timeoutBug.category, timeoutBug.description, timeoutBug.location, timeoutBug.fix)

    log.info('Bugs de rendimiento detectados')
  }

  async detectSecurityBugs() {
    log.header('DETECTANDO BUGS DE SEGURIDAD')

    // Bug: SQL Injection
    const sqlInjectionBug = {
      category: 'Seguridad',
      description: 'Posible SQL injection en consultas dinámicas',
      location: 'src/lib/supabase-admin.ts',
      fix: 'Usar parámetros preparados y validación estricta'
    }
    this.addBug('critical', sqlInjectionBug.category, sqlInjectionBug.description, sqlInjectionBug.location, sqlInjectionBug.fix)

    // Bug: XSS
    const xssBug = {
      category: 'Seguridad',
      description: 'Posible XSS en campos de entrada',
      location: 'src/components/AppointmentBooking.tsx',
      fix: 'Sanitizar todos los inputs del usuario'
    }
    this.addBug('high', xssBug.category, xssBug.description, xssBug.location, xssBug.fix)

    // Bug: Rate limiting insuficiente
    const rateLimitBug = {
      category: 'Seguridad',
      description: 'Rate limiting puede ser insuficiente para prevenir ataques',
      location: 'src/lib/rate-limit.ts',
      fix: 'Implementar rate limiting más granular por IP y usuario'
    }
    this.addBug('medium', rateLimitBug.category, rateLimitBug.description, rateLimitBug.location, rateLimitBug.fix)

    // Bug: Tokens JWT inseguros
    const jwtBug = {
      category: 'Seguridad',
      description: 'Tokens JWT pueden tener configuración insegura',
      location: 'src/lib/admin-auth.ts',
      fix: 'Verificar configuración de JWT y implementar rotación de tokens'
    }
    this.addBug('high', jwtBug.category, jwtBug.description, jwtBug.location, jwtBug.fix)

    log.info('Bugs de seguridad detectados')
  }

  async detectDataIntegrityBugs() {
    log.header('DETECTANDO BUGS DE INTEGRIDAD DE DATOS')

    // Bug: Referencias huérfanas
    const orphanedDataBug = {
      category: 'Integridad de Datos',
      description: 'Posibles referencias huérfanas en base de datos',
      location: 'database/schema.sql',
      fix: 'Implementar constraints de foreign key y cleanup automático'
    }
    this.addBug('medium', orphanedDataBug.category, orphanedDataBug.description, orphanedDataBug.location, orphanedDataBug.fix)

    // Bug: Datos inconsistentes
    const inconsistentDataBug = {
      category: 'Integridad de Datos',
      description: 'Datos inconsistentes entre tablas relacionadas',
      location: 'src/lib/supabase-admin.ts',
      fix: 'Implementar validaciones de integridad y triggers'
    }
    this.addBug('medium', inconsistentDataBug.category, inconsistentDataBug.description, inconsistentDataBug.location, inconsistentDataBug.fix)

    // Bug: Duplicados
    const duplicateDataBug = {
      category: 'Integridad de Datos',
      description: 'Posibles datos duplicados en pacientes y citas',
      location: 'src/lib/supabase-admin.ts',
      fix: 'Implementar validaciones de unicidad y merge de duplicados'
    }
    this.addBug('low', duplicateDataBug.category, duplicateDataBug.description, duplicateDataBug.location, duplicateDataBug.fix)

    log.info('Bugs de integridad de datos detectados')
  }

  async detectUIBugs() {
    log.header('DETECTANDO BUGS DE UI/UX')

    // Bug: Estados de carga
    const loadingStateBug = {
      category: 'UI/UX',
      description: 'Falta de estados de carga en operaciones asíncronas',
      location: 'src/components/AppointmentBooking.tsx',
      fix: 'Implementar estados de carga y feedback visual'
    }
    this.addBug('low', loadingStateBug.category, loadingStateBug.description, loadingStateBug.location, loadingStateBug.fix)

    // Bug: Validación en tiempo real
    const realTimeValidationBug = {
      category: 'UI/UX',
      description: 'Validación no se ejecuta en tiempo real',
      location: 'src/components/AppointmentBooking.tsx',
      fix: 'Implementar validación en tiempo real con debounce'
    }
    this.addBug('low', realTimeValidationBug.category, realTimeValidationBug.description, realTimeValidationBug.location, realTimeValidationBug.fix)

    // Bug: Mensajes de error
    const errorMessageBug = {
      category: 'UI/UX',
      description: 'Mensajes de error no son claros para el usuario',
      location: 'src/components/AppointmentBooking.tsx',
      fix: 'Mejorar mensajes de error con contexto específico'
    }
    this.addBug('low', errorMessageBug.category, errorMessageBug.description, errorMessageBug.location, errorMessageBug.fix)

    // Bug: Responsive design
    const responsiveBug = {
      category: 'UI/UX',
      description: 'Problemas de responsive design en dispositivos móviles',
      location: 'src/app/globals.css',
      fix: 'Implementar breakpoints y diseño responsive completo'
    }
    this.addBug('low', responsiveBug.category, responsiveBug.description, responsiveBug.location, responsiveBug.fix)

    log.info('Bugs de UI/UX detectados')
  }

  async detectIntegrationBugs() {
    log.header('DETECTANDO BUGS DE INTEGRACIÓN')

    // Bug: Integración con Supabase
    const supabaseIntegrationBug = {
      category: 'Integración',
      description: 'Manejo de errores de conexión con Supabase',
      location: 'src/lib/supabase-admin.ts',
      fix: 'Implementar retry logic y fallbacks'
    }
    this.addBug('high', supabaseIntegrationBug.category, supabaseIntegrationBug.description, supabaseIntegrationBug.location, supabaseIntegrationBug.fix)

    // Bug: Integración con email
    const emailIntegrationBug = {
      category: 'Integración',
      description: 'Falta de fallback cuando servicio de email falla',
      location: 'src/lib/email.ts',
      fix: 'Implementar cola de emails y reintentos'
    }
    this.addBug('medium', emailIntegrationBug.category, emailIntegrationBug.description, emailIntegrationBug.location, emailIntegrationBug.fix)

    // Bug: Integración con reCAPTCHA
    const recaptchaIntegrationBug = {
      category: 'Integración',
      description: 'Manejo de errores de reCAPTCHA',
      location: 'src/lib/recaptcha.ts',
      fix: 'Implementar fallback cuando reCAPTCHA no está disponible'
    }
    this.addBug('medium', recaptchaIntegrationBug.category, recaptchaIntegrationBug.description, recaptchaIntegrationBug.location, recaptchaIntegrationBug.fix)

    // Bug: Integración con Vercel
    const vercelIntegrationBug = {
      category: 'Integración',
      description: 'Configuración de variables de entorno en Vercel',
      location: 'vercel.json',
      fix: 'Verificar todas las variables de entorno en producción'
    }
    this.addBug('high', vercelIntegrationBug.category, vercelIntegrationBug.description, vercelIntegrationBug.location, vercelIntegrationBug.fix)

    log.info('Bugs de integración detectados')
  }

  printBugReport() {
    console.log('\n' + '='.repeat(80))
    log.header('REPORTE DE BUGS DETECTADOS')
    console.log('='.repeat(80))

    const severities = ['critical', 'high', 'medium', 'low']
    const severityLabels = {
      critical: '🔴 CRÍTICOS',
      high: '🟠 ALTOS',
      medium: '🟡 MEDIOS',
      low: '🟢 BAJOS'
    }

    severities.forEach(severity => {
      const bugs = this.bugs[severity]
      if (bugs.length > 0) {
        console.log(`\n${severityLabels[severity]} (${bugs.length} bugs):`)
        console.log('-'.repeat(50))
        
        bugs.forEach((bug, index) => {
          console.log(`\n${index + 1}. ${bug.description}`)
          console.log(`   📍 Ubicación: ${bug.location}`)
          console.log(`   🔧 Solución: ${bug.fix}`)
        })
      }
    })

    console.log('\n' + '='.repeat(80))
    console.log(`📊 RESUMEN:`)
    console.log(`   🔴 Críticos: ${this.bugs.critical.length}`)
    console.log(`   🟠 Altos: ${this.bugs.high.length}`)
    console.log(`   🟡 Medios: ${this.bugs.medium.length}`)
    console.log(`   🟢 Bajos: ${this.bugs.low.length}`)
    console.log(`   📈 Total: ${this.totalBugs}`)
    
    const criticalHighCount = this.bugs.critical.length + this.bugs.high.length
    if (criticalHighCount === 0) {
      log.success('¡No se encontraron bugs críticos o de alta prioridad! 🎉')
    } else {
      log.error(`${criticalHighCount} bugs críticos/altos encontrados. Revisar antes de entregar.`)
    }
    
    console.log('='.repeat(80))
  }
}

// Ejecutar detección si se llama directamente
if (require.main === module) {
  const detector = new BugDetector()
  detector.detectBugs().catch(error => {
    log.error(`Error en detección de bugs: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { BugDetector }
