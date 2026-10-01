const PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD;

export function renderLogin() {
  return `
    <div class="login-page">
      <div class="login-card">

        <h1>Contraseña</h1>

        <form id="loginForm">

          <input
            id="loginPassword"
            type="password"
            placeholder="Contraseña"
            autocomplete="current-password"
            required
          >

          <button type="submit">
            Entrar
          </button>

          <p id="loginError" class="login-error"></p>

        </form>

      </div>
    </div>
  `;
}

export function initLogin(onSuccess) {
  const form = document.querySelector("#loginForm");
  const input = document.querySelector("#loginPassword");
  const error = document.querySelector("#loginError");

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (input.value === PASSWORD) {
      sessionStorage.setItem("cronos_authenticated", "true");

      onSuccess();
      return;
    }

    error.textContent = "Contraseña incorrecta.";
    input.value = "";
    input.focus();
  });
}