import "../css/miembros.css";
import logo from "../assets/logo.png";
import { supabase, BUCKET_MIEMBROS } from "../supabase.js";
/* =========================================================
   DATOS DE EJEMPLO
   Después puedes reemplazar este arreglo por Firebase.
========================================================= */

let miembros = [];

/* =========================================================
   ICONOS SVG
========================================================= */

const icons = {
  users: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `,

  user: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21a8 8 0 0 1 16 0"/>
    </svg>
  `,

  chart: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10"/>
      <path d="M10 20V4"/>
      <path d="M16 20v-7"/>
      <path d="M22 20V7"/>
    </svg>
  `,

  dollar: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  `,

  search: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7"/>
      <path d="m20 20-3.5-3.5"/>
    </svg>
  `,

  phone: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2
      19.79 19.79 0 0 1-8.63-3.07
      19.5 19.5 0 0 1-6-6
      19.79 19.79 0 0 1-3.07-8.67
      A2 2 0 0 1 4.11 2h3
      a2 2 0 0 1 2 1.72
      12.84 12.84 0 0 0 .7 2.81
      2 2 0 0 1-.45 2.11L8.09 9.91
      a16 16 0 0 0 6 6l1.27-1.27
      a2 2 0 0 1 2.11-.45
      12.84 12.84 0 0 0 2.81.7
      A2 2 0 0 1 22 16.92z"/>
    </svg>
  `,

  calendar: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M16 3v4M8 3v4M3 10h18"/>
      <path d="M8 14h2M14 14h2M8 18h2M14 18h2"/>
    </svg>
  `,

  card: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M2 10h20"/>
      <path d="M6 15h4"/>
    </svg>
  `,

  edit: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>
    </svg>
  `,

  plus: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  `,

  more: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  `,

  database: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="8" ry="3"/>
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/>
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>
    </svg>
  `,
};

/* =========================================================
   UTILIDADES
========================================================= */

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  let fechaJS;

  if (typeof fecha.toDate === "function") {
    fechaJS = fecha.toDate();
  } else {
    fechaJS = new Date(fecha);
  }

  if (Number.isNaN(fechaJS.getTime())) {
    return "Sin fecha";
  }

  return fechaJS.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function obtenerEstadoMiembro(fechaVencimiento) {
  if (!fechaVencimiento) {
    return "inactivo";
  }

  let vencimiento;

  // Firestore Timestamp
  if (typeof fechaVencimiento.toDate === "function") {
    vencimiento = fechaVencimiento.toDate();
  } else {
    vencimiento = new Date(fechaVencimiento);
  }

  if (Number.isNaN(vencimiento.getTime())) {
    return "inactivo";
  }

  const hoy = new Date();

  // Comparamos únicamente las fechas, no las horas
  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  return vencimiento >= hoy
    ? "activo"
    : "inactivo";
}

function obtenerDatosPago(datos, estadoMiembro) {
  const estadoPago = String(
    datos.estadoPago || ""
  ).toLowerCase();

  const saldoPendiente = Number(
    datos.saldoPendiente || 0
  );

  // Si la membresía ya venció
  if (estadoMiembro === "inactivo") {
    return {
      pago: "Realizar pago",
      tipoPago: "vencido",
    };
  }

  // Membresía vigente y pagada
  if (estadoPago === "pagado") {
    return {
      pago: "Pagado",
      tipoPago: "pagado",
    };
  }

  // Membresía vigente pero con saldo pendiente
  if (estadoPago === "pendiente") {
    return {
      pago: `$${saldoPendiente.toLocaleString(
        "es-MX"
      )} pendiente`,

      tipoPago: "pendiente",
    };
  }

  // Por seguridad, si no existe estadoPago
  return {
    pago: "Realizar pago",
    tipoPago: "vencido",
  };
}


