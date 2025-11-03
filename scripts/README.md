# 🔧 Scripts de Utilidades

## Generar Hash de Contraseña

Para cambiar la contraseña del administrador, primero necesitás generar un hash bcrypt.

### Uso:

```bash
node scripts/generate-password-hash.js "nueva_contraseña_aqui"
```

### Ejemplo:

```bash
node scripts/generate-password-hash.js "MiPasswordSeguro2024!"
```

### Resultado:

El script te dará:
1. El hash de la contraseña
2. El SQL listo para ejecutar en Supabase

### Actualizar en Supabase:

1. Copiar el SQL que te genera el script
2. Ir a Supabase → SQL Editor
3. Pegar y ejecutar el SQL
4. ¡Listo! Ya podés usar la nueva contraseña

---

## ⚠️ Importante

- **NO compartas** las contraseñas en texto plano
- **Cambiar** la contraseña por defecto en producción
- **Guardar** la contraseña en un lugar seguro

