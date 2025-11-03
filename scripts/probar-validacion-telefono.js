#!/usr/bin/env node

/**
 * Script de prueba para validación de teléfonos argentinos
 */

// Función de validación actualizada con códigos específicos de la zona
const isValidArgentinaPhone = (phone) => {
  if (!phone || phone.trim() === '') return true // Teléfono es opcional
  
  // Limpiar el número de espacios y caracteres especiales
  const cleanPhone = phone.trim().replace(/[\s-]/g, '')
  
  // Patrón específico para códigos de área conocidos:
  // - Buenos Aires: 11
  // - Ramallo: 03407
  // - San Pedro: 03329
  // - San Nicolás: 03364
  // - Rosario: 0341
  // - Otros códigos de 2-5 dígitos
  const phoneRegex = /^(\+?54[ ]?)?(9[ ]?)?(11|03407|03329|03364|0341|[0-9]{2,5})[ ]?\d{6,8}$/
  
  return phoneRegex.test(cleanPhone)
}

console.log('🧪 PRUEBA DE VALIDACIÓN DE TELÉFONOS ARGENTINOS')
console.log('===============================================\n')

// Casos de prueba específicos para la zona
const testCases = [
  // Buenos Aires
  { phone: '+54 11 1234-5678', expected: true, description: 'Buenos Aires con código país' },
  { phone: '11 1234-5678', expected: true, description: 'Buenos Aires sin código país' },
  { phone: '1112345678', expected: true, description: 'Buenos Aires sin espacios' },
  { phone: '+54 9 11 1234-5678', expected: true, description: 'Celular Buenos Aires' },
  
  // Zona específica del usuario
  { phone: '54 03407 532790', expected: true, description: 'Ramallo con código país (caso del usuario)' },
  { phone: '03407 532790', expected: true, description: 'Ramallo sin código país' },
  { phone: '+54 3407 532790', expected: true, description: 'Ramallo con +54' },
  
  { phone: '54 03329 123456', expected: true, description: 'San Pedro, Pcia de Bs As' },
  { phone: '03329 123456', expected: true, description: 'San Pedro sin código país' },
  
  { phone: '54 03364 123456', expected: true, description: 'San Nicolás de los Arroyos, Pcia de Bs As' },
  { phone: '03364 123456', expected: true, description: 'San Nicolás sin código país' },
  
  { phone: '54 0341 123456', expected: true, description: 'Rosario, Pcia de Santa Fe' },
  { phone: '0341 123456', expected: true, description: 'Rosario sin código país' },
  
  // Otros códigos de área
  { phone: '54 0351 123456', expected: true, description: 'Córdoba' },
  { phone: '54 0221 123456', expected: true, description: 'La Plata' },
  
  // Casos inválidos
  { phone: '123', expected: false, description: 'Número muy corto' },
  { phone: 'abc123', expected: false, description: 'Contiene letras' },
  { phone: '54 123', expected: false, description: 'Número incompleto' },
  { phone: '', expected: true, description: 'Vacío (opcional)' },
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
  console.log('\n🎉 ¡Todas las pruebas pasaron! La validación está funcionando correctamente.')
} else {
  console.log('\n⚠️ Algunas pruebas fallaron. Revisar la lógica de validación.')
}
