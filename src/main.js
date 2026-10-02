import {
  renderMiembros,
  initMiembros
} from "./pages/miembros.js";

import {
  renderMembresias,
  initMembresias
} from "./pages/membresias.js";

import {
  renderLogin,
  initLogin
} from "./pages/login.js";

import "./css/login.css";

const app = document.querySelector("#app");


/* =========================================================
   NAVEGACIÓN
========================================================= */

async function navegar(page) {

  if (page === "miembros") {

    app.innerHTML = renderMiembros();

    await initMiembros();

    return;
  }


  if (page === "membresias") {

    app.innerHTML = renderMembresias();

    await initMembresias();

    return;
  }


  if (page === "analiticas") {

    console.log(
      "Página Analíticas próximamente"
    );

    return;
  }
}


/* =========================================================
   LOGIN
========================================================= */

function estaAutenticado() {

  return (
    sessionStorage.getItem(
      "cronos_authenticated"
    ) === "true"
  );

}


function mostrarLogin() {

  app.innerHTML = renderLogin();

  initLogin(() => {

    navegar("miembros");

  });

}


/* =========================================================
   NAVEGACIÓN DEL MENÚ
========================================================= */

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


/* =========================================================
   INICIO DE LA APLICACIÓN
========================================================= */

if (estaAutenticado()) {

  navegar("miembros");

} else {

  mostrarLogin();

}