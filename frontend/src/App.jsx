import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Proyectos from "./pages/Proyectos";
import Bitacora from "./pages/Bitacora";
import Documentos from "./pages/Documentos";
import Finanzas from "./pages/Finanzas";
import Usuarios from "./pages/Usuarios";
import Indicadores from "./pages/Indicadores";

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/clientes"
        element={<Clientes />}
      />

      <Route
        path="/proyectos"
        element={<Proyectos />}
      />

      <Route
        path="/bitacora"
        element={<Bitacora />}
      />

      <Route
        path="/documentos"
        element={<Documentos />}
      />

      <Route
        path="/finanzas"
        element={<Finanzas />}
      />

      <Route
        path="/usuarios"
        element={<Usuarios />}
      />

      <Route
        path="/indicadores"
        element={<Indicadores />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;