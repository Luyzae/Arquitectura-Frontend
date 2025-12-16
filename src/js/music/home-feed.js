import { API_GATEWAY_URL } from "../api/config.js";
import { player } from "./player.js";

const PLACEHOLDER = "https://via.placeholder.com/600x600?text=%E2%99%AA";

function qs(id) {
  return document.getElementById(id);
}

function coverUrl(track) {
  const thumbs = track?.thumbnails;

  let url = null;
  if (Array.isArray(thumbs) && thumbs.length) {
    const best = [...thumbs].sort((a, b) => (a?.width || 0) - (b?.width || 0)).pop();
    url = best?.url || thumbs[0]?.url || null;
  } else if (thumbs && typeof thumbs === "object") {
    url = thumbs.url || null;
  }

  if (!url || typeof url !== "string") return PLACEHOLDER;
  return url.replace("http://", "https://");
}

function artistText(track) {
  const a = Array.isArray(track.artists) ? track.artists : [];
  return a.length ? a.join(", ") : "Artista desconocido";
}

function renderCarouselSection({ title, subtitle, items }) {
  const section = document.createElement("section");
  section.className = "mb-12";

  section.innerHTML = `
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">${title}</h2>
        ${subtitle ? `<p class="mt-1 text-sm text-stone-400">${subtitle}</p>` : ""}
      </div>
      <button class="text-sm font-medium text-accent-pink hover:underline" type="button">
        Ver todo
      </button>
    </div>

    <div
      class="no-scrollbar -mx-4 flex flex-nowrap gap-4 overflow-x-auto px-4 pb-4"
      data-home-row
    >
      ${items
        .map(
          (t, i) => `
          <div class="w-48 shrink-0">
            <button
              type="button"
              class="group relative w-full overflow-hidden rounded-lg bg-dark-purple/50 p-3 text-left"
              data-index="${i}"
            >
              <!-- Cover -->
              <div class="relative aspect-square w-full overflow-hidden rounded-md bg-white/5">
                <img
                  alt="${t.title || "Track"}"
                  class="block h-full w-full object-cover"
                  src="${coverUrl(t)}"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />

                <!-- ▶ PLAY CENTRADO (YT MUSIC STYLE) -->
                <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span class="material-symbols-outlined
                               text-5xl text-white drop-shadow
                               transition-transform duration-200
                               group-hover:scale-110">
                    play_arrow
                  </span>
                </div>
              </div>

              <h3 class="mt-3 truncate text-base font-semibold text-white">
                ${t.title || "-"}
              </h3>
              <p class="truncate text-sm text-stone-400">
                ${artistText(t)}
              </p>
            </button>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  const row = section.querySelector("[data-home-row]");
  row.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const startIndex = Number(btn.dataset.index);
      player.setQueueAndPlay(items, startIndex);
    });
  });

  return section;
}

async function loadHome() {
  const homeRoot = qs("view-home");
  if (!homeRoot) return;

  let container = document.getElementById("home-dynamic");
  if (!container) {
    container = document.createElement("div");
    container.id = "home-dynamic";
    homeRoot.appendChild(container);
  }

  container.innerHTML = `<div class="text-stone-400 text-sm mb-6">Cargando recomendaciones...</div>`;

  try {
    const res = await fetch(`${API_GATEWAY_URL}/music/home`);
    if (!res.ok) throw new Error("Home no OK");

    const data = await res.json();
    const sections = Array.isArray(data.sections) ? data.sections : [];

    container.innerHTML = "";
    sections.forEach((s) => container.appendChild(renderCarouselSection(s)));
  } catch (e) {
    console.error("Error cargando home:", e);
    container.innerHTML = `<div class="text-red-400 text-sm">No se pudo cargar la música de inicio.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  player.init();
  loadHome();
});
