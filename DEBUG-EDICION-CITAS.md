# 🐛 Debug: Problemas al Editar Citas

## Checklist de Verificación

### 1. Verificar Trigger de Base de Datos

El error más común es el trigger que usa `jsonb_each`. Asegúrate de ejecutar:

```sql
-- En Supabase SQL Editor, ejecutar:
-- database/fix-jsonb-each-error.sql
```

### 2. Verificar Logs

Abre la consola del navegador (F12) y revisa los logs cuando intentas editar:

```
✏️ Editando cita: {...}
📝 Actualizando cita: {...}
📅 Actualizando fecha de cita: {...}
💾 Ejecutando actualización con objeto: {...}
```

Si ves algún error antes de estos logs, ese es el problema.

### 3. Verificar Formato de Fecha

Asegúrate de que la fecha esté en formato `YYYY-MM-DD`:
- ✅ Correcto: `2025-01-15`
- ❌ Incorrecto: `15/01/2025` o `01/15/2025`

### 4. Verificar Disponibilidad

Si el error es "El horario ya está ocupado":
- Verifica que no haya otra cita en ese mismo horario
- Revisa que el turno no esté intentando reemplazarse a sí mismo

### 5. Verificar Permisos

Asegúrate de estar logueado como administrador:
- Cookie `admin-session` debe estar presente
- Verificar en DevTools > Application > Cookies

### 6. Errores Comunes

#### Error: "function jsonb_each(json) does not exist"
**Solución:** Ejecutar `database/fix-jsonb-each-error.sql` en Supabase

#### Error: "El horario seleccionado ya está ocupado"
**Solución:** Verificar que no hay otro turno en ese horario (puede ser el mismo turno que estás editando)

#### Error: "No se pudo obtener la cita actualizada"
**Solución:** 
1. Verificar que el `appointmentId` es válido
2. Verificar que el turno existe en la base de datos
3. Revisar los logs del servidor para más detalles

#### Error: "Error al actualizar la cita en la base de datos"
**Solución:**
1. Revisar logs del servidor para ver el error específico
2. Verificar permisos de RLS en Supabase
3. Verificar que las relaciones (specialist, service, patient) existen

## Scripts de Prueba

### Probar desde terminal:

```bash
# Verificar que el servidor está corriendo
npm run dev

# En otra terminal, ejecutar test:
node scripts/test-edit-appointment.js
```

## Consultas SQL Útiles

### Ver turno específico:
```sql
SELECT * FROM appointments WHERE id = 'uuid-del-turno';
```

### Ver turnos en una fecha:
```sql
SELECT * FROM appointments 
WHERE appointment_date = '2025-01-15' 
AND specialist_id = 'uuid-del-especialista';
```

### Verificar trigger:
```sql
SELECT * FROM appointment_changes 
WHERE appointment_id = 'uuid-del-turno' 
ORDER BY created_at DESC;
```

### Verificar RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'appointments';
```

## Contacto

Si el problema persiste, proporciona:
1. Mensaje de error exacto
2. Logs de la consola del navegador
3. Logs del servidor (Vercel)
4. ID del turno que intentas editar

