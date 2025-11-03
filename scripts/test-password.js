const bcrypt = require('bcryptjs');

// Script para verificar si el hash corresponde a 'admin123'
const hashFromDB = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const password = 'admin123';

console.log('🔍 Verificando contraseña...');
console.log('Hash de la BD:', hashFromDB);
console.log('Contraseña a verificar:', password);

const isValid = bcrypt.compareSync(password, hashFromDB);
console.log('✅ ¿Es válida?', isValid);

if (!isValid) {
  console.log('❌ El hash NO corresponde a admin123');
  console.log('🔧 Generando nuevo hash para admin123...');
  const newHash = bcrypt.hashSync(password, 10);
  console.log('Nuevo hash:', newHash);
} else {
  console.log('✅ El hash SÍ corresponde a admin123');
}
