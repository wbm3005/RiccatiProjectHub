// Pruebas aisladas de la mejora "restablecimiento asistido de contraseña" (sin PostgreSQL real).
const assert = require("node:assert/strict");
const test = require("node:test");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const { cargarConDobles, servidor, filas } = require("./helpers/http");

test("Contraseña temporal: bloqueo hasta cambiarla", async t => {
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  const temporal = "Temporal#2026";
  const usuario = {
    id_usuario: 7, nombre: "Ana", apellidos: "Prueba", correo: "ana@example.test",
    password_hash: await bcrypt.hash(temporal, 4), estado: "ACTIVO", rol: "Colaborador", rol_activo: true,
    debe_cambiar_password: true,
  };
  const pool = {
    async query(sql, params) {
      if (sql.includes("UPDATE usuarios SET password_hash")) { usuario.password_hash = params[0]; return filas([]); }
      if (sql.includes("UPDATE usuarios SET debe_cambiar_password = FALSE")) { usuario.debe_cambiar_password = false; return filas([]); }
      if (sql.includes("UPDATE usuarios")) return filas([]);
      if (sql.includes("SELECT")) return filas([{ ...usuario }]);
      throw new Error(`Consulta inesperada: ${sql}`);
    },
  };
  const auth = cargarConDobles(require.resolve("../middleware/auth.middleware"), pool);
  const rutas = cargarConDobles(require.resolve("../routes/auth.routes"), pool);
  const llamar = await servidor(t, app => {
    app.use("/api/auth", rutas);
    app.get("/api/proyectos", auth.autenticarToken, (req, res) => res.json({ ok: true }));
  });
  const login = clave => llamar("/api/auth/login", { method: "POST", body: { correo: usuario.correo, password: clave } });

  let r = await login(temporal);
  assert.equal(r.status, 200);
  assert.equal(r.body.usuario.debeCambiarPassword, true, "el login informa que la contraseña es temporal");
  const token = r.body.token;
  const conToken = { Authorization: `Bearer ${token}` };

  r = await llamar("/api/proyectos", { headers: conToken });
  assert.equal(r.status, 403, "con contraseña temporal no se accede a otros módulos");
  assert.equal(r.body.codigo, "CAMBIO_CONTRASENA_REQUERIDO");

  r = await llamar("/api/auth/cambiar-contrasena", { method: "PUT", headers: conToken,
    body: { passwordActual: temporal, passwordNueva: "MiClave#2026", confirmarPassword: "MiClave#2026" } });
  assert.equal(r.status, 200, r.body.mensaje);
  assert.equal(usuario.debe_cambiar_password, false, "el cambio resuelve la contraseña temporal");

  r = await llamar("/api/proyectos", { headers: conToken });
  assert.equal(r.status, 401, "la sesión con la contraseña temporal queda cerrada");
  r = await login("MiClave#2026");
  assert.equal(r.body.usuario.debeCambiarPassword, false);
  r = await llamar("/api/proyectos", { headers: { Authorization: `Bearer ${r.body.token}` } });
  assert.equal(r.status, 200, "con la contraseña propia se usa el sistema normalmente");
});
