import { supabase } from "../supabase.js";

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

          <div class="login-actions">
            <button type="submit" class="login-main-button">
              Entrar
            </button>

            <button
              type="button"
              id="btnCambiarContrasena"
              class="login-change-button"
            >
              Cambiar contraseña
            </button>
          </div>

          <p id="loginError" class="login-error"></p>
        </form>

      </div>
    </div>

    <!-- MODAL CAMBIAR CONTRASEÑA -->
    <div class="change-password-overlay" id="changePasswordModal" hidden>
      <div class="change-password-card">

        <div class="change-password-header">
          <div>
            <h2>Cambiar contraseña</h2>
            <p>Confirma tu contraseña actual y escribe la nueva dos veces.</p>
          </div>

          <button
            type="button"
            id="btnCerrarCambiarContrasena"
            class="change-password-close"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form id="changePasswordForm">

          <label class="change-password-field">
            <span>Contraseña anterior</span>
            <input
              id="oldPassword"
              type="password"
              autocomplete="current-password"
              required
            >
          </label>

          <label class="change-password-field">
            <span>Nueva contraseña</span>
            <input
              id="newPassword"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
            >
          </label>

          <label class="change-password-field">
            <span>Repite la nueva contraseña</span>
            <input
              id="newPasswordConfirm"
              type="password"
              autocomplete="new-password"
              minlength="6"
              required
            >
          </label>

          <p id="changePasswordMessage" class="change-password-message"></p>

          <div class="change-password-actions">
            <button
              type="button"
              id="btnCancelarCambiarContrasena"
              class="change-password-cancel"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btnGuardarNuevaContrasena"
              class="change-password-save"
            >
              Guardar contraseña
            </button>
          </div>

        </form>
      </div>
    </div>
  `;
}

export function initLogin(onSuccess) {
  const form = document.querySelector("#loginForm");
  const input = document.querySelector("#loginPassword");
  const error = document.querySelector("#loginError");

  const btnCambiar = document.querySelector("#btnCambiarContrasena");
  const modal = document.querySelector("#changePasswordModal");
  const btnCerrar = document.querySelector("#btnCerrarCambiarContrasena");
  const btnCancelar = document.querySelector("#btnCancelarCambiarContrasena");

  const changeForm = document.querySelector("#changePasswordForm");
  const oldPassword = document.querySelector("#oldPassword");
  const newPassword = document.querySelector("#newPassword");
  const newPasswordConfirm = document.querySelector("#newPasswordConfirm");
  const changeMessage = document.querySelector("#changePasswordMessage");
  const btnGuardar = document.querySelector("#btnGuardarNuevaContrasena");

  function abrirCambiarContrasena() {
    if (!modal) return;

    modal.hidden = false;

    requestAnimationFrame(() => {
      modal.classList.add("open");
    });

    document.body.classList.add("modal-open");

    changeForm?.reset();

    if (changeMessage) {
      changeMessage.textContent = "";
      changeMessage.className = "change-password-message";
    }

    setTimeout(() => {
      oldPassword?.focus();
    }, 100);
  }

  function cerrarCambiarContrasena() {
    if (!modal) return;

    modal.classList.remove("open");
    document.body.classList.remove("modal-open");

    setTimeout(() => {
      modal.hidden = true;
    }, 180);
  }

  btnCambiar?.addEventListener("click", abrirCambiarContrasena);
  btnCerrar?.addEventListener("click", cerrarCambiarContrasena);
  btnCancelar?.addEventListener("click", cerrarCambiarContrasena);

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      cerrarCambiarContrasena();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      cerrarCambiarContrasena();
    }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (error) {
      error.textContent = "";
    }

    const password = input?.value?.trim();

    if (!password) {
      if (error) {
        error.textContent = "Escribe la contraseña.";
      }
      input?.focus();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "verificar_contrasena",
        {
          p_contrasena: password,
        }
      );

      if (rpcError) {
        console.error("Error al verificar contraseña:", rpcError);
        if (error) {
          error.textContent = "No fue posible verificar la contraseña.";
        }
        return;
      }

      if (data === true) {
        sessionStorage.setItem("cronos_authenticated", "true");
        onSuccess();
        return;
      }

      if (error) {
        error.textContent = "Contraseña incorrecta.";
      }

      if (input) {
        input.value = "";
        input.focus();
      }
    } catch (err) {
      console.error("Error en login:", err);

      if (error) {
        error.textContent = "Ocurrió un error al iniciar sesión.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  changeForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const anterior = oldPassword?.value?.trim() || "";
    const nueva = newPassword?.value?.trim() || "";
    const confirmacion = newPasswordConfirm?.value?.trim() || "";

    if (changeMessage) {
      changeMessage.textContent = "";
      changeMessage.className = "change-password-message";
    }

    if (!anterior || !nueva || !confirmacion) {
      if (changeMessage) {
        changeMessage.textContent = "Completa todos los campos.";
        changeMessage.classList.add("error");
      }
      return;
    }

    if (nueva.length < 6) {
      if (changeMessage) {
        changeMessage.textContent =
          "La nueva contraseña debe tener al menos 6 caracteres.";
        changeMessage.classList.add("error");
      }
      newPassword?.focus();
      return;
    }

    if (nueva !== confirmacion) {
      if (changeMessage) {
        changeMessage.textContent =
          "Las nuevas contraseñas no coinciden.";
        changeMessage.classList.add("error");
      }
      newPasswordConfirm?.focus();
      return;
    }

    if (anterior === nueva) {
      if (changeMessage) {
        changeMessage.textContent =
          "La nueva contraseña debe ser diferente a la anterior.";
        changeMessage.classList.add("error");
      }
      newPassword?.focus();
      return;
    }

    try {
      if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
      }

      const { data, error: rpcError } = await supabase.rpc(
        "cambiar_contrasena",
        {
          p_anterior: anterior,
          p_nueva: nueva,
        }
      );

      if (rpcError) {
        console.error("Error al cambiar contraseña:", rpcError);

        if (changeMessage) {
          changeMessage.textContent =
            "No fue posible cambiar la contraseña.";
          changeMessage.classList.add("error");
        }
        return;
      }

      if (data !== true) {
        if (changeMessage) {
          changeMessage.textContent =
            "La contraseña anterior es incorrecta.";
          changeMessage.classList.add("error");
        }

        oldPassword?.focus();
        return;
      }

      if (changeMessage) {
        changeMessage.textContent =
          "Contraseña cambiada correctamente.";
        changeMessage.classList.add("success");
      }

      changeForm.reset();

      setTimeout(() => {
        cerrarCambiarContrasena();

        if (error) {
          error.textContent = "Contraseña actualizada. Usa la nueva para entrar.";
        }

        input?.focus();
      }, 900);
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);

      if (changeMessage) {
        changeMessage.textContent =
          "Ocurrió un error al cambiar la contraseña.";
        changeMessage.classList.add("error");
      }
    } finally {
      if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar contraseña";
      }
    }
  });
}
