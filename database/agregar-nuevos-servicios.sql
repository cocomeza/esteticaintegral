-- =====================================================
-- AGREGAR NUEVOS SERVICIOS: MASAJES Y VENTOSAS
-- =====================================================

-- Insertar Masajes Descontracturantes/Relajantes
INSERT INTO aesthetic_services (name, description, duration, category, is_active)
VALUES (
  'Masajes Descontracturantes / Relajantes',
  'Técnica de masaje terapéutico que alivia tensiones musculares, contracturas y dolores. Combina técnicas de amasamiento profundo con movimientos relajantes para restaurar el equilibrio muscular y proporcionar bienestar general.',
  45,
  'terapeutico',
  true
)
ON CONFLICT DO NOTHING;

-- Insertar Ventosas
INSERT INTO aesthetic_services (name, description, duration, category, is_active)
VALUES (
  'Ventosas',
  'Técnica terapéutica milenaria que utiliza copas de succión para mejorar la circulación, aliviar dolores musculares y reducir inflamación. Efectiva para contracturas, dolores de espalda y problemas circulatorios.',
  45,
  'terapeutico',
  true
)
ON CONFLICT DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 
  id,
  name,
  duration,
  category,
  is_active,
  created_at
FROM aesthetic_services
WHERE name IN (
  'Masajes Descontracturantes / Relajantes',
  'Ventosas'
)
ORDER BY created_at DESC;

-- Mostrar todos los servicios activos
SELECT 
  id,
  name,
  duration,
  category,
  is_active
FROM aesthetic_services
WHERE is_active = true
ORDER BY category, name;

