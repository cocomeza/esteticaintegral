#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas de reservas
 * Verifica la configuración y conectividad de Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function diagnosticarReservas() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE RESERVAS')
  console.log('=====================================\n')

  // 1. Verificar variables de entorno
  console.log('1. 📋 Verificando variables de entorno...')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || supabaseUrl === 'https://ejemplo.supabase.co') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no configurado o es valor de ejemplo')
    return
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ejemplo.clave.temporal') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no configurado o es valor de ejemplo')
    return
  }
  if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no configurado - usando clave anónima')
  }

  console.log('✅ Variables de entorno configuradas correctamente\n')

  // 2. Crear cliente Supabase
  console.log('2. 🔗 Probando conexión a Supabase...')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Probar conexión básica
    const { data, error } = await supabase.from('specialists').select('count').limit(1)
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return
    }
    console.log('✅ Conexión a Supabase exitosa\n')
  } catch (err) {
    console.error('❌ Error de conexión:', err.message)
    return
  }

  // 3. Verificar datos esenciales
  console.log('3. 📊 Verificando datos esenciales...')
  
  // Verificar especialistas
  const { data: specialists, error: specialistsError } = await supabase
    .from('specialists')
    .select('id, name, email, is_active')
    .eq('is_active', true)

  if (specialistsError) {
    console.error('❌ Error obteniendo especialistas:', specialistsError.message)
  } else if (!specialists || specialists.length === 0) {
    console.error('❌ No hay especialistas activos en la base de datos')
    console.log('💡 Solución: Ejecutar database/SCHEMA-COMPLETO-FINAL.sql en Supabase')
  } else {
    console.log(`✅ ${specialists.length} especialista(s) encontrado(s):`)
    specialists.forEach(s => console.log(`   - ${s.name} (${s.email})`))
  }

  // Verificar servicios
  const { data: services, error: servicesError } = await supabase
    .from('aesthetic_services')
    .select('id, name, duration, category, is_active')
    .eq('is_active', true)

  if (servicesError) {
    console.error('❌ Error obteniendo servicios:', servicesError.message)
  } else if (!services || services.length === 0) {
    console.error('❌ No hay servicios activos en la base de datos')
    console.log('💡 Solución: Ejecutar database/SCHEMA-COMPLETO-FINAL.sql en Supabase')
  } else {
    console.log(`✅ ${services.length} servicio(s) encontrado(s):`)
    services.forEach(s => console.log(`   - ${s.name} (${s.duration} min, ${s.category})`))
  }

  // Verificar horarios de trabajo
  const { data: schedules, error: schedulesError } = await supabase
    .from('work_schedules')
    .select('specialist_id, day_of_week, start_time, end_time, is_active')

  if (schedulesError) {
    console.error('❌ Error obteniendo horarios:', schedulesError.message)
  } else if (!schedules || schedules.length === 0) {
    console.error('❌ No hay horarios de trabajo configurados')
    console.log('💡 Solución: Ejecutar database/SCHEMA-COMPLETO-FINAL.sql en Supabase')
  } else {
    console.log(`✅ ${schedules.length} horario(s) configurado(s)`)
  }

  console.log('')

  // 4. Verificar permisos RLS
  console.log('4. 🔒 Verificando permisos de Row Level Security...')
  
  try {
    // Intentar crear un paciente de prueba
    const { data: testPatient, error: patientError } = await supabase
      .from('patients')
      .insert({
        name: 'Test Usuario',
        email: 'test@example.com',
        phone: '1234567890'
      })
      .select()
      .single()

    if (patientError) {
      console.error('❌ Error creando paciente de prueba:', patientError.message)
      console.log('💡 Posible problema con RLS o permisos de inserción')
    } else {
      console.log('✅ Permisos de inserción funcionando')
      
      // Limpiar paciente de prueba
      await supabase.from('patients').delete().eq('id', testPatient.id)
    }
  } catch (err) {
    console.error('❌ Error verificando permisos:', err.message)
  }

  console.log('')

  // 5. Verificar configuración de reCAPTCHA
  console.log('5. 🤖 Verificando configuración de reCAPTCHA...')
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!recaptchaSiteKey) {
    console.warn('⚠️ NEXT_PUBLIC_RECAPTCHA_SITE_KEY no configurado')
    console.log('💡 Las reservas funcionarán pero sin protección anti-spam')
  } else {
    console.log('✅ reCAPTCHA configurado')
  }

  if (!recaptchaSecretKey) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY no configurado')
  }

  console.log('')

  // 6. Resumen y recomendaciones
  console.log('6. 📋 RESUMEN Y RECOMENDACIONES')
  console.log('================================')

  if (!specialists || specialists.length === 0) {
    console.log('🚨 PROBLEMA CRÍTICO: No hay especialistas en la base de datos')
    console.log('   Solución: Ejecutar database/SCHEMA-COMPLETO-FINAL.sql en Supabase SQL Editor')
  }

  if (!services || services.length === 0) {
    console.log('🚨 PROBLEMA CRÍTICO: No hay servicios en la base de datos')
    console.log('   Solución: Ejecutar database/SCHEMA-COMPLETO-FINAL.sql en Supabase SQL Editor')
  }

  if (!schedules || schedules.length === 0) {
    console.log('🚨 PROBLEMA CRÍTICO: No hay horarios configurados')
    console.log('   Solución: Ejecutar database/SCHEMA-COMPLETO-FINAL.sql en Supabase SQL Editor')
  }

  console.log('\n✅ Diagnóstico completado')
}

// Ejecutar diagnóstico
diagnosticarReservas().catch(console.error)
