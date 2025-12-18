// /js/music/playlists.js
import {
  createPlaylist,
  getUserPlaylists,
  addTrackToPlaylist,
  getPlaylistTracks,
  deletePlaylist,
} from "./playlistService.js";

import { player } from "./player.js";

let currentPlaylistTracks = [];

document.addEventListener("DOMContentLoaded", () => {
  player.init();

  const createPlaylistBtn = document.querySelector("[data-create-playlist-btn]");
  const modal = document.querySelector("[data-playlist-modal]");
  const closeModalBtn = modal?.querySelector("[data-close-modal]");
  const playlistNameInput = modal?.querySelector("[data-playlist-name-input]");
  const submitPlaylistBtn = modal?.querySelector("[data-submit-playlist]");
  const viewLibrary = document.getElementById("view-library");

  document.getElementById("back-to-library")?.addEventListener("click", () => {
    showView("view-library");
  });

  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener("click", () => {
      modal?.classList.remove("hidden");
      playlistNameInput?.focus();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      modal?.classList.add("hidden");
      if (playlistNameInput) playlistNameInput.value = "";
    });
  }

  if (submitPlaylistBtn) {
    submitPlaylistBtn.addEventListener("click", async () => {
      const playlistName = playlistNameInput?.value.trim();

      if (!playlistName) {
        showMessage("Por favor ingresa un nombre para la playlist.", "error");
        return;
      }

      submitPlaylistBtn.disabled = true;
      submitPlaylistBtn.textContent = "Creando...";

      try {
        const newPlaylist = await createPlaylist(playlistName);
        showMessage(`Playlist "${newPlaylist.name}" creada exitosamente.`, "success");

        modal?.classList.add("hidden");
        if (playlistNameInput) playlistNameInput.value = "";

        loadUserPlaylists();
      } catch (err) {
        showMessage(err.message, "error");
      } finally {
        submitPlaylistBtn.disabled = false;
        submitPlaylistBtn.textContent = "Crear";
      }
    });
  }

  if (playlistNameInput) {
    playlistNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") submitPlaylistBtn?.click();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
        if (playlistNameInput) playlistNameInput.value = "";
      }
    });
  }

  if (viewLibrary) {
    const observer = new MutationObserver(() => {
      if (!viewLibrary.classList.contains("hidden")) loadUserPlaylists();
    });
    observer.observe(viewLibrary, { attributes: true, attributeFilter: ["class"] });
  }

  const playlistsContainer = document.querySelector("[data-playlists-container]");
  if (playlistsContainer && !playlistsContainer.dataset.bound) {
    playlistsContainer.dataset.bound = "true";

    playlistsContainer.addEventListener("click", async (e) => {
      if (e.target.closest("[data-delete-playlist]")) return;

      const card = e.target.closest("[data-playlist-id]");
      if (!card) return;

      const playlistId = card.dataset.playlistId;
      const playlistName = card.querySelector("h3")?.textContent?.trim() || "Playlist";

      await openPlaylist(playlistId, playlistName);
      showView("view-playlist");
    });
  }

  loadUserPlaylists();
});

function showView(viewId) {
  document.querySelectorAll(".app-view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId)?.classList.remove("hidden");
}

async function openPlaylist(playlistId, playlistName = "Playlist") {
  const tracks = await getPlaylistTracks(playlistId);

  const titleEl = document.getElementById("playlist-title");
  const metaEl = document.getElementById("playlist-meta");
  const tracksEl = document.getElementById("playlist-tracks");
  const coverEl = document.getElementById("playlist-cover");

  if (!titleEl || !metaEl || !tracksEl) return;

  titleEl.textContent = playlistName;
  metaEl.textContent = `${tracks.length} ${tracks.length === 1 ? "pista" : "pistas"}`;

  const firstCover =
    tracks?.[0]?.cover_url ||
    tracks?.[0]?.thumbnails?.slice?.(-1)?.[0]?.url ||
    "https://via.placeholder.com/600x600?text=Playlist";

  if (coverEl) {
    coverEl.style.backgroundImage = `url("${firstCover}")`;
    coverEl.style.backgroundSize = "cover";
    coverEl.style.backgroundPosition = "center";
  }

  currentPlaylistTracks = Array.isArray(tracks) ? tracks : [];

  if (currentPlaylistTracks.length === 0) {
    tracksEl.innerHTML = `<p class="text-white/50">Esta playlist aún no tiene canciones.</p>`;
    return;
  }

  tracksEl.innerHTML = currentPlaylistTracks
    .map((track, index) => {
      const cover =
        track.cover_url ||
        track.thumbnails?.slice?.(-1)?.[0]?.url ||
        "https://via.placeholder.com/48";

      const artist = track.artist || track.artists?.[0] || "-";
      const duration = track.duration || "";

      return `
        <div class="group flex items-center gap-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 transition">
          <div class="w-6 text-sm text-white/50">${index + 1}</div>

          <img src="${cover}" class="h-12 w-12 rounded-xl object-cover shrink-0" />

          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-4">
              <p class="text-white font-semibold truncate">${track.title || "-"}</p>
              <p class="text-white/50 text-sm shrink-0">${duration}</p>
            </div>
            <p class="text-white/50 text-sm truncate">${artist}</p>
          </div>

          <button
            class="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 grid place-items-center opacity-0 group-hover:opacity-100 transition play-playlist-track"
            type="button"
            data-track-index="${index}"
            title="Reproducir"
          >
            <span class="material-symbols-outlined text-xl text-white">play_arrow</span>
          </button>
        </div>
      `;
    })
    .join("");

  tracksEl.querySelectorAll(".play-playlist-track").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.trackIndex);
      player.setQueueAndPlay(currentPlaylistTracks, index);
    });
  });
}

