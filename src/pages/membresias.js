import "../css/membresias.css";
import logo from "../assets/logo.png";
import { supabase } from "../supabase.js";

const icons = {
  users: `
    <svg viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  `,

  database: `
    <svg viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="8" ry="3"/>
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/>
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>
    </svg>
  `,

  chart: `
    <svg viewBox="0 0 24 24">
      <path d="M4 20V10"/>
      <path d="M10 20V4"/>
      <path d="M16 20v-7"/>
      <path d="M22 20V7"/>
    </svg>
  `,

  calendar: `
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M16 3v4M8 3v4M3 10h18"/>
      <path d="M8 14h2M14 14h2M8 18h2M14 18h2"/>
    </svg>
  `,

  dollar: `
    <svg viewBox="0 0 24 24">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  `,

  edit: `
    <svg viewBox="0 0 24 24">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>
    </svg>
  `,

  trash: `
    <svg viewBox="0 0 24 24">
      <path d="M3 6h18"/>
      <path d="M8 6V4h8v2"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v5M14 11v5"/>
    </svg>
  `,

  plus: `
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  `,
};

function formatoDinero(valor) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(valor);
}

function formatearDuracion(duracion, unidad) {
  const cantidad = Number(duracion);

  const unidades = {
    dia: cantidad === 1 ? "día" : "días",
    semana: cantidad === 1 ? "semana" : "semanas",
    mes: cantidad === 1 ? "mes" : "meses",
    ano: cantidad === 1 ? "año" : "años",
  };

  return `${cantidad} ${unidades[unidad] || unidad}`;
}


function crearTarjetaMembresia(membresia) {
  return `
    <article class="membership-card">

      <div class="membership-icon">
        ${icons.calendar}
      </div>

      <h2 class="membership-name">
        ${membresia.nombre}
      </h2>

      <div class="membership-divider"></div>

      <div class="membership-info">

        <div class="membership-row">
          <div class="membership-row-icon">
            ${icons.calendar}
          </div>

          <div>
            <span>Duración</span>
            <strong>
              ${formatearDuracion(
                membresia.duracion,
                membresia.unidadDuracion
              )}
            </strong>
          </div>
        </div>

        <div class="membership-row">
          <div class="membership-row-icon price-icon">
            ${icons.dollar}
          </div>

          <div>
            <span>Costo</span>
            <strong>${formatoDinero(membresia.precio)}</strong>
          </div>
        </div>

      </div>

      <div class="membership-actions">

        <button
          type="button"
          class="btn-membership-edit"
          data-id="${membresia.id}"
        >
          <span>${icons.edit}</span>
          Editar
        </button>

        <button
          type="button"
          class="btn-membership-delete"
          data-id="${membresia.id}"
        >
          <span>${icons.trash}</span>
          Eliminar
        </button>

      </div>

    </article>
  `;
}

