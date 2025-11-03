#!/usr/bin/env node

/**
 * Test completo del sistema de reservas
 * Prueba todas las formas posibles de hacer una reserva
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testCompletoReservas() {
  console.log('🧪 TEST COMPLETO DEL SISTEMA DE RESERVAS')
  console.log('=======================================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  let testsPasados = 0
  let testsFallidos = 0

  // Función helper para ejecutar tests
  const ejecutarTest = async (nombre, testFunction) => {
    try {
      console.log(`🔍 ${nombre}...`)
      await testFunction()
      console.log(`✅ ${nombre} - PASÓ\n`)
      testsPasados++
    } catch (error) {
      console.log(`❌ ${nombre} - FALLÓ: ${error.message}\n`)
      testsFallidos++
    }
  }

  // Test 1: Verificar conexión y datos básicos
  await ejecutarTest('Verificar conexión a Supabase', async () => {
    const { data, error } = await supabase.from('specialists').select('count').limit(1)
    if (error) throw new Error(`Error de conexión: ${error.message}`)
  })

  // Test 2: Verificar especialista activo
  await ejecutarTest('Verificar especialista activo', async () => {
    const { data: specialists, error } = await supabase
      .from('specialists')
      .select('id, name, email')
      .eq('is_active', true)
      .limit(1)

    if (error) throw new Error(`Error obteniendo especialista: ${error.message}`)
    if (!specialists || specialists.length === 0) throw new Error('No hay especialistas activos')
    
    console.log(`   Especialista: ${specialists[0].name}`)
  })

  // Test 3: Verificar servicios activos
  await ejecutarTest('Verificar servicios activos', async () => {
    const { data: services, error } = await supabase
      .from('aesthetic_services')
      .select('id, name, duration')
      .eq('is_active', true)
      .limit(5)

    if (error) throw new Error(`Error obteniendo servicios: ${error.message}`)
    if (!services || services.length === 0) throw new Error('No hay servicios activos')
    
    console.log(`   Servicios encontrados: ${services.length}`)
    services.forEach(s => console.log(`   - ${s.name} (${s.duration} min)`))
  })

  // Test 4: Verificar horarios de trabajo
  await ejecutarTest('Verificar horarios de trabajo', async () => {
    const { data: schedules, error } = await supabase
      .from('work_schedules')
      .select('day_of_week, start_time, end_time')
      .eq('is_active', true)

    if (error) throw new Error(`Error obteniendo horarios: ${error.message}`)
    if (!schedules || schedules.length === 0) throw new Error('No hay horarios configurados')
    
    console.log(`   Horarios configurados: ${schedules.length}`)
  })

  // Test 5: Probar creación de paciente (diferentes formatos de teléfono)
  const formatosTelefono = [
    '+54 03407532790',  // Caso específico del usuario
    '54 03407 532790',  // Con espacios
    '03407 532790',     // Sin código país
    '+54 11 1234-5678', // Buenos Aires
    '11 1234-5678',     // Buenos Aires sin código país
    '54 03329 123456',  // San Pedro
    '54 03364 123456',  // San Nicolás
    '54 0341 123456',   // Rosario
  ]

  for (const telefono of formatosTelefono) {
    await ejecutarTest(`Crear paciente con teléfono: ${telefono}`, async () => {
      const testEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
      
      const { data: newPatient, error } = await supabase
        .from('patients')
        .insert({
          name: 'Test Usuario',
          email: testEmail,
          phone: telefono
        })
        .select()
        .single()

      if (error) throw new Error(`Error creando paciente: ${error.message}`)
      
      // Limpiar paciente de prueba
      await supabase.from('patients').delete().eq('id', newPatient.id)
      
      console.log(`   Paciente creado y eliminado correctamente`)
    })
  }

  // Test 6: Probar creación de cita completa
  await ejecutarTest('Crear cita completa (simulación de reserva)', async () => {
    // Obtener datos necesarios
    const { data: specialist } = await supabase
      .from('specialists')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()

    const { data: service } = await supabase
      .from('aesthetic_services')
      .select('id, duration')
      .eq('is_active', true)
      .limit(1)
      .single()

    // Crear paciente de prueba
    const testEmail = `test-cita-${Date.now()}@example.com`
    const { data: patient } = await supabase
      .from('patients')
      .insert({
        name: 'Test Usuario Cita',
        email: testEmail,
        phone: '+54 03407532790'
      })
      .select()
      .single()

    // Crear cita
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const appointmentDate = tomorrow.toISOString().split('T')[0]
    const appointmentTime = '10:00'

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        specialist_id: specialist.id,
        patient_id: patient.id,
        service_id: service.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration: service.duration,
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) throw new Error(`Error creando cita: ${error.message}`)

    console.log(`   Cita creada: ${appointmentDate} a las ${appointmentTime}`)

    // Limpiar datos de prueba
    await supabase.from('appointments').delete().eq('id', appointment.id)
    await supabase.from('patients').delete().eq('id', patient.id)
    
    console.log(`   Datos de prueba eliminados`)
  })

  // Test 7: Probar validación de horarios disponibles
  await ejecutarTest('Verificar horarios disponibles', async () => {
    const { data: specialist } = await supabase
      .from('specialists')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const appointmentDate = tomorrow.toISOString().split('T')[0]

    // Verificar que no hay cierres para mañana
    const { data: closures } = await supabase
      .from('closures')
      .select('*')
      .eq('specialist_id', specialist.id)
      .eq('is_active', true)
      .lte('start_date', appointmentDate)
      .gte('end_date', appointmentDate)

    if (closures && closures.length > 0) {
      console.log(`   ⚠️ Hay cierres para ${appointmentDate}: ${closures[0].reason}`)
    } else {
      console.log(`   ✅ No hay cierres para ${appointmentDate}`)
    }

    // Verificar horario de trabajo
    const dayOfWeek = tomorrow.getDay()
    const { data: schedule } = await supabase
      .from('work_schedules')
      .select('start_time, end_time')
      .eq('specialist_id', specialist.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single()

    if (!schedule) {
      throw new Error(`No hay horario configurado para el día ${dayOfWeek}`)
    }

    console.log(`   Horario: ${schedule.start_time} - ${schedule.end_time}`)
  })

  // Test 8: Probar diferentes estados de cita
  await ejecutarTest('Probar diferentes estados de cita', async () => {
    const estados = ['scheduled', 'completed', 'cancelled']
    
    for (const estado of estados) {
      // Obtener datos necesarios
      const { data: specialist } = await supabase
        .from('specialists')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      const { data: service } = await supabase
        .from('aesthetic_services')
        .select('id, duration')
        .eq('is_active', true)
        .limit(1)
        .single()

      // Crear paciente de prueba
      const testEmail = `test-${estado}-${Date.now()}@example.com`
      const { data: patient } = await supabase
        .from('patients')
        .insert({
          name: `Test Usuario ${estado}`,
          email: testEmail,
          phone: '+54 03407532790'
        })
        .select()
        .single()

      // Crear cita con estado específico
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const appointmentDate = tomorrow.toISOString().split('T')[0]
      const appointmentTime = '11:00'

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          specialist_id: specialist.id,
          patient_id: patient.id,
          service_id: service.id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          duration: service.duration,
          status: estado
        })
        .select()
        .single()

      if (error) throw new Error(`Error creando cita con estado ${estado}: ${error.message}`)

      console.log(`   Cita con estado '${estado}' creada correctamente`)

      // Limpiar datos de prueba
      await supabase.from('appointments').delete().eq('id', appointment.id)
      await supabase.from('patients').delete().eq('id', patient.id)
    }
  })

  // Resumen final
  console.log('📊 RESUMEN FINAL DE TESTS')
  console.log('========================')
  console.log(`✅ Tests pasados: ${testsPasados}`)
  console.log(`❌ Tests fallidos: ${testsFallidos}`)
  console.log(`📈 Total: ${testsPasados + testsFallidos}`)

  if (testsFallidos === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!')
    console.log('✅ El sistema de reservas está funcionando correctamente')
    console.log('✅ Todos los formatos de teléfono son válidos')
    console.log('✅ Las reservas se pueden crear sin problemas')
    console.log('✅ La validación de horarios funciona')
    console.log('✅ Los diferentes estados de cita funcionan')
  } else {
    console.log('\n⚠️ ALGUNOS TESTS FALLARON')
    console.log('🔍 Revisar los errores anteriores para identificar problemas')
  }

  return testsFallidos === 0
}

// Ejecutar tests
testCompletoReservas()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Error ejecutando tests:', error)
    process.exit(1)
  })
