#!/usr/bin/env node

/**
 * Script de prueba específico para el caso del usuario
 */

// Función de validación actualizada
const isValidArgentinaPhone = (phone) => {
  if (!phone || phone.trim() === '') return true // Teléfono es opcional
  
  // Limpiar el número de espacios y caracteres especiales
  const cleanPhone = phone.trim().replace(/[\s-]/g, '')
  
  // Patrón más flexible que acepta:
  // - Código país opcional (+54 o 54)
  // - Código de celular opcional (9)
  // - Código de área específico (11, 03407, 03329, 03364, 0341) o cualquier código de 2-5 dígitos
  // - Número local (6-8 dígitos)
  // - Espacios opcionales entre todas las partes
  const phoneRegex = /^(\+?54[ ]?)?(9[ ]?)?(11|03407|03329|03364|0341|[0-9]{2,5})[ ]?\d{6,8}$/
  
  return phoneRegex.test(cleanPhone)
}

console.log('🧪 PRUEBA ESPECÍFICA PARA EL CASO DEL USUARIO')
console.log('==============================================\n')

// Casos específicos del usuario
const testCases = [
  { phone: '+54 03407532790', expected: true, description: 'Caso específico del usuario (sin espacios)' },
  { phone: '54 03407 532790', expected: true, description: 'Ramallo con espacios' },
  { phone: '03407 532790', expected: true, description: 'Ramallo sin código país' },
  { phone: '+54 3407 532790', expected: true, description: 'Ramallo con +54 y espacios' },
  { phone: '5403407532790', expected: true, description: 'Ramallo completamente sin espacios' },
  { phone: '+5403407532790', expected: true, description: 'Ramallo con +54 sin espacios' },
]

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = isValidArgentinaPhone(testCase.phone)
  const status = result === testCase.expected ? '✅' : '❌'
  
  console.log(`${index + 1}. ${status} ${testCase.description}`)
  console.log(`   Teléfono: "${testCase.phone}"`)
  console.log(`   Esperado: ${testCase.expected}, Obtenido: ${result}`)
  
  if (result === testCase.expected) {
    passed++
  } else {
    failed++
  }
  console.log('')
})

console.log('📊 RESUMEN DE PRUEBAS')
console.log('=====================')
console.log(`✅ Pasaron: ${passed}`)
console.log(`❌ Fallaron: ${failed}`)
console.log(`📈 Total: ${testCases.length}`)

if (failed === 0) {
  console.log('\n🎉 ¡Todas las pruebas pasaron! El número del usuario ahora es válido.')
} else {
  console.log('\n⚠️ Algunas pruebas fallaron. Revisar la lógica de validación.')
}
