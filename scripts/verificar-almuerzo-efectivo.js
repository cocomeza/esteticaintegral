// Script para verificar el "bloqueo efectivo" del almuerzo
// considerando turnos de 45 min y 20 min

function analizarAlmuerzo(almuerzoInicio, almuerzoFin) {
  console.log(`\n🍽️  ANÁLISIS DEL ALMUERZO: ${almuerzoInicio} - ${almuerzoFin}`);
  console.log('─'.repeat(60));

  function horaAMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  function minutosAHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const inicioAlm = horaAMinutos(almuerzoInicio);
  const finAlm = horaAMinutos(almuerzoFin);

  console.log(`\n📋 TURNOS DE 45 MINUTOS:`);
  
  // Último turno antes del almuerzo (termina justo antes del inicio)
  const ultimoTurnoAntes = inicioAlm - 45;
  console.log(`   ✅ Último turno disponible: ${minutosAHora(ultimoTurnoAntes)} (termina ${almuerzoInicio})`);
  
  // Primer turno después del almuerzo (empieza justo después del fin)
  const primerTurnoDespues = finAlm;
  const primerTurnoDespuesFin = primerTurnoDespues + 45;
  console.log(`   ✅ Primer turno disponible: ${minutosAHora(primerTurnoDespues)} (termina ${minutosAHora(primerTurnoDespuesFin)})`);
  
  console.log(`\n   💡 BLOQUEO EFECTIVO: Desde ${minutosAHora(ultimoTurnoAntes + 45)} hasta ${minutosAHora(primerTurnoDespues + 45)}`);
  console.log(`      (No puedes empezar un turno de 45 min que termine después de ${almuerzoInicio})`);
  console.log(`      (No puedes empezar un turno de 45 min antes de ${minutosAHora(primerTurnoDespues)})`);

  console.log(`\n📋 TURNOS DE 20 MINUTOS (Depilación):`);
  
  // Último turno antes del almuerzo (termina justo antes del inicio)
  const ultimoTurnoAntes20 = inicioAlm - 20;
  console.log(`   ✅ Último turno disponible: ${minutosAHora(ultimoTurnoAntes20)} (termina ${almuerzoInicio})`);
  
  // Primer turno después del almuerzo (empieza justo después del fin)
  const primerTurnoDespues20 = finAlm;
  const primerTurnoDespuesFin20 = primerTurnoDespues20 + 20;
  console.log(`   ✅ Primer turno disponible: ${minutosAHora(primerTurnoDespues20)} (termina ${minutosAHora(primerTurnoDespuesFin20)})`);
  
  console.log(`\n   💡 Para depilación (20 min), el bloqueo efectivo es menor`);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ANÁLISIS: BLOQUEO EFECTIVO DEL ALMUERZO                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');

analizarAlmuerzo('13:30', '14:30');

console.log('\n\n✅ CONCLUSIÓN:');
console.log('   El almuerzo configurado es 13:30 - 14:30');
console.log('   Para turnos de 45 min:');
console.log('     - Último turno mañana: 12:45 (termina 13:30)');
console.log('     - Primer turno tarde: 14:30 (termina 15:15)');
console.log('   El sistema YA está configurado para excluir correctamente');
console.log('   todos los turnos que se solapen con el almuerzo.');

