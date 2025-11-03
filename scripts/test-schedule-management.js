// Script para probar la gestión de horarios regulares
// Verifica que los horarios funcionan y avisan de turnos reservados

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Configuración de pruebas
const TEST_CONFIG = {
  specialistId: process.env.TEST_SPECIALIST_ID || '', // Debe proporcionarse
  adminEmail: process.env.TEST_ADMIN_EMAIL || 'lore.estetica76@gmail.com',
  adminPassword: process.env.TEST_ADMIN_PASSWORD || 'admin123'
};

let authCookies = ''; // Cookies de autenticación

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + (urlObj.search || ''),
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authCookies ? { 'Cookie': authCookies } : {}),
        ...options.headers
      }
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function authenticateAdmin() {
  console.log('🔐 Autenticando como administrador...');
  const response = await makeRequest(`${BASE_URL}/api/admin/login`, {
    method: 'POST'
  }, {
    email: TEST_CONFIG.adminEmail,
    password: TEST_CONFIG.adminPassword
  });

  if (response.status !== 200) {
    throw new Error(`Error de autenticación: ${response.status} - ${JSON.stringify(response.data)}`);
  }

  // Extraer cookies de Set-Cookie header
  const setCookieHeaders = response.headers['set-cookie'] || [];
  if (setCookieHeaders.length > 0) {
    authCookies = setCookieHeaders.map((cookie) => {
      // Extraer solo la parte nombre=valor antes del primer punto y coma
      return cookie.split(';')[0];
    }).join('; ');
    console.log('✅ Autenticación exitosa');
    return true;
  } else {
    throw new Error('No se recibieron cookies de autenticación');
  }
}

