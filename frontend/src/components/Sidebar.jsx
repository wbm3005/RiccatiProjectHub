
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  Building2,
  FolderKanban,
  LogOut,
  UserRound,
} from "lucide-react";

function Sidebar({ paginaActiva }) {
  const navigate = useNavigate();

  let usuario = null;

  try {
    usuario = JSON.parse(
      localStorage.getItem("usuarioRiccati")
    );
  } catch {
    usuario = null;
  }

  const esAdministrador =
    usuario?.rol === "Administrador";

  const cerrarSesion = () => {
    localStorage.removeItem("tokenRiccati");
    localStorage.removeItem("usuarioRiccati");
    navigate("/");
  };

  const claseMenu = (pagina) =>
    paginaActiva === pagina
      ? "riccati-menu-item active"
      : "riccati-menu-item";

  return (
    <aside className="riccati-sidebar">
      <div>
        <div className="riccati-brand">
          <div className="riccati-brand-logo">R</div>

          <div>
            <h2>Riccati</h2>
            <span>PROJECT HUB</span>
          </div>
        </div>

        <nav aria-label="Menú principal">
          <div className="riccati-sidebar-section">
            <span className="riccati-sidebar-title">
              PRINCIPAL
            </span>

            <NavLink
              to="/dashboard"
              className={claseMenu("dashboard")}
            >
              <span className="riccati-menu-icon">
                <LayoutDashboard
                  size={19}
                  strokeWidth={2.2}
                />
              </span>
              Dashboard
            </NavLink>
          </div>

          <div className="riccati-sidebar-section">
            <span className="riccati-sidebar-title">
              GESTIÓN
            </span>

            {esAdministrador && (
              <NavLink
                to="/usuarios"
                className={claseMenu("usuarios")}
              >
                <span className="riccati-menu-icon">
                  <UsersRound
                    size={19}
                    strokeWidth={2.2}
                  />
                </span>
                Usuarios
              </NavLink>
            )}

            <NavLink
              to="/clientes"
              className={claseMenu("clientes")}
            >
              <span className="riccati-menu-icon">
                <Building2
                  size={19}
                  strokeWidth={2.2}
                />
              </span>
              Clientes
            </NavLink>

            <NavLink
              to="/proyectos"
              className={claseMenu("proyectos")}
            >
              <span className="riccati-menu-icon">
                <FolderKanban
                  size={19}
                  strokeWidth={2.2}
                />
              </span>
              Proyectos
            </NavLink>
          </div>
          <div className="riccati-sidebar-section">
            <span className="riccati-sidebar-title">CUENTA</span>
            <NavLink to="/perfil" className={claseMenu("perfil")}>
              <span className="riccati-menu-icon"><UserRound size={19} strokeWidth={2.2} /></span>
              Mi cuenta
            </NavLink>
          </div>
        </nav>
      </div>

      <div className="riccati-sidebar-user">
        <div className="riccati-user-avatar">
          {usuario?.nombre?.charAt(0) || "U"}
        </div>

        <div className="riccati-user-data">
          <strong>
            {usuario?.nombre || "Usuario"}{" "}
            {usuario?.apellidos || ""}
          </strong>

          <span>
            {usuario?.rol || "Sin rol"}
          </span>
        </div>

        <button
          type="button"
          className="riccati-button-danger riccati-logout-button"
          onClick={cerrarSesion}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={19} strokeWidth={2.2} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;