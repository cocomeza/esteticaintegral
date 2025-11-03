# 🍽️ Actualizar Horario de Almuerzo a 13:30 - 14:30

## 📋 Resumen

Este script actualiza todos los horarios regulares de trabajo para que tengan el nuevo horario de almuerzo configurado en **13:30 - 14:30** en lugar de 13:00 - 14:00.

---

## 🚀 Cómo Aplicar los Cambios

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)
   - Inicia sesión

2. **Abre SQL Editor**
   - En el menú lateral, haz clic en **"SQL Editor"**
   - O ve directamente a: `https://supabase.com/dashboard/project/[tu-proyecto]/sql/new`

3. **Copia y pega el script**
   - Abre el archivo `database/update-lunch-hours.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor

4. **Ejecuta el script**
   - Haz clic en **"Run"** o presiona `Ctrl+Enter`
   - Verifica que no haya errores

5. **Verifica los resultados**
   - Deberías ver:
     - Una lista de todos los horarios con sus días
     - El conteo de horarios actualizados

---

### Opción 2: Desde el Panel de Admin (Manual)

Si prefieres actualizar día por día manualmente:

1. **Ve al Panel de Admin**
   - `/admin` → Inicia sesión

2. **Ir a Gestión de Horarios**
   - Pestaña "Gestión de Horarios"

3. **Editar cada día**
   - Haz clic en **"Editar"** para cada día (Lunes, Martes, Miércoles, etc.)
   - Cambia:
     - **Almuerzo inicio**: `13:30`
     - **Almuerzo fin**: `14:30`
   - Haz clic en **"Guardar"**

4. **Revisar advertencias**
   - El sistema te avisará si hay turnos que se verían afectados
   - Revisa la lista de turnos afectados
   - Confirma si quieres proceder

---

## ⚠️ Importante

### Antes de Ejecutar

1. **Verifica que no haya turnos en conflicto**
   - El script actualiza directamente los horarios
   - No verifica conflictos automáticamente
   - Revisa si hay turnos entre 13:00-13:30 o 14:00-14:30

2. **Backup recomendado**
   - Si quieres ser precavido, primero haz un backup:
   ```sql
   -- Backup de horarios actuales
   SELECT * FROM work_schedules INTO TEMP TABLE work_schedules_backup;
   ```

### Después de Ejecutar

1. **Verifica los cambios**
   ```sql
   SELECT 
     day_of_week,
     lunch_start,
     lunch_end
   FROM work_schedules
   WHERE is_active = true
   ORDER BY day_of_week;
   ```

2. **Verifica que los turnos funcionen**
   - Ve a la página de reservas
   - Intenta reservar un turno
   - Verifica que los horarios disponibles sean correctos

---

## 📊 Qué Actualiza el Script

- ✅ Todos los horarios regulares activos (`work_schedules`)
- ✅ Cambia `lunch_start` de `13:00:00` a `13:30:00`
- ✅ Cambia `lunch_end` de `14:00:00` a `14:30:00`
- ✅ Actualiza `updated_at` con la fecha actual

---

## 🔍 Verificar Cambios

Ejecuta esta consulta para ver todos los horarios:

```sql
SELECT 
  CASE day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as dia,
  start_time as inicio,
  end_time as fin,
  lunch_start as almuerzo_inicio,
  lunch_end as almuerzo_fin
FROM work_schedules
WHERE is_active = true
ORDER BY day_of_week;
```

---

## ✅ Resultado Esperado

Después de ejecutar el script, todos los horarios activos deberían tener:

- **Almuerzo inicio**: `13:30:00`
- **Almuerzo fin**: `14:30:00`

---

## 🆘 Si Algo Sale Mal

Si necesitas revertir los cambios:

```sql
-- Revertir a horario anterior
UPDATE work_schedules
SET 
  lunch_start = '13:00:00',
  lunch_end = '14:00:00',
  updated_at = NOW()
WHERE 
  lunch_start = '13:30:00' 
  AND lunch_end = '14:30:00'
  AND is_active = true;
```

---

## 📝 Notas

- Las **excepciones de horario** (`schedule_exceptions`) **NO** se actualizan automáticamente
- Cada excepción tiene su propio horario de almuerzo que puedes editar desde el panel
- Los turnos ya reservados **NO** se modifican, solo los horarios disponibles para futuras reservas

