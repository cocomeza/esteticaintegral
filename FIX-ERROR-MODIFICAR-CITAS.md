# 🔧 Fix: Error al Modificar Citas - "function jsonb_each(json) does not exist"

## Problema
Al intentar modificar una cita desde el panel de administración, aparece el error:
```
function jsonb_each(json) does not exist
```

## Causa
El trigger `auto_log_appointment_changes()` en la base de datos intenta usar `jsonb_each()` sobre el resultado de `row_to_json()`, que devuelve tipo `json` en lugar de `jsonb`.

## Solución

### Paso 1: Acceder a Supabase Dashboard
1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto "Estética Integral"

### Paso 2: Ejecutar el Script SQL
1. En el menú lateral, haz clic en **SQL Editor**
2. Haz clic en **New query**
3. Copia y pega el contenido completo del archivo `database/fix-jsonb-each-error.sql`
4. Haz clic en **Run** o presiona `Ctrl + Enter` (Windows) / `Cmd + Enter` (Mac)

### Paso 3: Verificar
Deberías ver un mensaje de éxito:
```
✅ Función auto_log_appointment_changes() actualizada correctamente
El error "function jsonb_each(json) does not exist" debería estar resuelto
```

### Paso 4: Probar
1. Ve al panel de administración de tu aplicación
2. Intenta modificar una cita existente
3. Deberías poder guardar los cambios sin errores

## Alternativa: Ejecutar desde Terminal

Si prefieres usar la CLI de Supabase:

```bash
# Instalar Supabase CLI si no la tienes
npm install -g supabase

# Login
supabase login

# Ejecutar el script
supabase db execute --file database/fix-jsonb-each-error.sql
```

## Notas
- Este fix solo actualiza la función del trigger, no afecta los datos existentes
- El trigger seguirá registrando cambios en la tabla `appointment_changes`
- Si el trigger no existe, el script lo creará automáticamente

