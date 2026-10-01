const bcrypt = require("bcrypt");
const pool = require("../db");

async function crearAdministrador() {
  try {
    const correo = "admin@riccati.cr";
    const password = "Admin123!";

    // Buscar el rol Administrador
    const rolResultado = await pool.query(
      `
      SELECT id_rol
      FROM roles
      WHERE nombre = $1
      `,
      ["Administrador"]
    );

    if (rolResultado.rows.length === 0) {
      console.log("No existe el rol Administrador.");
      return;
    }

    const idRol = rolResultado.rows[0].id_rol;

    // Revisar si ya existe el usuario
    const usuarioExistente = await pool.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE correo = $1
      `,
      [correo]
    );

    if (usuarioExistente.rows.length > 0) {
      console.log("El administrador ya existe.");
      return;
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    // Crear administrador
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
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        idRol,
        "Administrador",
        "Riccati",
        correo,
        passwordHash,
        "ACTIVO",
      ]
    );

    console.log(
      "Administrador creado correctamente"
    );

    console.log(
      "Correo: admin@riccati.cr"
    );

    console.log(
      "Contraseña: Admin123!"
    );
  } catch (error) {
    console.error(
      "Error al crear administrador:",
      error.message
    );
  } finally {
    await pool.end();
  }
}

crearAdministrador();