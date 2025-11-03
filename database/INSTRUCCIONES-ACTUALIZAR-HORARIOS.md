# 📋 INSTRUCCIONES: Actualizar Horarios de Sábados

## 🎯 Cambio Necesario

**Configuración ANTERIOR (incorrecta):**
- Sábados: Solo Depilación Láser ❌

**Configuración NUEVA (correcta):**
- Sábados: TODOS los servicios ✅

---

## 🔧 Cómo Actualizar en Supabase

### Opción 1: Ejecutar Script SQL (Recomendado)

1. Ir a tu proyecto de Supabase
2. Click en **SQL Editor** (menú izquierdo)
3. Click en **New Query**
4. Copiar y pegar el siguiente código:

```sql
-- Eliminar configuración incorrecta de sábado
DELETE FROM work_schedules 
WHERE day_of_week = 6;

-- Insertar configuración correcta
INSERT INTO work_schedules (specialist_id, day_of_week, start_time, end_time, allowed_services)
SELECT s.id, 6, '09:00'::time, '13:00'::time, NULL
FROM specialists s WHERE s.name = 'Lorena Esquivel';
```

5. Click en **Run** (o F5)
6. ✅ Listo! Ahora los sábados permiten TODOS los servicios

---

### Opción 2: Editar Manualmente (Table Editor)

1. Ir a **Table Editor** en Supabase
2. Seleccionar tabla `work_schedules`
3. Buscar la fila donde `day_of_week = 6` (sábado)
4. Click en la fila para editar
5. En el campo `allowed_services`:
   - **Cambiar de:** `[uuid-de-depilacion]`
   - **A:** `NULL` (dejar vacío)
6. Guardar
7. ✅ Listo!

---

## ✅ Verificar que Funcionó

### Desde SQL Editor:

```sql
-- Ver configuración actual
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
  lunch_end as almuerzo_fin,
  CASE 
    WHEN allowed_services IS NULL THEN 'Todos los servicios ✅'
    ELSE 'Servicios restringidos ⚠️'
  END as servicios
FROM work_schedules
WHERE specialist_id = (SELECT id FROM specialists WHERE name = 'Lorena Esquivel')
ORDER BY day_of_week;
```

**Resultado esperado:**
```
Lunes    | 09:00 | 18:00 | 13:00 | 14:00 | Todos los servicios ✅
Martes   | 09:00 | 18:00 | 13:00 | 14:00 | Todos los servicios ✅
...
Sábado   | 09:00 | 13:00 | NULL  | NULL  | Todos los servicios ✅
```

---

### Desde la Aplicación:

1. Ir al sitio web como cliente
2. Seleccionar **Sonoterapia** (o cualquier servicio que NO sea depilación)
3. Seleccionar un **sábado** en el calendario
4. **Deberías ver horarios disponibles** entre 9:00 y 13:00

**Antes:** No mostraba horarios (solo permitía depilación)  
**Después:** Muestra todos los horarios disponibles ✅

---

## 🎯 Resumen

**Campo `allowed_services` en `work_schedules`:**
- `NULL` = Todos los servicios permitidos ✅ (lo que queremos)
- `[array de IDs]` = Solo esos servicios permitidos

**Para sábados:**
- **Antes:** `[uuid-depilacion]` → Solo depilación
- **Después:** `NULL` → Todos los servicios ✅

---

## ⚠️ IMPORTANTE

Después de ejecutar el script SQL:
- Los cambios son **inmediatos**
- Los clientes podrán reservar **cualquier servicio** los sábados
- No necesitas reiniciar nada
- El sitio web se actualiza automáticamente

---

**✅ Una vez ejecutado, tu sistema estará 100% correcto según lo que necesita Lorena.**

