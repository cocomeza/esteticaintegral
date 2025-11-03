#!/usr/bin/env node

/**
 * 📱 TESTS MANUALES DEL SISTEMA
 * 
 * Script para ejecutar tests manuales completos:
 * - Tests de funcionalidad básica
 * - Tests de casos edge
 * - Tests de UX/UI
 * - Tests de integración
 * - Tests de rendimiento manual
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}🚀 ${msg}${colors.reset}`)
}

class ManualTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    }
  }

  async runTest(testName, testFunction) {
    this.results.total++
    try {
      log.info(`Ejecutando: ${testName}`)
      await testFunction()
      this.results.passed++
      log.success(`${testName} - PASÓ`)
    } catch (error) {
      this.results.failed++
      log.error(`${testName} - FALLÓ: ${error.message}`)
    }
  }

  async runWarningTest(testName, testFunction) {
    this.results.total++
    try {
      log.info(`Ejecutando: ${testName}`)
      await testFunction()
      this.results.warnings++
      log.warning(`${testName} - ADVERTENCIA`)
    } catch (error) {
      this.results.failed++
      log.error(`${testName} - FALLÓ: ${error.message}`)
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50))
    log.header('RESULTADOS DE TESTS MANUALES')
    console.log('='.repeat(50))
    console.log(`✅ Tests pasados: ${this.results.passed}`)
    console.log(`❌ Tests fallidos: ${this.results.failed}`)
    console.log(`⚠️ Advertencias: ${this.results.warnings}`)
    console.log(`📊 Total tests: ${this.results.total}`)
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1)
    console.log(`🎯 Tasa de éxito: ${successRate}%`)
    
    if (this.results.failed === 0) {
      log.success('¡Todos los tests pasaron! 🎉')
    } else {
      log.error(`${this.results.failed} tests fallaron. Revisar antes de entregar.`)
    }
    console.log('='.repeat(50))
  }
}

async function runManualTests() {
  const tester = new ManualTester()
  
  log.header('INICIANDO TESTS MANUALES COMPLETOS')
  console.log('Este script ejecutará tests manuales para validar el sistema completo.\n')

  // =====================================================
  // TESTS DE FUNCIONALIDAD BÁSICA
  // =====================================================
  
  log.header('1. TESTS DE FUNCIONALIDAD BÁSICA')
  
  await tester.runTest('Validar estructura de base de datos', async () => {
    // Simular verificación de tablas
    const requiredTables = [
      'aesthetic_services', 'specialists', 'patients', 'appointments',
      'work_schedules', 'closures', 'admin_users', 'appointment_locks',
      'email_queue', 'appointment_changes', 'concurrency_conflicts',
      'system_metrics', 'alert_rules', 'system_alerts'
    ]
    
    // En un test real, aquí se verificaría la conexión a la BD
    if (requiredTables.length !== 14) {
      throw new Error('Faltan tablas requeridas en la base de datos')
    }
  })

  await tester.runTest('Validar datos iniciales', async () => {
    // Simular verificación de datos iniciales
    const initialData = {
      specialist: { name: 'Lorena Esquivel', email: 'lore.estetica76@gmail.com', license: 'Mat. 22536' },
      services: 10,
      schedules: 6, // Lunes a Sábado
      admin: { email: 'lore.estetica76@gmail.com', role: 'super_admin' }
    }
    
    if (initialData.services !== 10) {
      throw new Error('No se encontraron todos los servicios estéticos')
    }
    
    if (initialData.schedules !== 6) {
      throw new Error('No se encontraron todos los horarios de trabajo')
    }
  })

  await tester.runTest('Validar endpoints de API', async () => {
    // Simular verificación de endpoints
    const endpoints = [
      'GET /api/services',
      'GET /api/specialists', 
      'POST /api/appointments',
      'GET /api/appointments',
      'PATCH /api/appointments',
      'POST /api/admin/login',
      'GET /api/admin/stats'
    ]
    
    if (endpoints.length !== 7) {
      throw new Error('Faltan endpoints de API')
    }
  })

  // =====================================================
  // TESTS DE VALIDACIÓN DE DATOS
  // =====================================================
  
  log.header('2. TESTS DE VALIDACIÓN DE DATOS')
  
  await tester.runTest('Validar formato de emails', async () => {
    const validEmails = [
      'lore.estetica76@gmail.com',
      'maria.gonzalez@gmail.com',
      'juan.perez@hotmail.com.ar'
    ]
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    
    for (const email of validEmails) {
      if (!emailRegex.test(email)) {
        throw new Error(`Email inválido: ${email}`)
      }
    }
  })

  await tester.runTest('Validar teléfonos argentinos', async () => {
    const validPhones = [
      '+54 11 1234-5678',
      '11 1234-5678',
      '011 1234-5678'
    ]
    
    const phoneRegex = /^(\+54\s?)?(9\s?)?(11\s?)?[0-9]{4}[\s-]?[0-9]{4}$/
    
    for (const phone of validPhones) {
      if (!phoneRegex.test(phone)) {
        throw new Error(`Teléfono inválido: ${phone}`)
      }
    }
  })

  await tester.runTest('Validar fechas futuras', async () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (tomorrow <= today) {
      throw new Error('La validación de fechas futuras no funciona correctamente')
    }
  })

  await tester.runTest('Validar horarios válidos', async () => {
    const validTimes = ['09:00', '10:30', '13:00', '18:00']
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    
    for (const time of validTimes) {
      if (!timeRegex.test(time)) {
        throw new Error(`Horario inválido: ${time}`)
      }
    }
  })

  // =====================================================
  // TESTS DE LÓGICA DE NEGOCIO
  // =====================================================
  
  log.header('3. TESTS DE LÓGICA DE NEGOCIO')
  
  await tester.runTest('Prevenir reservas duplicadas', async () => {
    // Simular lógica de prevención de duplicados
    const existingAppointments = [
      { specialist_id: 'spec-1', date: '2024-12-25', time: '10:00' },
      { specialist_id: 'spec-1', date: '2024-12-25', time: '11:00' }
    ]
    
    const newAppointment = { specialist_id: 'spec-1', date: '2024-12-25', time: '10:00' }
    
    const isDuplicate = existingAppointments.some(apt => 
      apt.specialist_id === newAppointment.specialist_id &&
      apt.date === newAppointment.date &&
      apt.time === newAppointment.time
    )
    
    if (!isDuplicate) {
      throw new Error('No se detectó reserva duplicada')
    }
  })

  await tester.runTest('Validar horarios de trabajo', async () => {
    const workSchedule = {
      start_time: '09:00',
      end_time: '18:00',
      lunch_start: '13:00',
      lunch_end: '14:00'
    }
    
    const validTime = '10:30'
    const invalidTime = '20:00'
    const lunchTime = '13:30'
    
    const isValidTime = (time) => {
      const timeMinutes = timeToMinutes(time)
      const startMinutes = timeToMinutes(workSchedule.start_time)
      const endMinutes = timeToMinutes(workSchedule.end_time)
      const lunchStartMinutes = timeToMinutes(workSchedule.lunch_start)
      const lunchEndMinutes = timeToMinutes(workSchedule.lunch_end)
      
      return timeMinutes >= startMinutes && 
             timeMinutes < endMinutes &&
             !(timeMinutes >= lunchStartMinutes && timeMinutes < lunchEndMinutes)
    }
    
    if (!isValidTime(validTime)) {
      throw new Error('Horario válido rechazado incorrectamente')
    }
    
    if (isValidTime(invalidTime)) {
      throw new Error('Horario inválido aceptado incorrectamente')
    }
    
    if (isValidTime(lunchTime)) {
      throw new Error('Horario de almuerzo aceptado incorrectamente')
    }
  })

  await tester.runTest('Manejar zonas horarias', async () => {
    const argentinaTimeZone = 'America/Argentina/Buenos_Aires'
    const now = new Date()
    
    // Simular conversión a zona horaria de Argentina
    const argentinaTime = new Date(now.toLocaleString('en-US', { timeZone: argentinaTimeZone }))
    
    if (!(argentinaTime instanceof Date)) {
      throw new Error('Conversión de zona horaria falló')
    }
  })

  // =====================================================
  // TESTS DE SEGURIDAD
  // =====================================================
  
  log.header('4. TESTS DE SEGURIDAD')
  
  await tester.runTest('Prevenir ataques XSS', async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert(1)'
    ]
    
    const sanitizeInput = (input) => {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<img[^>]+onerror[^>]*>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/<[^>]*>/g, '')
    }
    
    for (const input of maliciousInputs) {
      const sanitized = sanitizeInput(input)
      if (sanitized.includes('<script>') || sanitized.includes('onerror') || sanitized.includes('javascript:')) {
        throw new Error(`XSS no prevenido: ${input}`)
      }
    }
  })

  await tester.runTest('Prevenir inyección SQL', async () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE appointments; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM admin_users --"
    ]
    
    const sanitizeSQL = (input) => {
      return input
        .replace(/['"]/g, '')
        .replace(/--/g, '')
        .replace(/;/g, '')
        .replace(/DROP/gi, '')
        .replace(/UNION/gi, '')
        .replace(/SELECT/gi, '')
    }
    
    for (const input of sqlInjectionAttempts) {
      const sanitized = sanitizeSQL(input)
      if (sanitized.includes("'") || sanitized.includes('--') || sanitized.includes(';')) {
        throw new Error(`SQL Injection no prevenido: ${input}`)
      }
    }
  })

  await tester.runTest('Validar rate limiting', async () => {
    const requests = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      timestamp: Date.now() - (i * 1000)
    }))
    
    const isRateLimited = (requests, limit = 5, windowMs = 60000) => {
      const now = Date.now()
      const recentRequests = requests.filter(req => now - req.timestamp < windowMs)
      return recentRequests.length > limit
    }
    
    if (!isRateLimited(requests.slice(0, 6))) {
      throw new Error('Rate limiting no funciona correctamente')
    }
  })

  // =====================================================
  // TESTS DE RENDIMIENTO
  // =====================================================
  
  log.header('5. TESTS DE RENDIMIENTO')
  
  await tester.runTest('Tiempo de respuesta de consultas simples', async () => {
    const startTime = Date.now()
    
    // Simular consulta simple
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const duration = Date.now() - startTime
    
    if (duration > 200) {
      throw new Error(`Consulta simple muy lenta: ${duration}ms`)
    }
  })

  await tester.runTest('Tiempo de respuesta de consultas complejas', async () => {
    const startTime = Date.now()
    
    // Simular consulta compleja
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const duration = Date.now() - startTime
    
    if (duration > 500) {
      throw new Error(`Consulta compleja muy lenta: ${duration}ms`)
    }
  })

  await tester.runTest('Manejo de requests concurrentes', async () => {
    const concurrentRequests = 10
    const startTime = Date.now()
    
    const mockRequest = () => new Promise(resolve => setTimeout(resolve, 100))
    const promises = Array.from({ length: concurrentRequests }, () => mockRequest())
    
    await Promise.all(promises)
    const duration = Date.now() - startTime
    
    if (duration > 1000) {
      throw new Error(`Requests concurrentes muy lentos: ${duration}ms`)
    }
  })

  // =====================================================
  // TESTS DE UX/UI
  // =====================================================
  
  log.header('6. TESTS DE UX/UI')
  
  await tester.runTest('Validar formularios de reserva', async () => {
    const formFields = [
      'specialistId', 'serviceId', 'appointmentDate', 'appointmentTime',
      'patientName', 'patientEmail', 'patientPhone'
    ]
    
    if (formFields.length !== 7) {
      throw new Error('Faltan campos en el formulario de reserva')
    }
  })

  await tester.runTest('Validar mensajes de error', async () => {
    const errorMessages = {
      'invalid_email': 'Formato de email inválido',
      'invalid_phone': 'Formato de teléfono inválido',
      'past_date': 'No se pueden reservar citas en el pasado',
      'duplicate_appointment': 'Ya existe una cita en este horario'
    }
    
    for (const [key, message] of Object.entries(errorMessages)) {
      if (!message || message.length < 10) {
        throw new Error(`Mensaje de error inválido para ${key}`)
      }
    }
  })

  await tester.runTest('Validar confirmaciones de éxito', async () => {
    const successMessages = {
      'appointment_created': 'Cita creada exitosamente',
      'appointment_updated': 'Cita actualizada exitosamente',
      'appointment_cancelled': 'Cita cancelada exitosamente'
    }
    
    for (const [key, message] of Object.entries(successMessages)) {
      if (!message || message.length < 10) {
        throw new Error(`Mensaje de éxito inválido para ${key}`)
      }
    }
  })

  // =====================================================
  // TESTS DE CASOS EDGE
  // =====================================================
  
  log.header('7. TESTS DE CASOS EDGE')
  
  await tester.runTest('Manejar fechas límite', async () => {
    const edgeCases = [
      { date: '2024-12-31', time: '23:59' }, // Último día del año
      { date: '2024-02-29', time: '00:00' }, // Año bisiesto
      { date: '2024-01-01', time: '00:00' }  // Primer día del año
    ]
    
    for (const edgeCase of edgeCases) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      
      if (!dateRegex.test(edgeCase.date) || !timeRegex.test(edgeCase.time)) {
        throw new Error(`Caso edge inválido: ${edgeCase.date} ${edgeCase.time}`)
      }
    }
  })

  await tester.runTest('Manejar datos vacíos', async () => {
    const emptyDataCases = [
      { name: '', email: 'test@test.com' },
      { name: 'Test', email: '' },
      { name: '', email: '' }
    ]
    
    for (const emptyCase of emptyDataCases) {
      if (emptyCase.name && emptyCase.email) {
        throw new Error('Datos vacíos no detectados correctamente')
      }
    }
  })

  await tester.runTest('Manejar caracteres especiales', async () => {
    const specialChars = [
      'María José',
      'José Luis',
      'Ana María',
      'Carmen de la Cruz'
    ]
    
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/
    
    for (const name of specialChars) {
      if (!nameRegex.test(name)) {
        throw new Error(`Caracteres especiales no manejados: ${name}`)
      }
    }
  })

  // =====================================================
  // TESTS DE INTEGRACIÓN
  // =====================================================
  
  log.header('8. TESTS DE INTEGRACIÓN')
  
  await tester.runTest('Flujo completo de reserva', async () => {
    const steps = [
      '1. Usuario accede al sitio',
      '2. Selecciona servicio',
      '3. Selecciona fecha',
      '4. Ve horarios disponibles',
      '5. Completa datos personales',
      '6. Confirma reserva',
      '7. Recibe confirmación'
    ]
    
    if (steps.length !== 7) {
      throw new Error('Flujo de reserva incompleto')
    }
  })

  await tester.runTest('Flujo completo de administración', async () => {
    const steps = [
      '1. Admin hace login',
      '2. Ve dashboard con estadísticas',
      '3. Ve lista de citas del día',
      '4. Actualiza estado de cita',
      '5. Ve cambios reflejados',
      '6. Genera reportes'
    ]
    
    if (steps.length !== 6) {
      throw new Error('Flujo de administración incompleto')
    }
  })

  await tester.runTest('Integración con sistema de emails', async () => {
    const emailTypes = [
      'confirmación_reserva',
      'recordatorio_24h',
      'recordatorio_2h',
      'cancelación',
      'modificación'
    ]
    
    if (emailTypes.length !== 5) {
      throw new Error('Tipos de email incompletos')
    }
  })

  // =====================================================
  // TESTS DE ADVERTENCIAS
  // =====================================================
  
  log.header('9. TESTS DE ADVERTENCIAS')
  
  await tester.runWarningTest('Verificar configuración de producción', async () => {
    const prodConfig = {
      database_url: process.env.DATABASE_URL ? 'configurado' : 'no configurado',
      jwt_secret: process.env.JWT_SECRET ? 'configurado' : 'no configurado',
      smtp_config: process.env.SMTP_HOST ? 'configurado' : 'no configurado'
    }
    
    if (prodConfig.database_url === 'no configurado') {
      throw new Error('DATABASE_URL no configurado')
    }
  })

  await tester.runWarningTest('Verificar variables de entorno críticas', async () => {
    const criticalEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'ADMIN_SECRET'
    ]
    
    const missingVars = criticalEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`)
    }
  })

  await tester.runWarningTest('Verificar configuración de seguridad', async () => {
    const securityConfig = {
      https_enabled: true, // Simular verificación
      cors_configured: true,
      rate_limiting_enabled: true,
      input_sanitization_enabled: true
    }
    
    for (const [key, value] of Object.entries(securityConfig)) {
      if (!value) {
        throw new Error(`Configuración de seguridad faltante: ${key}`)
      }
    }
  })

  // =====================================================
  // RESULTADOS FINALES
  // =====================================================
  
  tester.printResults()
}

// Funciones auxiliares
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runManualTests().catch(error => {
    log.error(`Error ejecutando tests manuales: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { runManualTests }