function crearFotoPlaceholder(nombre = "Miembro") {
  const inicial = nombre.trim().charAt(0).toUpperCase() || "M";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="100%" height="100%" fill="#102637"/>
      <text
        x="50%"
        y="53%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial"
        font-size="110"
        font-weight="700"
        fill="#ffffff"
      >
        ${inicial}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/* =========================================================
   TARJETA DE MIEMBRO
========================================================= */

function crearTarjetaMiembro(miembro) {
  const activo = miembro.estado === "activo";

  return `
    <article
      class="member-card ${activo ? "member-active" : "member-inactive"}"
      data-member-id="${miembro.id}"
    >

      <div class="member-photo-wrapper">
        <img
          class="member-photo"
          src="${escapeHTML(miembro.foto)}"
          alt="Foto de ${escapeHTML(miembro.nombre)}"
          loading="lazy"
        >
      </div>

      <div class="member-main">

        <div class="member-header">
          <div>
            <h3 class="member-name">
              ${escapeHTML(miembro.nombre)}
            </h3>

            <div class="member-info">
              <span class="member-info-icon">
                ${icons.phone}
              </span>

              <span>
                ${escapeHTML(miembro.telefono)}
              </span>
            </div>

            <div class="member-info">
              <span class="member-info-icon">
                ${icons.calendar}
              </span>

              <span>
                Vence: ${escapeHTML(miembro.vence)}
              </span>
            </div>
          </div>

          <span class="status-badge ${activo ? "status-active" : "status-inactive"}">
            <span class="status-dot"></span>
            ${activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div class="member-actions">

          <button
            class="btn-edit"
            type="button"
            data-action="editar"
            data-id="${miembro.id}"
          >
            <span class="button-icon">
              ${icons.edit}
            </span>

            Editar
          </button>

          <div
            class="payment-status payment-${escapeHTML(miembro.tipoPago)}"
          >
            <span class="payment-icon">
              ${icons.card}
            </span>

            <span>
              ${escapeHTML(miembro.pago)}
            </span>
          </div>

          <button
            class="btn-more"
            type="button"
            aria-label="Más opciones para ${escapeHTML(miembro.nombre)}"
            data-action="opciones"
            data-id="${miembro.id}"
          >
            ${icons.more}
          </button>

        </div>

      </div>
    </article>
  `;
}

/* =========================================================
   RENDER PRINCIPAL
========================================================= */

export function renderMiembros() {
  return `
    <div class="cronos-app">

      <!-- ===================== HEADER ===================== -->

      <header class="main-header">
        <div class="header-inner">

          <a href="#" class="brand" aria-label="Cronos Gym">
            <div class="brand-logo">
  <img src="${logo}" alt="Cronos Gym">
</div>
            <div class="brand-divider"></div>

            <p class="brand-slogan">
              DISCIPLINA<br>
              PERSONAS<br>
              RESULTADOS
            </p>
          </a>


          <nav class="main-nav" aria-label="Navegación principal">

            <button
              class="nav-item active"
              type="button"
              data-page="miembros"
            >
              <span class="nav-icon">
                ${icons.users}
              </span>
              Miembros
            </button>

            <button
  class="nav-item"
  type="button"
  data-page="membresias"
>
  <span class="nav-icon">
    ${icons.database}
  </span>

  Membresías
</button>

            <button
              class="nav-item"
              type="button"
              data-page="analiticas"
            >
              <span class="nav-icon">
                ${icons.chart}
              </span>
              Analíticas
            </button>

          </nav>

        </div>
      </header>


      <!-- ===================== HERO ===================== -->

      <section class="members-hero">
        <div class="hero-content">

          <div>
            <h1>Gestión de Miembros</h1>

            <p>
              Administra tu comunidad, impulsa su progreso.
            </p>
          </div>

          <div class="hero-message">
            <span></span>

            <p>
              MÁS QUE UN GIMNASIO
              <strong>UNA MEJOR VERSIÓN DE TI</strong>
            </p>
          </div>

        </div>
      </section>


      <main class="members-container">

        <!-- ================= ESTADÍSTICAS ================= -->

        <section
          class="stats-grid"
          aria-label="Resumen de miembros"
        >

          <article class="stat-card">
            <div class="stat-icon">
              ${icons.users}
            </div>

            <div>
              <span>Total de miembros</span>
              <strong id="statTotal">0</strong>
            </div>
          </article>


          <article class="stat-card">
            <div class="stat-icon">
              ${icons.user}
            </div>

            <div>
              <span>Miembros activos</span>
              <strong id="statActivos">0</strong>
            </div>
          </article>


          <article class="stat-card">
            <div class="stat-icon">
              ${icons.chart}
            </div>

            <div>
              <span>Nuevos este mes</span>
              <strong>12</strong>
            </div>
          </article>


          <article class="stat-card">
            <div class="stat-icon">
              ${icons.dollar}
            </div>

            <div>
              <span>Ventas mensuales</span>
              <strong>$18,450</strong>
            </div>
          </article>

        </section>


        <!-- ================= FILTROS ================= -->

        <section class="members-tools">

          <label class="search-box">
            <span class="search-icon">
              ${icons.search}
            </span>

            <input
              id="buscarMiembro"
              type="search"
              autocomplete="off"
              placeholder="Buscar miembro por nombre"
              aria-label="Buscar miembro"
            >
          </label>


<div class="select-box custom-select" data-select-id="filtroEstado">
  <span class="select-label">Estado</span>

  <button
    class="select-trigger"
    type="button"
    aria-expanded="false"
  >
    <span class="select-value">Todos</span>
    <span class="select-chevron"></span>
  </button>

  <div class="select-menu">
    <button type="button" class="select-option selected" data-value="todos">
      Todos
    </button>

    <button type="button" class="select-option" data-value="activo">
      Activos
    </button>

    <button type="button" class="select-option" data-value="inactivo">
      Inactivos
    </button>
  </div>

  <select id="filtroEstado" class="native-select-hidden">
    <option value="todos">Todos</option>
    <option value="activo">Activos</option>
    <option value="inactivo">Inactivos</option>
  </select>
</div>


<div class="select-box custom-select" data-select-id="filtroMembresia">
  <span class="select-label">Membresía</span>

  <button
    class="select-trigger"
    type="button"
    aria-expanded="false"
  >
    <span class="select-value">Todas</span>
    <span class="select-chevron"></span>
  </button>

  <div class="select-menu"></div>

  <select id="filtroMembresia" class="native-select-hidden">
    <option value="todas">Todas</option>
  </select>
</div>


          <button
            class="btn-new-member"
            id="btnNuevoMiembro"
            type="button"
          >
            <span>
              ${icons.plus}
            </span>

            Nuevo miembro
          </button>

        </section>


        <!-- ================= MIEMBROS ================= -->

        <section
          class="members-grid"
          id="listaMiembros"
          aria-live="polite"
        >
        </section>


        <div
          class="empty-state"
          id="emptyState"
          hidden
        >
          <span>${icons.search}</span>

          <h3>No se encontraron miembros</h3>

          <p>
            Intenta utilizar otros filtros o términos de búsqueda.
          </p>
        </div>

      </main>


      <!-- ===================== FOOTER ===================== -->

      <footer class="main-footer">

        <div class="footer-inner">

          <div class="footer-brand">
            <strong>CRONOS GYM</strong>

            <span></span>

            <p>
              Personas más fuertes. Comunidades más sanas.
            </p>
          </div>

          <p>
            © ${new Date().getFullYear()} Cronos Gym.
            Todos los derechos reservados.
          </p>

        </div>

      </footer>

      <!-- ================= MODAL NUEVO MIEMBRO ================= -->

<div class="member-modal-overlay" id="modalNuevoMiembro" hidden>

  <section
    class="member-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modalNuevoTitulo"
  >

    <header class="member-modal-header">

      <div class="member-photo-capture">

  <button
    type="button"
    class="member-photo-button"
    id="btnTomarFoto"
    aria-label="Tomar foto del miembro"
  >

    <div
      class="member-photo-placeholder"
      id="fotoPlaceholder"
    >
      ${icons.user}

      <span class="photo-plus">
        +
      </span>
    </div>

    <img
      id="fotoPreview"
      class="member-photo-preview"
      alt="Foto del nuevo miembro"
      hidden
    >

  </button>


  <input
    type="file"
    id="inputFotoMiembro"
    accept="image/*"
    capture="user"
    hidden
  >

  <span class="photo-hint" id="fotoHint">
    Tomar foto
  </span>

</div>

      <div class="member-modal-title">
        <h2 id="modalNuevoTitulo">
          Nuevo miembro
        </h2>

        <p id="modalMiembroDescripcion">
          Registra un nuevo integrante de la comunidad.
        </p>
      </div>

    </header>


    <form id="formNuevoMiembro">

      <div class="member-form-grid">

        <!-- NOMBRE -->

        <label class="member-form-field">
          <span>Nombre *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.user}
            </span>

            <input
              type="text"
              id="nuevoNombre"
              name="nombre"
              placeholder="Juan"
              required
            >
          </div>
        </label>


        <!-- APELLIDOS -->

        <label class="member-form-field">
          <span>Apellidos *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.user}
            </span>

            <input
              type="text"
              id="nuevoApellidos"
              name="apellidos"
              placeholder="Pérez López"
              required
            >
          </div>
        </label>


        <!-- TELÉFONO -->

        <label class="member-form-field">
          <span>Número de teléfono *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.phone}
            </span>

            <input
              type="tel"
              id="nuevoTelefono"
              name="telefono"
              placeholder="7711234567"
              required
            >
          </div>
        </label>


        <!-- NACIMIENTO -->

        <label class="member-form-field">
          <span>Fecha de nacimiento *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.calendar}
            </span>

            <input
              type="date"
              id="nuevoNacimiento"
              name="fechaNacimiento"
              required
            >
          </div>
        </label>


        <!-- INCORPORACIÓN -->

        <label class="member-form-field">
          <span>Fecha de incorporación *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.calendar}
            </span>

            <input
              type="date"
              id="nuevoIncorporacion"
              name="fechaInscripcion"
              required
            >
          </div>
        </label>


        <!-- MEMBRESÍA -->

        <label class="member-form-field">
          <span>Tipo de membresía *</span>

          <div class="member-input">
            <span class="member-input-icon crown-icon">
              ♔
            </span>

            <select
              id="nuevoMembresia"
              name="tipoMembresiaId"
              required
            >
              <option value="">
                Selecciona una membresía
              </option>

              <option value="mensual">
                Mensualidad
              </option>

              <option value="semanal">
                Semana
              </option>

              <option value="visita">
                Visita
              </option>

              <option value="mensual_nutricion">
                Mensualidad + asesoría nutricional
              </option>
            </select>
          </div>
        </label>


        <!-- INICIO -->

        <label class="member-form-field">
          <span>Fecha de inicio *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.calendar}
            </span>

            <input
              type="date"
              id="nuevoInicio"
              name="fechaInicio"
              required
            >
          </div>
        </label>


        <!-- VENCIMIENTO -->

        <label class="member-form-field">
          <span>Fecha de vencimiento *</span>

          <div class="member-input">
            <span class="member-input-icon">
              ${icons.calendar}
            </span>

            <input
              type="date"
              id="nuevoVencimiento"
              name="fechaVencimiento"
              required
            >
          </div>
        </label>


        <!-- COSTO -->

        <label class="member-form-field">
          <span>Costo membresía *</span>

          <div class="member-input member-money-input">
            <span class="money-symbol">$</span>

            <input
              type="number"
              id="nuevoCosto"
              name="costoMembresia"
              min="0"
              step="1"
              value="0"
              required
            >
          </div>
        </label>


        <!-- SALDO -->

        <label class="member-form-field">
          <span>Saldo pendiente *</span>

          <div class="member-input member-money-input">
            <span class="money-symbol">$</span>

            <input
              type="number"
              id="nuevoSaldo"
              name="saldoPendiente"
              min="0"
              step="1"
              value="0"
              required
            >
          </div>
        </label>

      </div>


      <footer class="member-modal-footer">

        <button
          class="btn-modal-delete"
          id="eliminarMiembro"
          type="button"
          hidden
        >
          Eliminar miembro
        </button>

        <button
          class="btn-modal-cancel"
          id="cancelarNuevoMiembro"
          type="button"
        >
          Cancelar
        </button>

        <button
          class="btn-modal-save"
          id="guardarMiembro"
          type="submit"
        >
          <span class="save-icon"></span>
          <span id="textoGuardarMiembro">Guardar miembro</span>
        </button>

      </footer>

    </form>

  </section>

</div>

    </div>
  `;
}

/* =========================================================
   SUPABASE · DATOS
========================================================= */

let membresiasDisponibles = [];

async function cargarMiembrosSupabase() {
  try {
    const { data, error } = await supabase
      .from("miembros")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      throw error;
    }

    miembros = (data || []).map((datos) => {
      const nombreCompleto = [
        datos.nombre,
        datos.apellidos,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const estado = obtenerEstadoMiembro(
        datos.fecha_vencimiento
      );

      const datosPago = obtenerDatosPago(
        {
          estadoPago: datos.estado_pago,
          saldoPendiente: datos.saldo_pendiente,
        },
        estado
      );

      return {
        id: String(datos.id),
        idMiembro: Number(datos.id || 0),

        nombre:
          nombreCompleto || "Sin nombre",

        nombreBase:
          datos.nombre || "",

        apellidos:
          datos.apellidos || "",

        telefono:
          datos.telefono || "Sin teléfono",

        fechaNacimiento:
          datos.fecha_nacimiento || "",

        fechaInscripcion:
          datos.fecha_inscripcion || "",

        fechaInicio:
          datos.fecha_inicio || "",

        fechaVencimiento:
          datos.fecha_vencimiento || "",

        estado,

        vence:
          formatearFecha(datos.fecha_vencimiento),

        pago:
          datosPago.pago,

        tipoPago:
          datosPago.tipoPago,

        estadoPago:
          String(datos.estado_pago || "").toLowerCase(),

        saldoPendiente:
          Number(datos.saldo_pendiente || 0),

        costoMembresia:
          Number(datos.costo_membresia || 0),

        foto:
          datos.foto_url?.trim() ||
          crearFotoPlaceholder(nombreCompleto),

        fotoUrl:
          datos.foto_url || "",

        fotoPath:
          datos.foto_path || "",

        membresia:
          datos.tipo_membresia_id
            ? String(datos.tipo_membresia_id)
            : "",

        tipoMembresiaId:
          datos.tipo_membresia_id
            ? String(datos.tipo_membresia_id)
            : "",

        email:
          datos.email || "",
      };
    });

  } catch (error) {
    console.error(
      "Error al cargar los miembros desde Supabase:",
      error
    );

    miembros = [];
  }
}

async function cargarMembresiasSupabase() {
  try {
    const { data, error } = await supabase
      .from("membresias")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (error) {
      throw error;
    }

    membresiasDisponibles = (data || []).map(
      (membresia) => ({
        id: String(membresia.id),
        nombre: membresia.nombre,
        precio: Number(membresia.precio || 0),
        duracion: Number(membresia.duracion || 1),
        unidadDuracion:
          membresia.unidad_duracion || "mes",
      })
    );

    poblarSelectsMembresias();

  } catch (error) {
    console.error(
      "Error al cargar las membresías desde Supabase:",
      error
    );

    membresiasDisponibles = [];
    poblarSelectsMembresias();
  }
}

function poblarSelectsMembresias() {
  const filtro = document.querySelector(
    "#filtroMembresia"
  );

  const formulario = document.querySelector(
    "#nuevoMembresia"
  );

  const opciones = membresiasDisponibles
    .map(
      (membresia) => `
        <option value="${escapeHTML(membresia.id)}">
          ${escapeHTML(membresia.nombre)}
        </option>
      `
    )
    .join("");

  if (filtro) {
    filtro.innerHTML = `
      <option value="todas">
        Todas
      </option>
      ${opciones}
    `;

    filtro
      .closest(".custom-select")
      ?.reconstruirOpciones?.();
  }

  if (formulario) {
    formulario.innerHTML = `
      <option value="">
        Selecciona una membresía
      </option>
      ${opciones}
    `;
  }
}

function inicializarSelectPersonalizado(contenedor) {
  const select = contenedor.querySelector("select");
  const trigger = contenedor.querySelector(
    ".select-trigger"
  );
  const value = contenedor.querySelector(
    ".select-value"
  );
  const menu = contenedor.querySelector(
    ".select-menu"
  );

  if (!select || !trigger || !value || !menu) {
    return;
  }

  function construirOpciones() {
    menu.innerHTML = "";

    [...select.options].forEach((option) => {
      const boton = document.createElement(
        "button"
      );

      boton.type = "button";
      boton.className = "select-option";
      boton.dataset.value = option.value;
      boton.textContent =
        option.textContent.trim();

      if (option.value === select.value) {
        boton.classList.add("selected");
      }

      boton.addEventListener(
        "click",
        () => {
          select.value = option.value;
          value.textContent =
            option.textContent.trim();

          menu
            .querySelectorAll(
              ".select-option"
            )
            .forEach((item) =>
              item.classList.remove(
                "selected"
              )
            );

          boton.classList.add(
            "selected"
          );

          contenedor.classList.remove(
            "open"
          );

          trigger.setAttribute(
            "aria-expanded",
            "false"
          );

          select.dispatchEvent(
            new Event("change", {
              bubbles: true,
            })
          );
        }
      );

      menu.appendChild(boton);
    });

    const opcionActual =
      select.options[
        select.selectedIndex
      ];

    if (opcionActual) {
      value.textContent =
        opcionActual.textContent.trim();
    }
  }

  construirOpciones();

  trigger.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      document
        .querySelectorAll(
          ".custom-select.open"
        )
        .forEach((otroSelect) => {
          if (
            otroSelect !== contenedor
          ) {
            otroSelect.classList.remove(
              "open"
            );

            otroSelect
              .querySelector(
                ".select-trigger"
              )
              ?.setAttribute(
                "aria-expanded",
                "false"
              );
          }
        });

      const abierto =
        contenedor.classList.toggle(
          "open"
        );

      trigger.setAttribute(
        "aria-expanded",
        String(abierto)
      );
    }
  );

  contenedor.reconstruirOpciones =
    construirOpciones;
}

