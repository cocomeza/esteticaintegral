// Script para generar hash de contraseña
// Uso: node scripts/generate-password-hash.js "tu_nueva_contraseña"

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('❌ Error: Debes proporcionar una contraseña');
  console.log('Uso: node scripts/generate-password-hash.js "tu_contraseña"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\n✅ Hash generado exitosamente:\n');
console.log('Contraseña:', password);
console.log('Hash:', hash);
console.log('\n📋 SQL para actualizar en Supabase:\n');
console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = 'admin@esteticaintegral.com.ar';`);
console.log('\n');

