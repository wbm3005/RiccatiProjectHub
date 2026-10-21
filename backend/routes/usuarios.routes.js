const express = require("express");
const bcrypt = require("bcrypt");

const pool = require("../db");

const {
  autenticarToken,
  soloAdministrador,
} = require("../middleware/auth.middleware");

const router = express.Router();

// El bloqueo de tabla serializa ambos cambios de cuenta y protege el conteo
// incluso frente a otras escrituras en usuarios. Se mantiene hasta COMMIT/ROLLBACK.
async function bloquearAdministracion(conexion, idActor) {
  await conexion.query("LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE");
  const actor = await conexion.query(
    `SELECT u.id_usuario FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
      WHERE u.id_usuario = $1 AND u.estado = 'ACTIVO'
        AND r.nombre = 'Administrador' AND r.activo = TRUE`,
    [idActor]
  );
  // Otro administrador pudo revocar el acceso mientras esta petición esperaba.
  return actor.rows.length > 0;
}



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
  let conexion;
  let enTransaccion = false;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    enTransaccion = true;
    if (!(await bloquearAdministracion(conexion, req.usuario.idUsuario))) {
      return res.status(403).json({ mensaje: "Tu cuenta ya no tiene permisos de administración." });
    }
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
      await conexion.query(
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

    // La propia cuenta de administrador no puede inactivarse
    // ni perder el rol desde esta ruta.
    if (
      Number(id) === Number(req.usuario.idUsuario) &&
      (estado !== "ACTIVO" || rol !== "Administrador")
    ) {
      return res.status(409).json({
        mensaje: "No puedes desactivar ni retirar el rol de tu propia cuenta administrativa.",
      });
    }

    const rolActual = await conexion.query(
      `SELECT r.nombre AS rol, u.estado
         FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = $1`, [id]
    );
    if (
      rolActual.rows[0]?.rol === "Administrador" &&
      rolActual.rows[0]?.estado === "ACTIVO" &&
      (estado !== "ACTIVO" || rol !== "Administrador")
    ) {
      const activos = await conexion.query(
        `SELECT COUNT(*)::int AS total FROM usuarios u
          JOIN roles r ON r.id_rol = u.id_rol
         WHERE r.nombre = 'Administrador' AND u.estado = 'ACTIVO'`
      );
      if (activos.rows[0].total <= 1) {
        return res.status(409).json({
          mensaje: "Debe existir al menos un administrador activo.",
        });
      }
    }

    // ===============================================
    // CORREO DUPLICADO
    // ===============================================

    const correoDuplicado =
      await conexion.query(
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
      await conexion.query(
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

      await conexion.query(
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
      await conexion.query(
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
      await conexion.query(
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

    await conexion.query("COMMIT");
    enTransaccion = false;
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
  } finally {
    if (enTransaccion) {
      try { await conexion.query("ROLLBACK"); }
      catch (error) { console.error("Error al revertir cambio de usuario:", error); }
    }
    if (conexion) conexion.release();
  }
});


// HU-M01-06: inactivar/reactivar sin borrar el historial.
router.patch("/:id/estado", async (req, res) => {
  let conexion;
  let enTransaccion = false;
  try {
    conexion = await pool.connect();
    await conexion.query("BEGIN");
    enTransaccion = true;
    if (!(await bloquearAdministracion(conexion, req.usuario.idUsuario))) {
      return res.status(403).json({ mensaje: "Tu cuenta ya no tiene permisos de administración." });
    }
    const id = Number(req.params.id);
    const { estado } = req.body || {};
    if (!Number.isSafeInteger(id) || id < 1 || !["ACTIVO", "INACTIVO"].includes(estado)) {
      return res.status(400).json({ mensaje: "Usuario o estado inválido." });
    }

    if (id === Number(req.usuario.idUsuario) && estado !== "ACTIVO") {
      return res.status(409).json({
        mensaje: "No puedes inactivar tu propia cuenta.",
      });
    }

    const usuario = await conexion.query(
      `SELECT u.id_usuario, u.estado, r.nombre AS rol
         FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1`,
      [id]
    );
    if (usuario.rows.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (usuario.rows[0].estado === estado) {
      return res.status(409).json({ mensaje: "El usuario ya tiene ese estado." });
    }

    if (usuario.rows[0].rol === "Administrador" && estado === "INACTIVO") {
      const activos = await conexion.query(
        `SELECT COUNT(*)::int AS total FROM usuarios u
          JOIN roles r ON r.id_rol = u.id_rol
         WHERE r.nombre = 'Administrador' AND u.estado = 'ACTIVO'`
      );
      if (activos.rows[0].total <= 1) {
        return res.status(409).json({
          mensaje: "Debe existir al menos un administrador activo.",
        });
      }
    }

    const actualizado = await conexion.query(
      `UPDATE usuarios SET estado = $1, actualizado_en = CURRENT_TIMESTAMP
        WHERE id_usuario = $2
        RETURNING id_usuario, nombre, apellidos, correo, estado`,
      [estado, id]
    );
    await conexion.query("COMMIT");
    enTransaccion = false;
    return res.json({
      mensaje: estado === "ACTIVO" ? "Usuario reactivado correctamente." : "Usuario inactivado correctamente.",
      usuario: actualizado.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado del usuario:", error);
    return res.status(500).json({ mensaje: "No fue posible actualizar el estado del usuario." });
  } finally {
    if (enTransaccion) {
      try { await conexion.query("ROLLBACK"); }
      catch (error) { console.error("Error al revertir cambio de usuario:", error); }
    }
    if (conexion) conexion.release();
  }
});

module.exports = router;