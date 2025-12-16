// /js/music/player.js
import { API_GATEWAY_URL } from "../api/config.js";

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

// Estado ÚNICO
let queue = [];
let index = -1;

let audioEl;
let playerWrapper,
  playerTitle,
  playerArtist,
  playerCover,
  playerPlayBtn,
  playerPlayIcon,
  playerPrevBtn,
  playerNextBtn,
  playerCurrentTime,
  playerDuration,
  playerProgressFill,
  playerProgressBg,
  playerVolumeFill,
  playerVolumeBg;

let progressInterval = null;

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function setPlayIcon(isPlaying) {
  if (!playerPlayIcon) return;
  playerPlayIcon.textContent = isPlaying ? "pause" : "play_arrow";
}

function startProgressUpdater() {
  if (!audioEl || !playerCurrentTime || !playerDuration || !playerProgressFill) return;
  if (progressInterval) clearInterval(progressInterval);

  progressInterval = setInterval(() => {
    const current = audioEl.currentTime || 0;
    const duration = audioEl.duration || 0;

    playerCurrentTime.textContent = formatTime(current);
    playerDuration.textContent = formatTime(duration);

    playerProgressFill.style.width = duration > 0 ? `${(current / duration) * 100}%` : "0%";
  }, 500);
}

function setVolumeFromPercent(percent) {
  if (!audioEl || !playerVolumeFill) return;
  const norm = Math.max(0, Math.min(100, percent));
  playerVolumeFill.style.width = `${norm}%`;
  audioEl.volume = norm / 100;
}

// Normaliza campos (sirve para búsqueda y playlist)
function getVideoId(track) {
  return track.videoId || track.ytmusic_id || null;
}
function getTitle(track) {
  return track.title || "Título desconocido";
}
function getArtist(track) {
  if (track.artist) return track.artist;
  const arr = Array.isArray(track.artists) ? track.artists : [];
  return arr.length ? arr.join(", ") : "Artista desconocido";
}
function getCover(track) {
  if (track.cover_url) return track.cover_url;
  if (track.coverUrl) return track.coverUrl;
  const thumbs = Array.isArray(track.thumbnails) ? track.thumbnails : [];
  return thumbs.length ? thumbs[thumbs.length - 1].url : "https://via.placeholder.com/80x80?text=♪";
}
function getDurationHint(track) {
  return typeof track.duration === "string" ? track.duration : "0:00";
}

async function playByIndex(i) {
  const canPlay = ensureLoggedInForPlaybackSync();
  if (!canPlay) return;

  if (!queue.length || i < 0 || i >= queue.length) return;
  if (!audioEl || !playerWrapper) return;

  const track = queue[i];
  const videoId = getVideoId(track);
  if (!videoId) return;

  index = i;

  if (playerTitle) playerTitle.textContent = getTitle(track);
  if (playerArtist) playerArtist.textContent = getArtist(track);

  if (playerCover) {
    playerCover.style.backgroundImage = `url("${getCover(track)}")`;
    playerCover.style.backgroundSize = "cover";
    playerCover.style.backgroundPosition = "center";
  }

  playerWrapper.classList.remove("hidden");
  if (playerCurrentTime) playerCurrentTime.textContent = "0:00";
  if (playerDuration) playerDuration.textContent = getDurationHint(track);

  try {
    const resp = await fetch(`${API_GATEWAY_URL}/music/play?videoId=${encodeURIComponent(videoId)}`);
    if (!resp.ok) throw new Error("No se pudo obtener el audio.");

    const data = await resp.json();
    if (!data.streamUrl) throw new Error("Respuesta inválida del servidor de música.");

    audioEl.src = data.streamUrl;
    await audioEl.play();

    setPlayIcon(true);
    startProgressUpdater();
  } catch (err) {
    console.error("Error al reproducir:", err);
    setPlayIcon(false);
  }
}

function togglePlayPause() {
  if (!audioEl) return;
  if (audioEl.paused) {
    audioEl.play().catch(() => {});
    setPlayIcon(true);
  } else {
    audioEl.pause();
    setPlayIcon(false);
  }
}

function next() {
  if (!queue.length) return;
  let n = index + 1;
  if (n >= queue.length) n = 0;
  playByIndex(n);
}

function prev() {
  if (!queue.length) return;
  let p = index - 1;
  if (p < 0) p = queue.length - 1;
  playByIndex(p);
}

function init() {
  if (init._done) return;
  init._done = true;

  audioEl = document.getElementById("audio-element");
  playerWrapper = document.getElementById("player-wrapper");
  playerTitle = document.getElementById("player-title");
  playerArtist = document.getElementById("player-artist");
  playerCover = document.getElementById("player-cover");
  playerPlayBtn = document.getElementById("player-play-btn");
  playerPlayIcon = document.getElementById("player-play-icon");
  playerPrevBtn = document.getElementById("player-prev-btn");
  playerNextBtn = document.getElementById("player-next-btn");
  playerCurrentTime = document.getElementById("player-current-time");
  playerDuration = document.getElementById("player-duration");
  playerProgressFill = document.getElementById("player-progress-fill");
  playerProgressBg = document.getElementById("player-progress-bg");
  playerVolumeFill = document.getElementById("player-volume-fill");
  playerVolumeBg = document.getElementById("player-volume-bg");

  if (playerPlayBtn) playerPlayBtn.addEventListener("click", (e) => { e.preventDefault(); togglePlayPause(); });
  if (playerNextBtn) playerNextBtn.addEventListener("click", (e) => { e.preventDefault(); next(); });
  if (playerPrevBtn) playerPrevBtn.addEventListener("click", (e) => { e.preventDefault(); prev(); });

  if (playerProgressBg) {
    playerProgressBg.addEventListener("click", (e) => {
      if (!audioEl) return;
      const rect = playerProgressBg.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const duration = audioEl.duration || 0;
      if (duration > 0) audioEl.currentTime = duration * pct;
    });
  }

  if (playerVolumeBg) {
    playerVolumeBg.addEventListener("click", (e) => {
      const rect = playerVolumeBg.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setVolumeFromPercent(pct);
    });
  }

  if (audioEl) audioEl.addEventListener("ended", next);
}

export const player = {
  init,
  setQueueAndPlay(tracks, startIndex = 0) {
    queue = Array.isArray(tracks) ? tracks : [];
    index = -1;
    playByIndex(startIndex);
  },
  playByIndex,
  togglePlayPause,
  next,
  prev,
};
