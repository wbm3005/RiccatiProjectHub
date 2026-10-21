import { createPortal } from "react-dom";
import { Building2, ContactRound, FolderKanban, Pencil, UserPlus, X } from "lucide-react";

function ClienteFichaModal({ mostrar, cliente, contactos = [], proyectos = [], cargando, error, esAdministrador,
  onEditar, onAgregarContacto, onEditarContacto, onCambiarEstado, onClose }) {
  if (!mostrar) return null;
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="riccati-modal riccati-s2-modal riccati-s2-ficha" role="dialog" aria-modal="true" aria-label="Ficha del cliente">
        <div className="riccati-modal-header riccati-s2-modal-heading">
          <div><span className="riccati-panel-label">EXPEDIENTE DE CLIENTE</span><h3><Building2 size={22}/>{cliente?.nombre_razon_social || "Ficha del cliente"}</h3><p>Información, contactos y proyectos vinculados.</p></div>
          <button type="button" className="riccati-button-secondary" onClick={onClose} aria-label="Cerrar"><X size={18}/></button>
        </div>
        <div className="riccati-modal-body">
          {cargando && <div className="riccati-loader-wrapper"><span className="riccati-loader"/>Cargando ficha...</div>}
          {error && !cargando && <div className="login-error" role="alert">{error}</div>}
          {!cargando && cliente && !error && (
            <>
              <div className="riccati-s2-ficha-grid">
                <Dato etiqueta="Código" valor={`CLI-${String(cliente.id_cliente).padStart(3, "0")}`} />
                <Dato etiqueta="Estado" valor={cliente.estado === "ACTIVO" ? "Activo" : "Inactivo"} />
                <Dato etiqueta="Identificación" valor={cliente.identificacion}/>
                <Dato etiqueta="Correo general" valor={cliente.correo_general}/>
                <Dato etiqueta="Teléfono" valor={cliente.telefono_general}/>
                <Dato etiqueta="Dirección" valor={cliente.direccion}/>
              </div>
              {cliente.observaciones && <div className="riccati-s2-nota"><strong>Observaciones</strong><p>{cliente.observaciones}</p></div>}
              <div className="riccati-s2-section-head"><div><ContactRound size={17}/><strong>Contactos ({contactos.length})</strong></div>{esAdministrador && <button type="button" className="riccati-button-secondary" onClick={onAgregarContacto}><UserPlus size={16}/> Agregar</button>}</div>
              {contactos.length === 0 ? <p className="riccati-s2-muted">Sin contactos registrados.</p> : (
                <div className="riccati-s2-contactos">{contactos.map(c => (
                  <div className="riccati-s2-contacto" key={c.id_contacto}>
                    <div><strong>{c.nombre}</strong>{c.es_principal && <span className="riccati-badge riccati-badge-cyan">Principal</span>} {c.estado === "INACTIVO" && <span className="riccati-badge riccati-badge-orange">Inactivo</span>}
                      <p>{c.puesto || "Sin puesto"} · {c.correo || "Sin correo"} · {c.telefono || "Sin teléfono"}</p></div>
                    {esAdministrador && <button type="button" className="riccati-button-secondary" onClick={() => onEditarContacto(c)}><Pencil size={15}/> Editar</button>}
                  </div>
                ))}</div>
              )}
              <div className="riccati-s2-section-head"><div><FolderKanban size={17}/><strong>Historial de proyectos ({proyectos.length})</strong></div></div>
              {proyectos.length === 0 ? <p className="riccati-s2-muted">No hay proyectos asociados que puedas consultar.</p> : (
                <div className="riccati-s2-projects">{proyectos.map(p => <div className="riccati-s2-project-row" key={p.id_proyecto}>
                  <div><strong>{p.nombre}</strong><small>{p.codigo}</small></div><span className={"riccati-badge " + (p.estado === "Finalizado" ? "riccati-badge-green" : p.estado === "Archivado" ? "riccati-badge-purple" : "riccati-badge-cyan")}>{p.estado}</span>
                  <span className="riccati-s2-muted">{p.fecha_compromiso ? String(p.fecha_compromiso).slice(0, 10) : "Sin fecha"}</span>
                </div>)}</div>
              )}
            </>
          )}
        </div>
        <div className="riccati-modal-footer">
          {esAdministrador && cliente && !cargando && !error && <>
            <button type="button" className="riccati-button-secondary" onClick={onEditar}><Pencil size={16}/> Editar cliente</button>
            <button type="button" className={cliente.estado === "ACTIVO" ? "riccati-button-danger" : "riccati-button-primary"} onClick={onCambiarEstado}>{cliente.estado === "ACTIVO" ? "Inactivar" : "Reactivar"}</button>
          </>}
          <button type="button" className="riccati-button-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>, document.body
  );
}
function Dato({ etiqueta, valor }) { return <div className="riccati-s2-dato"><span>{etiqueta}</span><strong>{valor || "No registrado"}</strong></div>; }
export default ClienteFichaModal;