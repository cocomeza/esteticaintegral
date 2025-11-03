# Agregar Nuevos Servicios: Masajes y Ventosas

## ✅ Cambios Realizados en el Código

Se agregaron dos nuevos servicios en `src/config/aesthetic-services.ts`:

1. **Masajes Descontracturantes / Relajantes** - 45 minutos - Categoría: Terapéutico
2. **Ventosas** - 45 minutos - Categoría: Terapéutico

Estos servicios ya aparecerán en el frontend y se pueden seleccionar para reservar turnos.

## 📝 Actualizar Base de Datos

Para que los servicios estén disponibles completamente, necesitas agregarlos también en la base de datos de Supabase:

### Pasos:

1. **Abre Supabase Dashboard**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ve al SQL Editor**
   - Click en "SQL Editor" en el menú lateral

3. **Ejecuta el Script**
   - Copia y pega el contenido del archivo `database/agregar-nuevos-servicios.sql`
   - Click en "Run" o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verifica los Cambios**
   - El script mostrará los servicios insertados
   - Confirma que ambos servicios aparecen en la lista

### El Script:

- ✅ Inserta "Masajes Descontracturantes / Relajantes" (45 min, categoría: terapéutico)
- ✅ Inserta "Ventosas" (45 min, categoría: terapéutico)
- ✅ Muestra todos los servicios activos para verificación

### Características de los Nuevos Servicios:

**Masajes Descontracturantes / Relajantes:**
- Duración: 45 minutos
- Categoría: Terapéutico
- Disponible: Lunes a Viernes (09:00 - 18:45)
- No disponible: Sábados y Domingos

**Ventosas:**
- Duración: 45 minutos
- Categoría: Terapéutico
- Disponible: Lunes a Viernes (09:00 - 18:45)
- No disponible: Sábados y Domingos

### Nota Importante:

⚠️ Los servicios se agregarán automáticamente a la lista de servicios disponibles en el panel de administración y en la página principal para reservar turnos.

