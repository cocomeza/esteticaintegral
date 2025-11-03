// Script para calcular turnos con almuerzo 12:45 - 14:15

function calcularTurnos(horaInicio, horaFin, almuerzoInicio, almuerzoFin, duracionTurno) {
  console.log(`\n📊 CÁLCULO DE TURNOS`);
  console.log(`Horario laboral: ${horaInicio} - ${horaFin}`);
  console.log(`Almuerzo: ${almuerzoInicio} - ${almuerzoFin}`);
  console.log(`Duración por turno: ${duracionTurno} minutos`);
  console.log('─'.repeat(60));

  // Convertir horas a minutos desde medianoche
  function horaAMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  function minutosAHora(minutos) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const inicio = horaAMinutos(horaInicio);
  const fin = horaAMinutos(horaFin);
  const almuerzoInicioMin = horaAMinutos(almuerzoInicio);
  const almuerzoFinMin = horaAMinutos(almuerzoFin);

  const turnosAntesAlmuerzo = [];
  const turnosDespuesAlmuerzo = [];

  // Turnos antes del almuerzo
  let tiempoActual = inicio;
  while (tiempoActual < almuerzoInicioMin) {
    const tiempoFin = tiempoActual + duracionTurno;
    
    // Verificar que el turno no se solape con el almuerzo
    if (tiempoFin <= almuerzoInicioMin) {
      turnosAntesAlmuerzo.push({
        inicio: minutosAHora(tiempoActual),
        fin: minutosAHora(tiempoFin)
      });
      tiempoActual += duracionTurno;
    } else {
      // Este turno se solaparía con el almuerzo, no se puede
      break;
    }
  }

  // Turnos después del almuerzo
  tiempoActual = almuerzoFinMin;
  while (tiempoActual < fin) {
    const tiempoFin = tiempoActual + duracionTurno;
    
    // Verificar que el turno no se pase del horario de fin
    if (tiempoFin <= fin) {
      turnosDespuesAlmuerzo.push({
        inicio: minutosAHora(tiempoActual),
        fin: minutosAHora(tiempoFin)
      });
      tiempoActual += duracionTurno;
    } else {
      // Este turno se pasaría del horario, no se puede
      break;
    }
  }

  console.log(`\n🌅 Turnos ANTES del almuerzo (${horaInicio} - ${almuerzoInicio}):`);
  if (turnosAntesAlmuerzo.length === 0) {
    console.log('   ❌ No hay turnos disponibles');
  } else {
    turnosAntesAlmuerzo.forEach((turno, idx) => {
      console.log(`   ${idx + 1}. ${turno.inicio} → ${turno.fin}`);
    });
    console.log(`   ✅ Total: ${turnosAntesAlmuerzo.length} turnos`);
  }

  const duracionAlmuerzo = almuerzoFinMin - almuerzoInicioMin;
  console.log(`\n🍽️  Almuerzo: ${almuerzoInicio} - ${almuerzoFin} (${duracionAlmuerzo} minutos)`);

  console.log(`\n🌇 Turnos DESPUÉS del almuerzo (${almuerzoFin} - ${horaFin}):`);
  if (turnosDespuesAlmuerzo.length === 0) {
    console.log('   ❌ No hay turnos disponibles');
  } else {
    turnosDespuesAlmuerzo.forEach((turno, idx) => {
      console.log(`   ${idx + 1}. ${turno.inicio} → ${turno.fin}`);
    });
    console.log(`   ✅ Total: ${turnosDespuesAlmuerzo.length} turnos`);
  }

  const total = turnosAntesAlmuerzo.length + turnosDespuesAlmuerzo.length;
  
  console.log(`\n📈 RESUMEN:`);
  console.log(`   ✅ Total turnos de ${duracionTurno} min: ${total}`);
  console.log(`   📊 Turnos mañana: ${turnosAntesAlmuerzo.length}`);
  console.log(`   📊 Turnos tarde: ${turnosDespuesAlmuerzo.length}`);
  
  return total;
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ANÁLISIS: ALMUERZO 12:45 - 14:15                          ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// ESCENARIO PROPUESTO: Almuerzo 12:45 - 14:15
console.log('\n\n🔹 ESCENARIO PROPUESTO: Almuerzo 12:45 - 14:15');
const turnosPropuesto = calcularTurnos('09:00', '18:45', '12:45', '14:15', 45);

// COMPARACIÓN: Almuerzo actual 13:30 - 14:30
console.log('\n\n🔹 COMPARACIÓN: Almuerzo actual 13:30 - 14:30');
const turnosActual = calcularTurnos('09:00', '18:45', '13:30', '14:30', 45);

// ANÁLISIS FINAL
console.log('\n\n' + '═'.repeat(60));
console.log('📊 COMPARACIÓN FINAL');
console.log('═'.repeat(60));
console.log(`Almuerzo 12:45-14:15: ${turnosPropuesto} turnos de 45 min`);
console.log(`Almuerzo 13:30-14:30: ${turnosActual} turnos de 45 min`);
console.log(`Diferencia: ${turnosPropuesto - turnosActual} ${turnosPropuesto > turnosActual ? 'más' : 'menos'} turnos`);

console.log('\n\n💡 ANÁLISIS:');
if (turnosPropuesto === turnosActual) {
  console.log('   ✅ Ambos horarios de almuerzo dan el MISMO número de turnos');
} else if (turnosPropuesto > turnosActual) {
  console.log(`   ✅ El almuerzo 12:45-14:15 permite ${turnosPropuesto - turnosActual} turno(s) MÁS`);
} else {
  console.log(`   ⚠️  El almuerzo 12:45-14:15 permite ${turnosActual - turnosPropuesto} turno(s) MENOS`);
}

console.log('\n   📝 NOTA IMPORTANTE:');
console.log('   - El almuerzo de 12:45 a 14:15 dura 90 minutos (1h 30min)');
console.log('   - El almuerzo de 13:30 a 14:30 dura 60 minutos (1h)');
console.log('   - Con el almuerzo más temprano, pierdes turnos en la mañana pero');
console.log('     puedes ganar o mantener turnos en la tarde');
console.log('═'.repeat(60));

