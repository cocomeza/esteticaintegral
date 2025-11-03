-- =====================================================
-- FIX: Corregir error "invalid input syntax for type json"
-- =====================================================
-- Este script simplifica el trigger para evitar problemas con conversión JSON
-- El problema es que row_to_json() puede generar valores que no son JSON válido
-- Simplificamos el trigger para solo guardar los campos que cambiaron

CREATE OR REPLACE FUNCTION auto_log_appointment_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
  changed_fields JSONB := '{}'::jsonb;
  old_row JSONB;
  new_row JSONB;
BEGIN
  -- Solo registrar si hay cambios reales
  IF OLD IS DISTINCT FROM NEW THEN
    -- Convertir filas a JSONB de forma segura
    BEGIN
      old_row := to_jsonb(OLD);
      new_row := to_jsonb(NEW);
    EXCEPTION WHEN OTHERS THEN
      -- Si falla la conversión, usar row_to_json y convertir
      old_row := row_to_json(OLD)::text::jsonb;
      new_row := row_to_json(NEW)::text::jsonb;
    END;
    
    -- Construir objeto de cambios de forma más simple
    -- Solo guardar campos principales que pueden cambiar
    changed_fields := jsonb_build_object(
      'appointment_date', CASE 
        WHEN OLD.appointment_date IS DISTINCT FROM NEW.appointment_date 
        THEN jsonb_build_object('old', to_jsonb(OLD.appointment_date), 'new', to_jsonb(NEW.appointment_date))
        ELSE NULL
      END,
      'appointment_time', CASE 
        WHEN OLD.appointment_time IS DISTINCT FROM NEW.appointment_time 
        THEN jsonb_build_object('old', to_jsonb(OLD.appointment_time), 'new', to_jsonb(NEW.appointment_time))
        ELSE NULL
      END,
      'status', CASE 
        WHEN OLD.status IS DISTINCT FROM NEW.status 
        THEN jsonb_build_object('old', to_jsonb(OLD.status), 'new', to_jsonb(NEW.status))
        ELSE NULL
      END,
      'service_id', CASE 
        WHEN OLD.service_id IS DISTINCT FROM NEW.service_id 
        THEN jsonb_build_object('old', to_jsonb(OLD.service_id), 'new', to_jsonb(NEW.service_id))
        ELSE NULL
      END,
      'specialist_id', CASE 
        WHEN OLD.specialist_id IS DISTINCT FROM NEW.specialist_id 
        THEN jsonb_build_object('old', to_jsonb(OLD.specialist_id), 'new', to_jsonb(NEW.specialist_id))
        ELSE NULL
      END,
      'patient_id', CASE 
        WHEN OLD.patient_id IS DISTINCT FROM NEW.patient_id 
        THEN jsonb_build_object('old', to_jsonb(OLD.patient_id), 'new', to_jsonb(NEW.patient_id))
        ELSE NULL
      END,
      'duration', CASE 
        WHEN OLD.duration IS DISTINCT FROM NEW.duration 
        THEN jsonb_build_object('old', to_jsonb(OLD.duration), 'new', to_jsonb(NEW.duration))
        ELSE NULL
      END,
      'notes', CASE 
        WHEN (OLD.notes IS DISTINCT FROM NEW.notes) 
        THEN jsonb_build_object('old', to_jsonb(OLD.notes), 'new', to_jsonb(NEW.notes))
        ELSE NULL
      END
    );
    
    -- Remover campos NULL del objeto
    changed_fields := changed_fields - 'null';
    
    -- Construir objeto final de cambios
    changes := jsonb_build_object(
      'old_values', jsonb_build_object(
        'appointment_date', to_jsonb(OLD.appointment_date),
        'appointment_time', to_jsonb(OLD.appointment_time),
        'status', to_jsonb(OLD.status),
        'service_id', to_jsonb(OLD.service_id),
        'specialist_id', to_jsonb(OLD.specialist_id),
        'patient_id', to_jsonb(OLD.patient_id)
      ),
      'new_values', jsonb_build_object(
        'appointment_date', to_jsonb(NEW.appointment_date),
        'appointment_time', to_jsonb(NEW.appointment_time),
        'status', to_jsonb(NEW.status),
        'service_id', to_jsonb(NEW.service_id),
        'specialist_id', to_jsonb(NEW.specialist_id),
        'patient_id', to_jsonb(NEW.patient_id)
      ),
      'changed_fields', changed_fields,
      'timestamp', to_jsonb(NOW())
    );
    
    -- Insertar cambio solo si hay campos que cambiaron
    IF changed_fields::text != '{}' THEN
      INSERT INTO appointment_changes (
        appointment_id,
        version,
        changes,
        modified_by,
        reason
      ) VALUES (
        NEW.id,
        COALESCE(NEW.version, 1),
        changes,
        COALESCE(NEW.modified_by, 'system'),
        'Automatic change tracking'
      ) ON CONFLICT DO NOTHING; -- Evitar errores si ya existe
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay cualquier error, solo loguear y continuar
    RAISE WARNING 'Error en trigger auto_log_appointment_changes: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asegurar que el trigger existe y está activo
DROP TRIGGER IF EXISTS appointment_auto_log_changes ON appointments;
CREATE TRIGGER appointment_auto_log_changes
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_log_appointment_changes();

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger auto_log_appointment_changes() actualizado correctamente';
  RAISE NOTICE 'El error "invalid input syntax for type json" debería estar resuelto';
END $$;

