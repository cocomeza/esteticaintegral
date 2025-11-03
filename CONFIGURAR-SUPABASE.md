# 🚀 Configuración Rápida de Supabase

## ❌ Problema Actual
El proyecto está intentando conectarse a `ejemplo.supabase.co` porque falta el archivo `.env.local` con las credenciales reales.

## ✅ Solución Paso a Paso

### 1. Obtener Credenciales de Supabase

Si ya tienes un proyecto en Supabase:

1. Ve a https://supabase.com y entra a tu proyecto
2. Ve a **Settings** (⚙️) → **API**
3. Busca estas dos credenciales:
   - **Project URL**: algo como `https://xxxxx.supabase.co`
   - **anon public** key: una cadena larga que empieza con `eyJ...`

Si NO tienes un proyecto:

1. Ve a https://supabase.com
2. Crea una cuenta (si no tienes)
3. Click en **New Project**
4. Completa el formulario:
   - Nombre del proyecto
   - Base de datos password (guárdala bien)
   - Región (elige la más cercana a Argentina)
5. Espera unos minutos mientras se crea el proyecto
6. Ve a **Settings** → **API** y copia las credenciales

### 2. Crear Archivo .env.local

En la raíz del proyecto, crea un archivo llamado `.env.local` (con el punto al inicio)

**Contenido mínimo requerido:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
JWT_SECRET=tu_jwt_secret_minimo_32_caracteres_muy_seguro_aleatorio
```

**Ejemplo real:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz123456789
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.otra_clave_muy_larga_aqui
JWT_SECRET=mi_super_secreto_jwt_key_de_al_menos_32_caracteres_12345
```

### 3. Ejecutar el Schema SQL

Después de crear el archivo `.env.local`:

1. Ve al SQL Editor de Supabase
2. Abre el archivo `database/SCHEMA-COMPLETO-FINAL.sql`
3. Copia TODO el contenido
4. Pégalo en el SQL Editor
5. Ejecuta el script (Run o F5)

Esto creará todas las tablas necesarias en tu base de datos.

### 4. Reiniciar el Servidor

Después de configurar `.env.local`:

1. Detén el servidor (Ctrl+C en la terminal)
2. Ejecuta nuevamente: `npm run dev`
3. Abre el navegador y verifica que no aparezcan errores

### 5. Verificar que Funcionó

Si todo está bien:
- ✅ No deberías ver errores `ERR_NAME_NOT_RESOLVED` en la consola
- ✅ No deberías ver `ejemplo.supabase.co` en ningún lado
- ✅ La página debería cargar sin errores

## 🔍 Verificar Configuración

Puedes ejecutar este script para verificar que todo está bien:

```bash
node scripts/check-env.js
```

## ⚠️ Importante

- El archivo `.env.local` NO se sube a GitHub (está en .gitignore)
- NO compartas tus claves públicamente
- Guarda el `SUPABASE_SERVICE_ROLE_KEY` de forma segura (es como una contraseña de administrador)

