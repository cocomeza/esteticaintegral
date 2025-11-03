# 🧪 Tests de Excepciones de Horario

## Propósito

Este documento describe cómo probar que las excepciones de horario funcionan correctamente y que el sistema avisa cuando hay turnos reservados que se verían afectados.

## Funcionalidad a Probar

1. ✅ **Validación sin conflictos**: Crear excepción cuando no hay turnos
2. ✅ **Validación con conflictos**: Detectar cuando hay turnos que se verían afectados
3. ✅ **Creación de excepciones**: Crear excepciones exitosamente
4. ✅ **Listado de excepciones**: Obtener lista de excepciones existentes

## Cómo Ejecutar los Tests

### Prerrequisitos

1. El servidor debe estar corriendo (`npm run dev`)
2. Debes estar logueado como administrador
3. Necesitas el ID del especialista

### Paso 1: Obtener el ID del Especialista

**Opción A: Desde el navegador**
1. Abre el panel de administración
2. Abre la consola (F12)
3. Ejecuta:
```javascript
fetch('/api/admin/specialists')
  .then(r => r.json())
  .then(d => console.log('Especialistas:', d))
```

**Opción B: Desde SQL en Supabase**
```sql
SELECT id, name, email FROM specialists WHERE is_active = true;
```

### Paso 2: Ejecutar los Tests

```bash
# Establecer variables de entorno
$env:TEST_SPECIALIST_ID="uuid-del-especialista"
$env:TEST_DATE="2025-01-20"  # Opcional: fecha específica (default: 7 días desde ahora)

# Ejecutar tests
node scripts/test-schedule-exceptions.js
```

**Ejemplo completo:**
```bash
$env:TEST_SPECIALIST_ID="123e4567-e89b-12d3-a456-426614174000"; node scripts/test-schedule-exceptions.js
```

## Qué Esperar

### Test 1: Validación sin conflictos ✅
- Busca una fecha sin turnos
- Valida que se puede crear una excepción
- Espera: `hasConflicts: false`

### Test 2: Validación con conflictos ⚠️
- Crea un turno de prueba
- Valida una excepción que afecta ese turno
- Espera: `hasConflicts: true` con detalles del conflicto
- Limpia el turno de prueba

### Test 3: Crear excepción sin conflictos ✅
- Intenta crear una excepción real
- Verifica que se crea exitosamente
- Limpia la excepción de prueba

### Test 4: Obtener lista de excepciones 📋
- Obtiene todas las excepciones del especialista
- Muestra las primeras 3

## Verificación Manual en la Interfaz

### 1. Probar Validación en Tiempo Real

1. Ve al panel de admin → "Excepciones de Horario"
2. Selecciona una fecha que **TENGA** turnos reservados
3. Cambia el horario (ej: de 09:00-18:00 a 09:00-12:00)
4. **Debe aparecer**: ⚠️ Mensaje de advertencia con el número de turnos afectados

### 2. Probar Sin Conflictos

1. Selecciona una fecha que **NO TENGA** turnos
2. Configura cualquier horario
3. **Debe aparecer**: ✅ "No hay conflictos con turnos existentes"

### 3. Probar Creación con Confirmación

1. Selecciona fecha con turnos
2. Configura horario que afecta turnos
3. Haz clic en "Crear Excepción"
4. **Debe aparecer**: Dialog de confirmación preguntando si quieres continuar
5. Si aceptas, debe crear la excepción
6. Si cancelas, no debe crear nada

## Casos de Prueba Específicos

### Caso 1: Turno fuera del nuevo horario
```
Turno existente: 14:00 (duración 45 min → termina 14:45)
Excepción: 09:00 - 13:00
Resultado esperado: ⚠️ 1 conflicto detectado
```

### Caso 2: Turno dentro del nuevo horario
```
Turno existente: 10:00 (duración 45 min → termina 10:45)
Excepción: 09:00 - 18:00
Resultado esperado: ✅ Sin conflictos
```

### Caso 3: Múltiples turnos afectados
```
Turnos: 08:00, 14:00, 17:00
Excepción: 10:00 - 15:00
Resultado esperado: ⚠️ 2 conflictos (08:00 y 17:00)
```

## Verificación en Base de Datos

### Ver turnos para una fecha específica:
```sql
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.duration,
  a.status,
  p.name as patient_name,
  s.name as service_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN aesthetic_services s ON a.service_id = s.id
WHERE a.specialist_id = 'uuid-del-especialista'
  AND a.appointment_date = '2025-01-20'
  AND a.status = 'scheduled'
ORDER BY a.appointment_time;
```

### Ver excepciones activas:
```sql
SELECT 
  id,
  exception_date,
  start_time,
  end_time,
  lunch_start,
  lunch_end,
  reason,
  is_active
FROM schedule_exceptions
WHERE specialist_id = 'uuid-del-especialista'
  AND is_active = true
ORDER BY exception_date;
```

## Problemas Comunes

### Error: "Se requiere TEST_SPECIALIST_ID"
**Solución**: Establece la variable de entorno con el UUID del especialista

### Error: "No se pueden crear turnos de prueba"
**Solución**: 
1. Verifica que hay servicios creados
2. Verifica que hay pacientes creados
3. Verifica permisos en la base de datos

### No detecta conflictos cuando debería
**Solución**: 
1. Verifica que los turnos tienen `status = 'scheduled'`
2. Verifica que la fecha coincide exactamente
3. Verifica que el horario del turno realmente está fuera del nuevo horario

## Notas

- Los tests crean datos temporales que se limpian automáticamente
- Si un test falla, revisa los logs para ver qué paso específico falló
- Los tests usan fechas futuras para no interferir con turnos reales

