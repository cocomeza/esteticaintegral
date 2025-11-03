# 📅 Guía: Excepciones de Horario por Fecha

## ¿Cómo Funciona?

Las **excepciones de horario** permiten cambiar el horario de atención para **una fecha específica** sin afectar el horario regular de otros días.

### ✨ Características Clave:

- ✅ **Solo afecta la fecha específica** que configures
- ✅ **Los demás días de la semana siguen normales** (usan el horario regular)
- ✅ **No necesitas crear múltiples excepciones** - solo crea una para el día que necesitas cambiar
- ✅ **Se puede editar o eliminar** en cualquier momento

---

## 📋 Ejemplo Práctico

### Escenario:
Lorena quiere cambiar su horario solo para **mañana martes** (3 de diciembre), cerrando a las 15:00 en lugar de las 18:45.

### Paso 1: Crear Excepción
1. Ir al panel Admin → Pestaña **"Excepciones"**
2. Click en **"Nueva Excepción de Horario"**
3. Seleccionar fecha: **3 de diciembre 2025**
4. Configurar horario: **09:00 - 15:00**
5. Motivo (opcional): "Compromiso personal"
6. El sistema valida si hay turnos después de las 15:00
7. Si hay conflictos, muestra alerta
8. Guardar

### Resultado:

| Fecha | Tipo | Horario | Motivo |
|-------|------|---------|--------|
| **Martes 3 Dic** | ⚠️ Excepción | 09:00 - 15:00 | Compromiso personal |
| Martes 10 Dic | ✅ Regular | 09:00 - 18:45 | Horario normal |
| Martes 17 Dic | ✅ Regular | 09:00 - 18:45 | Horario normal |
| Martes 24 Dic | ✅ Regular | 09:00 - 18:45 | Horario normal |

### ✅ Lo que NO necesitas hacer:
- ❌ NO necesitas crear una excepción para "devolver" el horario normal
- ❌ NO necesitas configurar nada especial para los demás martes
- ❌ NO afecta otros días automáticamente

---

## 🔍 Cómo Funciona Internamente

Cuando alguien intenta reservar un turno:

1. **El sistema busca una excepción para esa fecha específica**
   ```sql
   SELECT * FROM schedule_exceptions 
   WHERE exception_date = '2025-12-03' 
   AND is_active = true
   ```

2. **Si encuentra una excepción:**
   - ✅ Usa el horario de la excepción
   - 📅 Solo aplica a esa fecha específica

3. **Si NO encuentra excepción:**
   - ✅ Usa el horario regular de `work_schedules`
   - 📅 Aplica según el día de la semana (lunes, martes, etc.)

---

## 💡 Casos de Uso

### Caso 1: Compromiso Personal
- **Fecha específica:** Mañana martes
- **Nuevo horario:** 09:00 - 15:00
- **Resultado:** Solo ese martes tiene horario corto

### Caso 2: Cita Médica
- **Fecha específica:** Viernes próximo
- **Nuevo horario:** 09:00 - 12:00
- **Resultado:** Solo ese viernes tiene horario corto

### Caso 3: Día Especial (más horas)
- **Fecha específica:** Lunes próximo
- **Nuevo horario:** 09:00 - 20:00
- **Resultado:** Solo ese lunes tiene horario extendido

---

## 📊 Gestión de Excepciones

### Ver todas las excepciones:
- Panel Admin → Pestaña **"Excepciones"**
- Muestra todas las excepciones configuradas con:
  - Fecha
  - Horario
  - Motivo (si tiene)

### Editar una excepción:
1. Click en el botón **✏️ Editar** de la excepción
2. Modificar horarios o motivo
3. Guardar

### Eliminar una excepción:
1. Click en el botón **🗑️ Eliminar** de la excepción
2. Confirmar eliminación
3. ✅ La fecha vuelve automáticamente al horario regular

---

## ⚠️ Validación de Conflictos

Antes de guardar una excepción, el sistema:

1. ✅ **Busca turnos ya reservados** para esa fecha
2. ✅ **Verifica si quedan fuera** del nuevo horario
3. ✅ **Muestra cuántos turnos** se verían afectados
4. ✅ **Lista los pacientes** y horarios afectados
5. ✅ **Permite continuar o cancelar** según tu decisión

### Ejemplo de validación:
```
⚠️ Este cambio afectará 2 turno(s) existente(s):

• María González - 16:00 (Limpieza Facial)
• Juan Pérez - 17:15 (Depilación Láser)

¿Desea continuar?
```

---

## ❓ Preguntas Frecuentes

### ¿Las excepciones afectan todos los días de ese tipo?
**No.** Solo afectan la fecha específica que configures.

### ¿Necesito crear una excepción para "volver" al horario normal?
**No.** Los demás días automáticamente usan el horario regular.

### ¿Puedo tener múltiples excepciones?
**Sí.** Puedes crear todas las excepciones que necesites, cada una para una fecha diferente.

### ¿Qué pasa si elimino una excepción?
La fecha vuelve automáticamente al horario regular de ese día de la semana.

### ¿Las excepciones expiran automáticamente?
No, permanecen activas hasta que las elimines o las desactives.

---

## 🎯 Resumen

- ✅ **Una excepción = Una fecha específica**
- ✅ **Los demás días = Horario regular automáticamente**
- ✅ **No necesitas configurar nada extra**
- ✅ **Sistema inteligente que valida conflictos**

¡Es así de simple! 🚀

