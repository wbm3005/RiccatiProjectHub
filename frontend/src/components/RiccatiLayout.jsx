import RiccatiLogo from "./RiccatiLogo";
import ModalAccessibility from "./ModalAccessibility";
import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

export default function RiccatiLayout({ children }) {
  const location = useLocation();
  const [openRoute, setOpenRoute] = useState(null);
  const open = openRoute === location.key;
  const menuButton = useRef(null);
  const drawer = useRef(null);
  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem("usuarioRiccati")); } catch { /* Invalid stored session. */ }
  const close = () => { setOpenRoute(null); menuButton.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [...drawer.current.querySelectorAll('a[href], button:not([disabled])')];
    focusable()[0]?.focus();
    function keydown(event) {
      if (event.key === "Escape") { setOpenRoute(null); menuButton.current?.focus(); }
      if (event.key === "Tab") {
        const items = focusable(); const first = items[0]; const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    const desktop = window.matchMedia("(min-width: 1200px)");
    const onResize = () => { if (desktop.matches) setOpenRoute(null); };
    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); desktop.removeEventListener("change", onResize); };
  }, [open]);
  return <div className={"rp-shell" + (open ? " rp-menu-open" : "")}>
    <ModalAccessibility/>
    <a href="#contenido-principal" className="rp-skip">Saltar al contenido</a>
    <div ref={drawer} id="navegacion-principal" className="rp-drawer" role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label="Navegación principal"><Sidebar onClose={close}/></div>
    {open && <button type="button" tabIndex={-1} className="rp-overlay" onClick={close} aria-label="Cerrar navegación"/>}
    <div className="rp-workspace" inert={open ? true : undefined}>
      <header className="rp-topbar">
        <div className="rp-topbar-left"><button ref={menuButton} type="button" className="rp-icon-button rp-mobile-only" onClick={() => setOpenRoute(location.key)} aria-label="Abrir navegación" aria-expanded={open} aria-controls="navegacion-principal"><Menu size={23}/></button><Link to="/dashboard" className="rp-header-brand" aria-label="Riccati Project Hub, inicio"><RiccatiLogo/></Link></div>
        <div className="rp-topbar-right"><ThemeToggle/><span className="rp-topbar-divider"/><Link to="/perfil" className="rp-account" aria-label="Ir a mi cuenta"><span className="rp-account-text"><strong>{usuario?.nombre || "Usuario"}</strong><small>{usuario?.rol || "Sin rol"}</small></span><span className="rp-avatar">{usuario?.nombre?.charAt(0) || "U"}</span></Link></div>
      </header>
      <main id="contenido-principal" tabIndex={-1} className="rp-content"><div className="rp-module-content">{children}</div></main>
      <footer className="rp-footer">Riccati Project Hub</footer>
    </div>
  </div>;
}
