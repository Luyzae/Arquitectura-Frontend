import { supabase } from "../supabase/supabaseClient.js";

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

    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("user_id")
      .eq("id", playlistId)
      .single();

    if (playlistError || playlistData.user_id !== userId) {
      throw new Error("No tienes permisos para modificar esta playlist.");
    }

    const title = track.title || "Sin título";
    const artistsArr = Array.isArray(track.artists) ? track.artists : [];
    const artist = track.artist || (artistsArr.length > 0 ? artistsArr.join(", ") : "Desconocido");
    const thumbs = Array.isArray(track.thumbnails) ? track.thumbnails : [];
    const coverUrl = track.coverUrl || (thumbs.length > 0 ? thumbs[thumbs.length - 1].url : "");
    const previewUrl = track.preview_url || track.previewUrl || "";
    const videoId = track.videoId || null;
    const duration = track.duration || null;

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

export async function getPlaylistTracks(playlistId) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");

    if (!userId) {
      throw new Error("Usuario no autenticado.");
    }

    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("user_id")
      .eq("id", playlistId)
      .single();

    if (playlistError || playlistData.user_id !== userId) {
      throw new Error("No tienes permisos para acceder a esta playlist.");
    }

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

export async function deletePlaylist(playlistId) {
  try {
    const userId = localStorage.getItem("soundhub_user_id");

    if (!userId) {
      throw new Error("Usuario no autenticado.");
    }

    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("user_id")
      .eq("id", playlistId)
      .single();

    if (playlistError || playlistData.user_id !== userId) {
      throw new Error("No tienes permisos para eliminar esta playlist.");
    }

    await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId);

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
