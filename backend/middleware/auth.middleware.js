const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const pool = require("../db");

// Una huella HMAC permite invalidar todos los JWT antiguos
// cuando la contraseña cambia, sin guardar tokens en la BD.
const versionCredencial = (passwordHash) =>
  crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(passwordHash)
    .digest("hex");

const autenticarToken = async (req, res, next) => {
  const encabezado = req.headers.authorization || "";
  const partes = encabezado.split(" ");

  if (partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
    return res.status(401).json({
      mensaje: "No se proporcionó un token de acceso válido.",
    });
  }

  let datosToken;
  try {
    datosToken = jwt.verify(partes[1], process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!Number.isSafeInteger(datosToken.idUsuario) || datosToken.idUsuario < 1) {
      throw new Error("Identificador de sesión inválido.");
    }
  } catch {
    return res.status(401).json({
      mensaje: "La sesión no es válida o ha expirado.",
    });
  }

  try {
    const resultado = await pool.query(
      `SELECT u.id_usuario, u.correo, u.estado, u.password_hash,
              r.nombre AS rol, r.activo AS rol_activo
         FROM usuarios u
         JOIN roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1`,
      [datosToken.idUsuario]
    );
    const usuario = resultado.rows[0];

    if (!usuario || usuario.estado !== "ACTIVO" || !usuario.rol_activo) {
      return res.status(401).json({
        mensaje: "La cuenta ya no tiene acceso al sistema.",
      });
    }

    const versionActual = versionCredencial(usuario.password_hash);
    const versionEnToken = datosToken.versionCredencial;

    if (
      typeof versionEnToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(versionEnToken) ||
      !crypto.timingSafeEqual(
        Buffer.from(versionEnToken),
        Buffer.from(versionActual)
      )
    ) {
      return res.status(401).json({
        mensaje: "La sesión debe iniciarse de nuevo.",
      });
    }

    // Nunca confiar únicamente en el rol que venía firmado en el token:
    // se consulta el estado y rol actuales de PostgreSQL.
    req.usuario = {
      idUsuario: usuario.id_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
    };
    return next();
  } catch (error) {
    console.error("Error al validar acceso:", error);
    return res.status(500).json({
      mensaje: "No fue posible validar el acceso.",
    });
  }
};

const soloAdministrador = (req, res, next) => {
  if (req.usuario?.rol !== "Administrador") {
    return res.status(403).json({
      mensaje: "No tienes permisos para realizar esta acción.",
    });
  }
  next();
};

module.exports = { autenticarToken, soloAdministrador, versionCredencial };