export function renderMembresias() {
  return `
    <div class="cronos-app">

      <header class="main-header">

        <div class="header-inner">

          <a href="#" class="brand">

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

          <nav class="main-nav">

            <button class="nav-item" data-page="miembros">
              <span class="nav-icon">
                ${icons.users}
              </span>

              Miembros
            </button>

            <button class="nav-item active" data-page="membresias">
              <span class="nav-icon">
                ${icons.database}
              </span>

              Membresías
            </button>

            <button class="nav-item" data-page="analiticas">
              <span class="nav-icon">
                ${icons.chart}
              </span>

              Analíticas
            </button>

          </nav>

        </div>

      </header>


      <section class="membership-hero">

        <div class="membership-hero-inner">

          <div>
            <h1>Gestión de Membresías</h1>

            <p>
              Administra los planes disponibles del gimnasio.
            </p>
          </div>

<button
  type="button"
  class="btn-add-membership"
>
  <span>+</span>
  Agregar membresía
</button>

        </div>

      </section>


      <main class="memberships-container">

<section
  class="memberships-grid"
  id="listaMembresias"
>
</section>

      </main>


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

    </div>

    <!-- ==================== MODAL NUEVA MEMBRESÍA ==================== -->

<div class="membership-modal-overlay" id="membershipModal" hidden>

  <div class="membership-modal">

    <!-- HEADER -->
    <div class="membership-modal-header">

      <div class="membership-modal-icon">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <circle cx="8" cy="10" r="2"/>
          <path d="M5.5 16c.6-2 4.4-2 5 0"/>
          <path d="M14 9h4"/>
          <path d="M14 13h4"/>
        </svg>
      </div>

      <div class="membership-modal-title">
  <h2 id="membershipModalTitle">
    Agregar membresía
  </h2>

  <p id="membershipModalDescription">
    Crea un nuevo plan para el gimnasio.
  </p>
</div>

    </div>


    <!-- FORMULARIO -->
    <form id="membershipForm">

      <!-- NOMBRE -->
      <label class="membership-form-field">

        <span>Nombre de la membresía</span>

        <input
          type="text"
          id="membershipName"
          class="membership-input"
          placeholder="Ej. Mensual"
        >

      </label>


      <!-- COSTO -->
      <label class="membership-form-field">

        <span>Costo</span>

        <div class="membership-price-input">

          <span class="price-prefix">$</span>

          <input
            type="number"
            id="membershipPrice"
            placeholder="0"
            min="0"
          >

        </div>

      </label>


      <!-- DURACIÓN + UNIDAD -->
      <div class="membership-duration-grid">

        <label class="membership-form-field">

          <span>Duración</span>

          <input
            type="number"
            id="membershipDuration"
            class="membership-input"
            value="1"
            min="1"
          >

        </label>


        <label class="membership-form-field">

          <span>Unidad</span>

          <select
            id="membershipUnit"
            class="membership-select"
          >
<option value="dia">Día(s)</option>
<option value="semana">Semana(s)</option>
<option value="mes" selected>Mes(es)</option>
<option value="ano">Año(s)</option>
          </select>

        </label>

      </div>


      <!-- FOOTER -->
      <div class="membership-modal-footer">

        <button
          type="button"
          class="btn-membership-cancel"
          id="btnCancelarMembership"
        >
          Cancelar
        </button>


        <button
          type="submit"
          class="btn-membership-save"
          id="btnGuardarMembership"
        >
          <span>
            <svg viewBox="0 0 24 24">
              <path d="M5 3h12l2 2v16H5z"/>
              <path d="M8 3v6h8V3"/>
              <path d="M8 21v-8h8v8"/>
            </svg>
          </span>

          Guardar membresía
        </button>

      </div>

    </form>

  </div>

</div>
  `;
}

let membresiaEditandoId = null;

