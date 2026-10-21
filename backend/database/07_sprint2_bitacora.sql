-- RICCATI PROJECT HUB · SPRINT 2 · M04 SEGUIMIENTO Y BITÁCORA
-- Ejecutar UNA VEZ después de 01 a 06: psql -U postgres -d riccati_project_hub -f database/07_sprint2_bitacora.sql
-- No elimina ni modifica registros previos de Usuarios, Clientes o Proyectos.
BEGIN;

CREATE TABLE IF NOT EXISTS bitacora_entradas (
  id_entrada BIGSERIAL PRIMARY KEY,
  id_proyecto INTEGER NOT NULL REFERENCES proyectos(id_proyecto) ON DELETE RESTRICT,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  tipo VARCHAR(12) NOT NULL CHECK (tipo IN ('ACTIVIDAD', 'COMENTARIO')),
  titulo VARCHAR(180),
  contenido TEXT NOT NULL,
  horas NUMERIC(4,2),
  descripcion_esfuerzo TEXT,
  -- Copia inmutable del registro original: necesaria para una cronología fiel.
  titulo_inicial VARCHAR(180),
  contenido_inicial TEXT NOT NULL,
  horas_iniciales NUMERIC(4,2),
  descripcion_esfuerzo_inicial TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_bitacora_horas CHECK (horas IS NULL OR (horas > 0 AND horas <= 24)),
  CONSTRAINT chk_bitacora_horas_iniciales CHECK (horas_iniciales IS NULL OR (horas_iniciales > 0 AND horas_iniciales <= 24)),
  CONSTRAINT chk_bitacora_contenido CHECK (length(btrim(contenido)) >= 2),
  CONSTRAINT chk_bitacora_actividad CHECK (
    (tipo = 'COMENTARIO' AND horas IS NULL AND descripcion_esfuerzo IS NULL)
    OR
    (tipo = 'ACTIVIDAD' AND length(btrim(COALESCE(titulo,''))) >= 3
      AND (horas IS NOT NULL OR length(btrim(COALESCE(descripcion_esfuerzo,''))) >= 5))
  )
);

CREATE INDEX IF NOT EXISTS idx_bitacora_entrada_proyecto_fecha
  ON bitacora_entradas (id_proyecto, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_entrada_autor
  ON bitacora_entradas (id_usuario);

CREATE TABLE IF NOT EXISTS bitacora_correcciones (
  id_correccion BIGSERIAL PRIMARY KEY,
  id_entrada BIGINT NOT NULL REFERENCES bitacora_entradas(id_entrada) ON DELETE RESTRICT,
  id_usuario_corrector INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  anterior JSONB NOT NULL,
  nuevo JSONB NOT NULL,
  justificacion TEXT,
  corregido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_bitacora_correccion_distinta CHECK (anterior <> nuevo)
);

CREATE INDEX IF NOT EXISTS idx_bitacora_correcciones_entrada_fecha
  ON bitacora_correcciones (id_entrada, corregido_en DESC);
COMMIT;
