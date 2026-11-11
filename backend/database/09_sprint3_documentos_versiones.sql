-- =====================================================
-- SPRINT 3 · M05 GESTIÓN DOCUMENTAL (continuación)
-- HU-M05-04 Cargar nueva versión de documento (RN-011)
-- HU-M05-06 Inactivar documento incorrecto (RN-012)
-- (HU-M05-05 Buscar y filtrar no requiere cambios de esquema.)
-- Migración incremental: ejecutar después de 08. No elimina datos.
-- =====================================================

BEGIN;

-- Versión vigente del documento. Los documentos existentes quedan en la versión 1.
ALTER TABLE documentos_proyecto
  ADD COLUMN IF NOT EXISTS version_actual INTEGER NOT NULL DEFAULT 1;

-- Trazabilidad de la inactivación: quién, cuándo y por qué (RN-012).
ALTER TABLE documentos_proyecto
  ADD COLUMN IF NOT EXISTS motivo_inactivacion TEXT;
ALTER TABLE documentos_proyecto
  ADD COLUMN IF NOT EXISTS id_usuario_inactiva INTEGER REFERENCES usuarios(id_usuario) ON DELETE RESTRICT;
ALTER TABLE documentos_proyecto
  ADD COLUMN IF NOT EXISTS inactivado_en TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_documento_version_actual') THEN
    ALTER TABLE documentos_proyecto
      ADD CONSTRAINT chk_documento_version_actual CHECK (version_actual >= 1);
  END IF;
  -- Un documento inactivo siempre conserva el motivo, el autor y la fecha.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_documento_inactivacion') THEN
    ALTER TABLE documentos_proyecto
      ADD CONSTRAINT chk_documento_inactivacion CHECK (
        estado = 'ACTIVO'
        OR (length(btrim(COALESCE(motivo_inactivacion, ''))) >= 10
            AND id_usuario_inactiva IS NOT NULL AND inactivado_en IS NOT NULL)
      );
  END IF;
END $$;

-- Historial completo de versiones de cada archivo (RN-011).
-- La versión vigente también se registra aquí; las anteriores nunca se borran.
CREATE TABLE IF NOT EXISTS documento_versiones (
  id_version BIGSERIAL PRIMARY KEY,
  id_documento BIGINT NOT NULL REFERENCES documentos_proyecto(id_documento) ON DELETE RESTRICT,
  numero INTEGER NOT NULL,
  nombre_original VARCHAR(255) NOT NULL,
  nombre_almacenado VARCHAR(80) NOT NULL UNIQUE,
  tipo_mime VARCHAR(120) NOT NULL,
  tamano_bytes BIGINT NOT NULL,
  hash_sha256 CHAR(64) NOT NULL,
  comentario TEXT,
  id_usuario_carga INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_documento_version UNIQUE (id_documento, numero),
  CONSTRAINT chk_version_numero CHECK (numero >= 1),
  CONSTRAINT chk_version_tamano CHECK (tamano_bytes > 0),
  CONSTRAINT chk_version_comentario CHECK (comentario IS NULL OR length(comentario) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_documento_versiones_documento
  ON documento_versiones (id_documento, numero DESC);

-- Los archivos cargados antes de esta migración pasan a ser su versión 1.
INSERT INTO documento_versiones
  (id_documento, numero, nombre_original, nombre_almacenado, tipo_mime,
   tamano_bytes, hash_sha256, id_usuario_carga, creado_en)
SELECT d.id_documento, 1, d.nombre_original, d.nombre_almacenado, d.tipo_mime,
       d.tamano_bytes, d.hash_sha256, d.id_usuario_carga, d.creado_en
  FROM documentos_proyecto d
 WHERE d.origen = 'ARCHIVO'
   AND NOT EXISTS (SELECT 1 FROM documento_versiones v WHERE v.id_documento = d.id_documento)
ON CONFLICT DO NOTHING;

-- Búsqueda por estado dentro del expediente (HU-M05-05 / HU-M05-06).
CREATE INDEX IF NOT EXISTS idx_documentos_proyecto_estado
  ON documentos_proyecto (id_proyecto, estado, creado_en DESC);

COMMIT;
