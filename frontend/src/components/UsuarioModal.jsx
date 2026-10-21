import FormField from "./FormField";
import { createPortal } from "react-dom";

function UsuarioModal({
  mostrar,
  usuarioEditando,
  formulario,
  roles,
  error,
  guardando,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!mostrar) {
    return null;
  }

  return createPortal(
    <div
      className="riccati-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >

      <div className="riccati-modal">

        {/* HEADER */}

        <div className="riccati-modal-header">

          <span className="riccati-page-label">
            M01 · USUARIOS
          </span>

          <h3>
            {usuarioEditando
              ? "Editar usuario"
              : "Nuevo usuario"}
          </h3>

        </div>

        {/* FORM */}

        <form onSubmit={onSubmit}>

          <div className="riccati-modal-body">

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* NOMBRE */}

            <FormField className="riccati-form-group">

              <label>
                Nombre
              </label>

              <input
                type="text"
                name="nombre"
                className="riccati-input"
                placeholder="Nombre del usuario"
                value={formulario.nombre}
                onChange={onChange}
                required
              />

            </FormField>

            {/* APELLIDOS */}

            <FormField className="riccati-form-group">

              <label>
                Apellidos
              </label>

              <input
                type="text"
                name="apellidos"
                className="riccati-input"
                placeholder="Apellidos"
                value={formulario.apellidos}
                onChange={onChange}
                required
              />

            </FormField>

            {/* CORREO */}

            <FormField className="riccati-form-group">

              <label>
                Correo electrónico
              </label>

              <input
                type="email"
                name="correo"
                className="riccati-input"
                placeholder="usuario@riccati.cr"
                value={formulario.correo}
                onChange={onChange}
                required
              />

            </FormField>

            {/* CONTRASEÑA */}

            <FormField className="riccati-form-group">

              <label>
                {usuarioEditando
                  ? "Nueva contraseña (opcional)"
                  : "Contraseña"}
              </label>

              <input
                type="password"
                name="password"
                className="riccati-input"
                placeholder={
                  usuarioEditando
                    ? "Dejar vacío para mantener la actual"
                    : "Ejemplo: Usuario123!"
                }
                value={formulario.password}
                onChange={onChange}
                required={!usuarioEditando}
              />

              <span
                style={{
                  display: "block",
                  marginTop: "7px",
                  color: "var(--rp-ink)",
                  fontSize: "13px",
                }}
              >
                Mínimo 8 caracteres, mayúscula,
                minúscula, número y carácter especial.
              </span>

            </FormField>

            {/* ROL + ESTADO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >

              <FormField className="riccati-form-group">

                <label>
                  Rol
                </label>

                <select
                  name="rol"
                  className="riccati-select"
                  value={formulario.rol}
                  onChange={onChange}
                >

                  {roles.map((rol) => (
                    <option
                      key={rol.id_rol}
                      value={rol.nombre}
                    >
                      {rol.nombre}
                    </option>
                  ))}

                </select>

              </FormField>

              <FormField className="riccati-form-group">

                <label>
                  Estado
                </label>

                <select
                  name="estado"
                  className="riccati-select"
                  value={formulario.estado}
                  onChange={onChange}
                >

                  <option value="ACTIVO">
                    Activo
                  </option>

                  <option value="INACTIVO">
                    Inactivo
                  </option>

                  <option value="BLOQUEADO">
                    Bloqueado
                  </option>

                </select>

              </FormField>

            </div>

          </div>

          {/* FOOTER */}

          <div className="riccati-modal-footer">

            <button
              type="button"
              className="riccati-button-secondary"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="riccati-button-primary"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : usuarioEditando
                  ? "Guardar cambios"
                  : "Registrar usuario"}
            </button>

          </div>

        </form>

      </div>

    </div>,
    document.body
  );
}

export default UsuarioModal;