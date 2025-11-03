const bcrypt = require('bcryptjs')

// Contraseña que estás usando para login
const inputPassword = 'admin123'

// Hash que está en la base de datos (del archivo SQL)
const storedHash = '$2b$10$rOzWKdFJaKfKmIxkUcA.VO8eHi3r/cEGVUgPgUZUf0nKqKYv4zSA.'

console.log('🔍 Verificando contraseña...')
console.log('📝 Contraseña ingresada:', inputPassword)
console.log('🔐 Hash almacenado:', storedHash)

// Verificar la contraseña
const isValid = bcrypt.compareSync(inputPassword, storedHash)

console.log('✅ Resultado:', isValid ? 'VÁLIDA' : 'INVÁLIDA')

if (!isValid) {
  console.log('❌ La contraseña no coincide con el hash')
  console.log('💡 Generando nuevo hash para "admin123"...')
  
  const newHash = bcrypt.hashSync(inputPassword, 10)
  console.log('🆕 Nuevo hash:', newHash)
  
  console.log('\n📋 SQL para actualizar la contraseña:')
  console.log(`UPDATE admin_users SET password_hash = '${newHash}' WHERE email = 'lore.estetica76@gmail.com';`)
}
