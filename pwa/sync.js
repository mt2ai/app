/**
 * NaayTracker — Sincronización opcional con Supabase.
 * El código de 12 caracteres es la llave: no hay cuentas ni contraseñas.
 */
const SYNC_KEY = "naaytracker_sync";
const SYNC_ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SYNC_INTERVALO_MS = 30000;

let syncMeta = cargarSyncMeta();
let syncDebounceId = null;
let syncAplicando = false;
let syncIniciado = false;
let syncEstado = "idle";
let syncUltimoError = "";

function cargarSyncMeta() {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      code: typeof data.code === "string" ? data.code : "",
      lastRemoteUpdatedAt: typeof data.lastRemoteUpdatedAt === "string" ? data.lastRemoteUpdatedAt : "",
      lastSyncAt: Number(data.lastSyncAt) || 0,
      dirty: !!data.dirty
    };
  } catch (e) {
    return { code: "", lastRemoteUpdatedAt: "", lastSyncAt: 0, dirty: false };
  }
}

function guardarSyncMeta() {
  localStorage.setItem(SYNC_KEY, JSON.stringify(syncMeta));
}

function syncConfigurado() {
  return !!(window.NAAY_SUPABASE && window.NAAY_SUPABASE.url && window.NAAY_SUPABASE.anonKey);
}

function normalizarCodigoSync(codigo) {
  return (codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function generarCodigoSync() {
  if (syncMeta.code && !confirm("Ya estás conectado a un código de sincronización.\n\n¿Generar uno nuevo? El código actual seguirá activo hasta que pulses Conectar con el nuevo.")) {
    return;
  }

  let codigo = "";
  const bytes = new Uint32Array(12);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    bytes.forEach(b => { codigo += SYNC_ALFABETO[b % SYNC_ALFABETO.length]; });
  } else {
    for (let i = 0; i < 12; i++) codigo += SYNC_ALFABETO[Math.floor(Math.random() * SYNC_ALFABETO.length)];
  }
  const input = document.getElementById("syncCode");
  if (input) input.value = codigo;
  syncEstado = "idle";
  syncUltimoError = "";
  renderSyncUI("Código generado. Guárdalo y pulsa Conectar.");
}

async function copiarCodigoSync() {
  const input = document.getElementById("syncCode");
  const codigo = normalizarCodigoSync((input && input.value) || syncMeta.code);

  if (!codigo) {
    alert("Genera o escribe un código primero.");
    return;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(codigo);
    } else {
      throw new Error("Clipboard API no disponible");
    }
    renderSyncUI("Código copiado al portapapeles.");
  } catch (e) {
    if (input) {
      input.focus();
      input.select();
      try {
        document.execCommand("copy");
        renderSyncUI("Código copiado al portapapeles.");
        return;
      } catch (err) {}
    }
    prompt("Copia tu código de sincronización:", codigo);
  }
}

