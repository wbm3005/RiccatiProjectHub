import { createPortal } from "react-dom";
import { Building2, X } from "lucide-react";

function ClienteModal({ mostrar, formulario, contacto, esEdicion = false, error,
  guardando, onChangeCliente, onChangeContacto, onSubmit, onClose }) {
  if (!mostrar) return null;
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onClose()}>
      <div className="riccati-modal riccati-s2-modal" role="dialog" aria-modal="true" aria-label={esEdicion ? "Editar cliente" : "Nuevo cliente"}>
        <div className="riccati-modal-header riccati-s2-modal-heading">
          <div>
            <span className="riccati-panel-label">GESTIÓN DE CLIENTES</span>
            <h3><Building2 size={22} aria-hidden="true" /> {esEdicion ? "Editar cliente" : "Nuevo cliente"}</h3>
            <p>{esEdicion ? "Actualiza la ficha sin perder su historial." : "Registra un cliente y, opcionalmente, su contacto principal."}</p>
          </div>
          <button type="button" className="riccati-button-secondary" aria-label="Cerrar" onClick={onClose} disabled={guardando}><X size={18}/></button>
        </div>
        <form onSubmit={onSubmit} className="riccati-s2-modal-form">
          <div className="riccati-modal-body">
            {error && <div className="login-error" role="alert">{error}</div>}
            <span className="riccati-panel-label">DATOS GENERALES</span>
            <div className="riccati-form-group">
              <label htmlFor="cliente-nombre">Nombre o razón social *</label>
              <input id="cliente-nombre" className="riccati-input" name="nombre_razon_social" value={formulario.nombre_razon_social} onChange={onChangeCliente} required maxLength={160} placeholder="Ej. Constructora Horizonte S.A." />
            </div>
            <div className="riccati-s2-form-grid">
              <div className="riccati-form-group">
                <label htmlFor="cliente-id">Identificación</label>
                <input id="cliente-id" className="riccati-input" name="identificacion" value={formulario.identificacion} onChange={onChangeCliente} maxLength={30}/>
              </div>
              <div className="riccati-form-group">
                <label htmlFor="cliente-correo">Correo general</label>
                <input id="cliente-correo" type="email" className="riccati-input" name="correo_general" value={formulario.correo_general} onChange={onChangeCliente} maxLength={150}/>
              </div>
              <div className="riccati-form-group">
                <label htmlFor="cliente-telefono">Teléfono</label>
                <input id="cliente-telefono" className="riccati-input" name="telefono_general" value={formulario.telefono_general} onChange={onChangeCliente} maxLength={30}/>
              </div>
              <div className="riccati-form-group">
                <label>Estado</label>
                <div className="riccati-s2-estado-lectura">{esEdicion ? formulario.estado === "ACTIVO" ? "Activo (cambia desde la ficha)" : "Inactivo (cambia desde la ficha)" : "Activo"}</div>
              </div>
            </div>
            <div className="riccati-form-group">
              <label htmlFor="cliente-direccion">Dirección</label>
              <input id="cliente-direccion" className="riccati-input" name="direccion" value={formulario.direccion} onChange={onChangeCliente}/>
            </div>
            <div className="riccati-form-group">
              <label htmlFor="cliente-obs">Observaciones</label>
              <textarea id="cliente-obs" className="riccati-input" rows={3} name="observaciones" value={formulario.observaciones} onChange={onChangeCliente}/>
            </div>
            {!esEdicion && (
              <>
                <div className="riccati-s2-form-divider"><span className="riccati-panel-label">CONTACTO PRINCIPAL · OPCIONAL</span></div>
                <div className="riccati-s2-form-grid">
                  <div className="riccati-form-group"><label htmlFor="cp-nombre">Nombre</label><input id="cp-nombre" className="riccati-input" name="nombre" value={contacto.nombre} onChange={onChangeContacto} maxLength={100}/></div>
                  <div className="riccati-form-group"><label htmlFor="cp-puesto">Puesto</label><input id="cp-puesto" className="riccati-input" name="puesto" value={contacto.puesto} onChange={onChangeContacto} maxLength={100}/></div>
                  <div className="riccati-form-group"><label htmlFor="cp-correo">Correo</label><input id="cp-correo" type="email" className="riccati-input" name="correo" value={contacto.correo} onChange={onChangeContacto} maxLength={150}/></div>
                  <div className="riccati-form-group"><label htmlFor="cp-telefono">Teléfono</label><input id="cp-telefono" className="riccati-input" name="telefono" value={contacto.telefono} onChange={onChangeContacto} maxLength={30}/></div>
                </div>
              </>
            )}
          </div>
          <div className="riccati-modal-footer">
            <button type="button" className="riccati-button-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
            <button type="submit" className="riccati-button-primary" disabled={guardando}>{guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Registrar cliente"}</button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
}
export default ClienteModal;