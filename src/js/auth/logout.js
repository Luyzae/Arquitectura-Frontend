document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-button");
  if (!logoutBtn) return;

  function updateAuthButton() {
    const token = localStorage.getItem("soundhub_access_token");
    const isLoggedIn = !!token;

    if (isLoggedIn) {
      logoutBtn.innerHTML = `
        <span class="material-symbols-outlined text-xl">logout</span>
        <span>Cerrar sesión</span>
      `;
      logoutBtn.onclick = handleLogout;
    } else {
      logoutBtn.innerHTML = `
        <span class="material-symbols-outlined text-xl">login</span>
        <span>Iniciar sesión</span>
      `;
      logoutBtn.onclick = handleLogin;
    }
  }

  function handleLogout() {
    localStorage.removeItem("soundhub_access_token");
    localStorage.removeItem("soundhub_user_id");

    // Astro page
    window.location.href = "/iniciarsesion";
  }

  function handleLogin() {
    // Astro page
    window.location.href = "/iniciarsesion";
  }

  updateAuthButton();
  window.addEventListener("storage", updateAuthButton);
});
