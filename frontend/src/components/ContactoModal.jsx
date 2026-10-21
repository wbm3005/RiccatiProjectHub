import FormField from "./FormField";
import { createPortal } from "react-dom";
import { ContactRound, X } from "lucide-react";

function ContactoModal({ mostrar, formulario, editando = false, error, guardando, onChange, onSubmit, onClose }) {
  if (!mostrar) return null;
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onClose()}>
      <div className="riccati-modal riccati-s2-modal riccati-s2-modal-pequeno" role="dialog" aria-modal="true" aria-label={editando ? "Editar contacto" : "Nuevo contacto"}>
        <div className="riccati-modal-header riccati-s2-modal-heading">
          <div><span className="riccati-panel-label">CONTACTOS DEL CLIENTE</span><h3><ContactRound size={20}/>{editando ? "Editar contacto" : "Nuevo contacto"}</h3></div>
          <button type="button" className="riccati-button-secondary" onClick={onClose} disabled={guardando} aria-label="Cerrar"><X size={18}/></button>
        </div>
        <form className="riccati-s2-modal-form" onSubmit={onSubmit}>
          <div className="riccati-modal-body">
            {error && <div className="login-error" role="alert">{error}</div>}
            <FormField className="riccati-form-group"><label htmlFor="contacto-nombre">Nombre completo *</label><input id="contacto-nombre" className="riccati-input" required name="nombre" value={formulario.nombre} onChange={onChange} maxLength={100}/></FormField>
            <div className="riccati-s2-form-grid">
              <FormField className="riccati-form-group"><label htmlFor="contacto-puesto">Puesto</label><input id="contacto-puesto" className="riccati-input" name="puesto" value={formulario.puesto} onChange={onChange} maxLength={100}/></FormField>
              <FormField className="riccati-form-group"><label htmlFor="contacto-telefono">Teléfono</label><input id="contacto-telefono" className="riccati-input" name="telefono" value={formulario.telefono} onChange={onChange} maxLength={30}/></FormField>
            </div>
            <FormField className="riccati-form-group"><label htmlFor="contacto-correo">Correo</label><input id="contacto-correo" type="email" className="riccati-input" name="correo" value={formulario.correo} onChange={onChange} maxLength={150}/></FormField>
            <label className="riccati-s2-checkbox"><input type="checkbox" name="es_principal" checked={Boolean(formulario.es_principal)} onChange={onChange}/> Marcar como contacto principal</label>
            {editando && <FormField className="riccati-form-group"><label htmlFor="contacto-estado">Estado</label><select id="contacto-estado" className="riccati-select" name="estado" value={formulario.estado || "ACTIVO"} onChange={onChange}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select></FormField>}
          </div>
          <div className="riccati-modal-footer"><button type="button" className="riccati-button-secondary" onClick={onClose} disabled={guardando}>Cancelar</button><button type="submit" className="riccati-button-primary" disabled={guardando}>{guardando ? "Guardando..." : editando ? "Guardar contacto" : "Agregar contacto"}</button></div>
        </form>
      </div>
    </div>, document.body
  );
}
export default ContactoModal;