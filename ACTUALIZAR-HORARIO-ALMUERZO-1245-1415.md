# Actualizar Horario de Almuerzo a 12:45 - 14:15

## Cambios Realizados en el Código

✅ Se actualizaron los siguientes archivos con el nuevo horario de almuerzo (12:45 - 14:15):

1. **`src/app/admin/components/ScheduleManager.tsx`** - Valores por defecto del formulario
2. **`src/app/admin/components/ScheduleExceptionManager.tsx`** - Valores por defecto del formulario
3. **`src/config/aesthetic-services.ts`** - Configuración global de horarios
4. **`src/lib/time-validation.ts`** - Valores por defecto de validación

## Actualizar Base de Datos

Para actualizar los horarios existentes en la base de datos, ejecuta el siguiente script SQL en Supabase:

### Pasos:

1. **Abre Supabase Dashboard**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ve al SQL Editor**
   - Click en "SQL Editor" en el menú lateral

3. **Ejecuta el Script**
   - Copia y pega el contenido del archivo `database/update-lunch-hours-1245-1415.sql`
   - Click en "Run" o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verifica los Cambios**
   - El script mostrará todos los horarios actualizados
   - Confirma que `lunch_start` = '12:45:00' y `lunch_end` = '14:15:00'

### El Script Actualiza:

- Todos los `work_schedules` activos que tengan horarios de almuerzo anteriores
- Incluye horarios que tenían 13:30-14:30, 13:00-14:00, etc.
- Mantiene los horarios personalizados que ya están configurados diferente

### Nota Importante:

⚠️ **Este cambio NO afecta citas existentes**, solo actualiza la configuración de horarios disponibles para futuras reservas.

Los horarios nuevos de almuerzo (12:45 - 14:15):
- ✅ Permiten 11 turnos de 45 minutos por día (igual que antes)
- ✅ Distribución: 5 turnos mañana + 6 turnos tarde
- ✅ El almuerzo dura 90 minutos (1h 30min)

