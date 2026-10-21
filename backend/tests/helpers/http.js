const assert = require("node:assert/strict");
const Module = require("node:module");
const express = require("express");

// Sustituye la conexión antes de cargar rutas: ningún test importa db.js ni .env.
function cargarConDobles(ruta, pool, auth) {
  const original = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === "../db") return pool;
    if (request === "../middleware/auth.middleware" && auth) return auth;
    return original.call(this, request, parent, isMain);
  };
  try {
    delete require.cache[ruta];
    return require(ruta);
  } finally {
    Module._load = original;
  }
}

async function servidor(t, configurar) {
  const app = express();
  app.use(express.json());
  configurar(app);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return async (ruta, { method = "GET", body, headers = {} } = {}) => {
    const respuesta = await fetch(`http://127.0.0.1:${server.address().port}${ruta}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const datos = await respuesta.json();
    assert.ok(datos && typeof datos === "object");
    return { status: respuesta.status, body: datos };
  };
}

const filas = rows => ({ rows, rowCount: rows.length });
const authSimulada = {
  autenticarToken(req, res, next) {
    req.usuario = { idUsuario: Number(req.headers["x-user"] || 1), rol: req.headers["x-role"] || "Administrador" };
    next();
  },
  soloAdministrador(req, res, next) {
    if (req.usuario.rol !== "Administrador") return res.status(403).json({ mensaje: "Sin permisos." });
    next();
  },
};

module.exports = { cargarConDobles, servidor, filas, authSimulada };
