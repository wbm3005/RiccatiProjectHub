-- =====================================================
-- RICCATI PROJECT HUB
-- SPRINT 1
-- M01 - ROLES Y USUARIOS
-- =====================================================


-- =========================
-- TABLA ROLES
-- =========================

CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(150),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- TABLA USUARIOS
-- =========================

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,

    id_rol INTEGER NOT NULL,

    nombre VARCHAR(80) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,

    correo VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    ultimo_acceso TIMESTAMP,

    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol),

    CONSTRAINT chk_usuario_estado
        CHECK (
            estado IN (
                'ACTIVO',
                'INACTIVO',
                'BLOQUEADO'
            )
        )
);


-- =========================
-- ROLES INICIALES
-- =========================

INSERT INTO roles (
    nombre,
    descripcion
)
VALUES
(
    'Administrador',
    'Usuario con acceso administrativo al sistema'
),
(
    'Colaborador',
    'Usuario con acceso operativo al sistema'
)
ON CONFLICT (nombre) DO NOTHING;