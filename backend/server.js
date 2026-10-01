const express = require("express");
const cors = require("cors");

require("dotenv").config();

require("./db");

const authRoutes = require(
  "./routes/auth.routes"
);

const usuariosRoutes = require(
  "./routes/usuarios.routes"
);

const clientesRoutes = require(
  "./routes/clientes.routes"
);

const proyectosRoutes = require(
  "./routes/proyectos.routes"
);


const app = express();

const PORT =
  process.env.PORT || 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());


// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {
  res.json({
    mensaje:
      "Riccati Project Hub API funcionando correctamente",
  });
});


// =====================================================
// RUTAS API
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/usuarios",
  usuariosRoutes
);

app.use(
  "/api/clientes",
  clientesRoutes
);

app.use(
  "/api/proyectos",
  proyectosRoutes
);


// =====================================================
// SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(
    `Servidor ejecutándose en http://localhost:${PORT}`
  );
});