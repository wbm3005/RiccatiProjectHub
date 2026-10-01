import { useNavigate } from "react-router-dom";

function Sidebar({ paginaActiva }) {
  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  const cerrarSesion = () => {
    localStorage.removeItem("tokenRiccati");
    localStorage.removeItem("usuarioRiccati");

    navigate("/");
  };

  const claseMenu = (pagina) => {
    return paginaActiva === pagina
      ? "riccati-menu-item active"
      : "riccati-menu-item";
  };

  return (
    <aside className="riccati-sidebar">

      <div>

        {/* LOGO */}

        <div className="riccati-brand">

          <div className="riccati-brand-logo">
            R
          </div>

          <div>
            <h2>Riccati</h2>
            <span>PROJECT HUB</span>
          </div>

        </div>

        {/* MENÚ */}

        <div className="riccati-sidebar-section">

          <span className="riccati-sidebar-title">
            MENÚ PRINCIPAL
          </span>

          <button
            className={claseMenu("dashboard")}
            onClick={() => navigate("/dashboard")}
          >
            <span className="riccati-menu-icon">
              ◈
            </span>

            Dashboard
          </button>

          {/* SOLO ADMINISTRADOR */}

          {usuario?.rol === "Administrador" && (
            <button
              className={claseMenu("usuarios")}
              onClick={() => navigate("/usuarios")}
            >
              <span className="riccati-menu-icon">
                ◇
              </span>

              Usuarios
            </button>
          )}

          <button
            className={claseMenu("clientes")}
            onClick={() => navigate("/clientes")}
          >
            <span className="riccati-menu-icon">
              ◎
            </span>

            Clientes
          </button>

          <button
            className={claseMenu("proyectos")}
            onClick={() => navigate("/proyectos")}
          >
            <span className="riccati-menu-icon">
              ◉
            </span>

            Proyectos
          </button>

        </div>

      </div>

      {/* USUARIO */}

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
          className="riccati-button-danger riccati-tooltip"
          data-tooltip="Cerrar sesión"
          onClick={cerrarSesion}
          style={{
            width: "32px",
            minHeight: "32px",
            padding: 0,
            flexShrink: 0,
          }}
        >
          ↪
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;