function fechaInputHoy() {
  const hoy = new Date();

  const year = hoy.getFullYear();

  const month = String(
    hoy.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    hoy.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fechaAInput(fecha) {
  const year = fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calcularFechaVencimiento(
  fechaInicio,
  plan
) {
  if (!fechaInicio || !plan) {
    return "";
  }

  const fecha = new Date(
    `${fechaInicio}T12:00:00`
  );

  const cantidad =
    Number(plan.duracion || 1);

  switch (plan.unidadDuracion) {
    case "dia":
      fecha.setDate(
        fecha.getDate() + cantidad
      );
      break;

    case "semana":
      fecha.setDate(
        fecha.getDate() +
        cantidad * 7
      );
      break;

    case "mes":
      fecha.setMonth(
        fecha.getMonth() + cantidad
      );
      break;

    case "ano":
      fecha.setFullYear(
        fecha.getFullYear() +
        cantidad
      );
      break;

    default:
      fecha.setMonth(
        fecha.getMonth() + cantidad
      );
  }

  return fechaAInput(fecha);
}

async function comprimirFoto(
  archivo,
  maxDimension = 900,
  calidad = 0.82
) {
  if (!archivo) {
    return null;
  }

  const urlTemporal =
    URL.createObjectURL(archivo);

  try {
    const imagen = await new Promise(
      (resolve, reject) => {
        const img = new Image();

        img.onload = () =>
          resolve(img);

        img.onerror = () =>
          reject(
            new Error(
              "No se pudo procesar la fotografía."
            )
          );

        img.src = urlTemporal;
      }
    );

    const mayorDimension = Math.max(
      imagen.naturalWidth,
      imagen.naturalHeight
    );

    const escala = Math.min(
      1,
      maxDimension /
      mayorDimension
    );

    const width = Math.max(
      1,
      Math.round(
        imagen.naturalWidth *
        escala
      )
    );

    const height = Math.max(
      1,
      Math.round(
        imagen.naturalHeight *
        escala
      )
    );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = width;
    canvas.height = height;

    const contexto =
      canvas.getContext("2d");

    contexto.drawImage(
      imagen,
      0,
      0,
      width,
      height
    );

    const blob = await new Promise(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/webp",
          calidad
        );
      }
    );

    return blob || archivo;

  } finally {
    URL.revokeObjectURL(
      urlTemporal
    );
  }
}

async function subirFotoMiembro(
  archivo
) {
  if (!archivo) {
    return {
      fotoUrl: null,
      fotoPath: null,
    };
  }

  if (
    !archivo.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "El archivo seleccionado no es una imagen."
    );
  }

  if (
    archivo.size >
    12 * 1024 * 1024
  ) {
    throw new Error(
      "La foto original no puede superar 12 MB."
    );
  }

  const fotoComprimida =
    await comprimirFoto(
      archivo
    );

  const extension =
    fotoComprimida.type ===
    "image/webp"
      ? "webp"
      : (
          archivo.name
            .split(".")
            .pop() ||
          "jpg"
        ).toLowerCase();

  const ruta =
    `miembros/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase
    .storage
    .from(BUCKET_MIEMBROS)
    .upload(
      ruta,
      fotoComprimida,
      {
        cacheControl: "3600",
        upsert: false,
        contentType:
          fotoComprimida.type ||
          archivo.type,
      }
    );

  if (error) {
    throw error;
  }

  const {
    data: datosUrl,
  } = supabase
    .storage
    .from(BUCKET_MIEMBROS)
    .getPublicUrl(ruta);

  return {
    fotoUrl:
      datosUrl.publicUrl,
    fotoPath:
      ruta,
  };
}

function inicializarModalNuevoMiembro(
  onMiembroGuardado
) {
  const modal = document.querySelector(
    "#modalNuevoMiembro"
  );

  const abrir = document.querySelector(
    "#btnNuevoMiembro"
  );

  const cancelar = document.querySelector(
    "#cancelarNuevoMiembro"
  );

  const botonEliminar = document.querySelector(
    "#eliminarMiembro"
  );

  const formulario = document.querySelector(
    "#formNuevoMiembro"
  );

  const tituloModal = document.querySelector(
    "#modalNuevoTitulo"
  );

  const descripcionModal = document.querySelector(
    "#modalMiembroDescripcion"
  );

  const textoGuardar = document.querySelector(
    "#textoGuardarMiembro"
  );

  const fotoHint = document.querySelector(
    "#fotoHint"
  );

  const nombre = document.querySelector(
    "#nuevoNombre"
  );

  const apellidos = document.querySelector(
    "#nuevoApellidos"
  );

  const telefono = document.querySelector(
    "#nuevoTelefono"
  );

  const fechaNacimiento = document.querySelector(
    "#nuevoNacimiento"
  );

  const membresia = document.querySelector(
    "#nuevoMembresia"
  );

  const fechaInicio = document.querySelector(
    "#nuevoInicio"
  );

  const fechaVencimiento = document.querySelector(
    "#nuevoVencimiento"
  );

  const fechaIncorporacion = document.querySelector(
    "#nuevoIncorporacion"
  );

  const costo = document.querySelector(
    "#nuevoCosto"
  );

  const saldo = document.querySelector(
    "#nuevoSaldo"
  );

  const btnTomarFoto = document.querySelector(
    "#btnTomarFoto"
  );

  const inputFoto = document.querySelector(
    "#inputFotoMiembro"
  );

  const fotoPreview = document.querySelector(
    "#fotoPreview"
  );

  const fotoPlaceholder = document.querySelector(
    "#fotoPlaceholder"
  );

  const botonGuardar = document.querySelector(
    "#guardarMiembro"
  );

  if (
    !modal ||
    !abrir ||
    !formulario ||
    !nombre ||
    !apellidos ||
    !telefono ||
    !fechaNacimiento ||
    !membresia ||
    !fechaInicio ||
    !fechaVencimiento ||
    !fechaIncorporacion ||
    !costo ||
    !saldo
  ) {
    return null;
  }

  let fotoTemporal = null;
  let urlPreview = null;
  let miembroEditando = null;

  function liberarObjectURL() {
    if (urlPreview) {
      URL.revokeObjectURL(urlPreview);
      urlPreview = null;
    }
  }

  function limpiarFotoTemporal() {
    fotoTemporal = null;

    if (inputFoto) {
      inputFoto.value = "";
    }

    liberarObjectURL();
  }

  function mostrarPlaceholderFoto() {
    if (fotoPreview) {
      fotoPreview.src = "";
      fotoPreview.hidden = true;
    }

    if (fotoPlaceholder) {
      fotoPlaceholder.hidden = false;
    }
  }

  function mostrarFoto(url) {
    if (!url) {
      mostrarPlaceholderFoto();
      return;
    }

    if (fotoPreview) {
      fotoPreview.src = url;
      fotoPreview.hidden = false;
    }

    if (fotoPlaceholder) {
      fotoPlaceholder.hidden = true;
    }
  }

  function limpiarPreviewFoto() {
    limpiarFotoTemporal();
    mostrarPlaceholderFoto();
  }

  btnTomarFoto?.addEventListener(
    "click",
    () => {
      inputFoto?.click();
    }
  );

  inputFoto?.addEventListener(
    "change",
    (event) => {
      const archivo =
        event.target.files?.[0];

      if (!archivo) {
        return;
      }

      if (
        !archivo.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Selecciona una imagen válida."
        );

        inputFoto.value = "";
        return;
      }

      fotoTemporal = archivo;
      liberarObjectURL();

      urlPreview =
        URL.createObjectURL(
          archivo
        );

      mostrarFoto(urlPreview);
    }
  );

  function actualizarMembresia() {
    const plan =
      membresiasDisponibles.find(
        (item) =>
          item.id ===
          membresia.value
      );

    costo.value =
      plan?.precio ?? 0;

    fechaVencimiento.value =
      calcularFechaVencimiento(
        fechaInicio.value,
        plan
      );
  }

  function prepararModoNuevo() {
    miembroEditando = null;
    formulario.reset();
    limpiarPreviewFoto();

    const hoy = fechaInputHoy();

    fechaIncorporacion.value = hoy;
    fechaInicio.value = hoy;
    costo.value = 0;
    saldo.value = 0;
    fechaVencimiento.value = "";

    if (tituloModal) {
      tituloModal.textContent =
        "Nuevo miembro";
    }

    if (descripcionModal) {
      descripcionModal.textContent =
        "Registra un nuevo integrante de la comunidad.";
    }

    if (textoGuardar) {
      textoGuardar.textContent =
        "Guardar miembro";
    }

    if (fotoHint) {
      fotoHint.textContent =
        "Tomar foto";
    }

    if (botonEliminar) {
      botonEliminar.hidden = true;
    }
  }

  function prepararModoEdicion(miembro) {
    miembroEditando = miembro;
    formulario.reset();
    limpiarFotoTemporal();

    nombre.value =
      miembro.nombreBase || "";

    apellidos.value =
      miembro.apellidos || "";

    telefono.value =
      miembro.telefono === "Sin teléfono"
        ? ""
        : miembro.telefono || "";

    fechaNacimiento.value =
      miembro.fechaNacimiento || "";

    fechaIncorporacion.value =
      miembro.fechaInscripcion || "";

    membresia.value =
      miembro.tipoMembresiaId || "";

    fechaInicio.value =
      miembro.fechaInicio || "";

    fechaVencimiento.value =
      miembro.fechaVencimiento || "";

    costo.value =
      Number(
        miembro.costoMembresia || 0
      );

    saldo.value =
      Number(
        miembro.saldoPendiente || 0
      );

    mostrarFoto(
      miembro.fotoUrl ||
      miembro.foto ||
      ""
    );

    if (tituloModal) {
      tituloModal.textContent =
        "Editar miembro";
    }

    if (descripcionModal) {
      descripcionModal.textContent =
        "Actualiza la información del miembro seleccionado.";
    }

    if (textoGuardar) {
      textoGuardar.textContent =
        "Guardar cambios";
    }

    if (fotoHint) {
      fotoHint.textContent =
        "Cambiar foto";
    }

    if (botonEliminar) {
      botonEliminar.hidden = false;
    }
  }

  function mostrarModal() {
    modal.hidden = false;

    requestAnimationFrame(() => {
      modal.classList.add(
        "open"
      );
    });

    document.body.classList.add(
      "modal-open"
    );

    setTimeout(() => {
      nombre.focus();
    }, 100);
  }

  function abrirModalNuevo() {
    prepararModoNuevo();
    mostrarModal();
  }

  function abrirModalEdicion(miembro) {
    if (!miembro) {
      return;
    }

    prepararModoEdicion(miembro);
    mostrarModal();
  }

  function cerrarModal() {
    modal.classList.remove(
      "open"
    );

    document.body.classList.remove(
      "modal-open"
    );

    limpiarFotoTemporal();

    setTimeout(() => {
      modal.hidden = true;
    }, 180);
  }

  abrir.addEventListener(
    "click",
    abrirModalNuevo
  );

  cancelar?.addEventListener(
    "click",
    cerrarModal
  );

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        cerrarModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !modal.hidden
      ) {
        cerrarModal();
      }
    }
  );

  membresia.addEventListener(
    "change",
    actualizarMembresia
  );

  fechaInicio.addEventListener(
    "change",
    actualizarMembresia
  );

  botonEliminar?.addEventListener(
    "click",
    async () => {
      if (!miembroEditando) {
        return;
      }

      const confirmar = confirm(
        `¿Eliminar a ${miembroEditando.nombre}?\n\nEsta acción eliminará el registro del miembro.`
      );

      if (!confirmar) {
        return;
      }

      const idMiembro =
        miembroEditando.idMiembro ||
        Number(miembroEditando.id);

      const fotoAnterior =
        miembroEditando.fotoPath || null;

      try {
        botonEliminar.disabled = true;
        botonEliminar.textContent =
          "Eliminando...";

        if (botonGuardar) {
          botonGuardar.disabled = true;
        }

        const { error } =
          await supabase
            .from("miembros")
            .delete()
            .eq("id", idMiembro);

        if (error) {
          throw error;
        }

        if (fotoAnterior) {
          const {
            error: errorFoto,
          } = await supabase
            .storage
            .from(
              BUCKET_MIEMBROS
            )
            .remove([
              fotoAnterior,
            ]);

          if (errorFoto) {
            console.warn(
              "El miembro se eliminó, pero no se pudo borrar su fotografía:",
              errorFoto
            );
          }
        }

        cerrarModal();
        await onMiembroGuardado?.();

      } catch (error) {
        console.error(
          "Error al eliminar miembro:",
          error
        );

        alert(
          `No fue posible eliminar al miembro: ${error.message}`
        );

      } finally {
        botonEliminar.disabled = false;
        botonEliminar.textContent =
          "Eliminar miembro";

        if (botonGuardar) {
          botonGuardar.disabled = false;
        }
      }
    }
  );

  formulario.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (
        !formulario.checkValidity()
      ) {
        formulario.reportValidity();
        return;
      }

      const datos =
        Object.fromEntries(
          new FormData(
            formulario
          )
        );

      datos.costoMembresia =
        Number(
          datos.costoMembresia
        );

      datos.saldoPendiente =
        Number(
          datos.saldoPendiente
        );

      datos.estadoPago =
        datos.saldoPendiente > 0
          ? "pendiente"
          : "pagado";

      const esEdicion =
        Boolean(miembroEditando);

      const fotoAnteriorPath =
        miembroEditando?.fotoPath || null;

      let nuevaFoto = null;

      try {
        if (botonGuardar) {
          botonGuardar.disabled = true;
        }

        if (botonEliminar) {
          botonEliminar.disabled = true;
        }

        if (textoGuardar) {
          textoGuardar.textContent =
            esEdicion
              ? "Guardando cambios..."
              : "Guardando...";
        }

        if (fotoTemporal) {
          nuevaFoto =
            await subirFotoMiembro(
              fotoTemporal
            );
        }

        const payload = {
          nombre:
            datos.nombre.trim(),

          apellidos:
            datos.apellidos.trim(),

          telefono:
            datos.telefono.trim(),

          fecha_nacimiento:
            datos.fechaNacimiento,

          fecha_inscripcion:
            datos.fechaInscripcion,

          tipo_membresia_id:
            datos.tipoMembresiaId,

          fecha_inicio:
            datos.fechaInicio,

          fecha_vencimiento:
            datos.fechaVencimiento,

          costo_membresia:
            datos.costoMembresia,

          saldo_pendiente:
            datos.saldoPendiente,

          estado_pago:
            datos.estadoPago,

          foto_url:
            nuevaFoto?.fotoUrl ??
            miembroEditando?.fotoUrl ??
            null,

          foto_path:
            nuevaFoto?.fotoPath ??
            miembroEditando?.fotoPath ??
            null,
        };

        if (esEdicion) {
          const idMiembro =
            miembroEditando.idMiembro ||
            Number(miembroEditando.id);

          const { error } =
            await supabase
              .from("miembros")
              .update(payload)
              .eq("id", idMiembro);

          if (error) {
            throw error;
          }

          if (
            nuevaFoto?.fotoPath &&
            fotoAnteriorPath &&
            fotoAnteriorPath !==
              nuevaFoto.fotoPath
          ) {
            const {
              error: errorBorrarFoto,
            } = await supabase
              .storage
              .from(
                BUCKET_MIEMBROS
              )
              .remove([
                fotoAnteriorPath,
              ]);

            if (errorBorrarFoto) {
              console.warn(
                "Los cambios se guardaron, pero no se pudo borrar la fotografía anterior:",
                errorBorrarFoto
              );
            }
          }

        } else {
          const { error } =
            await supabase
              .from("miembros")
              .insert(payload);

          if (error) {
            throw error;
          }
        }

        formulario.reset();
        limpiarPreviewFoto();
        cerrarModal();

        await onMiembroGuardado?.();

      } catch (error) {
        console.error(
          esEdicion
            ? "Error al editar miembro:"
            : "Error al guardar miembro:",
          error
        );

        if (nuevaFoto?.fotoPath) {
          await supabase
            .storage
            .from(
              BUCKET_MIEMBROS
            )
            .remove([
              nuevaFoto.fotoPath,
            ]);
        }

        alert(
          esEdicion
            ? `No fue posible guardar los cambios: ${error.message}`
            : `No fue posible guardar al miembro: ${error.message}`
        );

      } finally {
        if (botonGuardar) {
          botonGuardar.disabled = false;
        }

        if (botonEliminar) {
          botonEliminar.disabled = false;
        }

        if (textoGuardar) {
          textoGuardar.textContent =
            esEdicion
              ? "Guardar cambios"
              : "Guardar miembro";
        }
      }
    }
  );

  return {
    abrirNuevo:
      abrirModalNuevo,

    abrirEdicion:
      abrirModalEdicion,

    cerrar:
      cerrarModal,
  };
}

export async function initMiembros() {
  const lista = document.querySelector(
    "#listaMiembros"
  );

  const buscador =
    document.querySelector(
      "#buscarMiembro"
    );

  const filtroEstado =
    document.querySelector(
      "#filtroEstado"
    );

  const filtroMembresia =
    document.querySelector(
      "#filtroMembresia"
    );

  const emptyState =
    document.querySelector(
      "#emptyState"
    );

  document
    .querySelectorAll(
      ".custom-select"
    )
    .forEach(
      inicializarSelectPersonalizado
    );

  document.addEventListener(
    "click",
    () => {
      document
        .querySelectorAll(
          ".custom-select.open"
        )
        .forEach((select) => {
          select.classList.remove(
            "open"
          );

          select
            .querySelector(
              ".select-trigger"
            )
            ?.setAttribute(
              "aria-expanded",
              "false"
            );
        });
    }
  );

  if (
    !lista ||
    !buscador ||
    !filtroEstado ||
    !filtroMembresia
  ) {
    return;
  }

  function actualizarLista() {
    const busqueda =
      normalizarTexto(
        buscador.value.trim()
      );

    const estado =
      filtroEstado.value;

    const membresia =
      filtroMembresia.value;

    const filtrados =
      miembros.filter(
        (miembro) => {
          const textoMiembro =
            normalizarTexto(`
              ${miembro.nombre}
              ${miembro.telefono}
              ${miembro.email}
            `);

          const coincideBusqueda =
            !busqueda ||
            textoMiembro.includes(
              busqueda
            );

          const coincideEstado =
            estado === "todos" ||
            miembro.estado ===
              estado;

          const coincideMembresia =
            membresia === "todas" ||
            miembro.membresia ===
              membresia;

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideMembresia
          );
        }
      );

    lista.innerHTML =
      filtrados
        .map(
          crearTarjetaMiembro
        )
        .join("");

    if (emptyState) {
      emptyState.hidden =
        filtrados.length !== 0;
    }
  }

  function actualizarEstadisticas() {
    const total =
      miembros.length;

    const activos =
      miembros.filter(
        (miembro) =>
          miembro.estado ===
          "activo"
      ).length;

    const totalElement =
      document.querySelector(
        "#statTotal"
      );

    const activosElement =
      document.querySelector(
        "#statActivos"
      );

    if (totalElement) {
      totalElement.textContent =
        total;
    }

    if (activosElement) {
      activosElement.textContent =
        activos;
    }
  }

  async function recargarMiembros() {
    await cargarMiembrosSupabase();
    actualizarEstadisticas();
    actualizarLista();
  }

  buscador.addEventListener(
    "input",
    actualizarLista
  );

  filtroEstado.addEventListener(
    "change",
    actualizarLista
  );

  filtroMembresia.addEventListener(
    "change",
    actualizarLista
  );

  await Promise.all([
    cargarMembresiasSupabase(),
    cargarMiembrosSupabase(),
  ]);

  actualizarEstadisticas();
  actualizarLista();

  const controladorModalMiembro =
    inicializarModalNuevoMiembro(
      recargarMiembros
    );

  lista.addEventListener(
    "click",
    manejarAcciones
  );

  function manejarAcciones(event) {
    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) return;

    const id =
      button.dataset.id;

    const action =
      button.dataset.action;

    const miembro =
      miembros.find(
        (item) =>
          item.id === id
      );

    if (!miembro) return;

    if (action === "editar") {
      controladorModalMiembro
        ?.abrirEdicion(
          miembro
        );

      return;
    }

    if (action === "opciones") {
      console.log(
        "Opciones:",
        miembro
      );
    }
  }
}
