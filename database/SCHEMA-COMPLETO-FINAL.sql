-- =====================================================
-- SCHEMA COMPLETO PARA CENTRO DE ESTÉTICA INTEGRAL
-- Sistema completo con todas las mejoras implementadas
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLAS PRINCIPALES DEL SISTEMA
-- =====================================================

-- Tabla de servicios estéticos
CREATE TABLE aesthetic_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 45, -- duración en minutos
  category VARCHAR(20) NOT NULL CHECK (category IN ('facial', 'corporal', 'depilacion', 'terapeutico', 'estetico')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de especialistas (en este caso, solo Lorena)
CREATE TABLE specialists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  profile_image VARCHAR(500),
  title VARCHAR(100) DEFAULT 'Esteticista Profesional',
  license VARCHAR(50), -- Matrícula profesional
  address TEXT, -- Dirección del centro
  specialties UUID[], -- Array de IDs de servicios que ofrece
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pacientes/clientes
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  notes TEXT, -- observaciones del profesional
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de turnos/citas (CON MEJORAS DE CONCURRENCIA)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES aesthetic_services(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- duración del servicio en minutos
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  version INTEGER DEFAULT 1, -- Para control de concurrencia
  modified_by VARCHAR(255), -- Usuario que realizó la última modificación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar turnos duplicados en el mismo horario
  UNIQUE(specialist_id, appointment_date, appointment_time)
);

-- Tabla de horarios de trabajo
CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lunch_start TIME, -- hora de inicio de almuerzo
  lunch_end TIME, -- hora de fin de almuerzo
  allowed_services UUID[], -- servicios permitidos en este día (NULL = todos)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un horario por día por especialista
  UNIQUE(specialist_id, day_of_week)
);

-- Tabla de cierres y vacaciones
CREATE TABLE closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  closure_type VARCHAR(20) NOT NULL CHECK (closure_type IN ('vacation', 'holiday', 'personal', 'maintenance')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validar que la fecha de fin sea posterior o igual a la de inicio
  CHECK (end_date >= start_date)
);

-- Tabla de configuración del sistema
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de administradores
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NUEVAS TABLAS PARA MEJORAS IMPLEMENTADAS
-- =====================================================

-- 🔒 CRÍTICO: Tabla para locks de citas (prevenir race conditions)
CREATE TABLE appointment_locks (
  id VARCHAR(50) PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  locked_by VARCHAR(255) NOT NULL, -- IP o session ID del cliente
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Índices para consultas rápidas
  CONSTRAINT unique_active_lock UNIQUE (specialist_id, appointment_date, appointment_time)
);

-- 📧 CRÍTICO: Tabla para cola de emails (sistema de fallback)
CREATE TABLE email_queue (
  id VARCHAR(50) PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  last_attempt TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  message_id VARCHAR(255),
  error_message TEXT,
  
  -- Índices para consultas eficientes
  CONSTRAINT valid_attempts CHECK (attempts >= 0 AND attempts <= max_attempts)
);

-- 🔄 MEDIO: Tabla para historial de cambios de citas
CREATE TABLE appointment_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changes JSONB NOT NULL, -- Cambios realizados
  modified_by VARCHAR(255) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_appointment_version UNIQUE (appointment_id, version)
);

-- 🔄 MEDIO: Tabla para conflictos de concurrencia
CREATE TABLE concurrency_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type VARCHAR(50) NOT NULL, -- 'appointment', 'schedule', etc.
  resource_id UUID NOT NULL,
  conflict_type VARCHAR(50) NOT NULL, -- 'version_mismatch', 'simultaneous_edit', etc.
  current_version INTEGER NOT NULL,
  attempted_version INTEGER NOT NULL,
  current_data JSONB,
  attempted_data JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolution_strategy VARCHAR(50), -- 'merge', 'override', 'manual'
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT valid_version_order CHECK (attempted_version <= current_version)
);

-- 📊 BAJO: Tabla para métricas del sistema
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  performance_metrics JSONB NOT NULL,
  business_metrics JSONB NOT NULL,
  technical_metrics JSONB NOT NULL,
  security_metrics JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 BAJO: Tabla para reglas de alerta
