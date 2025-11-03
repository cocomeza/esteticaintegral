-- Tabla para excepciones de horario por fecha específica
-- Permite cambiar el horario para una fecha específica sin afectar el horario regular

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lunch_start TIME,
  lunch_end TIME,
  allowed_services UUID[], -- servicios permitidos en este día (NULL = todos)
  reason TEXT, -- motivo de la excepción (ej: "Cita médica personal")
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Una excepción por fecha por especialista
  UNIQUE(specialist_id, exception_date)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_date ON schedule_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_specialist ON schedule_exceptions(specialist_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_active ON schedule_exceptions(is_active);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_specialist_date ON schedule_exceptions(specialist_id, exception_date);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_schedule_exceptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_schedule_exceptions_updated_at ON schedule_exceptions;
CREATE TRIGGER update_schedule_exceptions_updated_at
  BEFORE UPDATE ON schedule_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_exceptions_updated_at();

-- Comentarios
COMMENT ON TABLE schedule_exceptions IS 'Excepciones de horario para fechas específicas que sobrescriben el horario regular';
COMMENT ON COLUMN schedule_exceptions.exception_date IS 'Fecha específica para la cual aplica esta excepción';
COMMENT ON COLUMN schedule_exceptions.reason IS 'Motivo de la excepción (ej: "Cita médica", "Compromiso personal")';

-- Habilitar RLS (Row Level Security)
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Política: Las excepciones activas son visibles para todos (necesario para consultar horarios disponibles)
CREATE POLICY "Active schedule exceptions are viewable by everyone" 
ON schedule_exceptions FOR SELECT 
USING (is_active = true);

-- Política: Solo admins pueden modificar excepciones
CREATE POLICY "Schedule exceptions are editable by admins only" 
ON schedule_exceptions FOR ALL 
USING (auth.role() = 'service_role');

