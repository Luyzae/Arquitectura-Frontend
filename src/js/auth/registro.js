import { API_GATEWAY_URL } from "../api/config.js";

window.togglePasswordVisibility = function (inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input || !icon) return;

  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "visibility";
  } else {
    input.type = "password";
    icon.textContent = "visibility_off";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("register-username");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  const confirmInput = document.getElementById("register-password-confirm");
  const submitBtn = document.getElementById("register-submit");
  const messageEl = document.getElementById("register-message");

  function setMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = "text-center text-sm mt-2";

    if (type === "error") {
      messageEl.classList.add("text-red-400");
    } else if (type === "success") {
      messageEl.classList.add("text-green-400");
    } else {
      messageEl.classList.add("text-[#a89db9]");
    }
  }

  function validateFields() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!username || !email || !password || !confirm) {
      setMessage("Completa todos los campos.", "error");
      return null;
    }

    if (!email.includes("@")) {
      setMessage("Ingresa un correo electrónico válido.", "error");
      return null;
    }

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.", "error");
      return null;
    }

    if (password !== confirm) {
      setMessage("Las contraseñas no coinciden.", "error");
      return null;
    }

    return { username, email, password };
  }

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    setMessage("");

    const values = validateFields();
    if (!values) return;

    const { username, email, password } = values;

    const redirectUrl = `${window.location.origin}/verificado`;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creando cuenta...";

    try {
      const response = await fetch(`${API_GATEWAY_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          redirectUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.valid) {
        setMessage(
          data.error || "No se pudo crear la cuenta.",
          "error"
        );
        return;
      }

      setMessage(
        "Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta.",
        "success"
      );

      usernameInput.value = "";
      emailInput.value = "";
      passwordInput.value = "";
      confirmInput.value = "";
    } catch (err) {
      console.error(err);
      setMessage("Error inesperado al crear la cuenta.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Crear cuenta";
    }
  });
});
