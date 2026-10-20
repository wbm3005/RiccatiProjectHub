-- =====================================================
-- RICCATI PROJECT HUB
-- SPRINT 1
-- M03 - PROYECTOS
-- =====================================================


-- =====================================================
-- TABLA PRIORIDADES
-- =====================================================

CREATE TABLE IF NOT EXISTS prioridades_proyecto (
    id_prioridad SERIAL PRIMARY KEY,

    nombre VARCHAR(20) NOT NULL UNIQUE,

    descripcion VARCHAR(150),

    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =====================================================
-- TABLA ESTADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS estados_proyecto (
    id_estado SERIAL PRIMARY KEY,

    nombre VARCHAR(30) NOT NULL UNIQUE,

    descripcion VARCHAR(150),

    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =====================================================
-- TABLA PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS proyectos (
    id_proyecto SERIAL PRIMARY KEY,

    codigo VARCHAR(20) NOT NULL UNIQUE,

    nombre VARCHAR(180) NOT NULL,

    id_cliente INTEGER NOT NULL,

    id_contacto_principal INTEGER,

    id_prioridad INTEGER NOT NULL,

    id_estado INTEGER NOT NULL,

    descripcion TEXT,

    fecha_inicio DATE,

    fecha_compromiso DATE,

    fecha_finalizacion DATE,

    creado_por INTEGER NOT NULL,

    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_proyecto_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),


    CONSTRAINT fk_proyecto_contacto
        FOREIGN KEY (id_contacto_principal)
        REFERENCES contactos_cliente(id_contacto),


    CONSTRAINT fk_proyecto_prioridad
        FOREIGN KEY (id_prioridad)
        REFERENCES prioridades_proyecto(id_prioridad),


    CONSTRAINT fk_proyecto_estado
        FOREIGN KEY (id_estado)
        REFERENCES estados_proyecto(id_estado),


    CONSTRAINT fk_proyecto_creado_por
        FOREIGN KEY (creado_por)
        REFERENCES usuarios(id_usuario),


    CONSTRAINT chk_fechas_proyecto
        CHECK (
            fecha_inicio IS NULL
            OR fecha_compromiso IS NULL
            OR fecha_compromiso >= fecha_inicio
        )
);


-- =====================================================
-- USUARIOS ASIGNADOS A PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS proyecto_usuarios (
    id_proyecto INTEGER NOT NULL,

    id_usuario INTEGER NOT NULL,

    es_responsable_principal BOOLEAN NOT NULL DEFAULT FALSE,

    fecha_asignacion DATE NOT NULL DEFAULT CURRENT_DATE,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    PRIMARY KEY (
        id_proyecto,
        id_usuario
    ),


    CONSTRAINT fk_proyecto_usuario_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyectos(id_proyecto),


    CONSTRAINT fk_proyecto_usuario_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
);


-- =====================================================
-- PRIORIDADES INICIALES
-- =====================================================

INSERT INTO prioridades_proyecto (
    nombre,
    descripcion
)
VALUES
(
    'Alta',
    'Proyecto de alta prioridad'
),
(
    'Media',
    'Proyecto de prioridad media'
),
(
    'Baja',
    'Proyecto de baja prioridad'
)
ON CONFLICT (nombre) DO NOTHING;


-- =====================================================
-- ESTADOS INICIALES
-- =====================================================

INSERT INTO estados_proyecto (
    nombre,
    descripcion
)
VALUES
(
    'Registrado',
    'Proyecto creado y registrado en el sistema'
),
(
    'En curso',
    'Proyecto actualmente en desarrollo'
),
(
    'Suspendido',
    'Proyecto suspendido temporalmente'
),
(
    'Finalizado',
    'Proyecto completado'
),
(
    'Archivado',
    'Proyecto archivado'
)
ON CONFLICT (nombre) DO NOTHING;