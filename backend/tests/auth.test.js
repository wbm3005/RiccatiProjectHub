const assert = require("node:assert/strict");
const test = require("node:test");
const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { cargarConDobles, servidor, filas } = require("./helpers/http");

test("Login, JWT y cambio de contraseña sin base de datos real", async t => {
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  process.env.JWT_EXPIRES_IN = "30m";
  const password = "Inicial123!";
  const usuario = {
    id_usuario: 1, nombre: "Cuenta", apellidos: "Prueba", correo: "prueba@example.test",
    password_hash: await bcrypt.hash(password, 4), estado: "ACTIVO", rol: "Administrador", rol_activo: true,
  };
  const pool = {
    async query(sql, params) {
      if (sql.includes("UPDATE usuarios SET password_hash")) {
        usuario.password_hash = params[0];
        return filas([]);
      }
      if (sql.includes("UPDATE usuarios")) return filas([]);
      if (sql.includes("SELECT")) return filas([{ ...usuario }]);
      throw new Error(`Consulta inesperada: ${sql}`);
    },
  };
  const auth = cargarConDobles(require.resolve("../middleware/auth.middleware"), pool);
  const rutas = cargarConDobles(require.resolve("../routes/auth.routes"), pool);
  const llamar = await servidor(t, app => {
    app.use("/auth", rutas);
    app.get("/sesion", auth.autenticarToken, (req, res) => res.json(req.usuario));
    app.get("/admin", auth.autenticarToken, auth.soloAdministrador, (req, res) => res.json({ ok: true }));
  });
  const login = clave => llamar("/auth/login", { method: "POST", body: { correo: usuario.correo, password: clave } });
  const sesion = token => llamar("/sesion", { headers: { Authorization: `Bearer ${token}` } });
  let token;

  await t.test("el login emite un JWT compatible y no expone hashes", async () => {
    const r = await login(password);
    assert.equal(r.status, 200);
    token = r.body.token;
    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    assert.equal(claims.versionCredencial, auth.versionCredencial(usuario.password_hash));
    assert.equal(claims.exp - claims.iat, 1800);
    assert.equal(r.body.usuario.idUsuario, 1);
    assert.equal(r.body.usuario.password_hash, undefined);
    assert.equal((await sesion(token)).status, 200);
    assert.equal((await login("incorrecta")).status, 401);
  });
  await t.test("rechaza JWT de Sprint 1, expirados, manipulados o con claims inválidos", async () => {
    const firmar = claims => jwt.sign({ idUsuario: 1, ...claims }, process.env.JWT_SECRET);
    const version = auth.versionCredencial(usuario.password_hash);
    for (const invalido of [
      firmar({}), firmar({ versionCredencial: version, exp: 1 }),
      firmar({ versionCredencial: "é".repeat(64) }),
      firmar({ idUsuario: "1", versionCredencial: version }),
      jwt.sign({ idUsuario: 1, versionCredencial: version }, "firma-incorrecta"),
      jwt.sign({ idUsuario: 1, versionCredencial: version }, process.env.JWT_SECRET, { algorithm: "HS384" }),
    ]) assert.equal((await sesion(invalido)).status, 401);
    assert.equal((await llamar("/sesion")).status, 401);
  });
  await t.test("el estado y rol actuales prevalecen sobre los claims", async () => {
    usuario.rol = "Colaborador";
    assert.equal((await sesion(token)).body.rol, "Colaborador");
    assert.equal((await llamar("/admin", { headers: { Authorization: `Bearer ${token}` } })).status, 403);
    usuario.estado = "INACTIVO";
    assert.equal((await sesion(token)).status, 401);
    assert.equal((await login(password)).status, 403);
    usuario.estado = "ACTIVO";
    usuario.rol_activo = false;
    assert.equal((await sesion(token)).status, 401);
    assert.equal((await login(password)).status, 403);
    usuario.rol_activo = true;
    usuario.rol = "Administrador";
  });
  await t.test("valida contraseña y confirmación sin modificar credenciales", async () => {
    const hash = usuario.password_hash;
    for (const datos of [
      { passwordActual: password, passwordNueva: "Nueva123!", confirmarPassword: "Otra123!" },
      { passwordActual: password, passwordNueva: "debil", confirmarPassword: "debil" },
      { passwordActual: "incorrecta", passwordNueva: "Nueva123!", confirmarPassword: "Nueva123!" },
      { passwordActual: password, passwordNueva: password, confirmarPassword: password },
    ]) {
      const r = await llamar("/auth/cambiar-contrasena", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: datos });
      assert.equal(r.status, 400);
      assert.equal(usuario.password_hash, hash);
    }
  });
  await t.test("cambiar contraseña invalida el JWT anterior y permite un nuevo login", async () => {
    const nueva = "Nueva123!";
    const r = await llamar("/auth/cambiar-contrasena", {
      method: "PUT", headers: { Authorization: `Bearer ${token}` },
      body: { passwordActual: password, passwordNueva: nueva, confirmarPassword: nueva },
    });
    assert.equal(r.status, 200);
    assert.equal((await sesion(token)).status, 401);
    assert.equal((await login(password)).status, 401);
    const renovada = await login(nueva);
    assert.equal(renovada.status, 200);
    assert.equal((await sesion(renovada.body.token)).status, 200);
  });
});
