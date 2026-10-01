const express = require("express");
const bcrypt = require("bcrypt");

const pool = require("../db");

const {
  autenticarToken,
  soloAdministrador,
} = require("../middleware/auth.middleware");

const router = express.Router();


// =====================================================
// TODAS LAS RUTAS DE USUARIOS REQUIEREN:
// 1. LOGIN
// 2. ROL ADMINISTRADOR
// =====================================================

router.use(
  autenticarToken,
  soloAdministrador
);


// =====================================================
// GET /api/usuarios/roles
// OBTENER ROLES
// =====================================================

router.get("/roles", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id_rol,
        nombre,
        descripcion,
        activo
      FROM roles
      WHERE activo = TRUE
      ORDER BY id_rol
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(
      "Error al obtener roles:",
      error
    );

    res.status(500).json({
      mensaje:
        "No fue posible obtener los roles.",
    });
  }
});


// =====================================================
// GET /api/usuarios
// LISTAR USUARIOS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellidos,
        u.correo,
        u.estado,
        u.ultimo_acceso,
        u.creado_en,
        r.id_rol,
        r.nombre AS rol
      FROM usuarios u

      INNER JOIN roles r
        ON u.id_rol = r.id_rol

      ORDER BY u.id_usuario
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(
      "Error al obtener usuarios:",
      error
    );

    res.status(500).json({
      mensaje:
        "No fue posible obtener los usuarios.",
    });
  }
});