async function loadUserPlaylists() {
  try {
    const playlists = await getUserPlaylists();
    const playlistsContainer = document.querySelector("[data-playlists-container]");

    if (!playlistsContainer) {
      console.warn("Contenedor de playlists no encontrado.");
      return;
    }

    if (playlists.length === 0) {
      playlistsContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-stone-400 mb-4">No tienes playlists aún.</p>
          <p class="text-stone-500 text-sm">Haz click en "Crear playlist" en el menú para crear una nueva.</p>
        </div>
      `;
      return;
    }

    playlistsContainer.innerHTML = playlists
      .map(
        (playlist) => `
        <div class="group bg-gradient-to-br from-white/5 to-white/0 rounded-xl p-6 hover:from-white/10 hover:to-white/5 transition-all cursor-pointer border border-white/10 hover:border-white/20" data-playlist-id="${playlist.id}">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-white font-bold text-lg truncate group-hover:text-accent-pink transition-colors">${playlist.name}</h3>
              <p class="text-stone-400 text-sm mt-1">Creada el ${new Date(
                playlist.created_at
              ).toLocaleDateString("es-ES")}</p>
            </div>
            <button class="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-400 transition-all ml-2 flex-shrink-0" data-delete-playlist="${playlist.id}">
              <span class="material-symbols-outlined text-xl">delete</span>
            </button>
          </div>
          <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <p class="text-stone-400 text-xs playlist-track-count" data-playlist-id="${playlist.id}">-</p>
            <button class="text-xs bg-primary hover:bg-primary/80 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">play_arrow</span>
              Ver
            </button>
          </div>
        </div>
      `
      )
      .join("");

    for (const playlist of playlists) {
      const countEl = playlistsContainer.querySelector(
        `.playlist-track-count[data-playlist-id="${playlist.id}"]`
      );

      if (!countEl) continue;

      try {
        const tracks = await getPlaylistTracks(playlist.id);
        const count = tracks.length;
        countEl.textContent = `${count} ${count === 1 ? "canción" : "canciones"}`;
      } catch (err) {
        console.error("Error al contar canciones:", err);
        countEl.textContent = "0 canciones";
      }
    }

    playlistsContainer.querySelectorAll("[data-delete-playlist]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();

        const playlistId = btn.dataset.deletePlaylist;
        if (!playlistId) return;

        if (confirm("¿Estás seguro de que deseas eliminar esta playlist?")) {
          try {
            await deletePlaylist(playlistId);
            showMessage("Playlist eliminada.", "success");
            loadUserPlaylists();
          } catch (err) {
            showMessage(err.message, "error");
          }
        }
      });
    });
  } catch (err) {
    console.error("Error al cargar playlists:", err.message);
  }
}

function showMessage(text, type = "info") {
  const messageEl = document.querySelector("[data-playlist-message]");
  if (!messageEl) return;

  messageEl.textContent = text;
  messageEl.className = "text-sm min-h-[1.25rem]";

  if (type === "error") messageEl.classList.add("text-red-400");
  else if (type === "success") messageEl.classList.add("text-green-400");
  else messageEl.classList.add("text-stone-400");

  setTimeout(() => {
    messageEl.textContent = "";
    messageEl.className = "text-sm min-h-[1.25rem]";
  }, 5000);
}

export async function showPlaylistSelector(track, buttonEl) {
  try {
    const playlists = await getUserPlaylists();

    if (playlists.length === 0) {
      showMessage("Crea una playlist primero.", "error");
      return;
    }

    const menu = document.createElement("div");
    menu.className =
      "absolute bg-background-dark border border-white/10 rounded-lg shadow-xl z-50 py-2 min-w-48";

    const rect = buttonEl.getBoundingClientRect();
    menu.style.top = rect.bottom + 8 + "px";
    menu.style.left = rect.left + "px";

    playlists.forEach((playlist) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className =
        "w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-sm";
      option.innerHTML = `
        <span class="material-symbols-outlined text-sm">playlist_add</span>
        ${playlist.name}
      `;

      option.addEventListener("click", async () => {
        try {
          await addTrackToPlaylist(playlist.id, track);
          showMessage(`"${track.title}" agregada a "${playlist.name}".`, "success");
          menu.remove();
        } catch (err) {
          showMessage(err.message, "error");
        }
      });

      menu.appendChild(option);
    });

    const divider = document.createElement("div");
    divider.className = "border-t border-white/10 my-2";
    menu.appendChild(divider);

    const newPlaylistOption = document.createElement("button");
    newPlaylistOption.type = "button";
    newPlaylistOption.className =
      "w-full text-left px-4 py-2 text-stone-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-sm";
    newPlaylistOption.innerHTML = `
      <span class="material-symbols-outlined text-sm">add</span>
      Nueva playlist
    `;

    newPlaylistOption.addEventListener("click", () => {
      menu.remove();
      document.querySelector('[data-create-playlist-btn]')?.click();
    });

    menu.appendChild(newPlaylistOption);

    document.body.appendChild(menu);

    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== buttonEl) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => document.addEventListener("click", closeMenu), 0);
  } catch (err) {
    showMessage(err.message, "error");
  }
}
