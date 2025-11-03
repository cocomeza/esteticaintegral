-- =====================================================
-- FIX: Corregir error "function jsonb_each(json) does not exist"
-- =====================================================
-- Este script corrige el trigger que causa el error al modificar citas
-- El problema es que row_to_json() devuelve tipo JSON, no JSONB
-- Necesitamos convertirlo explícitamente a JSONB antes de usar jsonb_each()

CREATE OR REPLACE FUNCTION auto_log_appointment_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
BEGIN
  -- Solo registrar si hay cambios reales
  IF OLD IS DISTINCT FROM NEW THEN
    changes = jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW),
      'changed_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(row_to_json(NEW)::jsonb)
        WHERE key IN (
          SELECT key
          FROM jsonb_each(row_to_json(OLD)::jsonb)
          WHERE value IS DISTINCT FROM (row_to_json(NEW) ->> key)::jsonb
        )
      )
    );
    
    INSERT INTO appointment_changes (
      appointment_id,
      version,
      changes,
      modified_by,
      reason
    ) VALUES (
      NEW.id,
      NEW.version,
      changes,
      COALESCE(NEW.modified_by, 'system'),
      'Automatic change tracking'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar que el trigger esté activo
-- Si no existe, crearlo:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_log_appointment_changes_trigger'
  ) THEN
    CREATE TRIGGER auto_log_appointment_changes_trigger
      AFTER UPDATE ON appointments
      FOR EACH ROW
      EXECUTE FUNCTION auto_log_appointment_changes();
  END IF;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Función auto_log_appointment_changes() actualizada correctamente';
  RAISE NOTICE 'El error "function jsonb_each(json) does not exist" debería estar resuelto';
END $$;

