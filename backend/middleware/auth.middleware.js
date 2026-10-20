const jwt = require("jsonwebtoken");

// =====================================================
// VALIDAR TOKEN JWT
// =====================================================

const autenticarToken = (req, res, next) => {
  const encabezado = req.headers.authorization;

  if (!encabezado) {
    return res.status(401).json({
      mensaje: "No se proporcionó un token de acceso.",
    });
  }

  const partes = encabezado.split(" ");

  if (
    partes.length !== 2 ||
    partes[0] !== "Bearer"
  ) {
    return res.status(401).json({
      mensaje: "Formato de token inválido.",
    });
  }

  const token = partes[1];

  try {
    const usuario = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = usuario;

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje:
        "La sesión no es válida o ha expirado.",
    });
  }
};

// =====================================================
// SOLO ADMINISTRADOR
// =====================================================

const soloAdministrador = (
  req,
  res,
  next
) => {
  if (
    !req.usuario ||
    req.usuario.rol !== "Administrador"
  ) {
    return res.status(403).json({
      mensaje:
        "No tienes permisos para realizar esta acción.",
    });
  }

  next();
};

module.exports = {
  autenticarToken,
  soloAdministrador,
};