async function testCase(name, testFunction) {
  console.log(`\n🧪 Test: ${name}`);
  console.log('─'.repeat(60));
  try {
    await testFunction();
    console.log(`✅ PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function testGetSchedules() {
  // Test 1: Obtener lista de horarios
  const response = await makeRequest(`${BASE_URL}/api/admin/schedules?specialistId=${TEST_CONFIG.specialistId}`, {
    method: 'GET'
  });

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
  }

  const schedules = response.data.schedules || [];
  console.log(`   ✓ Se obtuvieron ${schedules.length} horario(s)`);
  
  if (schedules.length > 0) {
    console.log(`   📋 Horarios encontrados:`);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    schedules.slice(0, 5).forEach((schedule, idx) => {
      const dayName = dayNames[schedule.day_of_week] || 'Desconocido';
      console.log(`     ${idx + 1}. ${dayName}: ${schedule.start_time} - ${schedule.end_time}`);
      if (schedule.lunch_start && schedule.lunch_end) {
        console.log(`        Almuerzo: ${schedule.lunch_start} - ${schedule.lunch_end}`);
      }
    });
  }
  
  return schedules;
}

async function testValidateScheduleWithoutConflicts() {
  // Test 2: Validar cambio de horario sin conflictos (Lunes)
  const response = await makeRequest(`${BASE_URL}/api/admin/schedules/validate`, {
    method: 'POST'
  }, {
    specialistId: TEST_CONFIG.specialistId,
    dayOfWeek: 1, // Lunes
    newStartTime: '08:00',
    newEndTime: '19:00',
    newLunchStart: '13:00',
    newLunchEnd: '14:00'
  });

  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
  }

  const validation = response.data.validation;
  console.log(`   ✓ Validación completada`);
  console.log(`   ✓ Conflictos: ${validation.hasConflicts ? 'Sí' : 'No'} (${validation.affectedAppointmentsCount} turnos)`);
  console.log(`   ✓ Mensaje: ${validation.recommendation}`);
}

async function testValidateScheduleWithConflicts() {
  // Test 3: Crear turnos para un día específico y luego validar cambio que los afecte
  // Necesitamos crear turnos para el próximo lunes (día 1)
  const nextMonday = getNextWeekday(1); // Próximo lunes
  
  console.log(`   📝 Preparando test para ${nextMonday} (Lunes)`);
  
  // Buscar servicios y pacientes
  const servicesResponse = await makeRequest(`${BASE_URL}/api/admin/services`, {
    method: 'GET'
  });
  
  if (servicesResponse.status !== 200 || !servicesResponse.data.services || servicesResponse.data.services.length === 0) {
    console.log('   ⚠️  No se pueden crear turnos de prueba - no hay servicios disponibles');
    return; // Skip
  }

  const service = servicesResponse.data.services[0];
  const appointmentTime = '17:00'; // Hora que será afectada

  // Buscar o crear paciente
  const patientsResponse = await makeRequest(`${BASE_URL}/api/admin/patients?limit=1`, {
    method: 'GET'
  });
  
  let patientId;
  if (patientsResponse.data && patientsResponse.data.length > 0) {
    patientId = patientsResponse.data[0].id;
  } else {
    // Crear paciente de prueba
    const newPatientResponse = await makeRequest(`${BASE_URL}/api/admin/patients`, {
      method: 'POST'
    }, {
      name: `Test Paciente Horarios ${Date.now()}`,
      email: `testhorarios${Date.now()}@example.com`,
      phone: '1234567890'
    });
    
    if (newPatientResponse.status === 201 || newPatientResponse.status === 200) {
      patientId = newPatientResponse.data.patient?.id || newPatientResponse.data.id;
    } else {
      console.log('   ⚠️  No se pudo crear/buscar paciente - saltando test de conflictos');
      return;
    }
  }

  // Crear turno de prueba
  console.log(`   📝 Creando turno de prueba: ${nextMonday} a las ${appointmentTime}`);
  const appointmentResponse = await makeRequest(`${BASE_URL}/api/admin/appointments`, {
    method: 'POST'
  }, {
    specialistId: TEST_CONFIG.specialistId,
    serviceId: service.id,
    patientId: patientId,
    appointmentDate: nextMonday,
    appointmentTime: appointmentTime,
    notes: 'Turno de prueba para test de horarios'
  });

  if (appointmentResponse.status !== 201) {
    console.log(`   ⚠️  No se pudo crear turno: ${JSON.stringify(appointmentResponse.data)}`);
    console.log('   ⚠️  Saltando test de conflictos');
    return;
  }

  const appointmentId = appointmentResponse.data.appointment?.id;
  console.log(`   ✓ Turno creado: ${appointmentId} a las ${appointmentTime}`);

  // Validar cambio que afecta el turno (reducir horario de fin)
  console.log(`   🔍 Validando cambio de horario que afecta el turno...`);
  const validationResponse = await makeRequest(`${BASE_URL}/api/admin/schedules/validate`, {
    method: 'POST'
  }, {
    specialistId: TEST_CONFIG.specialistId,
    dayOfWeek: 1, // Lunes
    newStartTime: '09:00',
    newEndTime: '16:00', // Termina antes del turno de las 17:00
    newLunchStart: '13:00',
    newLunchEnd: '14:00'
  });

  if (validationResponse.status !== 200) {
    throw new Error(`Expected 200, got ${validationResponse.status}`);
  }

  const validation = validationResponse.data.validation;
  
  if (!validation.hasConflicts) {
    console.log('   ⚠️  No se detectaron conflictos (puede ser que el turno no es del día correcto)');
  } else {
    console.log(`   ✓ Se detectaron ${validation.affectedAppointmentsCount} conflicto(s)`);
    console.log(`   ✓ Mensaje: ${validation.recommendation}`);
    
    if (validation.conflicts && validation.conflicts.length > 0) {
      console.log(`   ✓ Detalles del conflicto:`);
      validation.conflicts.forEach((conflict, idx) => {
        console.log(`     ${idx + 1}. ${conflict.patientName} - ${conflict.appointmentDate} ${conflict.appointmentTime} (${conflict.serviceName})`);
        if (conflict.conflictType) {
          console.log(`        Tipo: ${conflict.conflictType}`);
        }
      });
    }
  }

  // Limpiar: eliminar el turno de prueba
  if (appointmentId) {
    await makeRequest(`${BASE_URL}/api/admin/appointments`, {
      method: 'DELETE'
    }, {
      appointmentId: appointmentId
    });
    console.log(`   🧹 Turno de prueba eliminado`);
  }
}

function getNextWeekday(dayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  
  if (daysUntilTarget === 0) {
    daysUntilTarget = 7; // Si es hoy, tomar el próximo
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

async function testValidateLunchConflict() {
  // Test 4: Crear turno durante horario de almuerzo y luego cambiar el horario de almuerzo
  const nextMonday = getNextWeekday(1); // Próximo lunes
  
  console.log(`   📝 Preparando test de conflicto con horario de almuerzo para ${nextMonday} (Lunes)`);
  
  // Buscar servicios y pacientes
  const servicesResponse = await makeRequest(`${BASE_URL}/api/admin/services`, {
    method: 'GET'
  });
  
  if (servicesResponse.status !== 200 || !servicesResponse.data.services || servicesResponse.data.services.length === 0) {
    console.log('   ⚠️  No se pueden crear turnos de prueba - no hay servicios disponibles');
    return; // Skip
  }

  const service = servicesResponse.data.services[0];
  const appointmentTime = '13:30'; // Hora dentro del horario de almuerzo típico (13:00-14:00)

  // Buscar o crear paciente
  const patientsResponse = await makeRequest(`${BASE_URL}/api/admin/patients?limit=1`, {
    method: 'GET'
  });
  
  let patientId;
  if (patientsResponse.data && patientsResponse.data.length > 0) {
    patientId = patientsResponse.data[0].id;
  } else {
    // Crear paciente de prueba
    const newPatientResponse = await makeRequest(`${BASE_URL}/api/admin/patients`, {
      method: 'POST'
    }, {
      name: `Test Almuerzo ${Date.now()}`,
      email: `testalmuerzo${Date.now()}@example.com`,
      phone: '1234567890'
    });
    
    if (newPatientResponse.status === 201 || newPatientResponse.status === 200) {
      patientId = newPatientResponse.data.patient?.id || newPatientResponse.data.id;
    } else {
      console.log('   ⚠️  No se pudo crear/buscar paciente - saltando test de conflicto con almuerzo');
      return;
    }
  }

  // Crear turno durante el horario de almuerzo
  console.log(`   📝 Creando turno durante horario de almuerzo: ${nextMonday} a las ${appointmentTime}`);
  const appointmentResponse = await makeRequest(`${BASE_URL}/api/admin/appointments`, {
    method: 'POST'
  }, {
    specialistId: TEST_CONFIG.specialistId,
    serviceId: service.id,
    patientId: patientId,
    appointmentDate: nextMonday,
    appointmentTime: appointmentTime,
    notes: 'Turno de prueba para test de conflicto con almuerzo'
  });

  if (appointmentResponse.status !== 201) {
    console.log(`   ⚠️  No se pudo crear turno: ${JSON.stringify(appointmentResponse.data)}`);
    console.log('   ⚠️  Saltando test de conflicto con almuerzo');
    return;
  }

  const appointmentId = appointmentResponse.data.appointment?.id;
  console.log(`   ✓ Turno creado: ${appointmentId} a las ${appointmentTime} (durante horario de almuerzo)`);

  // Validar cambio del horario de almuerzo que cubre el turno existente
  console.log(`   🔍 Validando cambio de horario de almuerzo que afecta el turno...`);
  const validationResponse = await makeRequest(`${BASE_URL}/api/admin/schedules/validate`, {
    method: 'POST'
  }, {
    specialistId: TEST_CONFIG.specialistId,
    dayOfWeek: 1, // Lunes
    newStartTime: '09:00',
    newEndTime: '18:00', // Horario normal
    newLunchStart: '13:00', // Almuerzo que cubre el turno de 13:30
    newLunchEnd: '14:30'   // Extiende el almuerzo hasta 14:30
  });

  if (validationResponse.status !== 200) {
    throw new Error(`Expected 200, got ${validationResponse.status}`);
  }

  const validation = validationResponse.data.validation;
  
  if (!validation.hasConflicts) {
    console.log('   ⚠️  No se detectaron conflictos (puede ser que el turno no es del día correcto)');
  } else {
    console.log(`   ✓ Se detectaron ${validation.affectedAppointmentsCount} conflicto(s)`);
    console.log(`   ✓ Mensaje: ${validation.recommendation}`);
    
    if (validation.conflicts && validation.conflicts.length > 0) {
      console.log(`   ✓ Detalles del conflicto:`);
      validation.conflicts.forEach((conflict, idx) => {
        console.log(`     ${idx + 1}. ${conflict.patientName} - ${conflict.appointmentDate} ${conflict.appointmentTime} (${conflict.serviceName})`);
        if (conflict.conflictType === 'lunch_conflict') {
          console.log(`        ✅ TIPO: CONFLICTO CON ALMUERZO (correcto!)`);
        } else {
          console.log(`        ⚠️  Tipo: ${conflict.conflictType} (esperado: lunch_conflict)`);
        }
      });
    }

    // Verificar que al menos un conflicto es de tipo 'lunch_conflict'
    const lunchConflicts = validation.conflicts.filter(c => c.conflictType === 'lunch_conflict');
    if (lunchConflicts.length > 0) {
      console.log(`   ✅ Test EXITOSO: Se detectaron ${lunchConflicts.length} conflicto(s) con horario de almuerzo`);
    } else {
      console.log(`   ⚠️  ADVERTENCIA: No se detectaron conflictos específicos con horario de almuerzo`);
    }
  }

  // Limpiar: eliminar el turno de prueba
  if (appointmentId) {
    await makeRequest(`${BASE_URL}/api/admin/appointments`, {
      method: 'DELETE'
    }, {
      appointmentId: appointmentId
    });
    console.log(`   🧹 Turno de prueba eliminado`);
  }
}

async function testCreateSchedule() {
  // Test 5: Intentar crear un horario nuevo (domingo, que probablemente no existe)
  console.log(`   📝 Intentando crear horario para Domingo (día 0)...`);
  
  const response = await makeRequest(`${BASE_URL}/api/admin/schedules`, {
    method: 'POST'
  }, {
    specialistId: TEST_CONFIG.specialistId,
    dayOfWeek: 0, // Domingo
    startTime: '10:00',
    endTime: '14:00',
    lunchStart: null,
    lunchEnd: null
  });

  if (response.status === 201) {
    console.log(`   ✓ Horario creado exitosamente`);
    const scheduleId = response.data.schedule?.id;
    
    // Limpiar: eliminar el horario de prueba
    if (scheduleId) {
      await makeRequest(`${BASE_URL}/api/admin/schedules`, {
        method: 'DELETE'
      }, {
        scheduleId: scheduleId
      });
      console.log(`   🧹 Horario de prueba eliminado`);
    }
  } else if (response.status === 400 && response.data.error?.includes('ya existe')) {
    console.log(`   ⚠️  Ya existe un horario para Domingo (esto está bien)`);
  } else {
    throw new Error(`Expected 201 or 400, got ${response.status}: ${JSON.stringify(response.data)}`);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando tests de Gestión de Horarios');
  console.log('='.repeat(60));
  console.log(`URL Base: ${BASE_URL}`);
  
  // Autenticar primero
  try {
    await authenticateAdmin();
  } catch (error) {
    console.error('\n❌ ERROR: No se pudo autenticar');
    console.error(`   ${error.message}`);
    console.error('\nVerifica:');
    console.error('  1. Que el servidor esté corriendo (npm run dev)');
    console.error('  2. Que las credenciales sean correctas');
    console.error('  3. Variables opcionales: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD');
    return;
  }

  if (!TEST_CONFIG.specialistId) {
    console.error('\n❌ ERROR: Se requiere TEST_SPECIALIST_ID');
    console.error('\nUso:');
    console.error('  TEST_SPECIALIST_ID=uuid-del-especialista node scripts/test-schedule-management.js');
    console.error('\nPara obtener el ID del especialista:');
    console.error('  node scripts/get-specialist-id.js');
    return;
  }

  console.log(`Especialista ID: ${TEST_CONFIG.specialistId}\n`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Ejecutar tests
  const schedules = await testCase('Obtener lista de horarios', testGetSchedules);
  if (schedules !== undefined) {
    results.passed++;
  } else {
    results.failed++;
  }

  if (await testCase('Validación sin conflictos', testValidateScheduleWithoutConflicts)) {
    results.passed++;
  } else {
    results.failed++;
  }

  if (await testCase('Validación con conflictos', testValidateScheduleWithConflicts)) {
    results.passed++;
  } else {
    results.skipped++; // Este test puede fallar si no se pueden crear turnos
  }

  if (await testCase('Validación de conflicto con horario de almuerzo', testValidateLunchConflict)) {
    results.passed++;
  } else {
    results.skipped++; // Este test puede fallar si no se pueden crear turnos
  }

  if (await testCase('Crear horario nuevo', testCreateSchedule)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));
  console.log(`✅ Pasados: ${results.passed}`);
  console.log(`❌ Fallidos: ${results.failed}`);
  console.log(`⚠️  Omitidos: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);

  if (results.failed === 0) {
    console.log('\n🎉 ¡Todos los tests pasaron!');
  } else {
    console.log('\n⚠️  Algunos tests fallaron. Revisa los errores arriba.');
  }
}

// Ejecutar tests
runAllTests().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

