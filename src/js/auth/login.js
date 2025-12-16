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
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const submitBtn = document.getElementById("login-submit");
  const messageEl = document.getElementById("login-message");

  function setMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = "text-center text-xs mt-1 min-h-[1.25rem]";

    if (type === "error") messageEl.classList.add("text-red-400");
    else if (type === "success") messageEl.classList.add("text-green-400");
    else messageEl.classList.add("text-[#a89db9]");
  }

  function validateFields() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      setMessage("Ingresa tu correo y contraseña.", "error");
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

    return { email, password };
  }

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    setMessage("");

    const values = validateFields();
    if (!values) return;

    const { email, password } = values;

    submitBtn.disabled = true;
    submitBtn.textContent = "Iniciando sesión...";

    try {
      const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setMessage(data.error || "No se pudo iniciar sesión.", "error");
        return;
      }

      localStorage.setItem("soundhub_access_token", data.accessToken);
      localStorage.setItem("soundhub_user_id", data.userId);

      setMessage("Inicio de sesión exitoso, redirigiendo...", "success");

      setTimeout(() => {
        window.location.href = "/app";
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage("Error inesperado al iniciar sesión.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Iniciar sesión";
    }
  });
});
