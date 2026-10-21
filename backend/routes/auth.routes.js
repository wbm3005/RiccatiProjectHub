const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db");
const { autenticarToken, versionCredencial } = require("../middleware/auth.middleware");

const router = express.Router();

// =====================================================
// POST /api/auth/login
// HU-M01-01 - INICIAR SESIÓN
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validar campos obligatorios
    if (!correo || !password) {
      return res.status(400).json({
        mensaje:
          "El correo y la contraseña son obligatorios.",
      });
    }

    // Buscar usuario y su rol
    const resultado = await pool.query(
      `
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellidos,
        u.correo,
        u.password_hash,
        u.estado,
        r.nombre AS rol,
        r.activo AS rol_activo
      FROM usuarios u
      INNER JOIN roles r
        ON u.id_rol = r.id_rol
      WHERE LOWER(u.correo) = LOWER($1)
      LIMIT 1
      `,
      [correo]
    );

    // Usuario no encontrado
    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje:
          "Correo o contraseña incorrectos.",
      });
    }

    const usuario = resultado.rows[0];

    // Revisar estado del usuario
    if (usuario.estado !== "ACTIVO" || !usuario.rol_activo) {
      return res.status(403).json({
        mensaje:
          "El usuario no tiene acceso al sistema.",
      });
    }

    // Comparar contraseña con bcrypt
    const passwordCorrecta =
      await bcrypt.compare(
        password,
        usuario.password_hash
      );

    if (!passwordCorrecta) {
      return res.status(401).json({
        mensaje:
          "Correo o contraseña incorrectos.",
      });
    }

    // Crear JWT
    const token = jwt.sign(
      {
        idUsuario: usuario.id_usuario,
        correo: usuario.correo,
        rol: usuario.rol,
        versionCredencial: versionCredencial(usuario.password_hash),
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn:
          process.env.JWT_EXPIRES_IN || "30m",
      }
    );

    // Registrar último acceso
    await pool.query(
      `
      UPDATE usuarios
      SET ultimo_acceso = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
      `,
      [usuario.id_usuario]
    );

    // Respuesta al frontend
    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        idUsuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error interno del servidor.",
    });
  }
});

// HU-M01-05: cambio de contraseña para cualquier rol autenticado.
router.put("/cambiar-contrasena", autenticarToken, async (req, res) => {
  try {
    const { passwordActual, passwordNueva, confirmarPassword } = req.body || {};

    if (
      typeof passwordActual !== "string" ||
      typeof passwordNueva !== "string" ||
      typeof confirmarPassword !== "string" ||
      !passwordActual || !passwordNueva || !confirmarPassword
    ) {
      return res.status(400).json({
        mensaje: "Completa la contraseña actual, nueva y confirmación.",
      });
    }

    if (passwordNueva !== confirmarPassword) {
      return res.status(400).json({
        mensaje: "La confirmación de la contraseña no coincide.",
      });
    }

    const politica = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!politica.test(passwordNueva)) {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.",
      });
    }

    const resultado = await pool.query(
      `SELECT password_hash FROM usuarios WHERE id_usuario = $1 AND estado = 'ACTIVO'`,
      [req.usuario.idUsuario]
    );
    if (!resultado.rows.length) {
      return res.status(401).json({ mensaje: "Cuenta sin acceso." });
    }

    const hashActual = resultado.rows[0].password_hash;
    if (!(await bcrypt.compare(passwordActual, hashActual))) {
      return res.status(400).json({
        mensaje: "La contraseña actual es incorrecta.",
      });
    }
    if (await bcrypt.compare(passwordNueva, hashActual)) {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe ser diferente de la actual.",
      });
    }

    const nuevoHash = await bcrypt.hash(passwordNueva, 10);
    await pool.query(
      `UPDATE usuarios SET password_hash = $1, actualizado_en = CURRENT_TIMESTAMP
        WHERE id_usuario = $2`,
      [nuevoHash, req.usuario.idUsuario]
    );

    return res.json({
      mensaje: "Contraseña actualizada. Inicia sesión nuevamente.",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    return res.status(500).json({
      mensaje: "No fue posible cambiar la contraseña.",
    });
  }
});

module.exports = router;