async function syncRpc(nombre, body) {
  if (!syncConfigurado()) throw new Error("Supabase no está configurado.");
  const cfg = window.NAAY_SUPABASE;
  const resp = await fetch(`${cfg.url.replace(/\/$/, "")}/rest/v1/rpc/${nombre}`, {
    method: "POST",
    headers: {
      "apikey": cfg.anonKey,
      "Authorization": `Bearer ${cfg.anonKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    let detalle = "";
    try { detalle = (await resp.text()).slice(0, 240); } catch (e) {}
    throw new Error(`HTTP ${resp.status}${detalle ? `: ${detalle}` : ""}`);
  }
  return resp.json();
}

function registrarCambioLocal() {
  if (syncAplicando || !syncMeta.code) return;

  syncMeta.dirty = true;
  guardarSyncMeta();

  clearTimeout(syncDebounceId);
  syncDebounceId = setTimeout(() => {
    if (syncMeta.code && syncMeta.dirty) pushSync();
  }, 1400);

  renderSyncUI();
}

async function pushSync() {
  if (!syncMeta.code) return false;
  if (!navigator.onLine) {
    syncEstado = "offline";
    renderSyncUI();
    return false;
  }

  syncEstado = "syncing";
  syncUltimoError = "";
  renderSyncUI();

  try {
    const respuesta = await syncRpc("sync_save", {
      p_code: syncMeta.code,
      p_state: estadoParaSincronizar()
    });
    const fila = Array.isArray(respuesta) ? respuesta[0] : respuesta;
    const remoto = fila && fila.updated_at ? fila.updated_at : new Date().toISOString();

    syncMeta.dirty = false;
    syncMeta.lastRemoteUpdatedAt = remoto;
    syncMeta.lastSyncAt = Date.now();
    syncEstado = "ok";
    guardarSyncMeta();
  } catch (e) {
    syncEstado = "error";
    syncUltimoError = e.message || "No se pudo subir.";
  }

  renderSyncUI();
  return syncEstado === "ok";
}

async function pullSync() {
  if (!syncMeta.code) return false;
  if (!navigator.onLine) {
    syncEstado = "offline";
    renderSyncUI();
    return false;
  }

  syncEstado = "syncing";
  syncUltimoError = "";
  renderSyncUI();

  try {
    const respuesta = await syncRpc("sync_get", { p_code: syncMeta.code });
    const fila = Array.isArray(respuesta) ? respuesta[0] : respuesta;

    if (!fila || !fila.updated_at) {
      if (syncMeta.dirty) return pushSync();
      syncEstado = "ok";
      syncMeta.lastSyncAt = Date.now();
      guardarSyncMeta();
      renderSyncUI();
      return false;
    }

    const remotoMs = new Date(fila.updated_at).getTime();
    const localMs = syncMeta.lastRemoteUpdatedAt ? new Date(syncMeta.lastRemoteUpdatedAt).getTime() : 0;

    if (remotoMs > localMs) {
      if (syncMeta.dirty) return pushSync();

      syncAplicando = true;
      aplicarEstadoExterno(fila.state);
      syncAplicando = false;

      syncMeta.dirty = false;
      syncMeta.lastRemoteUpdatedAt = fila.updated_at;
      syncMeta.lastSyncAt = Date.now();
      syncEstado = "ok";
      guardarSyncMeta();
      renderSyncUI();
      return true;
    }

    syncEstado = "ok";
    syncMeta.lastSyncAt = Date.now();
    guardarSyncMeta();
  } catch (e) {
    syncEstado = "error";
    syncUltimoError = e.message || "No se pudo descargar.";
  }

  renderSyncUI();
  return false;
}

function sincronizarAhora() {
  if (!syncMeta.code) {
    alert("Primero conecta un código de sincronización.");
    return;
  }
  if (syncMeta.dirty) pushSync();
  else pullSync();
}

async function conectarSync() {
  const input = document.getElementById("syncCode");
  const codigo = normalizarCodigoSync(input && input.value);

  if (codigo.length < 10) {
    alert("El código debe tener al menos 10 caracteres. Se recomienda usar 12.");
    return;
  }

  if (syncMeta.code && syncMeta.code !== codigo) {
    const cambiar = confirm(
      "Ya estás conectado al código actual.\n\nSi cambias, este dispositivo dejará de sincronizar con el código anterior y los demás dispositivos no verán tus cambios nuevos.\n\n¿Cambiar de código?"
    );
    if (!cambiar) return;
  }

  syncEstado = "syncing";
  syncUltimoError = "";
  renderSyncUI();

  try {
    const respuesta = await syncRpc("sync_get", { p_code: codigo });
    const remoto = Array.isArray(respuesta) ? respuesta[0] : respuesta;
    const tieneNube = !!(remoto && remoto.updated_at);

    let descargarNube = false;
    if (tieneNube) {
      descargarNube = confirm(
        "Este código ya tiene progreso en la nube.\n\nAceptar = descargar y reemplazar los datos de este dispositivo.\nCancelar = mantener los datos locales y subirlos a la nube."
      );
    }

    syncMeta.code = codigo;
    syncMeta.lastRemoteUpdatedAt = "";
    syncMeta.dirty = false;

    if (descargarNube) {
      syncAplicando = true;
      aplicarEstadoExterno(remoto.state);
      syncAplicando = false;
      syncMeta.lastRemoteUpdatedAt = remoto.updated_at;
      syncMeta.lastSyncAt = Date.now();
      syncEstado = "ok";
      guardarSyncMeta();
    } else {
      syncMeta.dirty = true;
      guardarSyncMeta();
      const ok = await pushSync();
      if (!ok) throw new Error(syncUltimoError || "No se pudo subir el progreso local.");
    }

    renderSyncUI();
    alert("Sincronización conectada. Los cambios se enviarán automáticamente.");
  } catch (e) {
    syncEstado = "error";
    syncUltimoError = e.message || "No se pudo conectar.";
    syncMeta.code = "";
    syncMeta.dirty = false;
    guardarSyncMeta();
    renderSyncUI();
  }
}

function desconectarSync() {
  if (!confirm("¿Desconectar la sincronización de este dispositivo? Los datos locales no se borrarán.")) return;
  syncMeta = { code: "", lastRemoteUpdatedAt: "", lastSyncAt: 0, dirty: false };
  guardarSyncMeta();
  const input = document.getElementById("syncCode");
  if (input) input.value = "";
  syncEstado = "idle";
  syncUltimoError = "";
  renderSyncUI("Sincronización desconectada.");
}

function renderSyncUI(mensajeExtra) {
  const input = document.getElementById("syncCode");
  const status = document.getElementById("syncStatus");
  const disconnect = document.getElementById("syncDisconnect");
  if (!status) return;

  if (!syncConfigurado()) {
    status.textContent = "Supabase no está configurado.";
    status.className = "sync-status error";
    return;
  }

  if (input && syncMeta.code && !input.value) {
    input.value = syncMeta.code;
  }
  if (disconnect) disconnect.style.display = syncMeta.code ? "inline-block" : "none";

  let texto = "";
  if (mensajeExtra) texto = mensajeExtra;
  else if (!syncMeta.code) texto = "Sin conectar. Genera un código o introduce el de otro dispositivo.";
  else if (syncEstado === "syncing") texto = "Sincronizando...";
  else if (syncEstado === "error") texto = `Error: ${syncUltimoError}`;
  else if (syncEstado === "offline") texto = "Sin conexión. Se sincronizará al recuperar internet.";
  else if (syncMeta.dirty) texto = "Conectado · cambios pendientes de subir.";
  else if (syncMeta.lastSyncAt) texto = `Conectado · sincronizado ${new Date(syncMeta.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  else texto = "Conectado.";

  status.textContent = texto;
  status.className = "sync-status" + (syncEstado === "error" ? " error" : (syncEstado === "ok" && syncMeta.code ? " ok" : ""));
}

function iniciarSyncAutomatico() {
  renderSyncUI();
  if (syncIniciado) return;
  syncIniciado = true;

  if (syncMeta.code) {
    setTimeout(() => {
      if (syncMeta.dirty) pushSync();
      else pullSync();
    }, 900);
  }

  setInterval(() => {
    if (!syncMeta.code) return;
    if (syncMeta.dirty) pushSync();
    else pullSync();
  }, SYNC_INTERVALO_MS);

  window.addEventListener("online", () => {
    if (syncMeta.code) sincronizarAhora();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && syncMeta.code) {
      if (syncMeta.dirty) pushSync();
      else pullSync();
    }
  });
}
