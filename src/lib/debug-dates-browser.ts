/**
 * Utilidades de depuración para fechas en el navegador
 * Este archivo ayuda a identificar problemas de zona horaria en el frontend
 */

export function debugDateIssues() {
  console.log('=== DEPURACIÓN DE FECHAS EN NAVEGADOR ===')
  
  const testDate = '2024-01-30'
  console.log('1. Fecha de prueba:', testDate)
  
  // Crear objeto Date
  const dateObj = new Date(testDate)
  console.log('2. Objeto Date creado:', dateObj.toString())
  console.log('3. Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone)
  console.log('4. Offset en minutos:', dateObj.getTimezoneOffset())
  console.log('5. Offset en horas:', dateObj.getTimezoneOffset() / 60)
  
  // Métodos locales vs UTC
  console.log('6. Métodos locales:')
  console.log('   getFullYear():', dateObj.getFullYear())
  console.log('   getMonth() + 1:', dateObj.getMonth() + 1)
  console.log('   getDate():', dateObj.getDate())
  
  console.log('7. Métodos UTC:')
  console.log('   getUTCFullYear():', dateObj.getUTCFullYear())
  console.log('   getUTCMonth() + 1:', dateObj.getUTCMonth() + 1)
  console.log('   getUTCDate():', dateObj.getUTCDate())
  
  // Formateo
  console.log('8. Formateo:')
  console.log('   toISOString():', dateObj.toISOString())
  console.log('   toISOString().split("T")[0]:', dateObj.toISOString().split('T')[0])
  
  // Simular el problema
  const problematicDate = new Date(testDate)
  const problematicISO = problematicDate.toISOString().split('T')[0]
  console.log('9. Problema:')
  console.log(`   Fecha original: ${testDate}`)
  console.log(`   Después de conversión: ${problematicISO}`)
  console.log(`   ¿Son iguales? ${testDate === problematicISO}`)
  
  if (testDate !== problematicISO) {
    console.log('   ⚠️ PROBLEMA DETECTADO: Las fechas no coinciden!')
    const diffDays = Math.floor((new Date(problematicISO).getTime() - new Date(testDate).getTime()) / (1000 * 60 * 60 * 24))
    console.log(`   Diferencia en días: ${diffDays}`)
  } else {
    console.log('   ✅ Las fechas coinciden correctamente')
  }
  
  console.log('=== FIN DE DEPURACIÓN ===')
}

export function testDateFormatting(ymd: string) {
  console.log(`\n=== PRUEBA DE FORMATEO PARA: ${ymd} ===`)
  
  // Método problemático
  const problematicDate = new Date(ymd)
  const problematicFormatted = problematicDate.toISOString().split('T')[0]
  
  // Método correcto
  const [year, month, day] = ymd.split('-').map(Number)
  const correctFormatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  
  console.log('Fecha original:', ymd)
  console.log('Método problemático:', problematicFormatted)
  console.log('Método correcto:', correctFormatted)
  console.log('¿Problema detectado?', ymd !== problematicFormatted)
  
  return {
    original: ymd,
    problematic: problematicFormatted,
    correct: correctFormatted,
    hasIssue: ymd !== problematicFormatted
  }
}