
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Layers3, ShieldCheck } from "lucide-react";
import Sidebar from "./Sidebar";

function RiccatiLayout({ children, paginaActiva }) {
  const [rutaMenuAbierto, setRutaMenuAbierto] = useState(null);
  const location = useLocation();
  const menuAbierto = rutaMenuAbierto === location.key;
  const setMenuAbierto = abierto => setRutaMenuAbierto(abierto ? location.key : null);

  let usuario = null;

  try {
    usuario = JSON.parse(
      localStorage.getItem("usuarioRiccati")
    );
  } catch {
    usuario = null;
  }

  const titulos = {
    dashboard: "Dashboard",
    usuarios: "Usuarios",
    clientes: "Clientes",
    proyectos: "Proyectos",
    perfil: "Mi cuenta",
  };

  const tituloActual =
    titulos[paginaActiva] || "Espacio de trabajo";

  useEffect(() => {
    if (!menuAbierto) return;

    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") {
        setRutaMenuAbierto(null);
      }
    };

    window.addEventListener("keydown", cerrarConEscape);

    return () => {
      window.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, [menuAbierto]);

  return (
    <div className="riccati-app riccati-shell-v2">

      <div
        className={
          menuAbierto
            ? "riccati-shell-navigation is-open"
            : "riccati-shell-navigation"
        }
      >
        <Sidebar paginaActiva={paginaActiva} />
      </div>

      {menuAbierto && (
        <button
          type="button"
          className="riccati-shell-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <div className="riccati-workspace">

        <header className="riccati-workspace-bar">

          <div className="riccati-workspace-left">

            <button
              type="button"
              className="riccati-mobile-menu"
              onClick={() =>
                setMenuAbierto(!menuAbierto)
              }
              aria-label="Abrir menú de navegación"
              aria-expanded={menuAbierto}
            >
              <Menu size={22} />
            </button>

            <div className="riccati-workspace-symbol">
              <Layers3 size={20} />
            </div>

            <div className="riccati-workspace-context">
              <span>RICCATI PROJECT HUB</span>

              <div className="riccati-workspace-breadcrumb">
                Espacio de trabajo
                <span>/</span>
                <strong>{tituloActual}</strong>
              </div>
            </div>

          </div>

          <div className="riccati-workspace-right">

            <div className="riccati-workspace-session">
              <span className="riccati-workspace-session-dot" />
              Sesión iniciada
            </div>

            <div className="riccati-workspace-account">

              <div className="riccati-workspace-account-text">
                <strong>
                  {usuario?.nombre || "Usuario"}
                </strong>

                <span>
                  {usuario?.rol || "Sin rol"}
                </span>
              </div>

              <div className="riccati-workspace-avatar">
                {usuario?.nombre?.charAt(0) || "U"}
              </div>

            </div>

            <div
              className="riccati-workspace-security"
              title="Acceso mediante sesión autenticada"
            >
              <ShieldCheck size={19} />
            </div>

          </div>

        </header>

        <main
          id="contenido-principal"
          className="riccati-main"
        >
          {children}
        </main>

      </div>

    </div>
  );
}

export default RiccatiLayout;