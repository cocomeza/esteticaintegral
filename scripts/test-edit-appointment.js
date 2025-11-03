// Script para probar la edición de una cita
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_APPOINTMENT_ID = process.env.TEST_APPOINTMENT_ID || ''; // Pasar como variable de entorno

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        ...options.headers,
        'Cookie': options.cookie || ''
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
      req.write(body);
    }
    
    req.end();
  });
}

async function testEditAppointment() {
  if (!TEST_APPOINTMENT_ID) {
    console.error('❌ Se requiere TEST_APPOINTMENT_ID');
    console.error('');
    console.error('Uso:');
    console.error('  TEST_APPOINTMENT_ID=uuid-del-turno node scripts/test-edit-appointment.js');
    return;
  }

  console.log('🧪 Probando edición de cita...');
  console.log('URL:', `${BASE_URL}/api/admin/appointments`);
  console.log('Appointment ID:', TEST_APPOINTMENT_ID);
  console.log('');

  const newDate = '2025-01-15'; // Nueva fecha de prueba
  const newTime = '14:00'; // Nueva hora de prueba

  try {
    const body = JSON.stringify({
      appointmentId: TEST_APPOINTMENT_ID,
      specialistId: null, // Se obtendrá del turno actual
      serviceId: null, // Se mantiene el servicio actual
      patientId: null, // Se mantiene el paciente actual
      appointmentDate: newDate,
      appointmentTime: newTime,
      notes: 'Cita editada por script de prueba'
    });

    console.log('📤 Enviando:', JSON.stringify(JSON.parse(body), null, 2));
    console.log('');

    const response = await makeRequest(`${BASE_URL}/api/admin/appointments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      cookie: '' // Necesitarías una cookie de sesión válida
    }, body);

    console.log('📊 Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.status === 200) {
      console.log('✅ Cita actualizada exitosamente');
      console.log('');
      console.log('Datos actualizados:');
      console.log('  Fecha:', newDate);
      console.log('  Hora:', newTime);
    } else {
      console.log('❌ Error al actualizar cita');
      console.log('Error:', response.data.error || 'Error desconocido');
      if (response.data.details) {
        console.log('Detalles:', response.data.details);
      }
    }
  } catch (error) {
    console.error('❌ Error al probar edición:', error.message);
    console.error('');
    console.error('Posibles causas:');
    console.error('  1. El servidor no está corriendo');
    console.error('  2. La cookie de sesión no es válida (necesitas estar logueado)');
    console.error('  3. El appointment ID no existe');
    console.error('  4. Problemas de red');
  }
}

// Ejecutar test
testEditAppointment();

