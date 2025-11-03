// Script para probar el login de administrador
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL || 'lore.estetica76@gmail.com';
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';

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
      headers: options.headers || {}
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

async function testLogin() {
  console.log('🧪 Probando login de administrador...');
  console.log('URL:', `${BASE_URL}/api/admin/login`);
  console.log('Email:', TEST_EMAIL);
  console.log('Password:', '*'.repeat(TEST_PASSWORD.length));
  console.log('');

  try {
    const body = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const response = await makeRequest(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, body);

    const cookies = response.headers['set-cookie'] || [];

    console.log('📊 Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (cookies.length > 0) {
      console.log('🍪 Cookies recibidas:');
      cookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0];
        const hasHttpOnly = cookie.includes('HttpOnly');
        const hasSecure = cookie.includes('Secure');
        console.log(`  ✓ ${cookieName} (HttpOnly: ${hasHttpOnly}, Secure: ${hasSecure})`);
      });
    } else {
      console.log('⚠️  No se recibieron cookies');
    }

    console.log('');
    if (response.status === 200) {
      console.log('✅ Login exitoso');
      console.log('');
      console.log('Credenciales válidas:');
      console.log(`  Email: ${TEST_EMAIL}`);
      console.log(`  Password: ${TEST_PASSWORD}`);
    } else {
      console.log('❌ Login falló');
      console.log('Error:', response.data.error || 'Error desconocido');
      if (response.data.details) {
        console.log('Detalles:', response.data.details);
      }
      console.log('');
      console.log('Verificaciones:');
      console.log('  1. ¿El usuario existe en admin_users?');
      console.log('  2. ¿is_active = true?');
      console.log('  3. ¿El password_hash coincide?');
      console.log('  4. ¿JWT_SECRET está configurado?');
    }
  } catch (error) {
    console.error('❌ Error al probar login:', error.message);
    console.error('');
    console.error('Posibles causas:');
    console.error('  1. El servidor no está corriendo');
    console.error('  2. La URL es incorrecta');
    console.error('  3. Problemas de red');
    console.error('');
    console.error('Para probar localmente:');
    console.error('  1. Ejecutar: npm run dev');
    console.error('  2. Esperar a que el servidor inicie');
    console.error('  3. Ejecutar este script: node scripts/test-login.js');
  }
}

// Ejecutar test
testLogin();

