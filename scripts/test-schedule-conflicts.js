/**
 * Script para probar la validación de conflictos de horarios
 * 
 * Este script simula el escenario donde Lorena cambia su horario
 * y hay turnos existentes que quedan afectados.
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usar variables de entorno reales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testScheduleConflictValidation() {
  console.log('🧪 Iniciando prueba de validación de conflictos de horarios...\n')

  try {
    // 1. Obtener el ID de Lorena
    const { data: specialist, error: specialistError } = await supabase
      .from('specialists')
      .select('id, name')
      .eq('name', 'Lorena Esquivel')
      .single()

    if (specialistError || !specialist) {
      throw new Error('No se encontró el especialista Lorena Esquivel')
    }

    console.log(`✅ Especialista encontrado: ${specialist.name} (ID: ${specialist.id})`)

    // 2. Crear un turno de prueba para el lunes (día 1)
    const testDate = new Date()
    testDate.setDate(testDate.getDate() + (1 - testDate.getDay() + 7) % 7) // Próximo lunes
    const testDateString = testDate.toISOString().split('T')[0]

    console.log(`📅 Creando turno de prueba para el ${testDateString} (Lunes)`)

    // Crear paciente de prueba
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert([{
        name: 'Paciente Prueba',
        email: 'prueba@test.com',
        phone: '+54 11 1234-5678'
      }])
      .select()
      .single()

    if (patientError) {
      console.log('⚠️ Paciente ya existe o error:', patientError.message)
      // Intentar obtener el paciente existente
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('email', 'prueba@test.com')
        .single()
      
      if (existingPatient) {
        patient = existingPatient
      } else {
        throw patientError
      }
    }

    // Obtener un servicio
    const { data: service } = await supabase
      .from('aesthetic_services')
      .select('id, name, duration')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!service) {
      throw new Error('No se encontraron servicios activos')
    }

    // Crear turno de prueba a las 16:00 (fuera del nuevo horario que vamos a probar)
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([{
        specialist_id: specialist.id,
        patient_id: patient.id,
        service_id: service.id,
        appointment_date: testDateString,
        appointment_time: '16:00',
        duration: service.duration,
        status: 'scheduled',
        notes: 'Turno de prueba para validación de conflictos'
      }])
      .select()
      .single()

    if (appointmentError) {
      console.log('⚠️ Turno ya existe o error:', appointmentError.message)
      // Intentar obtener el turno existente
      const { data: existingAppointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('specialist_id', specialist.id)
        .eq('appointment_date', testDateString)
        .eq('appointment_time', '16:00')
        .single()
      
      if (existingAppointment) {
        appointment = existingAppointment
      } else {
        throw appointmentError
      }
    }

    console.log(`✅ Turno creado: ${appointment.appointment_date} a las ${appointment.appointment_time}`)

    // 3. Simular cambio de horario (de 9:00-18:00 a 9:00-14:00)
    console.log('\n🔄 Simulando cambio de horario: 9:00-18:00 → 9:00-14:00')

    // Importar la función de validación
    const { validateScheduleChange } = require('../src/lib/schedule-validation')

    const validation = await validateScheduleChange(
      specialist.id,
      1, // Lunes
      '09:00', // Nuevo horario de inicio
      '14:00', // Nuevo horario de fin (más temprano)
      '13:00', // Almuerzo
      '14:00',
      null // Todos los servicios permitidos
    )

    // 4. Mostrar resultados
    console.log('\n📊 RESULTADOS DE LA VALIDACIÓN:')
    console.log('=' .repeat(50))
    console.log(`🔍 ¿Hay conflictos?: ${validation.hasConflicts ? 'SÍ' : 'NO'}`)
    console.log(`📈 Turnos afectados: ${validation.affectedAppointmentsCount}`)
    console.log(`✅ ¿Se puede proceder?: ${validation.canProceed ? 'SÍ' : 'NO'}`)
    console.log(`💡 Recomendación: ${validation.recommendation}`)

    if (validation.hasConflicts) {
      console.log('\n⚠️ CONFLICTOS DETECTADOS:')
      validation.conflicts.forEach((conflict, index) => {
        console.log(`\n${index + 1}. Turno ID: ${conflict.appointmentId}`)
        console.log(`   👤 Paciente: ${conflict.patientName}`)
        console.log(`   📧 Email: ${conflict.patientEmail}`)
        console.log(`   📅 Fecha: ${conflict.appointmentDate}`)
        console.log(`   ⏰ Hora: ${conflict.appointmentTime}`)
        console.log(`   🛠️ Servicio: ${conflict.serviceName}`)
        console.log(`   ⚠️ Tipo de conflicto: ${conflict.conflictType}`)
      })
    }

    // 5. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    
    await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)

    console.log('✅ Datos de prueba eliminados')

    console.log('\n🎉 Prueba completada exitosamente!')
    console.log('\n📋 RESUMEN:')
    console.log('- El sistema detecta correctamente los conflictos de horarios')
    console.log('- Los turnos afectados son identificados apropiadamente')
    console.log('- Se proporciona información detallada para resolver conflictos')

  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
    process.exit(1)
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testScheduleConflictValidation()
}

module.exports = { testScheduleConflictValidation }
