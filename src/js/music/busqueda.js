// /js/music/busqueda.js
import { API_GATEWAY_URL } from "../api/config.js";
import { player } from "./player.js";

function redirectToLogin() {
  window.location.href = "/iniciarsesion";
}

function ensureLoggedInForPlaybackSync() {
  const token = localStorage.getItem("soundhub_access_token");
  if (!token) {
    redirectToLogin();
    return false;
  }
  return true;
}

let currentSongs = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
  player.init();

  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const statusEl = document.getElementById("search-status");
  const resultsContainer = document.getElementById("results-container");
  const recentContainer = document.getElementById("recent-searches");
  const suggestionsContainer = document.getElementById("suggestions-container");
  const artistSection = document.getElementById("artist-section");
  const artistOverview = document.getElementById("artist-overview");

  const RECENT_KEY = "soundhub_recent_searches";
  const MAX_RECENT = 6;

  let typingTimeout = null;
  let lastRequestId = 0;

  function setStatus(text) {
    statusEl.textContent = text || "";
  }

  function clearResults() {
    resultsContainer.innerHTML = "";
  }

  function clearSuggestions() {
    suggestionsContainer.innerHTML = "";
    suggestionsContainer.classList.add("hidden");
  }

  function showSuggestionsContainer() {
    suggestionsContainer.classList.remove("hidden");
  }

  function clearArtist() {
    artistOverview.innerHTML = "";
    artistSection.classList.add("hidden");
  }

  function loadRecentSearches() {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveRecentSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) return;

    let recents = loadRecentSearches();
    recents = recents.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    recents.unshift(trimmed);

    if (recents.length > MAX_RECENT) recents = recents.slice(0, MAX_RECENT);

    localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
    renderRecentSearches();
  }

  function removeRecentSearch(query) {
    let recents = loadRecentSearches();
    recents = recents.filter((q) => q.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
    renderRecentSearches();
  }

  function renderRecentSearches() {
    const recents = loadRecentSearches();
    recentContainer.innerHTML = "";

    if (!recents.length) {
      recentContainer.innerHTML =
        '<p class="text-sm text-[#a89db9] px-1">No hay búsquedas recientes.</p>';
      return;
    }

    recents.forEach((query) => {
      const wrapper = document.createElement("div");
      wrapper.className =
        "group flex items-center gap-2 bg-white/5 hover:bg-white/10 text-[#a89db9] hover:text-white px-4 py-2 rounded-full cursor-pointer transition-colors duration-200";

      const label = document.createElement("span");
      label.className = "text-sm";
      label.textContent = query;

      wrapper.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        input.value = query;
        form.dispatchEvent(new Event("submit"));
      });

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "opacity-0 group-hover:opacity-100 transition-opacity";
      closeBtn.innerHTML =
        '<span class="material-symbols-outlined text-base">close</span>';

      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeRecentSearch(query);
      });

      wrapper.appendChild(label);
      wrapper.appendChild(closeBtn);
      recentContainer.appendChild(wrapper);
    });
  }

  function renderResults(items) {
    clearResults();
    currentSongs = Array.isArray(items) ? items : [];
    currentIndex = -1;

    if (!currentSongs.length) {
      resultsContainer.innerHTML =
        '<p class="text-sm text-[#a89db9] px-1">No se encontraron canciones.</p>';
      return;
    }

    currentSongs.forEach((track, index) => {
      const title = track.title || "Título desconocido";
      const artistsArr = Array.isArray(track.artists) ? track.artists : [];
      const artists =
        artistsArr.length > 0 ? artistsArr.join(", ") : "Artista desconocido";
      const album = track.album || "";
      const duration = track.duration || "";
      const thumbs = Array.isArray(track.thumbnails) ? track.thumbnails : [];
      const thumbUrl =
        thumbs.length > 0
          ? thumbs[thumbs.length - 1].url
          : "https://via.placeholder.com/80x80?text=♪";

      const card = document.createElement("article");
      card.className =
        "flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3";

      card.innerHTML = `
        <div class="w-14 h-14 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
          <img src="${thumbUrl}" alt="Portada de ${title}" class="w-full h-full object-cover" />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold truncate" title="${title}">
            ${title}
          </p>
          <p class="text-[#a89db9] text-xs truncate" title="${artists}">
            ${artists}${album ? " · " + album : ""}
          </p>
          ${
            duration
              ? `<p class="text-[#a89db9] text-[11px] mt-1">${duration}</p>`
              : ""
          }
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            class="save-to-playlist-btn rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white flex items-center gap-1 transition-colors"
            title="Guardar en playlist"
          >
            <span class="material-symbols-outlined text-sm">playlist_add</span>
          </button>
          <button
            type="button"
            class="play-track-btn rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white flex items-center gap-1 transition-colors"
          >
            <span class="material-symbols-outlined text-sm">play_arrow</span>
            <span>Reproducir</span>
          </button>
        </div>
      `;

      const playBtn = card.querySelector(".play-track-btn");
      playBtn.addEventListener("click", () => {
        if (!ensureLoggedInForPlaybackSync()) return;

        currentIndex = index;
        player.setQueueAndPlay(currentSongs, index);
      });

      const saveBtn = card.querySelector(".save-to-playlist-btn");
      saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const { showPlaylistSelector } = await import("./playlists.js");
        showPlaylistSelector(track, saveBtn);
      });

      resultsContainer.appendChild(card);
    });
  }

  function renderArtist(artist, songsForPreview = []) {
    if (!artist) {
      clearArtist();
      return;
    }

    const name = artist.name || "Artista desconocido";
    const subscribers = artist.subscribers || artist.details?.subscribers || null;
    const thumbs = artist.thumbnails || artist.details?.thumbnails || [];
    const thumbUrl =
      Array.isArray(thumbs) && thumbs.length
        ? thumbs[thumbs.length - 1].url
        : "https://via.placeholder.com/160x160?text=♪";

    const previewSongs = Array.isArray(songsForPreview)
      ? songsForPreview.slice(0, 3)
      : [];

    artistOverview.innerHTML = `
      <div class="flex items-center gap-4 w-full">
        <div class="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
          <img src="${thumbUrl}" alt="Imagen de ${name}" class="w-full h-full object-cover" />
        </div>

        <div class="flex-1 flex flex-col gap-2 min-w-0">
          <p class="text-xs uppercase tracking-[0.16em] text-[#a89db9]">Artista</p>
          <h3 class="text-white text-2xl md:text-3xl font-bold truncate">${name}</h3>
          ${
            subscribers
              ? `<p class="text-sm text-[#a89db9]">${subscribers}</p>`
              : ""
          }

          <div class="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full bg-white text-black px-4 py-1.5 text-xs font-semibold"
            >
              <span class="material-symbols-outlined text-sm">shuffle</span>
              Aleatorio
            </button>
            <button
              type="button"
              class="flex items-center gap-2 rounded-full bg-white/10 text-white px-4 py-1.5 text-xs font-semibold"
            >
              <span class="material-symbols-outlined text-sm">radio</span>
              Radio
            </button>
          </div>
        </div>

        ${
          previewSongs.length
            ? `
        <div class="hidden md:flex flex-col gap-2 w-56 text-sm">
          <p class="text-xs text-[#a89db9] uppercase tracking-[0.16em] mb-1">
            Canciones destacadas
          </p>
          ${previewSongs
            .map((s) => {
              const t = s.title || "Título desconocido";
              const a = Array.isArray(s.artists)
                ? s.artists.join(", ")
                : "Artista desconocido";
              return `
              <div class="flex flex-col truncate">
                <span class="text-white truncate">${t}</span>
                <span class="text-[11px] text-[#a89db9] truncate">${a}</span>
              </div>`;
            })
            .join("")}
        </div>
        `
            : ""
        }
      </div>
    `;

    artistSection.classList.remove("hidden");
  }

  function renderSuggestions(items) {
    clearSuggestions();
    if (!items || !items.length) return;

    showSuggestionsContainer();

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
          <p class="text-[11px] text-[#a89db9] truncate" title="${artists}">
            ${artists}
          </p>
        </div>
      `;

      row.addEventListener("click", () => {
        input.value = title;
        clearSuggestions();
        form.dispatchEvent(new Event("submit"));
      });

      suggestionsContainer.appendChild(row);
    });
  }

  async function searchMusic(query, { saveRecent = false, mode = "full" } = {}) {
    const trimmed = query.trim();

    if (!trimmed) {
      setStatus("");
      clearResults();
      clearSuggestions();
      clearArtist();
      return;
    }

    const currentRequestId = ++lastRequestId;

    if (mode === "full") {
      setStatus("Buscando música...");
      clearResults();
      clearSuggestions();
      clearArtist();
    }

    if (saveRecent) saveRecentSearch(trimmed);

    let url = "";
    if (mode === "live") {
      url = `${API_GATEWAY_URL}/music/search?query=${encodeURIComponent(trimmed)}&limit=15`;
    } else {
      url = `${API_GATEWAY_URL}/music/overview?query=${encodeURIComponent(trimmed)}&songs_limit=20&artists_limit=1`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (currentRequestId !== lastRequestId) return;
      if (!response.ok) throw new Error("Respuesta no OK del servidor");

      const data = await response.json();

      if (mode === "live") {
        const items = Array.isArray(data.items) ? data.items : [];
        renderSuggestions(items);
      } else {
        const artists = Array.isArray(data.artists) ? data.artists : [];
        const songs = Array.isArray(data.songs) ? data.songs : [];

        if (!songs.length && !artists.length) {
          setStatus("No se encontraron resultados.");
          clearResults();
          clearArtist();
          return;
        }

        setStatus(
          `Se encontraron ${songs.length} canciones${
            artists.length ? " y " + artists.length + " artista(s)." : "."
          }`
        );

        if (artists.length) renderArtist(artists[0], songs);
        else clearArtist();

        renderResults(songs);
      }
    } catch (err) {
      if (currentRequestId !== lastRequestId) return;
      console.error("Error buscando música:", err);
      setStatus("Ocurrió un error al buscar. Inténtalo de nuevo.");
      clearResults();
      clearSuggestions();
      clearArtist();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    searchMusic(input.value, { saveRecent: true, mode: "full" });
  });

  input.addEventListener("input", () => {
    const value = input.value;

    if (!value.trim()) {
      setStatus("");
      clearResults();
      clearSuggestions();
      clearArtist();
      lastRequestId++;
      if (typingTimeout) clearTimeout(typingTimeout);
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      searchMusic(value, { saveRecent: false, mode: "live" });
    }, 350);
  });

  renderRecentSearches();

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q");
  if (initialQuery) {
    input.value = initialQuery;
    searchMusic(initialQuery, { saveRecent: true, mode: "full" });
  }
});