CREATE TABLE alert_rules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  metric_path VARCHAR(255) NOT NULL,
  condition VARCHAR(10) NOT NULL CHECK (condition IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  threshold DECIMAL(10,4) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 BAJO: Tabla para alertas del sistema
CREATE TABLE system_alerts (
  id VARCHAR(50) PRIMARY KEY,
  rule_id VARCHAR(50) NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices principales
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_specialist ON appointments(specialist_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_services_category ON aesthetic_services(category);
CREATE INDEX idx_services_active ON aesthetic_services(is_active);
CREATE INDEX idx_closures_dates ON closures(start_date, end_date);
CREATE INDEX idx_closures_specialist ON closures(specialist_id);
CREATE INDEX idx_closures_active ON closures(is_active);
CREATE INDEX idx_work_schedules_specialist ON work_schedules(specialist_id);

-- Índices para nuevas tablas
CREATE INDEX idx_appointment_locks_expires ON appointment_locks(expires_at);
CREATE INDEX idx_appointment_locks_specialist_date ON appointment_locks(specialist_id, appointment_date);
CREATE INDEX idx_appointment_locks_locked_by ON appointment_locks(locked_by);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);
CREATE INDEX idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_pending ON email_queue(status, priority, created_at) WHERE status = 'pending';

CREATE INDEX idx_appointment_changes_appointment_id ON appointment_changes(appointment_id);
CREATE INDEX idx_appointment_changes_version ON appointment_changes(version);
CREATE INDEX idx_appointment_changes_status ON appointment_changes(status);

CREATE INDEX idx_concurrency_conflicts_resource ON concurrency_conflicts(resource_type, resource_id);
CREATE INDEX idx_concurrency_conflicts_status ON concurrency_conflicts(status);
CREATE INDEX idx_concurrency_conflicts_created_at ON concurrency_conflicts(created_at);

CREATE INDEX idx_system_metrics_timestamp ON system_metrics(metric_timestamp);
CREATE INDEX idx_system_metrics_created_at ON system_metrics(created_at);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX idx_system_alerts_rule_id ON system_alerts(rule_id);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_triggered_at ON system_alerts(triggered_at);
CREATE INDEX idx_system_alerts_resolved_at ON system_alerts(resolved_at);
CREATE INDEX idx_system_alerts_active ON system_alerts(rule_id, triggered_at) WHERE resolved_at IS NULL;

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aesthetic_services_updated_at BEFORE UPDATE ON aesthetic_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_specialists_updated_at BEFORE UPDATE ON specialists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON work_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_closures_updated_at BEFORE UPDATE ON closures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar versión automáticamente
CREATE OR REPLACE FUNCTION update_appointment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_version_update
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_version();

-- Trigger para registrar cambios automáticamente
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

CREATE TRIGGER appointment_auto_log_changes
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_log_appointment_changes();

-- =====================================================
-- FUNCIONES ÚTILES DEL SISTEMA
-- =====================================================

-- Función para verificar si una fecha está cerrada
CREATE OR REPLACE FUNCTION is_date_closed(
  p_specialist_id UUID,
  p_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM closures
    WHERE specialist_id = p_specialist_id
      AND p_date BETWEEN start_date AND end_date
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Función mejorada para obtener slots disponibles
CREATE OR REPLACE FUNCTION get_available_slots(
  p_specialist_id UUID,
  p_date DATE,
  p_service_id UUID
)
RETURNS TABLE(time_slot TIME) AS $$
DECLARE
  service_duration INTEGER;
  day_of_week INTEGER;
  is_closed BOOLEAN;
BEGIN
  -- Verificar si la fecha está cerrada
  is_closed := is_date_closed(p_specialist_id, p_date);
  
  -- Si está cerrado, no devolver slots
  IF is_closed THEN
    RETURN;
  END IF;
  
  -- Obtener duración del servicio
  SELECT duration INTO service_duration FROM aesthetic_services WHERE id = p_service_id;
  
  -- Obtener día de la semana (0=domingo, 6=sábado)
  day_of_week := EXTRACT(DOW FROM p_date);
  
  RETURN QUERY
  WITH time_slots AS (
    SELECT 
      (ws.start_time + (generate_series(0, 
        EXTRACT(EPOCH FROM (ws.end_time - ws.start_time))::integer / 1800 - 1
      ) * INTERVAL '30 minutes'))::TIME as slot_time,
      ws.lunch_start,
      ws.lunch_end
    FROM work_schedules ws
    WHERE ws.specialist_id = p_specialist_id
      AND ws.day_of_week = day_of_week
      AND ws.is_active = true
      AND (ws.allowed_services IS NULL OR p_service_id::text = ANY(ws.allowed_services))
  )
  SELECT ts.slot_time
  FROM time_slots ts
  WHERE 
    -- Excluir horario de almuerzo si existe
    (ts.lunch_start IS NULL OR ts.lunch_end IS NULL OR 
     NOT (ts.slot_time >= ts.lunch_start AND ts.slot_time < ts.lunch_end))
    -- Excluir slots ya ocupados
    AND NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.specialist_id = p_specialist_id
        AND a.appointment_date = p_date
        AND a.appointment_time = ts.slot_time
        AND a.status != 'cancelled'
    )
  ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIONES PARA NUEVAS MEJORAS
-- =====================================================

-- Función para limpiar locks expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM appointment_locks 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un horario está bloqueado
CREATE OR REPLACE FUNCTION is_appointment_locked(
  p_specialist_id UUID,
  p_appointment_date DATE,
  p_appointment_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  lock_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM appointment_locks 
    WHERE specialist_id = p_specialist_id 
      AND appointment_date = p_appointment_date 
      AND appointment_time = p_appointment_time 
      AND expires_at > NOW()
  ) INTO lock_exists;
  
  RETURN lock_exists;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener información de locks activos
CREATE OR REPLACE FUNCTION get_active_locks()
RETURNS TABLE (
  lock_id VARCHAR(50),
  specialist_id UUID,
  appointment_date DATE,
  appointment_time TIME,
  locked_by VARCHAR(255),
  locked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  minutes_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.specialist_id,
    al.appointment_date,
    al.appointment_time,
    al.locked_by,
    al.locked_at,
    al.expires_at,
    EXTRACT(EPOCH FROM (al.expires_at - NOW()))::INTEGER / 60 as minutes_remaining
  FROM appointment_locks al
  WHERE al.expires_at > NOW()
  ORDER BY al.locked_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener emails pendientes ordenados por prioridad
CREATE OR REPLACE FUNCTION get_pending_emails(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id VARCHAR(50),
  to_email VARCHAR(255),
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  priority VARCHAR(10),
  attempts INTEGER,
  max_attempts INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.to_email,
    eq.subject,
    eq.html_content,
    eq.text_content,
    eq.priority,
    eq.attempts,
    eq.max_attempts,
    eq.created_at
  FROM email_queue eq
  WHERE eq.status = 'pending'
    AND eq.attempts < eq.max_attempts
    AND (eq.scheduled_for IS NULL OR eq.scheduled_for <= NOW())
  ORDER BY 
    CASE eq.priority 
      WHEN 'high' THEN 1 
      WHEN 'normal' THEN 2 
      WHEN 'low' THEN 3 
    END,
    eq.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar email como enviado
CREATE OR REPLACE FUNCTION mark_email_sent(
  p_id VARCHAR(50),
  p_message_id VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE email_queue 
  SET 
    status = 'sent',
    sent_at = NOW(),
    message_id = p_message_id
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar email como fallido
CREATE OR REPLACE FUNCTION mark_email_failed(
  p_id VARCHAR(50),
  p_error_message TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_attempts INTEGER;
  max_attempts_val INTEGER;
BEGIN
  SELECT attempts, max_attempts INTO current_attempts, max_attempts_val
  FROM email_queue WHERE id = p_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  UPDATE email_queue 
  SET 
    attempts = current_attempts + 1,
    last_attempt = NOW(),
    error_message = p_error_message,
    status = CASE 
      WHEN current_attempts + 1 >= max_attempts_val THEN 'failed'
      ELSE 'retrying'
    END
  WHERE id = p_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de la cola
CREATE OR REPLACE FUNCTION get_email_queue_stats()
RETURNS TABLE (
  status VARCHAR(20),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.status,
    COUNT(*) as count
  FROM email_queue eq
  GROUP BY eq.status
  ORDER BY eq.status;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar emails antiguos
CREATE OR REPLACE FUNCTION cleanup_old_emails(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_queue 
  WHERE status IN ('sent', 'failed')
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener la próxima versión de una cita
CREATE OR REPLACE FUNCTION get_next_appointment_version(p_appointment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO next_version
  FROM appointments
  WHERE id = p_appointment_id;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar un cambio en el historial
CREATE OR REPLACE FUNCTION log_appointment_change(
  p_appointment_id UUID,
  p_version INTEGER,
  p_changes JSONB,
  p_modified_by VARCHAR(255),
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  change_id UUID;
BEGIN
  INSERT INTO appointment_changes (
    appointment_id,
    version,
    changes,
    modified_by,
    reason
  ) VALUES (
    p_appointment_id,
    p_version,
    p_changes,
    p_modified_by,
    p_reason
  ) RETURNING id INTO change_id;
  
  RETURN change_id;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar conflictos de versión
CREATE OR REPLACE FUNCTION detect_version_conflict(
  p_appointment_id UUID,
  p_expected_version INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_version INTEGER;
BEGIN
  SELECT version INTO current_version
  FROM appointments
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    RETURN TRUE; -- Cita no existe, es un conflicto
  END IF;
  
  RETURN current_version != p_expected_version;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de conflictos
CREATE OR REPLACE FUNCTION get_concurrency_stats()
RETURNS TABLE (
  total_conflicts BIGINT,
  resolved_conflicts BIGINT,
  pending_conflicts BIGINT,
  conflicts_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_conflicts,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_conflicts,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_conflicts,
    jsonb_object_agg(conflict_type, type_count) as conflicts_by_type
  FROM (
    SELECT 
      conflict_type,
      COUNT(*) as type_count
    FROM concurrency_conflicts
    GROUP BY conflict_type
  ) type_counts;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar conflictos antiguos resueltos
CREATE OR REPLACE FUNCTION cleanup_resolved_conflicts(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM concurrency_conflicts 
  WHERE status = 'resolved'
    AND resolved_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar citas duplicadas
CREATE OR REPLACE FUNCTION find_duplicate_appointments()
RETURNS TABLE (
  id UUID,
  specialist_id UUID,
  appointment_date DATE,
  appointment_time TIME,
  duplicate_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.specialist_id,
    a.appointment_date,
    a.appointment_time,
    COUNT(*) as duplicate_count
  FROM appointments a
  WHERE a.status != 'cancelled'
  GROUP BY a.specialist_id, a.appointment_date, a.appointment_time
  HAVING COUNT(*) > 1
  ORDER BY duplicate_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar citas huérfanas (sin especialista válido)
CREATE OR REPLACE FUNCTION find_orphaned_appointments_by_specialist()
RETURNS TABLE (
  id UUID,
  specialist_id UUID,
  appointment_date DATE,
  appointment_time TIME,
  specialist_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.specialist_id,
    a.appointment_date,
    a.appointment_time,
    COALESCE(s.name, 'ESPECIALISTA NO ENCONTRADO') as specialist_name
  FROM appointments a
  LEFT JOIN specialists s ON a.specialist_id = s.id AND s.is_active = true
  WHERE s.id IS NULL
    AND a.status = 'scheduled'
  ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar citas huérfanas (sin servicio válido)
CREATE OR REPLACE FUNCTION find_orphaned_appointments_by_service()
RETURNS TABLE (
  id UUID,
  service_id UUID,
  appointment_date DATE,
  appointment_time TIME,
  service_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.service_id,
    a.appointment_date,
    a.appointment_time,
    COALESCE(s.name, 'SERVICIO NO ENCONTRADO') as service_name
  FROM appointments a
  LEFT JOIN aesthetic_services s ON a.service_id = s.id AND s.is_active = true
  WHERE s.id IS NULL
    AND a.status = 'scheduled'
  ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar horarios inconsistentes
CREATE OR REPLACE FUNCTION find_inconsistent_schedules()
RETURNS TABLE (
  id UUID,
  specialist_id UUID,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  issue_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.specialist_id,
    ws.day_of_week,
    ws.start_time,
    ws.end_time,
    CASE 
      WHEN ws.start_time >= ws.end_time THEN 'Hora inicio >= hora fin'
      WHEN ws.lunch_start IS NOT NULL AND ws.lunch_end IS NOT NULL 
           AND (ws.lunch_start < ws.start_time OR ws.lunch_end > ws.end_time) 
           THEN 'Horario almuerzo fuera del horario de trabajo'
      ELSE 'Otro'
    END as issue_type
  FROM work_schedules ws
  WHERE ws.is_active = true
    AND (
      ws.start_time >= ws.end_time OR
      (ws.lunch_start IS NOT NULL AND ws.lunch_end IS NOT NULL 
       AND (ws.lunch_start < ws.start_time OR ws.lunch_end > ws.end_time))
    );
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar datos faltantes críticos
CREATE OR REPLACE FUNCTION find_missing_critical_data()
RETURNS TABLE (
  table_name TEXT,
  record_id UUID,
  missing_field TEXT,
  severity TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Citas sin fecha
  SELECT 
    'appointments'::TEXT as table_name,
    a.id as record_id,
    CASE 
      WHEN a.appointment_date IS NULL THEN 'appointment_date'
      WHEN a.appointment_time IS NULL THEN 'appointment_time'
      ELSE 'unknown'
    END as missing_field,
    'critical'::TEXT as severity
  FROM appointments a
  WHERE a.appointment_date IS NULL OR a.appointment_time IS NULL
  
  UNION ALL
  
  -- Pacientes sin email
  SELECT 
    'patients'::TEXT as table_name,
    p.id as record_id,
    'email'::TEXT as missing_field,
    'medium'::TEXT as severity
  FROM patients p
  WHERE p.email IS NULL OR p.email = ''
  
  UNION ALL
  
  -- Especialistas sin datos básicos
  SELECT 
    'specialists'::TEXT as table_name,
    s.id as record_id,
    CASE 
      WHEN s.name IS NULL OR s.name = '' THEN 'name'
      WHEN s.email IS NULL OR s.email = '' THEN 'email'
      ELSE 'unknown'
    END as missing_field,
    'high'::TEXT as severity
  FROM specialists s
  WHERE s.name IS NULL OR s.name = '' OR s.email IS NULL OR s.email = '';
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar fechas inválidas
CREATE OR REPLACE FUNCTION find_invalid_dates()
RETURNS TABLE (
  table_name TEXT,
  record_id UUID,
  date_field TEXT,
  date_value DATE,
  issue_type TEXT
) AS $$
DECLARE
  one_year_ago DATE;
BEGIN
  one_year_ago := CURRENT_DATE - INTERVAL '1 year';
  
  RETURN QUERY
  -- Citas muy antiguas programadas
  SELECT 
    'appointments'::TEXT as table_name,
    a.id as record_id,
    'appointment_date'::TEXT as date_field,
    a.appointment_date as date_value,
    'Fecha muy antigua'::TEXT as issue_type
  FROM appointments a
  WHERE a.appointment_date < one_year_ago
    AND a.status = 'scheduled'
  
  UNION ALL
  
  -- Citas en el futuro muy lejano
  SELECT 
    'appointments'::TEXT as table_name,
    a.id as record_id,
    'appointment_date'::TEXT as date_field,
    a.appointment_date as date_value,
    'Fecha muy futura'::TEXT as issue_type
  FROM appointments a
  WHERE a.appointment_date > CURRENT_DATE + INTERVAL '1 year'
    AND a.status = 'scheduled';
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de integridad
CREATE OR REPLACE FUNCTION get_data_integrity_summary()
RETURNS TABLE (
  total_appointments BIGINT,
  orphaned_appointments BIGINT,
  duplicate_appointments BIGINT,
  invalid_schedules BIGINT,
  missing_data_records BIGINT,
  invalid_dates BIGINT,
  health_score INTEGER
) AS $$
DECLARE
  total_apt BIGINT;
  orphaned_apt BIGINT;
  duplicate_apt BIGINT;
  invalid_sched BIGINT;
  missing_data BIGINT;
  invalid_dates_count BIGINT;
  score INTEGER;
BEGIN
  -- Contar total de citas
  SELECT COUNT(*) INTO total_apt FROM appointments WHERE status != 'cancelled';
  
  -- Contar citas huérfanas
  SELECT COUNT(*) INTO orphaned_apt 
  FROM (
    SELECT a.id FROM appointments a
    LEFT JOIN specialists s ON a.specialist_id = s.id AND s.is_active = true
    WHERE s.id IS NULL AND a.status = 'scheduled'
    UNION
    SELECT a.id FROM appointments a
    LEFT JOIN aesthetic_services s ON a.service_id = s.id AND s.is_active = true
    WHERE s.id IS NULL AND a.status = 'scheduled'
  ) orphaned;
  
  -- Contar duplicados
  SELECT COUNT(*) INTO duplicate_apt
  FROM (
    SELECT specialist_id, appointment_date, appointment_time
    FROM appointments
    WHERE status != 'cancelled'
    GROUP BY specialist_id, appointment_date, appointment_time
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Contar horarios inconsistentes
  SELECT COUNT(*) INTO invalid_sched
  FROM work_schedules
  WHERE is_active = true
    AND (start_time >= end_time OR 
         (lunch_start IS NOT NULL AND lunch_end IS NOT NULL 
          AND (lunch_start < start_time OR lunch_end > end_time)));
  
  -- Contar datos faltantes
  SELECT COUNT(*) INTO missing_data
  FROM (
    SELECT id FROM appointments WHERE appointment_date IS NULL OR appointment_time IS NULL
    UNION
    SELECT id FROM patients WHERE email IS NULL OR email = ''
    UNION
    SELECT id FROM specialists WHERE name IS NULL OR name = '' OR email IS NULL OR email = ''
  ) missing;
  
  -- Contar fechas inválidas
  SELECT COUNT(*) INTO invalid_dates_count
  FROM appointments
  WHERE (appointment_date < CURRENT_DATE - INTERVAL '1 year' 
         OR appointment_date > CURRENT_DATE + INTERVAL '1 year')
    AND status = 'scheduled';
  
  -- Calcular score de salud (0-100)
  score := GREATEST(0, 100 - (
    COALESCE(orphaned_apt, 0) * 10 +
    COALESCE(duplicate_apt, 0) * 15 +
    COALESCE(invalid_sched, 0) * 5 +
    COALESCE(missing_data, 0) * 3 +
    COALESCE(invalid_dates_count, 0) * 2
  ));
  
  RETURN QUERY
  SELECT 
    total_apt,
    orphaned_apt,
    duplicate_apt,
    invalid_sched,
    missing_data,
    invalid_dates_count,
    score;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos automáticamente
CREATE OR REPLACE FUNCTION auto_cleanup_data_integrity()
RETURNS TABLE (
  action TEXT,
  records_affected BIGINT,
  success BOOLEAN
) AS $$
DECLARE
  orphaned_count BIGINT;
  duplicate_count BIGINT;
  invalid_schedule_count BIGINT;
BEGIN
  -- Cancelar citas huérfanas
  WITH orphaned_appointments AS (
    SELECT a.id FROM appointments a
    LEFT JOIN specialists s ON a.specialist_id = s.id AND s.is_active = true
    WHERE s.id IS NULL AND a.status = 'scheduled'
  )
  UPDATE appointments 
  SET 
    status = 'cancelled',
    notes = COALESCE(notes, '') || ' [Cancelada automáticamente por integridad]'
  WHERE id IN (SELECT id FROM orphaned_appointments);
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT 
    'Cancelar citas huérfanas'::TEXT as action,
    orphaned_count as records_affected,
    true as success;
  
  -- Intercambiar horas de inicio y fin en horarios inconsistentes
  WITH inconsistent_schedules AS (
    SELECT id, start_time, end_time
    FROM work_schedules
    WHERE is_active = true AND start_time >= end_time
  )
  UPDATE work_schedules
  SET 
    start_time = end_time,
    end_time = start_time
  WHERE id IN (SELECT id FROM inconsistent_schedules);
  
  GET DIAGNOSTICS invalid_schedule_count = ROW_COUNT;
  
  RETURN QUERY
  SELECT 
    'Corregir horarios inconsistentes'::TEXT as action,
    invalid_schedule_count as records_affected,
    true as success;
  
END;
$$ LANGUAGE plpgsql;

-- Función para obtener métricas recientes
CREATE OR REPLACE FUNCTION get_recent_metrics(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  id UUID,
  metric_timestamp TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB,
  business_metrics JSONB,
  technical_metrics JSONB,
  security_metrics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.metric_timestamp,
    sm.performance_metrics,
    sm.business_metrics,
    sm.technical_metrics,
    sm.security_metrics
  FROM system_metrics sm
  WHERE sm.metric_timestamp >= NOW() - INTERVAL '1 hour' * hours_back
  ORDER BY sm.metric_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener alertas activas
CREATE OR REPLACE FUNCTION get_active_alerts()
RETURNS TABLE (
  id VARCHAR(50),
  rule_id VARCHAR(50),
  rule_name VARCHAR(255),
  message TEXT,
  severity VARCHAR(20),
  triggered_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.rule_id,
    ar.name as rule_name,
    sa.message,
    sa.severity,
    sa.triggered_at,
    sa.metadata
  FROM system_alerts sa
  JOIN alert_rules ar ON sa.rule_id = ar.id
  WHERE sa.resolved_at IS NULL
  ORDER BY sa.triggered_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas del sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
  total_metrics BIGINT,
  metrics_last_24h BIGINT,
  active_alerts BIGINT,
  total_alerts BIGINT,
  alerts_by_severity JSONB,
  avg_response_time DECIMAL(10,2),
  error_rate DECIMAL(5,4),
  uptime_score DECIMAL(5,4)
) AS $$
DECLARE
  total_metrics_count BIGINT;
  metrics_24h_count BIGINT;
  active_alerts_count BIGINT;
  total_alerts_count BIGINT;
  avg_resp_time DECIMAL(10,2);
  error_rate_val DECIMAL(5,4);
  uptime_val DECIMAL(5,4);
BEGIN
  -- Contar métricas totales
  SELECT COUNT(*) INTO total_metrics_count FROM system_metrics;
  
  -- Contar métricas de las últimas 24 horas
  SELECT COUNT(*) INTO metrics_24h_count 
  FROM system_metrics 
  WHERE metric_timestamp >= NOW() - INTERVAL '24 hours';
  
  -- Contar alertas activas
  SELECT COUNT(*) INTO active_alerts_count 
  FROM system_alerts 
  WHERE resolved_at IS NULL;
  
  -- Contar total de alertas
  SELECT COUNT(*) INTO total_alerts_count FROM system_alerts;
  
  -- Calcular tiempo de respuesta promedio
  SELECT AVG((performance_metrics->>'responseTime')::DECIMAL) INTO avg_resp_time
  FROM system_metrics
  WHERE metric_timestamp >= NOW() - INTERVAL '1 hour';
  
  -- Calcular tasa de error promedio
  SELECT AVG((technical_metrics->>'errorRate')::DECIMAL) INTO error_rate_val
  FROM system_metrics
  WHERE metric_timestamp >= NOW() - INTERVAL '1 hour';
  
  -- Calcular uptime promedio
  SELECT AVG((technical_metrics->>'uptime')::DECIMAL) INTO uptime_val
  FROM system_metrics
  WHERE metric_timestamp >= NOW() - INTERVAL '1 hour';
  
  RETURN QUERY
  SELECT 
    total_metrics_count,
    metrics_24h_count,
    active_alerts_count,
    total_alerts_count,
    (
      SELECT jsonb_object_agg(severity, count)
      FROM (
        SELECT severity, COUNT(*) as count
        FROM system_alerts
        WHERE resolved_at IS NULL
        GROUP BY severity
      ) severity_counts
    ) as alerts_by_severity,
    COALESCE(avg_resp_time, 0),
    COALESCE(error_rate_val, 0),
    COALESCE(uptime_val, 1);
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar métricas antiguas
CREATE OR REPLACE FUNCTION cleanup_old_metrics(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_metrics 
  WHERE metric_timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar alertas resueltas antiguas
CREATE OR REPLACE FUNCTION cleanup_resolved_alerts(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_alerts 
  WHERE resolved_at IS NOT NULL 
    AND resolved_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para crear regla de alerta
CREATE OR REPLACE FUNCTION create_alert_rule(
  p_id VARCHAR(50),
  p_name VARCHAR(255),
  p_metric_path VARCHAR(255),
  p_condition VARCHAR(10),
  p_threshold DECIMAL(10,4),
  p_severity VARCHAR(20),
  p_cooldown_minutes INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO alert_rules (
    id, name, metric_path, condition, threshold, severity, cooldown_minutes
  ) VALUES (
    p_id, p_name, p_metric_path, p_condition, p_threshold, p_severity, p_cooldown_minutes
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para resolver alerta
CREATE OR REPLACE FUNCTION resolve_alert(
  p_alert_id VARCHAR(50),
  p_resolved_by VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE system_alerts 
  SET 
    resolved_at = NOW(),
    acknowledged_by = p_resolved_by,
    acknowledged_at = NOW()
  WHERE id = p_alert_id AND resolved_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES DEL SISTEMA
-- =====================================================

-- Insertar servicios estéticos por defecto
INSERT INTO aesthetic_services (name, description, duration, category) VALUES
('Drenaje Linfático', 'Técnica de masaje suave que estimula el sistema linfático para eliminar toxinas, reducir la retención de líquidos y mejorar la circulación. Ideal para combatir la celulitis y mejorar el contorno corporal.', 45, 'corporal'),
('Limpieza Facial', 'Tratamiento profundo que incluye limpieza, exfoliación, extracción de puntos negros, mascarilla purificante y humectación. Deja la piel renovada, suave y con aspecto saludable.', 45, 'facial'),
('Depilación Láser', 'Eliminación definitiva del vello no deseado mediante tecnología láser de última generación. Tratamiento seguro, efectivo y duradero para rostro y cuerpo.', 20, 'depilacion'),
('Podología', 'Cuidado integral de los pies incluyendo corte de uñas, tratamiento de callosidades, durezas y uñas encarnadas. Mejora la salud y estética de tus pies.', 45, 'terapeutico'),
('Sonoterapia', 'Terapia con ultrasonido que utiliza ondas sonoras para mejorar la circulación, reducir inflamación y acelerar la regeneración celular. Efectiva para celulitis y flacidez.', 45, 'corporal'),
('Cosmiatría', 'Tratamientos faciales especializados para mejorar la textura, luminosidad y juventud de la piel. Incluye peelings, mesoterapia y tratamientos anti-edad personalizados.', 45, 'facial'),
('Fangoterapia', 'Aplicación de barros terapéuticos ricos en minerales que desintoxican, nutren y revitalizan la piel. Ideal para problemas circulatorios y relajación muscular.', 45, 'corporal'),
('Reflexología', 'Técnica terapéutica que estimula puntos específicos en los pies para promover el equilibrio y bienestar general del cuerpo. Alivia tensiones y mejora la circulación.', 45, 'terapeutico'),
('Tratamientos Corporales', 'Variedad de tratamientos para moldear, tonificar y mejorar el aspecto de la piel corporal. Incluye radiofrecuencia, cavitación y tratamientos reductivos.', 45, 'corporal'),
('Lifting Facial', 'Tratamiento no invasivo que tensiona y reafirma la piel del rostro mediante técnicas avanzadas como radiofrecuencia y masajes especializados. Resultados visibles inmediatos.', 45, 'estetico');

-- Insertar especialista (Lorena Esquivel)
INSERT INTO specialists (name, email, phone, bio, years_experience, title, license, address, specialties) VALUES
('Lorena Esquivel', 'lore.estetica76@gmail.com', '+54 11 1234-5678', 'Especialista en tratamientos estéticos integrales con años de experiencia en el cuidado de la piel y bienestar corporal. Certificada en las últimas técnicas de estética y medicina estética.', 10, 'Esteticista Profesional', 'Mat. 22536', 'Av. Corrientes 1234, CABA, Argentina', ARRAY(SELECT id FROM aesthetic_services));

-- Insertar horarios de trabajo
-- Lunes a Viernes (1-5): Horario completo
INSERT INTO work_schedules (specialist_id, day_of_week, start_time, end_time, lunch_start, lunch_end)
SELECT s.id, generate_series(1, 5), '09:00'::time, '18:00'::time, '13:00'::time, '14:00'::time
FROM specialists s WHERE s.name = 'Lorena Esquivel';

-- Sábado (6): TODOS los servicios de 9:00 a 13:00 (sin almuerzo)
-- NULL en allowed_services = TODOS los servicios permitidos
INSERT INTO work_schedules (specialist_id, day_of_week, start_time, end_time, allowed_services)
SELECT s.id, 6, '09:00'::time, '13:00'::time, NULL
FROM specialists s WHERE s.name = 'Lorena Esquivel';

-- Crear usuario administrador por defecto (password: admin123)
-- Nota: Cambiar esta contraseña en producción
INSERT INTO admin_users (email, password_hash, full_name, role) VALUES
('lore.estetica76@gmail.com', '$2b$10$rOzWKdFJaKfKmIxkUcA.VO8eHi3r/cEGVUgPgUZUf0nKqKYv4zSA.', 'Lorena Esquivel', 'super_admin');

-- Insertar reglas de alerta por defecto
INSERT INTO alert_rules (id, name, metric_path, condition, threshold, severity, cooldown_minutes) VALUES
('high_response_time', 'Tiempo de respuesta alto', 'performance.responseTime', 'gt', 2000, 'medium', 5),
('high_error_rate', 'Tasa de error alta', 'technical.errorRate', 'gt', 0.05, 'high', 10),
('low_uptime', 'Tiempo de actividad bajo', 'technical.uptime', 'lt', 0.99, 'critical', 15),
('high_memory_usage', 'Uso de memoria alto', 'performance.memoryUsage', 'gt', 0.8, 'medium', 5),
('security_threats', 'Amenazas de seguridad', 'security.securityThreats', 'gt', 0, 'high', 0),
('high_cpu_usage', 'Uso de CPU alto', 'performance.cpuUsage', 'gt', 0.8, 'medium', 5),
('low_cache_hit_rate', 'Tasa de acierto de caché baja', 'technical.cacheHitRate', 'lt', 0.7, 'low', 10),
('blocked_requests', 'Solicitudes bloqueadas', 'security.blockedRequests', 'gt', 10, 'medium', 5);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE aesthetic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concurrency_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para servicios estéticos (lectura pública, escritura solo admin)
CREATE POLICY "Services are viewable by everyone" ON aesthetic_services FOR SELECT USING (true);
CREATE POLICY "Services are editable by admins only" ON aesthetic_services FOR ALL USING (auth.role() = 'service_role');

-- Políticas para especialistas (lectura pública de activos, escritura solo admin)
CREATE POLICY "Active specialists are viewable by everyone" ON specialists FOR SELECT USING (is_active = true);
CREATE POLICY "Specialists are editable by admins only" ON specialists FOR ALL USING (auth.role() = 'service_role');

-- Políticas para horarios (lectura pública de activos, escritura solo admin)
CREATE POLICY "Active schedules are viewable by everyone" ON work_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Schedules are editable by admins only" ON work_schedules FOR ALL USING (auth.role() = 'service_role');

-- Políticas para pacientes (permitir creación pública, gestión solo admin)
CREATE POLICY "Anyone can create patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read all patients" ON patients FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can update patients" ON patients FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete patients" ON patients FOR DELETE USING (auth.role() = 'service_role');

-- Políticas para citas (permitir creación pública, gestión solo admin)
CREATE POLICY "Anyone can create appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read all appointments" ON appointments FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can update appointments" ON appointments FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete appointments" ON appointments FOR DELETE USING (auth.role() = 'service_role');

-- Políticas para administradores (solo acceso de service role)
CREATE POLICY "Admin users are private" ON admin_users FOR ALL USING (auth.role() = 'service_role');

-- Políticas para cierres (lectura pública de activos, escritura solo admin)
CREATE POLICY "Active closures are viewable by everyone" ON closures FOR SELECT USING (is_active = true);
CREATE POLICY "Closures are editable by admins only" ON closures FOR ALL USING (auth.role() = 'service_role');

-- Políticas para configuración del sistema (lectura pública, escritura solo admin)
CREATE POLICY "System settings are viewable by everyone" ON system_settings FOR SELECT USING (true);
CREATE POLICY "System settings are editable by admins only" ON system_settings FOR ALL USING (auth.role() = 'service_role');

-- Políticas para nuevas tablas (solo service role)
CREATE POLICY "Appointment locks are managed by service role" ON appointment_locks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Email queue is managed by service role" ON email_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Appointment changes are managed by service role" ON appointment_changes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Concurrency conflicts are managed by service role" ON concurrency_conflicts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "System metrics are managed by service role" ON system_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Alert rules are managed by service role" ON alert_rules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "System alerts are managed by service role" ON system_alerts FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de servicios activos
CREATE VIEW active_services AS
SELECT * FROM aesthetic_services WHERE is_active = true ORDER BY category, name;

-- Vista de horarios disponibles
CREATE VIEW available_times AS
SELECT 
  ws.specialist_id,
  ws.day_of_week,
  generate_series(
    EXTRACT(EPOCH FROM ws.start_time)::integer,
    EXTRACT(EPOCH FROM ws.end_time)::integer - 1800, -- -30 minutos para el último slot
    1800 -- intervalos de 30 minutos
  ) / 3600.0 AS hour_decimal
FROM work_schedules ws
WHERE ws.is_active = true;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE aesthetic_services IS 'Catálogo de servicios estéticos disponibles';
COMMENT ON TABLE specialists IS 'Profesionales que brindan los servicios (en este caso, solo Lorena)';
COMMENT ON TABLE patients IS 'Clientes del centro de estética';
COMMENT ON TABLE appointments IS 'Turnos agendados con servicios específicos (con control de concurrencia)';
COMMENT ON TABLE work_schedules IS 'Horarios de trabajo por día de la semana';
COMMENT ON TABLE admin_users IS 'Usuarios con acceso administrativo al sistema';
COMMENT ON TABLE closures IS 'Periodos de cierre por vacaciones, feriados u otras razones';
COMMENT ON TABLE system_settings IS 'Configuración general del sistema';
COMMENT ON TABLE appointment_locks IS 'Locks temporales para prevenir race conditions en reservas de citas';
COMMENT ON TABLE email_queue IS 'Cola de emails para sistema de fallback cuando el envío directo falla';
COMMENT ON TABLE appointment_changes IS 'Historial de cambios de citas para auditoría y resolución de conflictos';
COMMENT ON TABLE concurrency_conflicts IS 'Registro de conflictos de concurrencia detectados';
COMMENT ON TABLE system_metrics IS 'Métricas del sistema recolectadas periódicamente';
COMMENT ON TABLE alert_rules IS 'Reglas para generar alertas automáticas';
COMMENT ON TABLE system_alerts IS 'Alertas generadas por el sistema de monitoreo';

COMMENT ON COLUMN appointments.duration IS 'Duración en minutos del servicio (copiado del servicio al crear el turno)';
COMMENT ON COLUMN appointments.version IS 'Número de versión para control de concurrencia';
COMMENT ON COLUMN appointments.modified_by IS 'Usuario que realizó la última modificación';
COMMENT ON COLUMN work_schedules.allowed_services IS 'Array de UUIDs de servicios permitidos en este día (NULL = todos los servicios)';
COMMENT ON COLUMN closures.closure_type IS 'Tipo de cierre: vacation (vacaciones), holiday (feriado), personal (personal), maintenance (mantenimiento)';
COMMENT ON COLUMN appointment_locks.locked_by IS 'Identificador único del cliente (IP + User Agent hash)';
COMMENT ON COLUMN appointment_locks.expires_at IS 'Momento en que expira el lock (normalmente 5 minutos)';
COMMENT ON COLUMN email_queue.priority IS 'Prioridad del email: high, normal, low';
COMMENT ON COLUMN email_queue.attempts IS 'Número de intentos de envío realizados';
COMMENT ON COLUMN email_queue.max_attempts IS 'Número máximo de intentos permitidos';
COMMENT ON COLUMN email_queue.status IS 'Estado actual: pending, sent, failed, retrying';

-- =====================================================
-- FIN DEL SCHEMA COMPLETO
-- =====================================================