// =====================================================
// POST /api/usuarios
// CREAR USUARIO
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      apellidos,
      correo,
      password,
      rol,
      estado = "ACTIVO",
    } = req.body;

    // ===============================================
    // CAMPOS OBLIGATORIOS
    // ===============================================

    if (
      !nombre ||
      !apellidos ||
      !correo ||
      !password ||
      !rol
    ) {
      return res.status(400).json({
        mensaje:
          "Todos los campos obligatorios deben completarse.",
      });
    }

    // ===============================================
    // POLÍTICA DE CONTRASEÑA
    // ===============================================

    const passwordValida =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordValida.test(password)) {
      return res.status(400).json({
        mensaje:
          "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.",
      });
    }

    // ===============================================
    // VALIDAR ESTADO
    // ===============================================

    const estadosPermitidos = [
      "ACTIVO",
      "INACTIVO",
      "BLOQUEADO",
    ];

    if (
      !estadosPermitidos.includes(estado)
    ) {
      return res.status(400).json({
        mensaje: "Estado de usuario inválido.",
      });
    }

    // ===============================================
    // VALIDAR CORREO DUPLICADO
    // ===============================================

    const correoExistente =
      await pool.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE LOWER(correo) = LOWER($1)
        `,
        [correo]
      );

    if (
      correoExistente.rows.length > 0
    ) {
      return res.status(409).json({
        mensaje:
          "Ya existe un usuario con ese correo.",
      });
    }

    // ===============================================
    // BUSCAR ROL
    // ===============================================

    const resultadoRol =
      await pool.query(
        `
        SELECT id_rol
        FROM roles
        WHERE nombre = $1
        AND activo = TRUE
        `,
        [rol]
      );

    if (resultadoRol.rows.length === 0) {
      return res.status(400).json({
        mensaje: "El rol seleccionado no existe.",
      });
    }

    const idRol =
      resultadoRol.rows[0].id_rol;

    // ===============================================
    // HASH CONTRASEÑA
    // ===============================================

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );

    // ===============================================
    // INSERTAR
    // ===============================================

    const resultado =
      await pool.query(
        `
        INSERT INTO usuarios (
          id_rol,
          nombre,
          apellidos,
          correo,
          password_hash,
          estado
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )

        RETURNING
          id_usuario,
          nombre,
          apellidos,
          correo,
          estado,
          creado_en
        `,
        [
          idRol,
          nombre.trim(),
          apellidos.trim(),
          correo.trim().toLowerCase(),
          passwordHash,
          estado,
        ]
      );

    return res.status(201).json({
      mensaje:
        "Usuario registrado correctamente.",

      usuario: {
        ...resultado.rows[0],
        rol,
      },
    });
  } catch (error) {
    console.error(
      "Error al registrar usuario:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error interno al registrar el usuario.",
    });
  }
});


// =====================================================
// PUT /api/usuarios/:id
// ACTUALIZAR USUARIO
// =====================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      apellidos,
      correo,
      password,
      rol,
      estado,
    } = req.body;

    // ===============================================
    // VALIDAR USUARIO
    // ===============================================

    const usuarioActual =
      await pool.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE id_usuario = $1
        `,
        [id]
      );

    if (
      usuarioActual.rows.length === 0
    ) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    // ===============================================
    // CAMPOS OBLIGATORIOS
    // ===============================================

    if (
      !nombre ||
      !apellidos ||
      !correo ||
      !rol ||
      !estado
    ) {
      return res.status(400).json({
        mensaje:
          "Los datos del usuario están incompletos.",
      });
    }

    // ===============================================
    // VALIDAR ESTADO
    // ===============================================

    const estadosPermitidos = [
      "ACTIVO",
      "INACTIVO",
      "BLOQUEADO",
    ];

    if (
      !estadosPermitidos.includes(estado)
    ) {
      return res.status(400).json({
        mensaje: "Estado de usuario inválido.",
      });
    }

    // ===============================================
    // CORREO DUPLICADO
    // ===============================================

    const correoDuplicado =
      await pool.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE LOWER(correo) = LOWER($1)
        AND id_usuario <> $2
        `,
        [correo, id]
      );

    if (
      correoDuplicado.rows.length > 0
    ) {
      return res.status(409).json({
        mensaje:
          "Ya existe otro usuario con ese correo.",
      });
    }

    // ===============================================
    // OBTENER ROL
    // ===============================================

    const resultadoRol =
      await pool.query(
        `
        SELECT id_rol
        FROM roles
        WHERE nombre = $1
        AND activo = TRUE
        `,
        [rol]
      );

    if (
      resultadoRol.rows.length === 0
    ) {
      return res.status(400).json({
        mensaje: "El rol seleccionado no existe.",
      });
    }

    const idRol =
      resultadoRol.rows[0].id_rol;

    // ===============================================
    // SI CAMBIA CONTRASEÑA
    // ===============================================

    if (password) {
      const passwordValida =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

      if (!passwordValida.test(password)) {
        return res.status(400).json({
          mensaje:
            "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      await pool.query(
        `
        UPDATE usuarios

        SET
          id_rol = $1,
          nombre = $2,
          apellidos = $3,
          correo = $4,
          password_hash = $5,
          estado = $6,
          actualizado_en =
            CURRENT_TIMESTAMP

        WHERE id_usuario = $7
        `,
        [
          idRol,
          nombre.trim(),
          apellidos.trim(),
          correo.trim().toLowerCase(),
          passwordHash,
          estado,
          id,
        ]
      );
    } else {
      await pool.query(
        `
        UPDATE usuarios

        SET
          id_rol = $1,
          nombre = $2,
          apellidos = $3,
          correo = $4,
          estado = $5,
          actualizado_en =
            CURRENT_TIMESTAMP

        WHERE id_usuario = $6
        `,
        [
          idRol,
          nombre.trim(),
          apellidos.trim(),
          correo.trim().toLowerCase(),
          estado,
          id,
        ]
      );
    }

    // ===============================================
    // DEVOLVER USUARIO ACTUALIZADO
    // ===============================================

    const actualizado =
      await pool.query(
        `
        SELECT
          u.id_usuario,
          u.nombre,
          u.apellidos,
          u.correo,
          u.estado,
          r.nombre AS rol

        FROM usuarios u

        INNER JOIN roles r
          ON u.id_rol = r.id_rol

        WHERE u.id_usuario = $1
        `,
        [id]
      );

    return res.json({
      mensaje:
        "Usuario actualizado correctamente.",

      usuario:
        actualizado.rows[0],
    });
  } catch (error) {
    console.error(
      "Error al actualizar usuario:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error interno al actualizar el usuario.",
    });
  }
});


module.exports = router;