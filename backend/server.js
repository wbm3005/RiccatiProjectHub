const express = require("express");
const cors = require("cors");

const clientesRoutes = require("./routes/clientes.routes");
const proyectosRoutes = require("./routes/proyectos.routes");
const actividadesRoutes = require("./routes/actividades.routes");
const documentosRoutes = require("./routes/documentos.routes");
const pagosRoutes = require("./routes/pagos.routes");
const usuariosRoutes = require("./routes/usuarios.routes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "Riccati Project Hub API funcionando correctamente"
  });
});

app.use("/api/clientes", clientesRoutes);
app.use("/api/proyectos", proyectosRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/documentos", documentosRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/usuarios", usuariosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});