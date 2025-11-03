# 📚 Guía: Cuándo Usar "Horarios" vs "Excepciones"

## 🎯 Resumen Rápido

### Usa "Horarios" cuando:
- ✅ Quieres cambiar el horario **PERMANENTE** de todos los lunes (o martes, miércoles, etc.)
- ✅ Cambias tu horario normal de trabajo de forma definitiva
- ✅ Ejemplo: "A partir de ahora, todos los martes voy a cerrar a las 17:00 en lugar de 18:45"

### Usa "Excepciones" cuando:
- ✅ Quieres cambiar el horario **SOLO de una fecha específica**
- ✅ Es un cambio temporal o puntual
- ✅ Ejemplo: "Mañana martes (3 de diciembre) quiero cerrar a las 15:00, pero los demás martes siguen igual"

---

## 📋 Ejemplos Prácticos

### Caso 1: Cambio Permanente del Horario Regular

**Situación:** Lorena decide que a partir de ahora, **todos los martes** va a cerrar a las 17:00 en lugar de 18:45.

**Solución:** 
1. Ir a **"Horarios"**
2. Buscar la tarjeta de **"Martes"**
3. Click en el botón **✏️ Editar**
4. Cambiar "Hora fin" de `18:45` a `17:00`
5. Click en **"Actualizar"**

**Resultado:**
- ✅ **Todos los martes** futuros tendrán horario 09:00 - 17:00
- ✅ Se aplica automáticamente a todos los martes (pasados, presentes y futuros)
- ✅ No necesitas crear excepciones para cada martes

---

### Caso 2: Cambio Temporal para una Fecha Específica

**Situación:** Lorena tiene una cita médica el **próximo martes 3 de diciembre**, así que ese día quiere cerrar a las 15:00. Pero los demás martes sigue con horario normal (18:45).

**Solución:**
1. Ir a **"Excepciones"**
2. Click en **"Nueva Excepción de Horario"**
3. Seleccionar fecha: **3 de diciembre 2025**
4. Configurar horario: **09:00 - 15:00**
5. Motivo: "Cita médica"
6. Click en **"Crear Excepción"**

**Resultado:**
- ✅ Solo el **martes 3 de diciembre** tiene horario 09:00 - 15:00
- ✅ Los demás martes (10 dic, 17 dic, etc.) siguen con horario regular 09:00 - 18:45
- ✅ No afecta ningún otro día

---

## 🔄 ¿Qué Pasa si Cambias Ambos?

### Escenario Complejo:

1. **Horarios:** Martes regular = 09:00 - 18:45
2. **Excepciones:** Martes 3 de diciembre = 09:00 - 15:00

**Resultado:**
- Martes 3 de diciembre → Usa **EXCEPCIÓN** → 09:00 - 15:00 ⚠️
- Martes 10 de diciembre → Usa **HORARIO REGULAR** → 09:00 - 18:45 ✅
- Martes 17 de diciembre → Usa **HORARIO REGULAR** → 09:00 - 18:45 ✅

**Prioridad:** Las excepciones tienen PRIORIDAD sobre el horario regular. Si existe excepción para una fecha, se usa esa; si no, se usa el horario regular.

---

## 📊 Tabla Comparativa

| Característica | **Horarios** | **Excepciones** |
|---------------|--------------|-----------------|
| **Cuándo usar** | Cambio permanente | Cambio temporal |
| **Alcance** | Todos los días de ese tipo | Solo fecha específica |
| **Ejemplo** | "Todos los martes" | "Solo el martes 3 de dic" |
| **Frecuencia** | Recurrente | Una sola vez |
| **Editar** | Afecta todos los días | Solo esa fecha |

---

## 🎯 Casos de Uso Reales

### Ejemplo 1: Reducir Horario Permanente

**Lorena decide:** "A partir de enero, todos los viernes voy a trabajar medio día (09:00 - 13:00)"

**Acción:** 
- Usar **"Horarios"** → Editar Viernes → Cambiar fin a 13:00

---

### Ejemplo 2: Cita Médica

**Lorena tiene:** "Mañana tengo cita médica, cierro a las 14:00"

**Acción:**
- Usar **"Excepciones"** → Crear excepción para mañana → Fin a 14:00

---

### Ejemplo 3: Vacaciones de 1 Día

**Lorena decide:** "El viernes próximo no voy a trabajar"

**Acción:**
- Usar **"Cierres / Vacaciones"** (no Horarios ni Excepciones)
- O crear **Excepción** con horario 00:00 - 00:00 (cerrado)

---

## ⚠️ Errores Comunes

### ❌ Error 1: Crear Excepción para Cambio Permanente
**No hagas esto:**
- Crear excepciones para cada martes del mes porque quieres cambiar todos los martes

**Haz esto:**
- Usar "Horarios" para cambiar el horario regular de martes

### ❌ Error 2: Cambiar Horario Regular para un Día Específico
**No hagas esto:**
- Cambiar el horario regular de martes solo porque mañana tienes un compromiso

**Haz esto:**
- Mantener el horario regular
- Crear excepción solo para mañana

---

## ✅ Regla de Oro

**Pregúntate:**
- **¿Es para TODOS los [día de la semana]?** → Usa **"Horarios"**
- **¿Es solo para UNA fecha específica?** → Usa **"Excepciones"**

---

## 🎓 Ejemplo Completo Paso a Paso

### Situación Inicial:
- Horarios: Lunes a Viernes = 09:00 - 18:45
- No hay excepciones

### Cambio 1: Lorena decide trabajar menos los viernes
1. Ir a **"Horarios"**
2. Editar **"Viernes"**
3. Cambiar fin a **17:00**
4. ✅ Todos los viernes ahora son 09:00 - 17:00

### Cambio 2: El próximo viernes tiene un compromiso y cierra a las 14:00
1. Ir a **"Excepciones"**
2. Crear excepción para **próximo viernes**
3. Horario: **09:00 - 14:00**
4. ✅ Solo ese viernes será 09:00 - 14:00, los demás viernes siguen con 17:00

### Resultado Final:
- Viernes regular: 09:00 - 17:00 (de "Horarios")
- Próximo viernes específico: 09:00 - 14:00 (de "Excepciones")
- Resto de viernes: 09:00 - 17:00 (de "Horarios")

---

## 💡 Tip Final

**Piensa en "Horarios" como tu "horario base"** que se aplica siempre, y en "Excepciones" como "ajustes puntuales" que sobrescriben el horario base solo para fechas específicas.

¡Es como tener un horario de trabajo normal y luego hacer ajustes especiales cuando tienes compromisos!

