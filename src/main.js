import {
  renderMiembros,
  initMiembros
} from "./pages/miembros.js";

import {
  renderMembresias,
  initMembresias
} from "./pages/membresias.js";

const app =
  document.querySelector("#app");

async function navegar(page) {

  if (page === "miembros") {

    app.innerHTML =
      renderMiembros();

    await initMiembros();

    return;
  }

  if (page === "membresias") {

    app.innerHTML =
      renderMembresias();

    await initMembresias();

    return;
  }

  if (page === "analiticas") {

    console.log(
      "Página Analíticas próximamente"
    );
  }
}

document.addEventListener(
  "click",
  (event) => {

    const boton =
      event.target.closest(
        "[data-page]"
      );

    if (!boton) return;

    navegar(
      boton.dataset.page
    );
  }
);

navegar("miembros");