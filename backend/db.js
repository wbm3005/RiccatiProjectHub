const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool
  .connect()
  .then((cliente) => {
    console.log("Conexión a PostgreSQL exitosa");
    cliente.release();
  })
  .catch((error) => {
    console.error(
      "Error al conectar con PostgreSQL:",
      error.message
    );
  });

module.exports = pool;