export async function initMembresias() {
  const modalTitulo = document.getElementById("membershipModalTitle");
  const modalDescripcion = document.getElementById("membershipModalDescription");
  const btnGuardar = document.getElementById("btnGuardarMembership");
  const btnAgregar = document.querySelector(".btn-add-membership");
  const modal = document.getElementById("membershipModal");
  const btnCancelar = document.getElementById("btnCancelarMembership");
  const form = document.getElementById("membershipForm");

  const inputNombre = document.getElementById("membershipName");
  const inputCosto = document.getElementById("membershipPrice");
  const inputDuracion = document.getElementById("membershipDuration");
  const selectUnidad = document.getElementById("membershipUnit");
  const listaMembresias = document.getElementById("listaMembresias");

  async function cargarMembresias() {
    if (!listaMembresias) return;

    listaMembresias.innerHTML = `
      <p class="memberships-empty">
        Cargando membresías...
      </p>
    `;

    const { data, error } = await supabase
      .from("membresias")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al cargar membresías:", error);

      listaMembresias.innerHTML = `
        <p class="memberships-empty">
          No fue posible cargar las membresías.
        </p>
      `;
      return;
    }

    const membresias = (data || []).map((membresia) => ({
      id: membresia.id,
      nombre: membresia.nombre,
      precio: Number(membresia.precio || 0),
      duracion: Number(membresia.duracion || 1),
      unidadDuracion: membresia.unidad_duracion,
      activo: membresia.activo,
    }));

    if (membresias.length === 0) {
      listaMembresias.innerHTML = `
        <p class="memberships-empty">
          No hay membresías registradas.
        </p>
      `;
      return;
    }

    listaMembresias.innerHTML = membresias
      .map(crearTarjetaMembresia)
      .join("");
  }

  function abrirModal() {
    if (!modal) return;

    modal.hidden = false;

    requestAnimationFrame(() => {
      modal.classList.add("open");
    });

    document.body.classList.add("modal-open");

    setTimeout(() => {
      inputNombre?.focus();
    }, 100);
  }

  function cerrarModal() {
    if (!modal) return;

    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

    setTimeout(() => {
      modal.hidden = true;
    }, 180);
  }

  function prepararModalNueva() {
    membresiaEditandoId = null;
    form?.reset();

    if (inputDuracion) {
      inputDuracion.value = "1";
    }

    if (selectUnidad) {
      selectUnidad.value = "mes";
    }

    if (modalTitulo) {
      modalTitulo.textContent = "Agregar membresía";
    }

    if (modalDescripcion) {
      modalDescripcion.textContent =
        "Crea un nuevo plan para el gimnasio.";
    }

    if (btnGuardar) {
      btnGuardar.innerHTML = `
        <span>
          <svg viewBox="0 0 24 24">
            <path d="M5 3h12l2 2v16H5z"/>
            <path d="M8 3v6h8V3"/>
            <path d="M8 21v-8h8v8"/>
          </svg>
        </span>
        Guardar membresía
      `;
    }

    abrirModal();
  }

  btnAgregar?.addEventListener("click", prepararModalNueva);

  btnCancelar?.addEventListener("click", cerrarModal);

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      cerrarModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal &&
      !modal.hidden
    ) {
      cerrarModal();
    }
  });

  listaMembresias?.addEventListener("click", async (event) => {
    const botonEditar = event.target.closest(".btn-membership-edit");

    if (botonEditar) {
      const id = botonEditar.dataset.id;

      if (!id) return;

      const { data: membresia, error } = await supabase
        .from("membresias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error al cargar membresía:", error);
        alert("No fue posible cargar esta membresía.");
        return;
      }

      membresiaEditandoId = id;

      inputNombre.value = membresia.nombre ?? "";
      inputCosto.value = Number(membresia.precio ?? 0);
      inputDuracion.value = Number(membresia.duracion ?? 1);
      selectUnidad.value = membresia.unidad_duracion ?? "mes";

      if (modalTitulo) {
        modalTitulo.textContent = "Editar membresía";
      }

      if (modalDescripcion) {
        modalDescripcion.textContent =
          "Actualiza la información de este plan.";
      }

      if (btnGuardar) {
        btnGuardar.innerHTML = `
          <span>
            <svg viewBox="0 0 24 24">
              <path d="M5 3h12l2 2v16H5z"/>
              <path d="M8 3v6h8V3"/>
              <path d="M8 21v-8h8v8"/>
            </svg>
          </span>
          Guardar cambios
        `;
      }

      abrirModal();
      return;
    }

    const botonEliminar = event.target.closest(".btn-membership-delete");

    if (botonEliminar) {
      const id = botonEliminar.dataset.id;

      if (!id) return;

      const confirmar = confirm(
        "¿Seguro que deseas eliminar esta membresía?"
      );

      if (!confirmar) return;

      const { error } = await supabase
        .from("membresias")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error al eliminar membresía:", error);

        if (error.code === "23503") {
          alert(
            "Esta membresía está asociada a uno o más miembros y no puede eliminarse."
          );
        } else {
          alert("No fue posible eliminar la membresía.");
        }

        return;
      }

      await cargarMembresias();
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombre = inputNombre?.value.trim();
    const precio = Number(inputCosto?.value);
    const duracion = Number(inputDuracion?.value);
    const unidadDuracion = selectUnidad?.value;

    if (!nombre) {
      inputNombre?.focus();
      return;
    }

    if (!precio || precio <= 0) {
      inputCosto?.focus();
      return;
    }

    if (!duracion || duracion <= 0) {
      inputDuracion?.focus();
      return;
    }

    const datosMembresia = {
      nombre,
      precio,
      duracion,
      unidad_duracion: unidadDuracion,
      activo: true,
      updated_at: new Date().toISOString(),
    };

    try {
      if (btnGuardar) {
        btnGuardar.disabled = true;
      }

      if (membresiaEditandoId) {
        const { error } = await supabase
          .from("membresias")
          .update(datosMembresia)
          .eq("id", membresiaEditandoId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("membresias")
          .insert(datosMembresia);

        if (error) throw error;
      }

      membresiaEditandoId = null;
      cerrarModal();
      form.reset();

      if (inputDuracion) {
        inputDuracion.value = "1";
      }

      if (selectUnidad) {
        selectUnidad.value = "mes";
      }

      await cargarMembresias();
    } catch (error) {
      console.error("Error al guardar membresía:", error);
      alert(`No fue posible guardar la membresía: ${error.message}`);
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
      }
    }
  });

  await cargarMembresias();
}
