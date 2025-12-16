import { supabase } from "../supabase/supabaseClient.js";

/**
 * Crear una nueva playlist para el usuario autenticado
 * @param {string} playlistName - Nombre de la playlist
 * @returns {Promise<Object>} - Datos de la playlist creada
 */
export async function createPlaylist(playlistName) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");
    const token = localStorage.getItem("soundhub_access_token");

    if (!userId || !token) {
      throw new Error("Usuario no autenticado. Por favor inicia sesión.");
    }

    if (!playlistName || playlistName.trim().length === 0) {
      throw new Error("El nombre de la playlist no puede estar vacío.");
    }

    // Crear playlist en Supabase
    const { data, error } = await supabase
      .from("playlists")
      .insert([
        {
          user_id: userId,
          name: playlistName.trim(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .select();

    if (error) {
      throw new Error(`Error al crear playlist: ${error.message}`);
    }

    console.log("Playlist creada exitosamente:", data);
    return data[0];
  } catch (err) {
    console.error("Error en createPlaylist:", err.message);
    throw err;
  }
}

/**
 * Obtener todas las playlists del usuario
 * @returns {Promise<Array>} - Array de playlists
 */
export async function getUserPlaylists() {
  try {
    const userId = localStorage.getItem("soundhub_user_id");
    const token = localStorage.getItem("soundhub_access_token");

    if (!userId || !token) {
      throw new Error("Usuario no autenticado.");
    }

    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error al obtener playlists: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error en getUserPlaylists:", err.message);
    return [];
  }
}

/**
 * Agregar una canción a una playlist
 * @param {string} playlistId - ID de la playlist
 * @param {Object} track - Objeto de la canción con { title, artist, coverUrl, preview_url, videoId, duration, artists, thumbnails }
 * @returns {Promise<Object>} - Datos de la canción agregada
 */
export async function addTrackToPlaylist(playlistId, track) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");
    const token = localStorage.getItem("soundhub_access_token");

    if (!userId || !token) {
      throw new Error("Usuario no autenticado.");
    }

    if (!playlistId || !track) {
      throw new Error("Parámetros inválidos.");
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("user_id")
      .eq("id", playlistId)
      .single();

    if (playlistError || playlistData.user_id !== userId) {
      throw new Error("No tienes permisos para modificar esta playlist.");
    }

    // Extraer información de la canción
    const title = track.title || "Sin título";
    const artistsArr = Array.isArray(track.artists) ? track.artists : [];
    const artist = track.artist || (artistsArr.length > 0 ? artistsArr.join(", ") : "Desconocido");
    const thumbs = Array.isArray(track.thumbnails) ? track.thumbnails : [];
    const coverUrl = track.coverUrl || (thumbs.length > 0 ? thumbs[thumbs.length - 1].url : "");
    const previewUrl = track.preview_url || track.previewUrl || "";
    const videoId = track.videoId || null;
    const duration = track.duration || null;

    // Agregar canción a la tabla de playlist_tracks
    const { data, error } = await supabase
      .from("playlist_tracks")
      .insert([
        {
          playlist_id: playlistId,
          title: title,
          artist: artist,
          cover_url: coverUrl,
          preview_url: previewUrl,
          ytmusic_id: videoId,
          duration: duration,
          added_at: new Date(),
        },
      ])
      .select();

    if (error) {
      throw new Error(`Error al agregar canción: ${error.message}`);
    }

    console.log("Canción agregada a playlist:", data);
    return data[0];
  } catch (err) {
    console.error("Error en addTrackToPlaylist:", err.message);
    throw err;
  }
}

/**
 * Obtener canciones de una playlist
 * @param {string} playlistId - ID de la playlist
 * @returns {Promise<Array>} - Array de canciones
 */
export async function getPlaylistTracks(playlistId) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");

    if (!userId) {
      throw new Error("Usuario no autenticado.");
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("user_id")
      .eq("id", playlistId)
      .single();

    if (playlistError || playlistData.user_id !== userId) {
      throw new Error("No tienes permisos para acceder a esta playlist.");
    }

    // Obtener canciones
    const { data, error } = await supabase
      .from("playlist_tracks")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("added_at", { ascending: false });

    if (error) {
      throw new Error(`Error al obtener canciones: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error("Error en getPlaylistTracks:", err.message);
    return [];
  }
}

/**
 * Eliminar una canción de una playlist
 * @param {string} trackId - ID de la canción en la playlist
 * @returns {Promise<boolean>} - True si se eliminó exitosamente
 */
export async function removeTrackFromPlaylist(trackId) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");

    if (!userId) {
      throw new Error("Usuario no autenticado.");
    }

    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("id", trackId);

    if (error) {
      throw new Error(`Error al eliminar canción: ${error.message}`);
    }

    console.log("Canción eliminada de la playlist.");
    return true;
  } catch (err) {
    console.error("Error en removeTrackFromPlaylist:", err.message);
    throw err;
  }
}

/**
 * Eliminar una playlist completa
 * @param {string} playlistId - ID de la playlist
 * @returns {Promise<boolean>} - True si se eliminó exitosamente
 */
export async function deletePlaylist(playlistId) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");

    if (!userId) {
      throw new Error("Usuario no autenticado.");
    }

    // Verificar que la playlist pertenece al usuario
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("user_id")
      .eq("id", playlistId)
      .single();

    if (playlistError || playlistData.user_id !== userId) {
      throw new Error("No tienes permisos para eliminar esta playlist.");
    }

    // Eliminar todas las canciones de la playlist primero
    await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId);

    // Eliminar la playlist
    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);

    if (error) {
      throw new Error(`Error al eliminar playlist: ${error.message}`);
    }

    console.log("Playlist eliminada exitosamente.");
    return true;
  } catch (err) {
    console.error("Error en deletePlaylist:", err.message);
    throw err;
  }
}
