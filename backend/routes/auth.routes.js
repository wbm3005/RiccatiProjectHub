const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db");

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
        r.nombre AS rol
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
    if (usuario.estado !== "ACTIVO") {
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
      },
      process.env.JWT_SECRET,
      {
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

module.exports = router;