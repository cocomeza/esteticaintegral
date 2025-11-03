# 🍽️ Test: Detección de Conflictos con Horario de Almuerzo

## ✅ ¿Funciona la detección de conflictos con el horario de almuerzo?

**RESPUESTA: SÍ, el sistema detecta y avisa cuando hay turnos que chocan con el horario de almuerzo.**

---

## 🔍 Cómo funciona

Cuando cambias el horario de almuerzo en la sección **"Gestión de Horarios"**, el sistema:

1. **Valida automáticamente** todos los turnos futuros del día
2. **Detecta conflictos** si hay citas que caen dentro del nuevo horario de almuerzo
3. **Muestra un aviso visual** destacado con todos los turnos afectados

---

## 🎯 Casos que detecta

El sistema detecta conflictos en estos casos:

### 1. Turno que empieza durante el almuerzo
```
Almuerzo: 13:00 - 14:00
Turno: 13:30 - 14:00 ✅ DETECTADO
```

### 2. Turno que termina durante el almuerzo
```
Almuerzo: 13:00 - 14:00
Turno: 12:30 - 13:30 ✅ DETECTADO
```

### 3. Turno que contiene completamente el almuerzo
```
Almuerzo: 13:00 - 14:00
Turno: 12:00 - 15:00 ✅ DETECTADO
```

---

## 📱 Visualización en el Panel

Cuando hay conflictos con el horario de almuerzo, verás:

### ⚠️ Aviso Principal
- **Color naranja** destacado
- Mensaje: "⚠️ ADVERTENCIA: Este cambio afectará X turno(s) futuro(s)"

### 📋 Lista de Turnos Afectados
Cada turno con conflicto muestra:
- **Nombre del paciente**
- **Fecha y hora del turno**
- **Servicio reservado**
- **Badge naranja**: "⚠️ CONFLICTO CON ALMUERZO"

### 🍽️ Aviso Específico de Almuerzo
Si hay conflictos con el horario de almuerzo, aparece un recuadro especial:
```
🍽️ ATENCIÓN: Hay turnos que caen dentro del nuevo horario de almuerzo
Estos pacientes tienen citas programadas durante las horas que acabas 
de definir como horario de descanso.
```

---

## 🧪 Cómo Probar

### Opción 1: Prueba Automatizada

Ejecuta el script de tests que incluye un test específico para conflictos con almuerzo:

```bash
$env:TEST_SPECIALIST_ID="uuid-del-especialista"; node scripts/test-schedule-management.js
```

El test `testValidateLunchConflict`:
1. Crea un turno a las 13:30 (durante horario de almuerzo)
2. Cambia el horario de almuerzo para que cubra ese turno
3. Verifica que se detecta el conflicto de tipo `lunch_conflict`

### Opción 2: Prueba Manual

1. **Ve al panel de admin** → "Gestión de Horarios"
2. **Edita un horario** (ej: Lunes)
3. **Busca o crea un turno** para el próximo lunes a las 13:30 (durante el horario de almuerzo)
4. **Vuelve a editar el horario de Lunes**
5. **Cambia el horario de almuerzo** (ej: de 13:00-14:00 a 13:00-15:00)
6. **Observa**: Deberías ver:
   - ⚠️ ADVERTENCIA en naranja
   - Lista de turnos afectados
   - Badge "⚠️ CONFLICTO CON ALMUERZO" en cada turno
   - Recuadro especial con el aviso de almuerzo

---

## 🔧 Código Responsable

### Backend - Validación
**Archivo:** `pages/api/admin/schedules/validate.ts`
- Líneas 119-147: Detecta conflictos con horario de almuerzo
- Compara horarios en minutos para detectar overlaps

### Frontend - Visualización
**Archivo:** `src/app/admin/components/ScheduleManager.tsx`
- Líneas 331-335: Muestra badge "CONFLICTO CON ALMUERZO"
- Líneas 344-353: Recuadro especial de advertencia para almuerzo
- Línea 52: Se dispara validación automática al cambiar `lunchStart` o `lunchEnd`

---

## ✅ Resumen

**¿El sistema avisa si hay turnos cuando cambias el horario de almuerzo?**

✅ **SÍ** - El sistema:
- Detecta automáticamente turnos que caen dentro del nuevo horario de almuerzo
- Muestra avisos visuales destacados
- Identifica específicamente conflictos con almuerzo (vs. conflictos fuera de horario)
- Proporciona información detallada de cada turno afectado

---

## 📝 Notas Técnicas

- La validación se ejecuta automáticamente cuando cambias `lunchStart` o `lunchEnd`
- Los conflictos se detectan comparando horarios convertidos a minutos
- El tipo de conflicto `lunch_conflict` se distingue de `outside_hours`
- El sistema NO impide el cambio, solo ADVIERTE - el admin debe decidir si proceder

