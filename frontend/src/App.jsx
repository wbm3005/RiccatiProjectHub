import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Proyectos from "./pages/Proyectos";

import RutaProtegida from "./components/RutaProtegida";

function App() {
  return (
    <Routes>

      {/* LOGIN */}

      <Route
        path="/"
        element={<Login />}
      />


      {/* DASHBOARD */}

      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />


      {/* USUARIOS - SOLO ADMIN */}

      <Route
        path="/usuarios"
        element={
          <RutaProtegida
            soloAdministrador={true}
          >
            <Usuarios />
          </RutaProtegida>
        }
      />


      {/* CLIENTES */}

      <Route
        path="/clientes"
        element={
          <RutaProtegida>
            <Clientes />
          </RutaProtegida>
        }
      />


      {/* PROYECTOS */}

      <Route
        path="/proyectos"
        element={
          <RutaProtegida>
            <Proyectos />
          </RutaProtegida>
        }
      />


      {/* CUALQUIER OTRA RUTA */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;