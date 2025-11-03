# 🔧 Fix: Error "invalid input syntax for type json"

## Problema

Al intentar editar una cita, aparece el error:
```
❌ Error en handleEditAppointment: Error: invalid input syntax for type json
```

## Causa

El trigger `auto_log_appointment_changes()` está intentando convertir datos de PostgreSQL a JSONB de forma que falla con ciertos tipos de datos o valores NULL.

## Solución

Ejecutar el script SQL `database/fix-trigger-json-error.sql` en Supabase.

### Paso 1: Abrir Supabase Dashboard

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión
3. Selecciona tu proyecto

### Paso 2: Ejecutar el Script

1. En el menú lateral, haz clic en **SQL Editor**
2. Haz clic en **New query**
3. Abre el archivo `database/fix-trigger-json-error.sql`
4. Copia TODO el contenido
5. Pégalo en el SQL Editor
6. Haz clic en **Run** o presiona `Ctrl + Enter`

### Paso 3: Verificar

Deberías ver:
```
✅ Trigger auto_log_appointment_changes() actualizado correctamente
El error "invalid input syntax for type json" debería estar resuelto
```

### Paso 4: Probar

1. Intenta editar una cita nuevamente
2. Debería funcionar sin errores

## ¿Qué hace este fix?

1. **Simplifica el trigger**: En lugar de intentar convertir toda la fila a JSON, solo convierte los campos específicos que pueden cambiar
2. **Manejo de errores**: Agrega bloques EXCEPTION para manejar errores de conversión
3. **Más robusto**: Usa `to_jsonb()` directamente en lugar de `row_to_json()::jsonb` cuando es posible
4. **Evita conflictos**: Agrega `ON CONFLICT DO NOTHING` para evitar errores si ya existe un registro

## Alternativa: Desactivar el Trigger

Si no necesitas el historial de cambios, puedes desactivar el trigger temporalmente:

```sql
DROP TRIGGER IF EXISTS appointment_auto_log_changes ON appointments;
```

**Nota:** Esto desactivará el tracking de cambios, pero las citas se podrán editar sin problemas.

## Verificación

Para verificar que el trigger está funcionando correctamente:

```sql
-- Ver cambios recientes
SELECT * FROM appointment_changes 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver estructura del trigger
SELECT * FROM pg_trigger 
WHERE tgname = 'appointment_auto_log_changes';
```

## Si el problema persiste

1. Verifica los logs de Supabase para ver el error completo
2. Revisa que la tabla `appointment_changes` existe y tiene la estructura correcta
3. Verifica que el usuario tiene permisos para insertar en `appointment_changes`

