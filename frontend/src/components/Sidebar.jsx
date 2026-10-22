import RiccatiLogo from "./RiccatiLogo";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, UsersRound, Building2, FolderKanban, LogOut, UserRound, ClipboardList, X } from "lucide-react";

export default function Sidebar({ onClose }) {
  const navigate = useNavigate();
  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem("usuarioRiccati")); } catch { /* Invalid stored session. */ }
  const links = [
    ["/dashboard", "Dashboard", LayoutDashboard, "GENERAL"],
    ...(usuario?.rol === "Administrador" ? [["/usuarios", "Usuarios", UsersRound, "GESTIÓN"]] : []),
    ["/clientes", "Clientes", Building2, usuario?.rol === "Administrador" ? null : "GESTIÓN"],
    ["/proyectos", "Proyectos", FolderKanban],
    ["/bitacora", "Bitácora", ClipboardList],
    ["/perfil", "Mi cuenta", UserRound, "PERSONAL"],
  ];
  function logout() {
    localStorage.removeItem("tokenRiccati");
    localStorage.removeItem("usuarioRiccati");
    navigate("/");
  }
  return <aside className="rp-sidebar">
    <div className="rp-brand-row">
      <NavLink to="/dashboard" className="rp-brand" onClick={onClose} aria-label="Riccati Project Hub, inicio">
        <span className="rp-brand-lockup"><RiccatiLogo/><small>Project Hub</small></span>
      </NavLink>
      <button type="button" className="rp-icon-button rp-mobile-only" onClick={onClose} aria-label="Cerrar navegación"><X size={20}/></button>
    </div>
    <nav aria-label="Menú principal" className="rp-nav">
      {links.map(([to, label, Icon, section]) => <div key={to}>
        {section && <div className="rp-nav-section">{section}</div>}
        <NavLink to={to} onClick={onClose} className={({isActive}) => "rp-nav-link" + (isActive ? " active" : "")}><Icon size={20} aria-hidden="true"/><span>{label}</span></NavLink>
      </div>)}
    </nav>
    <div className="rp-sidebar-bottom">
      <Link to="/perfil" className="rp-session-user" onClick={onClose} aria-label="Consultar mi perfil"><span className="rp-avatar"><UserRound size={20} aria-hidden="true"/></span><span><strong>{usuario?.nombre || "Usuario"}</strong><small>{usuario?.rol || "Sin rol"}</small></span></Link>
      <button type="button" className="rp-nav-link rp-logout" onClick={logout}><LogOut size={19} aria-hidden="true"/>Cerrar sesión</button>
    </div>
  </aside>;
}
