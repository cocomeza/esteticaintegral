// Script para calcular cuántos turnos de 45 minutos caben en un día
// con diferentes horarios de almuerzo

function calcularTurnos(horaInicio, horaFin, almuerzoInicio, almuerzoFin, duracionTurno) {
  console.log(`\n📊 Cálculo de Turnos`);
  console.log(`Horario: ${horaInicio} - ${horaFin}`);
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

  console.log(`\n🍽️  Almuerzo: ${almuerzoInicio} - ${almuerzoFin}`);

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
  console.log(`   Total turnos de ${duracionTurno} min: ${total}`);
  console.log(`   Turnos mañana: ${turnosAntesAlmuerzo.length}`);
  console.log(`   Turnos tarde: ${turnosDespuesAlmuerzo.length}`);
  
  return total;
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  CÁLCULO DE TURNOS CON DIFERENTES HORARIOS DE ALMUERZO    ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// Escenario 1: Almuerzo actual (13:00 - 14:00)
console.log('\n\n🔹 ESCENARIO 1: Almuerzo 13:00 - 14:00');
calcularTurnos('09:00', '18:45', '13:00', '14:00', 45);

// Escenario 2: Almuerzo 12:30 - 14:00
console.log('\n\n🔹 ESCENARIO 2: Almuerzo 12:30 - 14:00 (LO QUE PREGUNTASTE)');
const turnosEscenario2 = calcularTurnos('09:00', '18:45', '12:30', '14:00', 45);

// Escenario 3: Almuerzo 13:30 - 14:30 (el que configuramos)
console.log('\n\n🔹 ESCENARIO 3: Almuerzo 13:30 - 14:30 (CONFIGURADO)');
calcularTurnos('09:00', '18:45', '13:30', '14:30', 45);

// Escenario 4: Para comparar - Sin almuerzo
console.log('\n\n🔹 ESCENARIO 4: Sin almuerzo (para comparar)');
calcularTurnos('09:00', '18:45', '18:46', '18:47', 45); // Truco: almuerzo fuera del horario

console.log('\n\n✅ RESPUESTA A TU PREGUNTA:');
console.log(`Si pones el almuerzo de 12:30 a 14:00, tendrías ${turnosEscenario2} turnos de 45 minutos`);

