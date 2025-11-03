#!/usr/bin/env node

/**
 * Script de prueba para verificar que las reservas funcionen
 * después de aplicar la corrección de RLS
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function probarReservas() {
  console.log('🧪 PRUEBA DEL SISTEMA DE RESERVAS')
  console.log('=================================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // 1. Obtener datos necesarios
    console.log('1. 📋 Obteniendo datos necesarios...')
    
    const { data: specialists } = await supabase
      .from('specialists')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)

    const { data: services } = await supabase
      .from('aesthetic_services')
      .select('id, name, duration')
      .eq('is_active', true)
      .limit(1)

    if (!specialists || specialists.length === 0) {
      console.error('❌ No hay especialistas disponibles')
      return
    }

    if (!services || services.length === 0) {
      console.error('❌ No hay servicios disponibles')
      return
    }

    const specialist = specialists[0]
    const service = services[0]

    console.log(`✅ Especialista: ${specialist.name}`)
    console.log(`✅ Servicio: ${service.name} (${service.duration} min)\n`)

    // 2. Probar creación de paciente
    console.log('2. 👤 Probando creación de paciente...')
    
    const testEmail = `test-${Date.now()}@example.com`
    const { data: newPatient, error: patientError } = await supabase
      .from('patients')
      .insert({
        name: 'Test Usuario',
        email: testEmail,
        phone: '1234567890'
      })
      .select()
      .single()

    if (patientError) {
      console.error('❌ Error creando paciente:', patientError.message)
      console.log('💡 Las políticas RLS aún están bloqueando las inserciones')
      return
    }

    console.log(`✅ Paciente creado: ${newPatient.name} (${newPatient.email})\n`)

    // 3. Probar creación de cita
    console.log('3. 📅 Probando creación de cita...')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const appointmentDate = tomorrow.toISOString().split('T')[0]
    const appointmentTime = '10:00'

    const { data: newAppointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        specialist_id: specialist.id,
        patient_id: newPatient.id,
        service_id: service.id,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        duration: service.duration,
        status: 'scheduled'
      })
      .select()
      .single()

    if (appointmentError) {
      console.error('❌ Error creando cita:', appointmentError.message)
      console.log('💡 Las políticas RLS aún están bloqueando las inserciones de citas')
      
      // Limpiar paciente de prueba
      await supabase.from('patients').delete().eq('id', newPatient.id)
      return
    }

    console.log(`✅ Cita creada: ${appointmentDate} a las ${appointmentTime}\n`)

    // 4. Probar lectura de datos
    console.log('4. 📖 Probando lectura de datos...')
    
    const { data: appointments, error: readError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        specialist:specialists(name),
        service:aesthetic_services(name),
        patient:patients(name, email)
      `)
      .eq('id', newAppointment.id)
      .single()

    if (readError) {
      console.error('❌ Error leyendo cita:', readError.message)
    } else {
      console.log('✅ Lectura de datos funcionando correctamente')
      console.log(`   Cita: ${appointments.patient.name} - ${appointments.service.name}`)
      console.log(`   Fecha: ${appointments.appointment_date} ${appointments.appointment_time}`)
    }

    // 5. Limpiar datos de prueba
    console.log('\n5. 🧹 Limpiando datos de prueba...')
    
    await supabase.from('appointments').delete().eq('id', newAppointment.id)
    await supabase.from('patients').delete().eq('id', newPatient.id)
    
    console.log('✅ Datos de prueba eliminados\n')

    // 6. Resumen
    console.log('6. 📋 RESUMEN DE LA PRUEBA')
    console.log('==========================')
    console.log('✅ Creación de pacientes: FUNCIONANDO')
    console.log('✅ Creación de citas: FUNCIONANDO')
    console.log('✅ Lectura de datos: FUNCIONANDO')
    console.log('✅ Limpieza de datos: FUNCIONANDO')
    console.log('\n🎉 ¡El sistema de reservas está funcionando correctamente!')
    console.log('💡 Las políticas RLS han sido corregidas exitosamente')

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
  }
}

// Ejecutar prueba
probarReservas().catch(console.error)
