-- =====================================================
-- SPRINT 3 · M05 GESTIÓN DOCUMENTAL
-- HU-M05-01 Adjuntar documentos (archivo o vínculo)
-- HU-M05-02 Clasificar documentos por tipo
-- HU-M05-03 Consultar y abrir documentos
-- Migración incremental: no modifica ni elimina tablas existentes.
-- Ejecutar después de 01–07.
-- =====================================================

BEGIN;

-- Catálogo controlado de clasificación (HU-M05-02).
CREATE TABLE IF NOT EXISTS tipos_documento (
  id_tipo_documento SERIAL PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO tipos_documento (nombre, descripcion) VALUES
  ('Contrato', 'Contratos, adendas y acuerdos firmados con el cliente'),
  ('Plano', 'Planos arquitectónicos, estructurales y de detalle'),
  ('Presupuesto', 'Presupuestos, cotizaciones y propuestas económicas'),
  ('Permiso o trámite', 'Permisos de construcción, visados y trámites institucionales'),
  ('Informe técnico', 'Informes, estudios, memorias y especificaciones técnicas'),
  ('Fotografía', 'Registro fotográfico de visitas y avance de obra'),
  ('Correspondencia', 'Actas, minutas y comunicaciones con el cliente'),
  ('Otro', 'Documentos que no corresponden a las categorías anteriores')
ON CONFLICT (nombre) DO NOTHING;

-- Expediente documental del proyecto (HU-M05-01 / HU-M05-03).
-- Los archivos se guardan fuera de cualquier carpeta pública, con un
-- nombre generado por el servidor; aquí solo se registran sus metadatos.
CREATE TABLE IF NOT EXISTS documentos_proyecto (
  id_documento BIGSERIAL PRIMARY KEY,
  id_proyecto INTEGER NOT NULL REFERENCES proyectos(id_proyecto) ON DELETE RESTRICT,
  id_tipo_documento INTEGER NOT NULL REFERENCES tipos_documento(id_tipo_documento) ON DELETE RESTRICT,
  nombre VARCHAR(180) NOT NULL,
  descripcion TEXT,
  origen VARCHAR(10) NOT NULL,
  url_externa VARCHAR(2000),
  nombre_original VARCHAR(255),
  nombre_almacenado VARCHAR(80) UNIQUE,
  tipo_mime VARCHAR(120),
  tamano_bytes BIGINT,
  hash_sha256 CHAR(64),
  estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
  id_usuario_carga INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario_actualiza INTEGER REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  actualizado_en TIMESTAMPTZ,
  CONSTRAINT chk_documento_origen_valor CHECK (origen IN ('ARCHIVO', 'VINCULO')),
  CONSTRAINT chk_documento_estado CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  CONSTRAINT chk_documento_nombre CHECK (length(btrim(nombre)) >= 3),
  CONSTRAINT chk_documento_descripcion CHECK (descripcion IS NULL OR length(descripcion) <= 2000),
  CONSTRAINT chk_documento_origen CHECK (
    (origen = 'ARCHIVO'
      AND nombre_almacenado IS NOT NULL AND nombre_original IS NOT NULL
      AND tipo_mime IS NOT NULL AND tamano_bytes > 0 AND hash_sha256 IS NOT NULL
      AND url_externa IS NULL)
    OR
    (origen = 'VINCULO'
      AND url_externa ~* '^https?://'
      AND nombre_almacenado IS NULL AND nombre_original IS NULL
      AND tamano_bytes IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_documentos_proyecto_fecha
  ON documentos_proyecto (id_proyecto, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_tipo
  ON documentos_proyecto (id_tipo_documento);

COMMIT;
