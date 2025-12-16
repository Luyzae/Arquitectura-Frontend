const routes = {
  home: "view-home",
  search: "view-search",
  library: "view-library",
};

function showRoute(routeName) {
  const viewId = routes[routeName] || routes.home;

  document.querySelectorAll(".app-view").forEach((view) => {
    view.classList.add("hidden");
  });

  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-link").forEach((link) => {
    const isActive = link.dataset.route === routeName;
    link.classList.remove("bg-primary/20", "text-white");
    if (isActive) {
      link.classList.add("bg-primary/20", "text-white");
    }
  });

  const mainSearchForm = document.getElementById("main-search-form");
  const mainSearchInput = document.getElementById("main-search-input");
  const mainSearchSuggestions = document.getElementById(
    "main-search-suggestions"
  );

  if (mainSearchForm) {
    if (routeName === "home") {
      mainSearchForm.classList.remove("hidden");
    } else {
      mainSearchForm.classList.add("hidden");
      if (mainSearchInput) mainSearchInput.value = "";
      if (mainSearchSuggestions) {
        mainSearchSuggestions.innerHTML = "";
        mainSearchSuggestions.classList.add("hidden");
      }
    }
  }

  if (location.hash !== "#" + routeName) {
    history.replaceState(null, "", "#" + routeName);
  }

  const main = document.querySelector("main");
  if (main) main.scrollTo({ top: 0, behavior: "instant" });
}

function handleHashChange() {
  const routeName = location.hash.replace("#", "") || "home";
  showRoute(routeName);
}

function initRouter() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const routeName = link.dataset.route || "home";
      window.location.hash = "#" + routeName;
    });
  });

  window.addEventListener("hashchange", handleHashChange);

  if (!location.hash) {
    window.location.hash = "#home";
  }
  handleHashChange();
}

document.addEventListener("DOMContentLoaded", initRouter);
