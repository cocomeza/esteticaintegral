// Script para verificar las variables de entorno
// Ejecutar con: node scripts/check-env.js

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verificando variables de entorno...\n')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
]

const optionalVars = [
  'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
  'RECAPTCHA_SECRET_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM_NAME',
  'SMTP_FROM_EMAIL',
  'CRON_SECRET'
]

console.log('📋 VARIABLES REQUERIDAS:')
let allRequired = true
requiredVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '❌'
  const displayValue = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NO DEFINIDA'
  console.log(`${status} ${varName}: ${displayValue}`)
  if (!value) allRequired = false
})

console.log('\n📋 VARIABLES OPCIONALES:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  const status = value ? '✅' : '⚠️'
  const displayValue = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NO DEFINIDA'
  console.log(`${status} ${varName}: ${displayValue}`)
})

console.log('\n🎯 RESUMEN:')
if (allRequired) {
  console.log('✅ Todas las variables requeridas están configuradas')
  console.log('🚀 El sistema debería funcionar correctamente')
} else {
  console.log('❌ Faltan variables requeridas')
  console.log('📝 Revisa tu archivo .env.local')
}

console.log('\n💡 CREDENCIALES DE ACCESO:')
console.log('📧 Email: lore.estetica76@gmail.com')
console.log('🔑 Contraseña: admin123')
console.log('⚠️  IMPORTANTE: Ejecuta el script database/fix-admin-password.sql en Supabase')
