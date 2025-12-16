import { API_GATEWAY_URL } from "../api/config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("main-search-form");
  const input = document.getElementById("main-search-input");
  const suggestionsContainer = document.getElementById(
    "main-search-suggestions"
  );

  if (!form || !input || !suggestionsContainer) return;

  let typingTimeout = null;
  let lastRequestId = 0;

  function clearSuggestions() {
    suggestionsContainer.innerHTML = "";
    suggestionsContainer.classList.add("hidden");
  }

  function showSuggestions() {
    suggestionsContainer.classList.remove("hidden");
  }

  function scrollToResults() {
    const target =
      document.getElementById("results-container") ||
      document.getElementById("view-search");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function runSearchInSearchView(q) {
    window.location.hash = "#search";

    setTimeout(() => {
      const searchInput = document.getElementById("search-input");
      const searchForm = document.getElementById("search-form");

      if (searchInput && searchForm) {
        searchInput.value = q;
        searchForm.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }

      scrollToResults();
    }, 0);
  }

  function renderSuggestions(items) {
    clearSuggestions();

    if (!items || !items.length) return;

    showSuggestions();

    items.slice(0, 5).forEach((track) => {
      const title = track.title || "Título desconocido";
      const artistsArr = Array.isArray(track.artists) ? track.artists : [];
      const artists =
        artistsArr.length > 0 ? artistsArr.join(", ") : "Artista desconocido";

      const row = document.createElement("button");
      row.type = "button";
      row.className =
        "w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-white/10 text-sm text-white";

      row.innerHTML = `
        <span class="material-symbols-outlined text-base">music_note</span>
        <div class="flex-1 min-w-0">
          <p class="truncate" title="${title}">${title}</p>
          <p class="text-[11px] text-stone-400 truncate" title="${artists}">
            ${artists}
          </p>
        </div>
      `;

      row.addEventListener("click", () => {
        clearSuggestions();
        runSearchInSearchView(title);
      });

      suggestionsContainer.appendChild(row);
    });
  }

  async function searchSuggestions(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      lastRequestId++;
      clearSuggestions();
      return;
    }

    const currentRequestId = ++lastRequestId;

    const url = `${API_GATEWAY_URL}/music/search?query=${encodeURIComponent(
      trimmed
    )}&limit=15`;

    try {
      const res = await fetch(url);
      if (currentRequestId !== lastRequestId) return;
      if (!res.ok) throw new Error("Respuesta no OK");

      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      renderSuggestions(items);
    } catch (err) {
      if (currentRequestId !== lastRequestId) return;
      console.error("Error en sugerencias de inicio:", err);
      clearSuggestions();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;

    clearSuggestions();
    runSearchInSearchView(q);
  });

  input.addEventListener("input", () => {
    const value = input.value;

    if (!value.trim()) {
      clearSuggestions();
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      searchSuggestions(value);
    }, 350);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      clearSuggestions();
    }, 150);
  });
});
