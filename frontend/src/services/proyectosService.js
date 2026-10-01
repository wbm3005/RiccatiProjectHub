const API_URL =
  "http://localhost:3000/api/proyectos";


/* =====================================================
   TOKEN
===================================================== */

const obtenerToken = () => {
  return localStorage.getItem(
    "tokenRiccati"
  );
};


/* =====================================================
   HEADERS
===================================================== */

const obtenerHeaders = (
  incluirContenido = false
) => {
  const headers = {
    Authorization:
      `Bearer ${obtenerToken()}`,
  };

  if (incluirContenido) {
    headers["Content-Type"] =
      "application/json";
  }

  return headers;
};


/* =====================================================
   RESPUESTA
===================================================== */

const procesarRespuesta =
  async (respuesta) => {

    let datos = {};

    try {
      datos =
        await respuesta.json();
    } catch {
      datos = {};
    }

    if (respuesta.status === 401) {
      localStorage.removeItem(
        "tokenRiccati"
      );

      localStorage.removeItem(
        "usuarioRiccati"
      );

      window.location.href = "/";

      throw new Error(
        "La sesión ha expirado."
      );
    }

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje ||
          "No fue posible completar la solicitud."
      );
    }

    return datos;
  };


/* =====================================================
   OBTENER PROYECTOS
===================================================== */

export const obtenerProyectos =
  async () => {

    const respuesta = await fetch(
      API_URL,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   OBTENER PROYECTO
===================================================== */

export const obtenerProyecto =
  async (idProyecto) => {

    const respuesta = await fetch(
      `${API_URL}/${idProyecto}`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   CREAR PROYECTO
===================================================== */

export const crearProyecto =
  async (proyecto) => {

    const respuesta = await fetch(
      API_URL,
      {
        method: "POST",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          proyecto
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   ACTUALIZAR PROYECTO
===================================================== */

export const actualizarProyecto =
  async (
    idProyecto,
    proyecto
  ) => {

    const respuesta = await fetch(
      `${API_URL}/${idProyecto}`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify(
          proyecto
        ),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   PRIORIDADES
===================================================== */

export const obtenerPrioridades =
  async () => {

    const respuesta = await fetch(
      `${API_URL}/catalogos/prioridades`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   ESTADOS
===================================================== */

export const obtenerEstados =
  async () => {

    const respuesta = await fetch(
      `${API_URL}/catalogos/estados`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   ASIGNAR RESPONSABLE
===================================================== */

export const asignarResponsable =
  async (
    idProyecto,
    idUsuario
  ) => {

    const respuesta = await fetch(
      `${API_URL}/${idProyecto}/responsable`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify({
          idUsuario,
        }),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };


/* =====================================================
   CAMBIAR ESTADO
===================================================== */

export const cambiarEstadoProyecto =
  async (
    idProyecto,
    idEstado
  ) => {

    const respuesta = await fetch(
      `${API_URL}/${idProyecto}/estado`,
      {
        method: "PUT",

        headers:
          obtenerHeaders(true),

        body: JSON.stringify({
          idEstado,
        }),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };

  /* =====================================================
   RESPONSABLES
===================================================== */

export const obtenerResponsables =
  async () => {

    const respuesta = await fetch(
      `${API_URL}/catalogos/responsables`,
      {
        headers:
          obtenerHeaders(),
      }
    );

    return procesarRespuesta(
      respuesta
    );
  };