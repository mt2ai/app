/**
 * NaayTracker — Motor Principal de Lógica, Temporizadores en Vivo y Economía Dual (Wons / Yang)
 * Enfoque: Alquimia DSS, Control de Objetivos y Eventos en Tiempo Real
 */

// ==========================================
// 1. SISTEMA DE EVENTOS EN VIVO — API gahdm2.com
// Fuente: opensheet.elk.sh (Google Sheets pública)
// ==========================================

const API_EVENTOS_URL = "https://opensheet.elk.sh/18ODsqbcn1SolrmseW05kmu0Pnvf3tj-nPnuTYZ17X3s/Hoja%201";

/**
 * GRUPOS DE SERVIDORES — replicado exactamente de gahdm2.com/script.js
 * Clave = nombre del "servidor" en la API → Valor = array de servidores que reciben esos eventos
 */
const GRUPOS_SERVIDORES = {
  "global":   ["Onyx","Emerald","Ruby","Sapphire","Iberia","Europe","Teutonia","Germania","Azrael","TigerGhost","Eostre","Nyx","Italia"],
  "Iberia":   ["Iberia","Teutonia","Europe","Germania","Italia"],
  "Europe":   ["Teutonia","Europe","Germania"],
  "Teutonia": ["Teutonia","Germania"],
  "Italia":   ["Italia"],
  "Onyx":     ["Ruby","Sapphire"],
  "Azrael":   ["TigerGhost","Eostre"],
  "especial": ["Iberia","Teutonia","Europe","Germania","Azrael","TigerGhost","Eostre","Italia"],
  "Nyx":      ["Nyx"]
};

/**
 * Mapa JS getDay() → string tal como aparece en la API (minúsculas, con tildes).
 */
const DIA_API_MAP = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado"
};

// Cache en memoria de los eventos cargados desde la API
let EVENTOS_API_CACHE = null;
let EVENTOS_API_LOADING = false;
let EVENTOS_API_ERROR = false;

/**
 * Carga los eventos desde la API (con caché en memoria por sesión).
 */
async function cargarEventosAPI() {
  if (EVENTOS_API_CACHE !== null) return EVENTOS_API_CACHE;
  if (EVENTOS_API_LOADING) {
    return new Promise(resolve => {
      const check = setInterval(() => {
        if (EVENTOS_API_CACHE !== null || EVENTOS_API_ERROR) {
          clearInterval(check);
          resolve(EVENTOS_API_CACHE || []);
        }
      }, 150);
    });
  }

  EVENTOS_API_LOADING = true;
  try {
    const resp = await fetch(API_EVENTOS_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    EVENTOS_API_CACHE = Array.isArray(data) ? data : [];
    EVENTOS_API_ERROR = false;
    console.log(`[NaayTracker] ${EVENTOS_API_CACHE.length} eventos cargados.`);
  } catch (err) {
    console.warn("[NaayTracker] API no disponible:", err.message);
    EVENTOS_API_CACHE = [];
    EVENTOS_API_ERROR = true;
  } finally {
    EVENTOS_API_LOADING = false;
  }
  return EVENTOS_API_CACHE;
}

/**
 * Normaliza "H:MM" o "HH:MM" → "HH:MM" para comparación lexicográfica.
 */
function normalizarHora(h) {
  if (!h) return "00:00";
  const [hh, mm] = (h + "").trim().split(":");
  return hh.padStart(2, "0") + ":" + (mm || "00").padStart(2, "0");
}

/**
 * Calcula el offset en MINUTOS entre Europe/Madrid y la zona local del dispositivo.
 * Positivo → Madrid está adelantado respecto al local (ej: local GMT-6 → offset = +420 min)
 * Se recalcula cada vez para respetar DST de ambas zonas.
 */
function getOffsetMadridALocal() {
  // Usamos una fecha de referencia para extraer la hora en cada zona
  const ahora = new Date();
  // Hora en Europe/Madrid
  const madridStr = ahora.toLocaleString("en-CA", { timeZone: "Europe/Madrid", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit" });
  // Hora local del dispositivo
  const localStr  = ahora.toLocaleString("en-CA", { hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit" });
  // Parsear ambas como UTC para comparar
  const madridMs = new Date(madridStr.replace(",","") + " UTC").getTime();
  const localMs  = new Date(localStr.replace(",","")  + " UTC").getTime();
  // Diferencia en minutos: cuánto hay que RESTAR a una hora Madrid para obtener local
  return Math.round((madridMs - localMs) / 60000);
}

/**
 * Convierte "HH:MM" en hora Madrid → "HH:MM" en hora local del dispositivo.
 * Devuelve { hora: "HH:MM", diaDelta: -1|0|1 } donde diaDelta indica si
 * la hora local cae en el día anterior (-1) o siguiente (+1).
 */
function madridHoraALocal(hhmm) {
  if (!hhmm || hhmm === "00:00" && false) return { hora: "00:00", diaDelta: 0 };
  const [hh, mm] = hhmm.split(":").map(Number);
  const totalMin = hh * 60 + mm;
  const offsetMin = getOffsetMadridALocal(); // minutos que Madrid lleva de ventaja
  let localMin = totalMin - offsetMin;
  let diaDelta = 0;
  if (localMin < 0)    { localMin += 1440; diaDelta = -1; }
  if (localMin >= 1440){ localMin -= 1440; diaDelta = +1; }
  const lh = Math.floor(localMin / 60).toString().padStart(2, "0");
  const lm = (localMin % 60).toString().padStart(2, "0");
  return { hora: `${lh}:${lm}`, diaDelta };
}

/**
 * Filtra eventos según la lógica EXACTA de gahdm2.com/script.js → procesarEventos():
 *
 *  - global   → aplica a TODOS los servidores
 *  - especial → aplica solo si ev.servidor === servidorSeleccionado (match exacto)
 *  - grupo    → aplica si GRUPOS_SERVIDORES[ev.servidor].includes(servidorSeleccionado)
 *  - estatico → igual que grupo
 *
 * Las horas de la API están en Europe/Madrid (CET/CEST).
 * Se convierten a la hora LOCAL del dispositivo para comparación y visualización.
 * dia_semana también se ajusta si la conversión cruza medianoche.
 */
function filtrarEventosPorServidor(eventos, servidorActual) {
  const diasOrdenApi = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];

  return eventos
    .filter(ev => {
      if (!ev || !ev.tipo_evento) return false;
      const tipo = ev.tipo_evento.trim().toLowerCase();
      const srvEv = (ev.servidor || "").trim();

      if (tipo === "global") return true;

      if (tipo === "especial") {
        return srvEv === servidorActual;
      }

      if (tipo === "grupo" || tipo === "estatico") {
        const miembros = GRUPOS_SERVIDORES[srvEv];
        return miembros && miembros.includes(servidorActual);
      }

      return false;
    })
    .map(ev => {
      const hiMadrid = normalizarHora(ev.hora_inicio);
      const hfMadrid = normalizarHora(ev.hora_fin);
      const { hora: hiLocal, diaDelta: deltaI } = madridHoraALocal(hiMadrid);
      const { hora: hfLocal, diaDelta: deltaF } = madridHoraALocal(hfMadrid);

      // Ajustar dia_semana al local si la conversión cruzó medianoche
      let diaLocal = (ev.dia_semana || "").trim().toLowerCase();
      if (deltaI !== 0 && diaLocal && diasOrdenApi.includes(diaLocal)) {
        const idx = diasOrdenApi.indexOf(diaLocal);
        diaLocal = diasOrdenApi[(idx + deltaI + 7) % 7];
      }

      // Ajustar fecha para eventos con fecha fija (especial/global/grupo con fecha)
      let fechaLocal = ev.fecha || "";
      if (fechaLocal && deltaI !== 0) {
        const d = new Date(fechaLocal + "T12:00:00Z"); // mediodía UTC para evitar ambigüedad
        d.setDate(d.getDate() + deltaI);
        fechaLocal = d.toISOString().split("T")[0];
      }

      return {
        ...ev,
        hora_inicio:      hiLocal,
        hora_fin:         hfLocal,
        hora_inicio_orig: hiMadrid,   // guardamos original para debug
        hora_fin_orig:    hfMadrid,
        dia_semana:       diaLocal,
        fecha:            fechaLocal
      };
    });
}

// ==========================================
// 2. GESTIÓN DEL ESTADO GLOBAL
// ==========================================

const HITOS_PLAN_MAESTRO = [
  // ETAPA 1: Cimientos de Farmeo y Acopio de Antiguas (Semanas 1-8)
  { id: "p1", etapa: 1, etapaNombre: "Etapa 1 (Sem 1-8)", texto: "Mantener 4 fragmenteros activos (20 Cors/día = 140/sem = ~560/mes)", completado: false, cat: "farmeo", esHitoPlan: true },
  { id: "p2", etapa: 1, etapaNombre: "Etapa 1 (Sem 1-8)", texto: "Vender secundarias (Jade, Ónice, etc.) para crear caja de Wons y comprar Rubíes baratos", completado: false, cat: "finanzas", esHitoPlan: true },
  { id: "p3", etapa: 1, etapaNombre: "Etapa 1 (Sem 1-8)", texto: "Arbitraje de Alquimia: Comprar Rubíes Antiguos en el mercado con fondos de secundarias (Hito 10 Antiguas)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p4", etapa: 1, etapaNombre: "Etapa 1 (Sem 1-8)", texto: "Acumular segundo lote de 20 Rubíes Antiguos (banco de 10 intentos a Legendaria)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p5", etapa: 1, etapaNombre: "Etapa 1 (Sem 1-8)", texto: "Acumular lote óptimo de 30 Rubíes Antiguos para sesión de refinado masivo", completado: false, cat: "alquimia", esHitoPlan: true },

  // ETAPA 2: De Antiguas a Legendarias & Primera Mítica Mate (Semanas 9-16)
  { id: "p6", etapa: 2, etapaNombre: "Etapa 2 (Sem 9-16)", texto: "Refinar lote de Antiguas con Jitter y obtener las primeras 2 a 4 Legendarias", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p7", etapa: 2, etapaNombre: "Etapa 2 (Sem 9-16)", texto: "Acumular banco de 8 Legendarias antes de intentar Míticas (evitar quiebra)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p8", etapa: 2, etapaNombre: "Etapa 2 (Sem 9-16)", texto: "Acumular reserva de 12 a 16 Legendarias (materia prima para fabricar Míticas)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p9", etapa: 2, etapaNombre: "Etapa 2 (Sem 9-16)", texto: "Fusionar y obtener el primer Rubí Mítico Mate (equipar provisionalmente para +daño)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p10", etapa: 2, etapaNombre: "Etapa 2 (Sem 9-16)", texto: "⚠️ REGLA DE ORO: NO fusionar pureza con solo 2 Míticas; iniciar banco de reserva", completado: false, cat: "alquimia", esHitoPlan: true },

  // ETAPA 3: Protocolo 4 Míticas ➔ Claridad Clara & Límpida (Semanas 17-24)
  { id: "p11", etapa: 3, etapaNombre: "Etapa 3 (Sem 17-24)", texto: "Acumular colchón de 4 Míticas Mate antes del primer asalto de pureza", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p12", etapa: 3, etapaNombre: "Etapa 3 (Sem 17-24)", texto: "Subir Rubí a Claridad Clara absorbiendo posibles fallos (~50%) con Stop-Loss", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p13", etapa: 3, etapaNombre: "Etapa 3 (Sem 17-24)", texto: "Acumular banco de 4 Míticas Claras (equivale a 8 Míticas Mate exitosas)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p14", etapa: 3, etapaNombre: "Etapa 3 (Sem 17-24)", texto: "Alcanzar Claridad Límpida en el Rubí manteniendo una piedra de respaldo activa", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p15", etapa: 3, etapaNombre: "Etapa 3 (Sem 17-24)", texto: "Financiar primera gran pieza de equipo con mercado de alquimia secundaria (30-50W)", completado: false, cat: "equipo", esHitoPlan: true },

  // ETAPA 4: La Pirámide a Brillante (Semanas 25-32)
  { id: "p16", etapa: 4, etapaNombre: "Etapa 4 (Sem 25-32)", texto: "Construir pirámide: Fabricar lote de 4 Míticas Límpidas para asalto a Brillante", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p17", etapa: 4, etapaNombre: "Etapa 4 (Sem 25-32)", texto: "Alcanzar Claridad Brillante en Rubí con protocolo estricto de Stop-Loss", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p18", etapa: 4, etapaNombre: "Etapa 4 (Sem 25-32)", texto: "Mantener siempre 1 Rubí de combate equipado mientras se refinan gemas en almacén", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p19", etapa: 4, etapaNombre: "Etapa 4 (Sem 25-32)", texto: "Iniciar segunda gema de la Rueda (Jade o Diamante) con excedente de farmeo", completado: false, cat: "alquimia", esHitoPlan: true },

  // ETAPA 5: El Asalto Final a Excelente +6 (Semanas 33-36)
  { id: "p20", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "Acumular lote crítico para Excelente: 2 Brillantes (+ reserva de Míticas) para tasa ~30-35%", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p21", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "🏆 ¡Conseguir Rubí Mítico Excelente! (Culminación de la pirámide de ~16-30 Míticas)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p22", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "Subir Rubí Excelente a +6 con reserva mínima de 20 alubias verdes", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p23", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "Culminar la Meta de Equipo Principal con el poder del Rubí Excelente +6", completado: false, cat: "equipo", esHitoPlan: true }
];

const DEFAULT_STATE = {
  version: 4,
  perfil: {
    nombre: "Mi Cuenta",
    servidor: "Ruby"
  },
  semanaActual: 1,
  corsTotal: 0,
  corsExtraEventos: 0,
  corsSemanaActual: 0,
  semanaHistorial: [0, 0, 0, 0, 0, 0, 0], // L, M, X, J, V, S, D
  granjeros: [
    { id: 1, nombre: "Fragmentero 1", hechoHoy: false, hora: "", tiempoMin: 0 },
    { id: 2, nombre: "Fragmentero 2", hechoHoy: false, hora: "", tiempoMin: 0 },
    { id: 3, nombre: "Fragmentero 3", hechoHoy: false, hora: "", tiempoMin: 0 },
    { id: 4, nombre: "Fragmentero 4", hechoHoy: false, hora: "", tiempoMin: 0 }
  ],
  ruedaDSS: {
    gemaActiva: "rubi",
    slots: {
      rubi: { estado: "en_progreso", claridad: "ninguna", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 },
      jade: { estado: "cola", claridad: "ninguna", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 },
      onice: { estado: "cola", claridad: "ninguna", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 },
      diamante: { estado: "cola", claridad: "ninguna", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 },
      zafiro: { estado: "cola", claridad: "ninguna", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 },
      granate: { estado: "cola", claridad: "ninguna", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 }
    }
  },
  consumibles: {
    guantesLadron: 0,
    alubiasVerdes: 0,
    elixiresSol: 0,
    pocionesMoradas: 0
  },
  finanzas: {
    saldoWons: 0,
    saldoYangKK: 0, // 1 Won = 100kk
    metaNombre: "Meta de Equipo Principal",
    metaCostoWons: 10,
    precioCompraRubiWons: 4.5,
    precioCompraRubiKK: 0,
    alquimiaSecundaria: {
      rubi: { nombre: "Rubí Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 },
      diamante: { nombre: "Diamante Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 },
      jade: { nombre: "Jade Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 },
      zafiro: { nombre: "Zafiro Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 },
      granate: { nombre: "Granate Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 },
      onice: { nombre: "Ónice Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 }
    }
  },
  objetivos: JSON.parse(JSON.stringify(HITOS_PLAN_MAESTRO))
};

let STATE = loadState();

function loadState() {
  const saved = localStorage.getItem("naaytracker_state");
  if (!saved) return JSON.parse(JSON.stringify(DEFAULT_STATE));
  try {
    const parsed = JSON.parse(saved);
    // Deep merge: fusionar subobjetos clave para no perder propiedades nuevas en DEFAULT_STATE
    const merged = Object.assign({}, DEFAULT_STATE, parsed);
    const subKeys = ["perfil", "ruedaDSS", "consumibles", "finanzas"];
    subKeys.forEach(k => {
      if (DEFAULT_STATE[k] && parsed[k] && typeof parsed[k] === "object") {
        merged[k] = Object.assign({}, DEFAULT_STATE[k], parsed[k]);
      }
    });
    // Deep merge de ruedaDSS.slots y finanzas.alquimiaSecundaria
    if (DEFAULT_STATE.ruedaDSS.slots && parsed.ruedaDSS?.slots) {
      merged.ruedaDSS.slots = Object.assign({}, DEFAULT_STATE.ruedaDSS.slots, parsed.ruedaDSS.slots);
    }
    if (DEFAULT_STATE.finanzas.alquimiaSecundaria && parsed.finanzas?.alquimiaSecundaria) {
      merged.finanzas.alquimiaSecundaria = Object.assign({}, DEFAULT_STATE.finanzas.alquimiaSecundaria, parsed.finanzas.alquimiaSecundaria);
    }
    if (merged.finanzas?.alquimiaSecundaria && !merged.finanzas.alquimiaSecundaria.rubi) {
      merged.finanzas.alquimiaSecundaria.rubi = { nombre: "Rubí Antiguo", stock: 0, ultimoPrecioWons: 0, ultimoPrecioKK: 0 };
    }
    if (merged.finanzas) {
      if (merged.finanzas.precioCompraRubiWons === undefined) merged.finanzas.precioCompraRubiWons = 4.5;
      if (merged.finanzas.precioCompraRubiKK === undefined) merged.finanzas.precioCompraRubiKK = 0;
    }
    // Asegurar objetivos y sincronizar con los 23 hitos del plan maestro
    if (!merged.objetivos || !Array.isArray(merged.objetivos) || merged.objetivos.length === 0) {
      merged.objetivos = JSON.parse(JSON.stringify(HITOS_PLAN_MAESTRO));
    } else {
      const customObjs = merged.objetivos.filter(o => !o.esHitoPlan && typeof o.id === "number");
      if ((parsed.version || 0) < 4) {
        // Migración a versión 4 con los 23 hitos guiados paso a paso
        merged.objetivos = [...JSON.parse(JSON.stringify(HITOS_PLAN_MAESTRO)), ...customObjs];
      } else {
        // Sincronizar hitos del plan maestro preservando si el usuario ya los completó
        HITOS_PLAN_MAESTRO.forEach(hp => {
          const existing = merged.objetivos.find(o => o.id === hp.id);
          if (existing) {
            existing.texto = hp.texto;
            existing.etapa = hp.etapa;
            existing.etapaNombre = hp.etapaNombre;
            existing.cat = hp.cat;
            existing.esHitoPlan = true;
          } else {
            merged.objetivos.push(Object.assign({}, hp));
          }
        });
      }
    }
    // Asegurar propiedades de stock en los slots de la rueda DSS
    // (claridad/nivel ya no se usan para tracking — solo se preservan si existen en datos antiguos)
    if (merged.ruedaDSS && merged.ruedaDSS.slots) {
      Object.keys(merged.ruedaDSS.slots).forEach(k => {
        if (merged.ruedaDSS.slots[k].stockAntiguas === undefined) merged.ruedaDSS.slots[k].stockAntiguas = 0;
        if (merged.ruedaDSS.slots[k].stockLegendarias === undefined) merged.ruedaDSS.slots[k].stockLegendarias = 0;
        if (merged.ruedaDSS.slots[k].stockMiticas === undefined) merged.ruedaDSS.slots[k].stockMiticas = 0;
      });
    }
    return merged;
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function cambiarConsumible(clave, delta) {
  if (STATE.consumibles && STATE.consumibles[clave] !== undefined) {
    STATE.consumibles[clave] = Math.max(0, STATE.consumibles[clave] + delta);
    saveState();
  }
}

function saveState() {
  localStorage.setItem("naaytracker_state", JSON.stringify(STATE));
  renderAll();
}

// ==========================================
// 3. NAVEGACIÓN Y VISTAS
// ==========================================

let activeView = "view-dashboard";
let activeZoom = "diario";

function switchView(viewId) {
  activeView = viewId;
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderAll();

  // Cargar eventos en vivo al entrar a la vista de Eventos
  if (viewId === "view-eventos") {
    // Actualizar badge del servidor
    const badge = document.getElementById("eventosServidorBadge");
    if (badge) badge.textContent = STATE.perfil.servidor || "Ruby";
    renderVistaEventos();
  }
}

function switchZoom(zoomKey) {
  activeZoom = zoomKey;
  document.querySelectorAll(".zoom-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-zoom") === zoomKey);
  });
  renderDashboardZoom();
}

// ==========================================
// 4. CONTROL DE OBJETIVOS & HITOS DEL PLAN
// ==========================================

let filtroObjetivosActual = "plan";

function setFiltroObjetivos(filtro) {
  filtroObjetivosActual = filtro;
  const btnP = document.getElementById("btnFiltroObjPlan");
  const btnC = document.getElementById("btnFiltroObjCustom");
  const btnT = document.getElementById("btnFiltroObjTodos");
  if (btnP) btnP.classList.toggle("active", filtro === "plan");
  if (btnC) btnC.classList.toggle("active", filtro === "custom");
  if (btnT) btnT.classList.toggle("active", filtro === "todos");
  renderObjetivos();
}

function renderObjetivos() {
  const cont = document.getElementById("listaObjetivos");
  if (!cont) return;

  const objs = STATE.objetivos || [];
  const hitosPlan = objs.filter(o => o.esHitoPlan);
  const hechosPlan = hitosPlan.filter(o => o.completado).length;
  const pctPlan = hitosPlan.length ? Math.round((hechosPlan / hitosPlan.length) * 100) : 0;

  // Renderizar caja de progreso del plan maestro
  const progBox = document.getElementById("progresoPlanBox");
  if (progBox) {
    progBox.innerHTML = `
      <div style="background:var(--bg-input); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid rgba(212,160,23,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.8rem; font-weight:700; color:var(--gold);">🏆 Progreso de Hitos del Plan (36 Sem):</span>
          <span class="semaphore-badge ${pctPlan >= 80 ? 'semaphore-green' : (pctPlan >= 40 ? 'semaphore-yellow' : 'semaphore-red')}">${hechosPlan} / ${hitosPlan.length} Hitos (${pctPlan}%)</span>
        </div>
        <div class="progress-track" style="height:6px; margin-bottom:4px;">
          <div class="progress-fill ${pctPlan >= 80 ? 'green' : ''}" style="width:${pctPlan}%;"></div>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); text-align:right;">
          ${hechosPlan === hitosPlan.length ? "🌟 ¡Plan maestro completado al 100%!" : "El plan marca el rumbo; sacar más Cors acelera, pero el plan manda."}
        </div>
      </div>
    `;
  }

  // Filtrar según pestaña activa
  let filtrados = objs;
  if (filtroObjetivosActual === "plan") {
    filtrados = objs.filter(o => o.esHitoPlan);
  } else if (filtroObjetivosActual === "custom") {
    filtrados = objs.filter(o => !o.esHitoPlan);
  }

  if (filtrados.length === 0) {
    const msg = filtroObjetivosActual === "custom"
      ? "No has añadido metas personales aún. ¡Escribe una abajo para agregarla!"
      : "No hay objetivos en esta categoría.";
    cont.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px 0;">${msg}</p>`;
    return;
  }

  const catColors = {
    alquimia: { icon: "💎", label: "Alquimia" },
    equipo:   { icon: "🛡️", label: "Equipo" },
    farmeo:   { icon: "⚡", label: "Farmeo" },
    finanzas: { icon: "💰", label: "Finanzas" },
    general:  { icon: "🎯", label: "Meta" }
  };

  cont.innerHTML = filtrados.map(o => {
    const c = catColors[o.cat] || catColors.general;
    const badgeEtapa = o.esHitoPlan
      ? `<span style="font-size:0.68rem; background:rgba(212,160,23,0.15); border:1px solid var(--gold); color:var(--gold); padding:1px 6px; border-radius:10px; margin-left:6px; white-space:nowrap;">E${o.etapa || 1}</span>`
      : `<span style="font-size:0.68rem; background:rgba(52,152,219,0.15); border:1px solid var(--blue); color:var(--blue); padding:1px 6px; border-radius:10px; margin-left:6px; white-space:nowrap;">Personal</span>`;

    const btnDel = o.esHitoPlan
      ? ""
      : `<button class="btn-icon" style="width:24px; height:24px; font-size:0.75rem; color:var(--text-dim);" onclick="eliminarObjetivo('${o.id}')" title="Eliminar meta personalizada">✕</button>`;

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 12px; border-radius:var(--radius-sm); border:1px solid ${o.completado ? 'rgba(46,204,113,0.3)' : 'var(--border-card)'};">
        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; flex:1;">
          <input type="checkbox" ${o.completado ? 'checked' : ''} onchange="toggleObjetivo('${o.id}')" style="accent-color:var(--green); width:16px; height:16px; cursor:pointer;">
          <span style="font-size:0.83rem; color:${o.completado ? 'var(--text-muted)' : 'var(--text-main)'}; text-decoration:${o.completado ? 'line-through' : 'none'}; line-height:1.3;">
            ${c.icon} ${o.texto} ${badgeEtapa}
          </span>
        </label>
        ${btnDel}
      </div>
    `;
  }).join('');
}

function toggleObjetivo(id) {
  const o = (STATE.objetivos || []).find(x => String(x.id) === String(id));
  if (o) {
    o.completado = !o.completado;
    saveState();
  }
}

function agregarNuevoObjetivo() {
  const inp = document.getElementById("inpNuevoObjetivo");
  if (!inp) return;
  const txt = inp.value.trim();
  if (!txt) return;

  if (!STATE.objetivos) STATE.objetivos = [];
  const customObjs = STATE.objetivos.filter(x => typeof x.id === "number");
  const nuevoId = customObjs.length ? Math.max(...customObjs.map(x => x.id)) + 1 : 1;

  let cat = "general";
  const low = txt.toLowerCase();
  if (low.includes("rubi") || low.includes("alquimia") || low.includes("jade") || low.includes("onice") || low.includes("dss") || low.includes("mitic")) cat = "alquimia";
  else if (low.includes("won") || low.includes("yang") || low.includes("ahorr") || low.includes("comprar")) cat = "finanzas";
  else if (low.includes("cor") || low.includes("granjer") || low.includes("farm")) cat = "farmeo";
  else if (low.includes("pendiente") || low.includes("casco") || low.includes("armadura") || low.includes("escudo") || low.includes("+9")) cat = "equipo";

  STATE.objetivos.push({ id: nuevoId, texto: txt, completado: false, cat, esHitoPlan: false });
  inp.value = "";
  filtroObjetivosActual = "custom";
  const btnC = document.getElementById("btnFiltroObjCustom");
  const btnP = document.getElementById("btnFiltroObjPlan");
  const btnT = document.getElementById("btnFiltroObjTodos");
  if (btnC) btnC.classList.add("active");
  if (btnP) btnP.classList.remove("active");
  if (btnT) btnT.classList.remove("active");
  saveState();
}

function eliminarObjetivo(id) {
  STATE.objetivos = (STATE.objetivos || []).filter(x => String(x.id) !== String(id));
  saveState();
}

// ==========================================
// 5. ECONOMÍA DUAL: WONS Y YANG (1kk = 1.000.000)
// ==========================================

let itemAlquimiaVendiendoKey = null;

function abrirModalVentaAlquimia(key) {
  itemAlquimiaVendiendoKey = key;
  const item = STATE.finanzas.alquimiaSecundaria[key];
  if (!item) return;

  document.getElementById("lblVentaItem").textContent = `Venta de: ${item.nombre}`;
  document.getElementById("inpVentaWons").value = item.ultimoPrecioWons || 0;
  document.getElementById("inpVentaKK").value = item.ultimoPrecioKK || 0;
  document.getElementById("modalVentaAlquimia").classList.add("active");
}

function confirmarVentaAlquimia() {
  if (!itemAlquimiaVendiendoKey) return;
  const item = STATE.finanzas.alquimiaSecundaria[itemAlquimiaVendiendoKey];
  if (!item) return;

  const wons = parseFloat(document.getElementById("inpVentaWons").value) || 0;
  const kk = parseFloat(document.getElementById("inpVentaKK").value) || 0;

  if (wons === 0 && kk === 0) {
    alert("Ingresa un precio válido.");
    return;
  }

  item.ultimoPrecioWons = wons;
  item.ultimoPrecioKK = kk;
  if (item.stock > 0) item.stock--;

  sumarDinero(wons, kk);
  cerrarModal("modalVentaAlquimia");
  alert(`✅ Venta registrada: +${wons} Wons y +${kk}kk Yang.`);
  saveState();
}

function sumarDinero(wons, kk) {
  STATE.finanzas.saldoWons += wons;
  STATE.finanzas.saldoYangKK += kk;

  if (STATE.finanzas.saldoYangKK >= 100) {
    const wonsExtra = Math.floor(STATE.finanzas.saldoYangKK / 100);
    STATE.finanzas.saldoWons += wonsExtra;
    STATE.finanzas.saldoYangKK = STATE.finanzas.saldoYangKK % 100;
  }
}

function abrirEditorMetaFinanzas() {
  document.getElementById("inpMetaNombre").value = STATE.finanzas.metaNombre;
  document.getElementById("inpMetaCosto").value = STATE.finanzas.metaCostoWons;
  document.getElementById("modalEditarMeta").classList.add("active");
}

function guardarEditorMetaFinanzas() {
  const nom = document.getElementById("inpMetaNombre").value.trim();
  const c = parseFloat(document.getElementById("inpMetaCosto").value) || 1;
  if (nom) STATE.finanzas.metaNombre = nom;
  STATE.finanzas.metaCostoWons = c;
  saveState();
  cerrarModal("modalEditarMeta");
}

function abrirModalPrecioCompraRubi() {
  const pW = STATE.finanzas.precioCompraRubiWons !== undefined ? STATE.finanzas.precioCompraRubiWons : 4.5;
  const pKK = STATE.finanzas.precioCompraRubiKK !== undefined ? STATE.finanzas.precioCompraRubiKK : 0;
  const inpW = document.getElementById("inpCompraRubiWons");
  const inpKK = document.getElementById("inpCompraRubiKK");
  if (inpW) inpW.value = pW;
  if (inpKK) inpKK.value = pKK;
  const m = document.getElementById("modalPrecioCompraRubi");
  if (m) m.classList.add("active");
}

function guardarPrecioCompraRubi() {
  const wons = parseFloat(document.getElementById("inpCompraRubiWons")?.value) || 0;
  const kk = parseFloat(document.getElementById("inpCompraRubiKK")?.value) || 0;
  if (wons === 0 && kk === 0) {
    alert("Ingresa un precio de compra válido.");
    return;
  }
  STATE.finanzas.precioCompraRubiWons = wons;
  STATE.finanzas.precioCompraRubiKK = kk;
  saveState();
  renderFinanzas();
  cerrarModal("modalPrecioCompraRubi");
}

function comprarRubiAntiguoMercadoRapido() {
  const costoWons = STATE.finanzas.precioCompraRubiWons !== undefined ? STATE.finanzas.precioCompraRubiWons : 4.5;
  const costoKK = STATE.finanzas.precioCompraRubiKK !== undefined ? STATE.finanzas.precioCompraRubiKK : 0;
  const costoTotalKK = (costoWons * 100) + costoKK;

  const saldoActualTotalKK = (STATE.finanzas.saldoWons * 100) + STATE.finanzas.saldoYangKK;

  if (saldoActualTotalKK < costoTotalKK) {
    const faltanKK = costoTotalKK - saldoActualTotalKK;
    const faltanW = (faltanKK / 100).toFixed(1);
    alert(`⚠️ Fondos insuficientes para comprar 1 Rubí Antiguo.\n\nPrecio: ${costoWons}W ${costoKK > 0 ? costoKK + 'kk' : ''}\nTu saldo: ${STATE.finanzas.saldoWons}W y ${STATE.finanzas.saldoYangKK}kk\nTe faltan: ~${faltanW} Wons.\n\n¡Vende más piedras secundarias en el mercado para acumular fondos!`);
    return;
  }

  // Restar costo
  const nuevoSaldoKK = saldoActualTotalKK - costoTotalKK;
  STATE.finanzas.saldoWons = Math.floor(nuevoSaldoKK / 100);
  STATE.finanzas.saldoYangKK = Math.round(nuevoSaldoKK % 100);

  // Sumar +1 Rubí Antiguo a la Rueda DSS
  if (!STATE.ruedaDSS.slots.rubi) {
    STATE.ruedaDSS.slots.rubi = { estado: "en_progreso", claridad: "mate", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 };
  }
  STATE.ruedaDSS.slots.rubi.stockAntiguas = (STATE.ruedaDSS.slots.rubi.stockAntiguas || 0) + 1;

  vibrar(60);
  saveState();
  renderAll();

  const stockNuevo = STATE.ruedaDSS.slots.rubi.stockAntiguas;
  alert(`🎉 ¡Rubí Antiguo Comprado con éxito!\n\nSe descontaron ${costoWons} Wons ${costoKK > 0 ? '+ ' + costoKK + 'kk' : ''} de tus fondos.\nTu stock de Rubí Antiguo en almacén sube a: ${stockNuevo} piedras.\n\n¡Estrategia de reinversión en marcha!`);
}

function vibrar(ms = 40) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

// ==========================================
// 7. ALQUIMIA RNG: JITTER Y STOP-LOSS
// ==========================================

let jitterTimerId = null;
let jitterRemaining = 0;
let consecutiveFails = 0;
let stopLossActive = false;
let stopLossTimerId = null;
let stopLossRemaining = 0;

function ejecutarIntentoAlquimia(esExito) {
  if (stopLossActive) {
    alert("🚨 STOP-LOSS ACTIVO: Espera a que termine la pausa de 60 segundos.");
    return;
  }

  const gemaKey = STATE.ruedaDSS.gemaActiva || "rubi";
  const gemaSlot = STATE.ruedaDSS.slots[gemaKey];
  const tipoIntento = document.getElementById("tipoIntentoAlquimia")?.value || "antiguas";
  const autoSync = document.getElementById("chkAutoSyncStock")?.checked ?? true;

  let detalleCambio = "";

  if (autoSync && gemaSlot) {
    if (tipoIntento === "antiguas") {
      if (esExito) {
        if (gemaSlot.stockAntiguas >= 2) {
          gemaSlot.stockAntiguas -= 2;
          gemaSlot.stockLegendarias = (gemaSlot.stockLegendarias || 0) + 1;
          detalleCambio = " (-2 Antiguas, +1 Legendaria)";
        }
      } else {
        if (gemaSlot.stockAntiguas >= 1) {
          gemaSlot.stockAntiguas -= 1;
          detalleCambio = " (-1 Antigua perdida)";
        }
      }
    } else if (tipoIntento === "legendarias") {
      if (esExito) {
        if (gemaSlot.stockLegendarias >= 2) {
          gemaSlot.stockLegendarias -= 2;
          gemaSlot.stockMiticas = (gemaSlot.stockMiticas || 0) + 1;
          detalleCambio = " (-2 Legendarias, +1 Mítica)";
        }
      } else {
        if (gemaSlot.stockLegendarias >= 1) {
          gemaSlot.stockLegendarias -= 1;
          detalleCambio = " (-1 Legendaria perdida)";
        }
      }
    } else if (tipoIntento === "claridad") {
      if (esExito) {
        if (gemaSlot.stockMiticas >= 2) {
          gemaSlot.stockMiticas -= 1; // se fusionan 2 y queda 1 de mayor claridad
          const claridades = ["mate", "claro", "limpido", "brillante", "excelente"];
          const currIdx = claridades.indexOf(gemaSlot.claridad || "mate");
          if (currIdx < claridades.length - 1) {
            gemaSlot.claridad = claridades[currIdx + 1];
          }
          detalleCambio = ` (-1 Mítica, Claridad sube a ${gemaSlot.claridad})`;
        }
      } else {
        if (gemaSlot.stockMiticas >= 1) {
          gemaSlot.stockMiticas -= 1;
          detalleCambio = " (-1 Mítica perdida)";
        }
      }
    } else if (tipoIntento === "alubia") {
      if (STATE.consumibles.alubiasVerdes > 0) {
        STATE.consumibles.alubiasVerdes--;
        if (esExito) {
          if (gemaSlot.nivel < 6) gemaSlot.nivel++;
          detalleCambio = ` (-1 Alubia, sube a +${gemaSlot.nivel})`;
        } else {
          detalleCambio = " (-1 Alubia Verde consumida)";
        }
      }
    }
    saveState();
  }

  if (esExito) {
    consecutiveFails = 0;
    const statEl = document.getElementById("jitterStatus");
    if (statEl) statEl.textContent = `✅ ¡ÉXITO!${detalleCambio} Pausa de Jitter activada:`;
    iniciarJitterCountdown();
  } else {
    consecutiveFails++;
    const statEl = document.getElementById("jitterStatus");
    if (statEl) statEl.textContent = `❌ FALLO REGISTRADO${detalleCambio}.`;
    if (consecutiveFails >= 2) {
      activarStopLoss();
      return;
    } else {
      iniciarJitterCountdown();
    }
  }
}

function iniciarJitterCountdown() {
  clearInterval(jitterTimerId);
  jitterRemaining = Math.floor(Math.random() * 5) + 3;
  actualizarUIJitter();

  jitterTimerId = setInterval(() => {
    jitterRemaining--;
    actualizarUIJitter();
    if (jitterRemaining <= 0) {
      clearInterval(jitterTimerId);
      document.getElementById("jitterStatus").textContent = "🟢 ¡LISTO PARA EL SIGUIENTE CLIC!";
      document.getElementById("btnExito").disabled = false;
      document.getElementById("btnFallo").disabled = false;
    }
  }, 1000);
}

function actualizarUIJitter() {
  const el = document.getElementById("jitterCountdown");
  if (el) el.textContent = `00:0${jitterRemaining}`;
  document.getElementById("btnExito").disabled = jitterRemaining > 0;
  document.getElementById("btnFallo").disabled = jitterRemaining > 0;
}

function activarStopLoss() {
  stopLossActive = true;
  stopLossRemaining = 60;
  clearInterval(jitterTimerId);

  document.getElementById("stopLossBox").style.display = "block";
  document.getElementById("btnExito").disabled = true;
  document.getElementById("btnFallo").disabled = true;

  clearInterval(stopLossTimerId);
  stopLossTimerId = setInterval(() => {
    stopLossRemaining--;
    const el = document.getElementById("stopLossCount");
    if (el) el.textContent = `${stopLossRemaining}s`;

    if (stopLossRemaining <= 0) {
      clearInterval(stopLossTimerId);
      stopLossActive = false;
      consecutiveFails = 0;
      document.getElementById("stopLossBox").style.display = "none";
      document.getElementById("jitterStatus").textContent = "🟢 Pausa cumplida. Estado reseteado.";
      document.getElementById("btnExito").disabled = false;
      document.getElementById("btnFallo").disabled = false;
    }
  }, 1000);
}

// ==========================================
// 8. CRONÓMETRO DE GRANJEROS
// ==========================================

let sessionTimerId = null;
let sessionSeconds = 12 * 60;
let sessionRunning = false;

function toggleSessionTimer() {
  if (sessionRunning) {
    clearInterval(sessionTimerId);
    sessionRunning = false;
    document.getElementById("btnTimerToggle").textContent = "▶️ Reanudar";
  } else {
    sessionRunning = true;
    document.getElementById("btnTimerToggle").textContent = "⏸️ Pausar";
    sessionTimerId = setInterval(() => {
      if (sessionSeconds > 0) {
        sessionSeconds--;
        renderSessionTimer();
      } else {
        clearInterval(sessionTimerId);
        sessionRunning = false;
        alert("🔔 ¡12 Minutos cumplidos! Hora de cambiar de personaje.");
      }
    }, 1000);
  }
}

function resetSessionTimer(minutos = 12) {
  clearInterval(sessionTimerId);
  sessionRunning = false;
  sessionSeconds = minutos * 60;
  document.getElementById("btnTimerToggle").textContent = "▶️ Iniciar";
  renderSessionTimer();
}

function renderSessionTimer() {
  const m = Math.floor(sessionSeconds / 60);
  const s = sessionSeconds % 60;
  const str = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  const el = document.getElementById("sessionTimerDigits");
  if (el) el.textContent = str;
}

// ==========================================
// 9. RENDERIZADO VISUAL
// ==========================================

function renderAll() {
  renderHeader();
  renderDashboardZoom();
  renderConsumiblesDash();
  renderGranjeros();
  renderEventosRadar();   // async — actualiza el DOM cuando resuelve
  renderRuedaDSS();
  renderObjetivos();
  renderFinanzas();
  renderCalculadoraLuzVerde();
  // Vista de eventos (sólo si está activa para no hacer fetch innecesario)
  if (activeView === "view-eventos") {
    renderVistaEventos();
  }
}

/**
 * Actualiza los consumibles de soporte en el Dashboard desde STATE.consumibles
 */
function renderConsumiblesDash() {
  const elGuantes = document.getElementById("dashGuantes");
  const elAlubias = document.getElementById("dashAlubias");
  if (elGuantes) elGuantes.textContent = STATE.consumibles.guantesLadron ?? 0;
  if (elAlubias) elAlubias.textContent = `${STATE.consumibles.alubiasVerdes ?? 0} / 60`;
}

function renderHeader() {
  const prof = STATE.perfil || { nombre: "Naay", servidor: "Ruby" };
  const nameEl = document.getElementById("headerProfileName");
  if (nameEl) nameEl.textContent = prof.nombre || "Naay";
  const srvEl = document.getElementById("headerServer");
  if (srvEl) srvEl.textContent = prof.servidor || "Ruby";
}

function renderDashboardZoom() {
  const cont = document.getElementById("zoomContainer");
  if (!cont) return;

  if (activeZoom === "diario") {
    const hechos = STATE.granjeros.filter(g => g.hechoHoy).length;
    const corsHoy = hechos * 5;
    const pct = Math.round((corsHoy / 20) * 100);

    cont.innerHTML = `
      <div class="card-title">
        <span>⚡ Tarea Diaria (Hoy)</span>
        <span class="semaphore-badge ${pct === 100 ? 'semaphore-green' : 'semaphore-yellow'}">${corsHoy} / 20 Cors (${pct}%)</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${pct === 100 ? 'green' : ''}" style="width: ${pct}%"></div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
        ${hechos === 4 ? '🎉 ¡Cuota completada! Descanso merecido.' : `Faltan ${4 - hechos} personaje(s) por fragmentar.`}
      </p>
      <button class="btn-primary" onclick="switchView('view-granjeros')" style="margin-top:0;">👥 Abrir Granjeros & Timer</button>
    `;
  } else if (activeZoom === "semanal") {
    const cors = STATE.corsSemanaActual;
    const pct = Math.min(100, Math.round((cors / 140) * 100));
    const semColor = cors >= 100 ? 'semaphore-green' : (cors >= 70 ? 'semaphore-yellow' : 'semaphore-red');

      const diaHoyIdx = (new Date().getDay() + 6) % 7; // 0=Lun, 1=Mar ... 6=Dom
      cont.innerHTML = `
      <div class="card-title">
        <span>📅 Semana ${STATE.semanaActual} de 36</span>
        <span class="semaphore-badge ${semColor}">${cors} / 140 Cors</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${cors >= 100 ? 'green' : ''}" style="width: ${pct}%"></div>
      </div>
      <div class="week-matrix">
        ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => `
          <div class="day-cell ${i === diaHoyIdx ? 'today' : ''}">
            <span class="day-name">${d}</span>
            <span class="day-val">${STATE.semanaHistorial[i] || 0}</span>
            <span class="day-status">${(STATE.semanaHistorial[i] || 0) >= 20 ? '✅' : ((STATE.semanaHistorial[i] || 0) > 0 ? '🟡' : '⏳')}</span>
          </div>
        `).join('')}
      </div>
      <p style="font-size: 0.8rem; color: var(--gold); margin-top: 8px;">
        🎯 Meta Semana ${STATE.semanaActual}: Mantener Semáforo Verde (≥100 Cors).
      </p>
    `;
  } else if (activeZoom === "mensual") {
    const mesNum = Math.ceil(STATE.semanaActual / 4);
    const semInicio = (mesNum - 1) * 4 + 1;
    const semFin = mesNum * 4;
    // Cors del mes: historial de la semana actual + corsSemanaActual (semana en curso) 
    // Para semanas pasadas del mismo mes, usaríamos un historial de semanas (no implementado aún),
    // así que calculamos con lo que tenemos: semana actual + estimado de semanas del mes completo.
    // Estimamos cors de las semanas anteriores del mes usando corsSemanaActual como referencia.
    const corsMesActual = STATE.corsSemanaActual; // semana en curso
    const corsMesTotal  = STATE.corsTotal; // acumulado global (para mostrar hito)
    // Meta del mes: 4 semanas × 140 = 560 Cors máximos
    const metaMes = 560;
    // Pct basado en semana actual vs meta semanal proporcional al avance del mes
    const semDentroMes = ((STATE.semanaActual - 1) % 4) + 1;
    const metaProporcional = semDentroMes * 140;
    const pctMes = Math.min(100, Math.round((corsMesActual / metaProporcional) * 100));
    const semColor2 = pctMes >= 90 ? 'semaphore-green' : (pctMes >= 60 ? 'semaphore-yellow' : 'semaphore-red');
    cont.innerHTML = `
      <div class="card-title">
        <span>📆 Mes ${mesNum} (Semanas ${semInicio}–${semFin})</span>
        <span class="semaphore-badge ${semColor2}">${corsMesActual} Cors sem. ${STATE.semanaActual} (${pctMes}%)</span>
      </div>
      <div class="progress-track"><div class="progress-fill ${pctMes >= 90 ? 'green' : ''}" style="width: ${pctMes}%;"></div></div>
      <div style="background: var(--bg-input); padding: 10px; border-radius: var(--radius-sm); font-size: 0.82rem; margin-top: 8px;">
        <strong style="color: var(--gold);">🏆 Hito Mes ${mesNum}:</strong>
        <p style="margin-top: 4px;">6-8 Míticos Mates y comprar ${STATE.finanzas.metaNombre}.</p>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">📊 Total global acumulado: <strong style="color:var(--gold);">${corsMesTotal} / 5040 Cors</strong></p>
      </div>
    `;
  } else if (activeZoom === "global") {
    const pct = Math.min(100, Math.round((STATE.corsTotal / 5040) * 100));
    cont.innerHTML = `
      <div class="card-title">
        <span>🌍 Progreso Total hacia Excelente +6</span>
        <span class="semaphore-badge semaphore-green">${STATE.corsTotal} / 5040 Cors (${pct}%)</span>
      </div>
      <div class="progress-track"><div class="progress-fill ruby" style="width: ${pct}%;"></div></div>
      <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin-top: 8px;">
        <div>✅ Etapa 1: Cimientos (Sem 1-8)</div>
        <div style="color:var(--gold);">🔄 Etapa 2: Míticos Mates (Sem 9-16) ➔ Estás Aquí</div>
        <div>🔒 Etapa 3: Pureza Clara & Límpida (Sem 17-24)</div>
        <div>🔒 Etapa 4: Colchón de Brillantes (Sem 25-32)</div>
        <div>🏆 Etapa 5: Excelente +6 (Sem 33-36)</div>
      </div>
    `;
  }
}

function renderGranjeros() {
  const cont = document.getElementById("farmersList");
  if (!cont) return;

  cont.innerHTML = STATE.granjeros.map((g, i) => `
    <div class="farmer-row">
      <div class="farmer-name">
        <span>${g.hechoHoy ? '✅' : '⏳'}</span>
        <span>${g.nombre}</span>
        ${g.hora ? `<span style="font-size: 0.75rem; color: var(--text-muted);">(${g.hora})</span>` : ''}
      </div>
      <button class="btn-complete ${g.hechoHoy ? 'done' : ''}" onclick="toggleGranjero(${i})">
        ${g.hechoHoy ? 'Completado ✓' : 'Marcar 5 Cors'}
      </button>
    </div>
  `).join('');
}

function toggleGranjero(index) {
  const g = STATE.granjeros[index];
  g.hechoHoy = !g.hechoHoy;
  if (g.hechoHoy) {
    const d = new Date();
    g.hora = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    STATE.corsSemanaActual += 5;
    STATE.corsTotal += 5;
  } else {
    g.hora = "";
    STATE.corsSemanaActual = Math.max(0, STATE.corsSemanaActual - 5);
    STATE.corsTotal = Math.max(0, STATE.corsTotal - 5);
  }
  saveState();
}

function esEventoAlquimia(nombre) {
  const n = (nombre || "").toLowerCase();
  return n.includes("cor draconis") || n.includes("alubia");
}

let filtroEventosActual = "todos";

function setFiltroEventos(filtro) {
  filtroEventosActual = filtro;
  const btnT = document.getElementById("btnFiltroEvTodos");
  const btnA = document.getElementById("btnFiltroEvAlquimia");
  if (btnT) btnT.classList.toggle("active", filtro === "todos");
  if (btnA) btnA.classList.toggle("active", filtro === "alquimia");
  renderVistaEventos();
}

async function renderEventosRadar() {
  const el = document.getElementById("radarEventBox");
  if (!el) return;

  el.innerHTML = `
    <div class="radar-header"><span>⏰ RADAR DE EVENTOS</span><span style="font-size:0.75rem; color:var(--text-muted);">Cargando...</span></div>
    <div class="radar-content" style="font-size:0.85rem; color:var(--text-muted);">Consultando eventos del servidor...</div>
  `;

  const eventos = await cargarEventosAPI();
  const servidor = STATE.perfil.servidor || "Ruby";
  const filtrados = filtrarEventosPorServidor(eventos, servidor);

  const now       = new Date();
  const horaActual  = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const fechaHoy    = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
  const diaNombreHoy = DIA_API_MAP[now.getDay()];

  const esEventoHoy = ev => {
    const tipo = (ev.tipo_evento || "").toLowerCase();
    return tipo === "estatico" ? ev.dia_semana === diaNombreHoy : ev.fecha === fechaHoy;
  };

  // Soporte para eventos que cruzan medianoche en hora local (hora_inicio > hora_fin)
  const estaActivo = (ev, hora) => {
    if (ev.hora_inicio <= ev.hora_fin) {
      return hora >= ev.hora_inicio && hora <= ev.hora_fin;
    }
    // Cruza medianoche: activo si hora >= inicio O hora <= fin
    return hora >= ev.hora_inicio || hora <= ev.hora_fin;
  };

  const activo   = filtrados.find(ev => esEventoHoy(ev) && estaActivo(ev, horaActual));
  const proximos = filtrados.filter(ev => esEventoHoy(ev) && !estaActivo(ev, horaActual) && horaActual < ev.hora_inicio)
                            .sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio));

  const badge = `<span style="font-size:0.7rem; background:rgba(212,160,23,0.15); border:1px solid var(--gold); color:var(--gold); padding:1px 6px; border-radius:10px; margin-left:6px;">${servidor}</span>`;

  if (EVENTOS_API_ERROR) {
    el.innerHTML = `<div class="radar-header"><span>⚠️ SIN CONEXIÓN</span></div><div class="radar-content" style="font-size:0.82rem; color:var(--text-muted);">No se pudieron cargar los eventos en vivo.</div>`;
    return;
  }

  if (activo) {
    const esAlq = esEventoAlquimia(activo.nombre_evento);
    const ico = activo.tipo_evento === "especial" ? "🗓️ ESPECIAL" : activo.tipo_evento === "grupo" ? "👥 GRUPO" : "⚡ ACTIVO AHORA";
    const alqBadge = esAlq ? `<span style="font-size:0.68rem; background:rgba(46,204,113,0.2); border:1px solid var(--green); color:var(--green); padding:1px 6px; border-radius:10px; margin-left:6px;">💎 EVENTO ALQUIMIA</span>` : "";
    let tip = activo.descripcion || "";
    if (esAlq) {
      if (activo.nombre_evento.toLowerCase().includes("cor draconis")) {
        tip = "💡 <strong>¡Farmea Cors ahora!</strong> Pasa tus 4 granjeros para duplicar cors durante esta franja.";
      } else if (activo.nombre_evento.toLowerCase().includes("alubia")) {
        tip = "💡 <strong>¡Cosecha de Alubias!</strong> Acumula alubias para subir tu DSS a +4 / +6.";
      }
    }

    el.innerHTML = `
      <div class="radar-header"><span>${ico} ${badge} ${alqBadge}</span><span>${activo.hora_inicio} – ${activo.hora_fin}</span></div>
      <div class="radar-content">💎 ${activo.nombre_evento}</div>
      <div style="font-size:0.8rem; color:${esAlq ? 'var(--green)' : 'var(--text-muted)'}; margin-top:4px;">${tip}</div>`;
  } else if (proximos.length > 0) {
    const prox = proximos[0];
    const esAlqProx = esEventoAlquimia(prox.nombre_evento);
    const alqBadge = esAlqProx ? `<span style="font-size:0.68rem; background:rgba(46,204,113,0.2); border:1px solid var(--green); color:var(--green); padding:1px 6px; border-radius:10px; margin-left:6px;">💎 ALQUIMIA</span>` : "";
    el.innerHTML = `
      <div class="radar-header"><span>⏰ PRÓXIMO HOY ${badge} ${alqBadge}</span><span>Inicia ${prox.hora_inicio}</span></div>
      <div class="radar-content">${prox.nombre_evento}</div>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${prox.descripcion || ""}</div>
      ${proximos.length > 1 ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:6px;">+${proximos.length-1} más hoy</div>` : ""}`;
  } else {
    el.innerHTML = `<div class="radar-header"><span>📅 RADAR ${badge}</span></div><div class="radar-content" style="font-size:0.85rem; color:var(--text-muted);">Sin eventos hoy para ${servidor}.</div>`;
  }
}

/**
 * Vista completa de Eventos: reproduce la lógica de gahdm2.com/script.js
 * - Estáticos: agrupados por día de semana (tabla semanal fija)
 * - Especiales / Grupo / Global: filtrados por MES y AÑO actuales, ordenados por fecha
 * - Soporta filtro de ALQUIMIA & FARMA
 * NOTA: Las horas ya están convertidas a hora LOCAL del dispositivo por filtrarEventosPorServidor().
 */
async function renderVistaEventos() {
  const cont = document.getElementById("eventosList");
  if (!cont) return;

  cont.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:20px 0;">⏳ Cargando calendario de eventos...</p>`;

  const eventos  = await cargarEventosAPI();
  const servidor = STATE.perfil.servidor || "Ruby";
  let filtrados = filtrarEventosPorServidor(eventos, servidor);

  // Aplicar filtro de Alquimia si está activo
  if (filtroEventosActual === "alquimia") {
    filtrados = filtrados.filter(ev => esEventoAlquimia(ev.nombre_evento));
  }

  if (EVENTOS_API_ERROR || filtrados.length === 0) {
    cont.innerHTML = `<p style="color:var(--ruby); font-size:0.85rem; text-align:center; padding:20px 0;">
      ⚠️ Sin eventos ${filtroEventosActual === 'alquimia' ? 'de Alquimia' : ''} encontrados para <strong>${servidor}</strong>.
    </p>`;
    return;
  }

  const now        = new Date();
  const mesActual  = now.getMonth() + 1;
  const añoActual  = now.getFullYear();
  const fechaHoy   = `${añoActual}-${mesActual.toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
  const horaActual = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const diaNombreHoy = DIA_API_MAP[now.getDay()];
  const meses = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // Soporte para eventos que cruzan medianoche en hora local
  const estaActivo = (hi, hf, hora) => {
    if (hi <= hf) return hora >= hi && hora <= hf;
    return hora >= hi || hora <= hf; // cruza medianoche
  };

  // ── ESTÁTICOS: semanal fijo ──
  const estaticos  = filtrados.filter(ev => (ev.tipo_evento||"").toLowerCase() === "estatico");
  const diasOrden  = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  const diasLabel  = {"lunes":"Lunes","martes":"Martes","miércoles":"Miércoles","jueves":"Jueves","viernes":"Viernes","sábado":"Sábado","domingo":"Domingo"};

  const filasDias = diasOrden.map(dia => {
    const evs = estaticos.filter(ev => ev.dia_semana === dia).sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio));
    if (!evs.length) return "";
    const esHoy = dia === diaNombreHoy;
    return `<div style="margin-bottom:10px;">
      <div style="font-size:0.72rem; font-weight:800; color:${esHoy ? 'var(--gold)':'var(--text-muted)'}; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px;">${esHoy ? '📍 ':'' }${diasLabel[dia]}</div>
      ${evs.map(ev => {
        const activo = esHoy && estaActivo(ev.hora_inicio, ev.hora_fin, horaActual);
        const esAlq = esEventoAlquimia(ev.nombre_evento);
        return `<div style="display:flex;justify-content:space-between;align-items:center;background:${activo?'rgba(46,204,113,0.1)':'var(--bg-input)'};padding:6px 10px;border-radius:var(--radius-sm);margin-bottom:3px;border:1px solid ${activo?'var(--green)':esHoy?'rgba(212,160,23,0.2)':'var(--border-card)'};">
          <span style="font-size:0.82rem;font-weight:600;color:${activo?'var(--green)':'var(--text-main)'};">
            ${activo?'🟢 ':''}${ev.nombre_evento}
            ${esAlq ? '<span style="font-size:0.65rem; background:rgba(46,204,113,0.15); color:var(--green); border:1px solid var(--green); padding:1px 4px; border-radius:4px; margin-left:4px;">💎 Alquimia</span>' : ''}
          </span>
          <span style="font-size:0.72rem;color:var(--gold);font-family:monospace;white-space:nowrap;margin-left:8px;">${ev.hora_inicio}–${ev.hora_fin}</span>
        </div>`;
      }).join("")}
    </div>`;
  }).join("");

  const htmlEstaticos = estaticos.length ? `
    <div style="margin-bottom:18px;">
      <div style="font-size:0.75rem;font-weight:800;color:var(--blue);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid var(--border-card);padding-bottom:6px;">
        📅 Calendario Semanal Fijo ${filtroEventosActual === 'alquimia' ? '(Filtrado Alquimia)' : '(Hora local)'}
      </div>
      ${filasDias}
    </div>` : "";

  // ── CALENDARIO DEL MES: grupo + especial + global con fecha ──
  const eventosMes = filtrados
    .filter(ev => {
      if (!ev.fecha) return false;
      const tipo = (ev.tipo_evento||"").toLowerCase();
      if (tipo === "estatico") return false;
      const [y,m] = ev.fecha.split("-");
      return parseInt(y) === añoActual && parseInt(m) === mesActual;
    })
    .sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));

  const htmlMes = eventosMes.length ? `
    <div>
      <div style="font-size:0.75rem;font-weight:800;color:var(--ruby);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid var(--border-card);padding-bottom:6px;">
        🗓️ ${meses[mesActual]} ${añoActual} — Eventos Especiales ${filtroEventosActual === 'alquimia' ? '(Alquimia)' : ''}
      </div>
      ${eventosMes.map(ev => {
        const esPasado = ev.fecha < fechaHoy;
        const esHoy2   = ev.fecha === fechaHoy;
        const activo   = esHoy2 && estaActivo(ev.hora_inicio, ev.hora_fin, horaActual);
        const dia      = parseInt(ev.fecha.split("-")[2]);
        const esAlq    = esEventoAlquimia(ev.nombre_evento);
        return `<div style="display:flex;justify-content:space-between;align-items:flex-start;background:${activo?'rgba(46,204,113,0.1)':esPasado?'rgba(255,255,255,0.02)':'var(--bg-input)'};padding:8px 10px;border-radius:var(--radius-sm);margin-bottom:4px;border:1px solid ${activo?'var(--green)':esHoy2?'rgba(212,160,23,0.3)':'var(--border-card)'};opacity:${esPasado?'0.45':'1'};">
          <div>
            <div style="font-size:0.82rem;font-weight:600;color:${activo?'var(--green)':esPasado?'var(--text-muted)':'var(--text-main)'};">
              ${activo?'🟢 ':''}${ev.nombre_evento}
              ${esAlq ? '<span style="font-size:0.65rem; background:rgba(46,204,113,0.15); color:var(--green); border:1px solid var(--green); padding:1px 4px; border-radius:4px; margin-left:4px;">💎 Alquimia</span>' : ''}
            </div>
            ${ev.descripcion ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${ev.descripcion}</div>` : ""}
          </div>
          <div style="text-align:right;flex-shrink:0;margin-left:10px;">
            <div style="font-size:0.72rem;color:var(--text-dim);">${dia} ${meses[mesActual].slice(0,3)}</div>
            <div style="font-size:0.72rem;color:var(--gold);font-family:monospace;">${ev.hora_inicio}${ev.hora_fin?'–'+ev.hora_fin:''}</div>
          </div>
        </div>`;
      }).join("")}
    </div>` :
    `<p style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:10px 0;">Sin eventos ${filtroEventosActual === 'alquimia' ? 'de Alquimia' : ''} en ${meses[mesActual]} para <strong>${servidor}</strong>.</p>`;

  cont.innerHTML = htmlEstaticos + htmlMes;
}


const GEMA_INFO_MAP = {
  rubi:     { nombre: "Rubí", icono: "🔴", color: "var(--ruby)", stat: "Valor Ataque + Media" },
  jade:     { nombre: "Jade", icono: "🟢", color: "var(--green)", stat: "Max HP + Robo Vida" },
  onice:    { nombre: "Ónice", icono: "⚫", color: "#b0b8c4", stat: "Bloqueo + Res. Crítico" },
  diamante: { nombre: "Diamante", icono: "⚪", color: "#ffffff", stat: "Ataque Mágico + Habilidad" },
  zafiro:   { nombre: "Zafiro", icono: "🔵", color: "var(--blue)", stat: "Fuerza vs Razas" },
  granate:  { nombre: "Granate", icono: "🟠", color: "var(--gold)", stat: "SP + Res. Relámpago" }
};

function renderRuedaDSS() {
  const gemaKey = STATE.ruedaDSS.gemaActiva || "rubi";
  const slots = STATE.ruedaDSS.slots;
  const gemaData = slots[gemaKey] || { stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 };

  // 1. Renderizar Rueda Visual de los 6 Slots
  const wheelGrid = document.getElementById("dssWheelGrid");
  if (wheelGrid) {
    wheelGrid.innerHTML = Object.keys(GEMA_INFO_MAP).map(k => {
      const g = GEMA_INFO_MAP[k];
      const slot = slots[k] || { stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 };
      const esActiva = k === gemaKey;
      const totalPiedras = (slot.stockAntiguas || 0) + (slot.stockLegendarias || 0) + (slot.stockMiticas || 0);
      const subtitulo = totalPiedras > 0
        ? `A:${slot.stockAntiguas || 0} L:${slot.stockLegendarias || 0} M:${slot.stockMiticas || 0}`
        : "Sin stock";

      return `
        <div onclick="cambiarGemaActiva('${k}')" style="background:${esActiva ? 'rgba(212,160,23,0.15)' : 'var(--bg-card)'}; border:2px solid ${esActiva ? 'var(--gold)' : 'var(--border-card)'}; border-radius:var(--radius-sm); padding:8px 6px; text-align:center; cursor:pointer; transition:all 0.2s; box-shadow:${esActiva ? '0 0 12px var(--gold-glow)' : 'none'};">
          <div style="font-size:1.3rem;">${g.icono}</div>
          <div style="font-size:0.75rem; font-weight:800; color:${esActiva ? 'var(--gold)' : 'var(--text-main)'}; margin-top:2px;">${g.nombre}</div>
          <div style="font-size:0.62rem; color:${totalPiedras > 0 ? 'var(--text-muted)' : 'var(--text-dim)'}; margin-top:4px; font-family:monospace;">
            ${subtitulo}
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Actualizar detalles de la Gema Activa
  const infoActiva = GEMA_INFO_MAP[gemaKey] || GEMA_INFO_MAP.rubi;
  const titleEl = document.getElementById("activeGemaTitle");
  if (titleEl) titleEl.textContent = `${infoActiva.icono} ${infoActiva.nombre} (${infoActiva.stat})`;

  // Badge muestra totales del almacén de la gema activa
  const badgeEl = document.getElementById("activeGemaBadge");
  if (badgeEl) {
    const ant = gemaData.stockAntiguas || 0;
    const leg = gemaData.stockLegendarias || 0;
    const mit = gemaData.stockMiticas || 0;
    const totalPiedras = ant + leg + mit;
    if (totalPiedras === 0) {
      badgeEl.textContent = "Almacén";
      badgeEl.style.color = "var(--text-muted)";
      badgeEl.style.borderColor = "var(--border-card)";
      badgeEl.style.background = "rgba(255,255,255,0.04)";
    } else {
      badgeEl.textContent = `A:${ant} L:${leg} M:${mit}`;
      badgeEl.style.color = "var(--gold)";
      badgeEl.style.borderColor = "var(--gold)";
      badgeEl.style.background = "rgba(212,160,23,0.15)";
    }
  }

  const stAnt = document.getElementById("stockAntiguas");
  if (stAnt) stAnt.textContent = gemaData.stockAntiguas || 0;

  const stLeg = document.getElementById("stockLegendarias");
  if (stLeg) stLeg.textContent = gemaData.stockLegendarias || 0;

  const stMit = document.getElementById("stockMiticas");
  if (stMit) stMit.textContent = gemaData.stockMiticas || 0;

  // Actualizar badge en Asistente RNG
  const asisBadge = document.getElementById("asistenteGemaBadge");
  if (asisBadge) asisBadge.textContent = `${infoActiva.icono} ${infoActiva.nombre}`;

  // 3. Calculadora y Proyecciones DSS
  const calcInfo = document.getElementById("dssCalculadoraInfo");
  if (calcInfo) {
    const ant = gemaData.stockAntiguas || 0;
    const leg = gemaData.stockLegendarias || 0;
    const mit = gemaData.stockMiticas || 0;

    const potLegendarias = Math.floor(ant / 2);
    const potMiticas = Math.floor((leg + potLegendarias) / 2);

    calcInfo.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <span>🎯 Potencial directo en almacén:</span>
        <strong style="color:var(--gold);">+${potLegendarias} Legendarias / +${potMiticas} Míticas</strong>
      </div>
      <div style="padding: 8px 10px; background: rgba(212, 160, 23, 0.08); border-left: 3px solid var(--gold); border-radius: 4px; font-size: 0.74rem; line-height: 1.45; margin-bottom: 6px;">
        <strong style="color: var(--gold);">📐 Pirámide de Claridad a Excelente (Metin2):</strong><br>
        • <strong>Mate ➔ Claro:</strong> Requiere 2 Míticas Mate (Colchón seguro: <strong>4 Míticas</strong>).<br>
        • <strong>Claro ➔ Límpido:</strong> Requiere 2 Claras (Equivale a 4 Míticas Mate exitosas).<br>
        • <strong>Límpido ➔ Brillante:</strong> Requiere 2 Límpidas (Equivale a 8 Míticas Mate exitosas).<br>
        • <strong>Brillante ➔ Excelente:</strong> Requiere 2 Brillantes (Equivale a 16+ Míticas Mate teóricas; ~25-35 reales por tasa del ~30-35%).
      </div>
      <div style="font-size:0.73rem; color:var(--text-muted); line-height:1.4;">
        ⚠️ <strong>Regla Anti-Quiebra de Claridad:</strong> Nunca fusiones pureza con solo 2 Míticas. Un fallo destruye la piedra y paraliza semanas de trabajo. Acumula siempre <strong>4+ Míticas</strong> antes de intentar subir pureza.
      </div>
    `;
  }
}

function cambiarGemaActiva(gemaKey) {
  STATE.ruedaDSS.gemaActiva = gemaKey;
  saveState();
}

function cambiarStockGema(tipo, delta) {
  const gemaKey = STATE.ruedaDSS.gemaActiva || "rubi";
  if (!STATE.ruedaDSS.slots[gemaKey]) return;
  STATE.ruedaDSS.slots[gemaKey][tipo] = Math.max(0, (STATE.ruedaDSS.slots[gemaKey][tipo] || 0) + delta);
  saveState();
}


function renderFinanzas() {
  const elWons = document.getElementById("saldoWons");
  if (elWons) elWons.textContent = STATE.finanzas.saldoWons;
  const elYang = document.getElementById("saldoYang");
  if (elYang) elYang.textContent = `${STATE.finanzas.saldoYangKK}kk`;

  const metaW = STATE.finanzas.metaCostoWons || 35;
  const actualW = (STATE.finanzas.saldoWons || 0) + ((STATE.finanzas.saldoYangKK || 0) / 100);
  const pct = Math.min(100, Math.round((actualW / metaW) * 100));

  const elMetaTitle = document.getElementById("metaEquipTitle");
  if (elMetaTitle) elMetaTitle.textContent = STATE.finanzas.metaNombre;
  const elMetaProg = document.getElementById("metaEquipProgress");
  if (elMetaProg) elMetaProg.style.width = `${pct}%`;
  const elMetaStat = document.getElementById("metaEquipStatus");
  if (elMetaStat) elMetaStat.textContent = `${STATE.finanzas.saldoWons} Wons y ${STATE.finanzas.saldoYangKK}kk / ${metaW} Wons (${pct}%)`;

  const tbody = document.getElementById("tablaAlquimiaSecundaria");
  if (tbody) {
    const sec = STATE.finanzas.alquimiaSecundaria || {};
    tbody.innerHTML = Object.keys(sec).map(k => {
      const item = sec[k];
      const precioTxt = item.ultimoPrecioWons > 0 && item.ultimoPrecioKK > 0
        ? `${item.ultimoPrecioWons}W + ${item.ultimoPrecioKK}kk`
        : (item.ultimoPrecioWons > 0 ? `${item.ultimoPrecioWons} Wons` : (item.ultimoPrecioKK > 0 ? `${item.ultimoPrecioKK}kk Yang` : "Sin cotizar"));

      return `
        <tr>
          <td><strong>${item.nombre}</strong></td>
          <td>
            <div style="display:inline-flex; align-items:center; gap:6px;">
              <button class="btn-counter" onclick="cambiarStockAlquimiaSec('${k}', -1)">-</button>
              <span style="min-width:24px; text-align:center; font-weight:800; font-size:0.95rem;">${item.stock}</span>
              <button class="btn-counter" onclick="cambiarStockAlquimiaSec('${k}', 1)">+</button>
            </div>
          </td>
          <td style="color: var(--gold); font-size:0.8rem;">${precioTxt}</td>
          <td>
            <button class="btn-complete done" onclick="abrirModalVentaAlquimia('${k}')" style="padding: 6px 12px; font-size: 0.78rem;">
              Vender ➔
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Panel de Arbitraje / Reinversión en Rubíes Antiguos
  const panelArb = document.getElementById("panelArbitrajeRubi");
  const lblPrecio = document.getElementById("lblPrecioCompraRubi");
  if (panelArb) {
    const cWons = STATE.finanzas.precioCompraRubiWons !== undefined ? STATE.finanzas.precioCompraRubiWons : 4.5;
    const cKK = STATE.finanzas.precioCompraRubiKK !== undefined ? STATE.finanzas.precioCompraRubiKK : 0;
    const precioTxt = `${cWons}W${cKK > 0 ? ' + ' + cKK + 'kk' : ''}`;
    if (lblPrecio) lblPrecio.textContent = precioTxt;

    const saldoTotalKK = (STATE.finanzas.saldoWons * 100) + (STATE.finanzas.saldoYangKK || 0);
    const costoUnitarioKK = (cWons * 100) + cKK;
    const rubisComprables = costoUnitarioKK > 0 ? Math.floor(saldoTotalKK / costoUnitarioKK) : 0;
    const rubisStock = STATE.ruedaDSS?.slots?.rubi?.stockAntiguas || 0;

    panelArb.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); border:1px solid rgba(231,76,60,0.25);">
        <div>
          <span style="color:var(--text-muted); font-size:0.75rem;">Cotización compra:</span>
          <strong style="color:var(--gold); margin-left:4px;">${precioTxt}</strong>
        </div>
        <div>
          <span style="color:var(--text-muted); font-size:0.75rem;">Poder de compra:</span>
          <strong style="color:${rubisComprables > 0 ? 'var(--green)' : 'var(--text-dim)'}; margin-left:4px;">
            ${rubisComprables} Rubí(es)
          </strong>
        </div>
      </div>
      <div style="font-size:0.73rem; color:var(--text-muted); margin-top:5px; text-align:right;">
        Stock en almacén: <strong style="color:var(--ruby);">${rubisStock} Rubí(es) Antiguo(s)</strong>
      </div>
    `;
  }
}

function cambiarStockAlquimiaSec(key, delta) {
  if (STATE.finanzas.alquimiaSecundaria[key]) {
    STATE.finanzas.alquimiaSecundaria[key].stock = Math.max(0, STATE.finanzas.alquimiaSecundaria[key].stock + delta);
    saveState();
  }
}

function renderCalculadoraLuzVerde() {
  const gemaKey = STATE.ruedaDSS.gemaActiva || "rubi";
  const gemaData = STATE.ruedaDSS.slots[gemaKey] || {};
  const el = document.getElementById("calcResultado");
  if (!el) return;

  const tipoSelect = document.getElementById("tipoIntentoAlquimia");
  const tipo = tipoSelect ? tipoSelect.value : "antiguas";

  let semColor = "red";
  let prob = "0%";
  let dictamen = "";
  let stockLabel = "";

  if (tipo === "alubia") {
    const alubias = STATE.consumibles.alubiasVerdes || 0;
    const lvl = gemaData.nivel !== undefined ? gemaData.nivel : 0;
    stockLabel = `Alubias Verdes: ${alubias} | Nivel Actual: +${lvl}`;

    if (lvl >= 6) {
      semColor = "green";
      prob = "Nivel Máx (+6)";
      dictamen = "🏆 ¡Piedra al máximo nivel (+6)! No requiere más alubias.";
    } else if (alubias === 0) {
      semColor = "red";
      prob = "Sin alubias";
      dictamen = "⛔ Sin alubias: Necesitas alubias verdes para intentar subir el nivel (+0 a +6).";
    } else {
      // La probabilidad disminuye drásticamente a medida que sube el nivel
      if (lvl <= 2) {
        semColor = alubias >= 3 ? "green" : "yellow";
        prob = "~65% (Fácil)";
        dictamen = `🟢 Probabilidad alta para subir a +${lvl + 1} (~65%). Seguro para intentar.`;
      } else if (lvl === 3) {
        semColor = alubias >= 6 ? "yellow" : "red";
        prob = "~50% (Medio)";
        dictamen = "🟡 Probabilidad media (~50%) para +4. Si falla, existe riesgo de bajar a +2.";
      } else if (lvl === 4) {
        semColor = alubias >= 10 ? "yellow" : "red";
        prob = "~35% (Difícil)";
        dictamen = "⚠️ Probabilidad baja (~35%) para +5. Alto riesgo de degradar a +3. Se aconseja lote grande.";
      } else {
        // lvl === 5 intentando +6
        semColor = alubias >= 15 ? "green" : "red";
        prob = "~25% (Crítico)";
        dictamen = "🚨 Salto a +6: Tasa muy baja (~25%). Si falla bajará a +4. Imprescindible tener 15+ alubias de reserva.";
      }
    }
  } else if (tipo === "legendarias") {
    // Al acercarse a Mítico la tasa base cae del 64% al ~45-50%
    const stockLeg = gemaData.stockLegendarias || 0;
    stockLabel = `Stock de ${gemaKey.toUpperCase()} Legendario: ${stockLeg} piedras`;
    if (stockLeg === 0) {
      semColor = "red";
      prob = "Sin stock";
      dictamen = "⛔ Sin material: Se requieren al menos 2 piedras Legendarias para intentar fusionar una Mítica.";
    } else if (stockLeg === 1) {
      semColor = "red";
      prob = "Insuficiente (1/2)";
      dictamen = "⚠️ Stock insuficiente: Tienes 1 Legendaria, requieres 2 para el intento.";
    } else if (stockLeg < 4) {
      semColor = "yellow";
      prob = "45% (1 intento)";
      dictamen = "⚠️ La probabilidad a Mítico desciende a ~45%. Si falla perderás 1 Legendaria (55% de fallo). Se sugiere acumular 4+ piedras.";
    } else if (stockLeg < 8) {
      semColor = "green";
      prob = "~70% (2 intentos)";
      dictamen = "🟢 Colchón de 2-3 intentos (~70% de sacar al menos 1 Mítica). Aplica Stop-Loss estricto si hay 2 fallos consecutivos.";
    } else if (stockLeg < 12) {
      semColor = "green";
      prob = "88%+ (Lote 8 Legendarias)";
      dictamen = "💎 ¡Banco Hito (8 Legendarias = 4 intentos)! Rendimiento esperado: 2 Míticas Mate para alimentar la pirámide de pureza.";
    } else {
      semColor = "green";
      prob = "96%+ (Lote 12-16+ Legendarias)";
      dictamen = "🏆 ¡Banco Industrial (12-16+ Legendarias)! Reserva óptima del plan para producir las Míticas necesarias hacia la pureza.";
    }
  } else if (tipo === "claridad") {
    // La claridad exige fusionar 2 gemas de la misma pureza.
    // REGLA FUNDAMENTAL DE METIN2: Con solo 2 míticas tienes 1 intento con 50% de fallo (quiebra).
    // Para subir claridad de forma segura y tener luz verde se necesitan AL MENOS 4 MÍTICAS.
    const stockMit = gemaData.stockMiticas || 0;
    const clarActual = gemaData.claridad || "mate";
    stockLabel = `Stock de ${gemaKey.toUpperCase()} Mítico: ${stockMit} piedras | Claridad Actual: ${clarActual.toUpperCase()}`;

    let siguienteClaridad = "Claro";
    let tasaPaso = "~50%";
    let piramideCosto = "Mate ➔ Claro (x2 Míticas)";
    if (clarActual === "claro") {
      siguienteClaridad = "Límpido";
      tasaPaso = "~45%";
      piramideCosto = "Claro ➔ Límpido (equivale a 4 Míticas Mate base)";
    } else if (clarActual === "limpido") {
      siguienteClaridad = "Brillante";
      tasaPaso = "~40%";
      piramideCosto = "Límpido ➔ Brillante (equivale a 8 Míticas Mate base)";
    } else if (clarActual === "brillante") {
      siguienteClaridad = "Excelente";
      tasaPaso = "~30-35%";
      piramideCosto = "Brillante ➔ Excelente (equivale a 16+ Míticas Mate teóricas; ~25-35 reales)";
    }

    if (clarActual === "excelente") {
      semColor = "green";
      prob = "Máxima Pureza";
      dictamen = "🏆 ¡Gema en Claridad Excelente! Es el grado máximo de pureza alcanzable en Metin2.";
    } else if (stockMit === 0) {
      semColor = "red";
      prob = "Sin stock";
      dictamen = `⛔ Sin míticas: Necesitas fusionar 2 Míticas del mismo grado y acumular al menos 4 de colchón para intentar subir a ${siguienteClaridad} sin arriesgar quiebra.`;
    } else if (stockMit === 1) {
      semColor = "red";
      prob = "Insuficiente (1/2)";
      dictamen = `⚠️ Tienes 1 sola Mítica: Cada intento consume 2 Míticas. Para avanzar hacia ${siguienteClaridad} necesitas acumular piedras de respaldo.`;
    } else if (stockMit < 4) {
      // 2 o 3 míticas = 1 intento sin colchón
      semColor = "red";
      prob = `${tasaPaso} (1 intento - Alto Riesgo)`;
      dictamen = `🚨 ALTO RIESGO DE QUIEBRA (Tienes ${stockMit}/4 Míticas): Sólo tienes para 1 intento (${tasaPaso}). Si falla, perderás 1 Mítica y te quedarás con 1 sola piedra sin poder reintentar. <strong>Regla del Plan: Acumula mínimo 4 Míticas</strong> antes de fusionar.`;
    } else if (stockMit < 6) {
      semColor = (clarActual === "brillante") ? "yellow" : "green";
      prob = `${tasaPaso} (2 intentos)`;
      dictamen = clarActual === "brillante"
        ? `🟡 Salto crítico a Excelente (${tasaPaso}): Tienes ${stockMit} Míticas (2 intentos). Por el alto fallo (~65%), se recomienda tener 6+ piedras o aplicar Stop-Loss estricto.`
        : `🟢 ¡Luz Verde para Claridad (${clarActual.toUpperCase()} ➔ ${siguienteClaridad.toUpperCase()})! Tienes colchón de ${stockMit} Míticas (2 intentos). Si falla el primero, te quedarán piedras para reintentar. [${piramideCosto}]`;
    } else {
      semColor = "green";
      prob = `${tasaPaso} (Colchón Óptimo 3+ intentos)`;
      dictamen = `💎 ¡Colchón Óptimo de Seguridad (${stockMit} Míticas)! Tienes margen para amortiguar hasta 2 fallos consecutivos y lograr el salto a ${siguienteClaridad}. Respeta la pausa Jitter.`;
    }
  } else {
    // Tipo: antiguas (Fusión Antiguas ➔ Legendaria)
    const stockAnt = gemaData.stockAntiguas || 0;
    stockLabel = `Stock de ${gemaKey.toUpperCase()} Antiguo: ${stockAnt} piedras`;

    if (stockAnt === 0) {
      semColor = "red";
      prob = "Sin stock";
      dictamen = "⛔ Sin material: Se requieren al menos 2 piedras Antiguas para intentar una fusión.";
    } else if (stockAnt === 1) {
      semColor = "red";
      prob = "Insuficiente (1/2)";
      dictamen = "⚠️ Stock insuficiente: Tienes 1 piedra, pero cada intento requiere 2 piedras Antiguas.";
    } else if (stockAnt === 2) {
      semColor = "red";
      prob = "64% (1 intento)";
      dictamen = "⚠️ Tienes para 1 solo intento (64% base). Alto riesgo de quiebra si falla (36%). Sigue acumulando hacia el hito de 10 Antiguas.";
    } else if (stockAnt === 3) {
      semColor = "yellow";
      prob = "~78% (≥1 éxito)";
      dictamen = "🟡 Tienes 1 intento y te sobra 1 piedra de reserva. Aplica Stop-Loss si falla el primer intento.";
    } else if (stockAnt < 10) {
      semColor = "green";
      prob = "87%+ (Luz Verde)";
      dictamen = `🟢 Colchón de seguridad activo (${stockAnt} Antiguas = ${Math.floor(stockAnt / 2)} intentos). Puedes probar con Jitter o completar el Hito de 10 Antiguas.`;
    } else if (stockAnt < 20) {
      semColor = "green";
      prob = "96%+ (Hito 10 Antiguas)";
      dictamen = `💎 ¡Hito de 10 Antiguas Alcanzado! (${stockAnt} piedras = ${Math.floor(stockAnt / 2)} intentos). Rendimiento esperado: 3 Legendarias absorbiendo fallos.`;
    } else if (stockAnt < 30) {
      semColor = "green";
      prob = "99%+ (Hito 20 Antiguas)";
      dictamen = `💎 ¡Hito de 20 Antiguas Alcanzado! (${stockAnt} piedras = ${Math.floor(stockAnt / 2)} intentos). Banco sólido para sacar ~6-7 Legendarias.`;
    } else {
      semColor = "green";
      prob = "99.9% (Hito 30+ Antiguas)";
      dictamen = `🏆 ¡Hito de 30+ Antiguas Óptimo! (${stockAnt} piedras = ${Math.floor(stockAnt / 2)} intentos). Sesión masiva de refinado con máximo rendimiento industrial.`;
    }
  }

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <strong>${stockLabel}</strong>
      <span class="semaphore-badge semaphore-${semColor}">${prob}</span>
    </div>
    <p style="font-size: 0.85rem; color: var(--text-main); margin:0;">${dictamen}</p>
  `;
}

// ==========================================
// 10. MODALES GENERALES
// ==========================================

function cerrarModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("active");
}

function cerrarModalAjustes() {
  cerrarModal("modalAjustes");
}

function abrirModalAjustes() {
  const prof = STATE.perfil || { nombre: "Naay", servidor: "Ruby" };
  const inpNom = document.getElementById("cfgNombre");
  if (inpNom) inpNom.value = prof.nombre || "Naay";
  const inpSrv = document.getElementById("cfgServidor");
  if (inpSrv) inpSrv.value = prof.servidor || "Ruby";

  // Cargar nombres de los 4 fragmenteros
  if (!STATE.granjeros || STATE.granjeros.length < 4) {
    STATE.granjeros = [
      { id: 1, nombre: "Fragmentero 1", hechoHoy: false, hora: "", tiempoMin: 0 },
      { id: 2, nombre: "Fragmentero 2", hechoHoy: false, hora: "", tiempoMin: 0 },
      { id: 3, nombre: "Fragmentero 3", hechoHoy: false, hora: "", tiempoMin: 0 },
      { id: 4, nombre: "Fragmentero 4", hechoHoy: false, hora: "", tiempoMin: 0 }
    ];
  }
  for (let i = 0; i < 4; i++) {
    const inp = document.getElementById(`cfgGranjero${i + 1}`);
    if (inp) {
      inp.value = STATE.granjeros[i] ? STATE.granjeros[i].nombre : `Fragmentero ${i + 1}`;
    }
  }

  const m = document.getElementById("modalAjustes");
  if (m) m.classList.add("active");
}

function guardarAjustesPerfil() {
  const servidorAnterior = STATE.perfil.servidor;
  const inpNom = document.getElementById("cfgNombre");
  STATE.perfil.nombre = (inpNom && inpNom.value.trim()) ? inpNom.value.trim() : "Naay";
  const inpSrv = document.getElementById("cfgServidor");
  if (inpSrv) STATE.perfil.servidor = inpSrv.value;

  // Guardar nombres de los fragmenteros
  if (!STATE.granjeros) STATE.granjeros = [];
  for (let i = 0; i < 4; i++) {
    const inp = document.getElementById(`cfgGranjero${i + 1}`);
    const nombre = (inp && inp.value.trim()) ? inp.value.trim() : `Fragmentero ${i + 1}`;
    if (STATE.granjeros[i]) {
      STATE.granjeros[i].nombre = nombre;
    } else {
      STATE.granjeros.push({ id: i + 1, nombre: nombre, hechoHoy: false, hora: "", tiempoMin: 0 });
    }
  }

  // Refrescar vistas
  renderHeader();
  renderGranjeros();
  const evBadge = document.getElementById("eventosServidorBadge");
  if (evBadge) evBadge.textContent = STATE.perfil.servidor;

  // Si cambió el servidor, refrescar los eventos (el caché sigue válido, solo se filtra diferente)
  if (servidorAnterior !== STATE.perfil.servidor) {
    renderEventosRadar();
    if (activeView === "view-eventos") renderVistaEventos();
  }

  saveState();
  cerrarModal("modalAjustes");
}

// ==========================================
// 11. RESPALDO Y EXPORTACIÓN
// ==========================================

function exportarDatosJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(STATE, null, 2));
  const dlAnchor = document.createElement("a");
  const fecha = new Date().toISOString().split("T")[0];
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `NaayTracker_Backup_${fecha}.json`);
  dlAnchor.click();
}

function importarDatosJSON(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.corsTotal !== undefined) {
        STATE = Object.assign({}, DEFAULT_STATE, data);
        saveState();
        alert("✅ Copia de seguridad restaurada con éxito.");
      }
    } catch (err) {
      alert("❌ Error en el archivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

function copiarCodigoTexto() {
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(STATE))));
  navigator.clipboard.writeText(b64).then(() => {
    alert("📋 ¡Código de respaldo copiado al portapapeles!");
  }).catch(() => {
    prompt("Copia este código de respaldo:", b64);
  });
}

function restaurarDesdeCodigoTexto() {
  const code = prompt("Pega aquí tu código de respaldo de NaayTracker:");
  if (code) {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const data = JSON.parse(json);
      STATE = Object.assign({}, DEFAULT_STATE, data);
      saveState();
      alert("✅ Datos restaurados con éxito desde el código.");
    } catch (e) {
      alert("❌ Código inválido.");
    }
  }
}

function restablecerTodosLosDatos() {
  const confirmacion = confirm("⚠️ ¿Estás seguro de que deseas BORRAR TODOS los datos?\n\nEsta acción reiniciará tu progreso de cors, alquimia, objetivos y finanzas a cero, dejando la aplicación completamente limpia como recién instalada.");
  if (!confirmacion) return;

  localStorage.removeItem("naaytracker_state");
  STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
  saveState();
  renderAll();
  cerrarModal("modalAjustes");
  alert("🧹 Todos los datos han sido borrados. La aplicación está completamente limpia.");
  if (typeof window !== "undefined" && window.location) {
    window.location.reload();
  }
}

// ==========================================
// 12. INICIALIZACIÓN Y PWA INSTALL
// ==========================================

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById("btnInstalarPwa");
  if (btn) btn.style.display = "inline-flex";
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById("btnInstalarPwa");
  if (btn) btn.style.display = "none";
});

function instalarPWA() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("PWA instalada con éxito");
      }
      deferredInstallPrompt = null;
      const btn = document.getElementById("btnInstalarPwa");
      if (btn) btn.style.display = "none";
    });
  } else {
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (esIOS) {
      alert("📱 Para instalar NaayTracker en iPhone:\n\n1. Toca el botón 'Compartir' (el icono con una flecha hacia arriba ⎋ o ⬆️ en Safari).\n2. Baja y pulsa en 'Agregar al inicio' (+).\n3. ¡Listo! Se abrirá como una aplicación nativa.");
    } else {
      alert("📱 Para instalar NaayTracker en Android:\n\n1. Pulsa en los tres puntos (⋮) arriba a la derecha en Chrome.\n2. Selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.\n3. Si ya la tienes instalada, búscala en tu pantalla de inicio.");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  renderSessionTimer();

  // Cerrar modales haciendo clic en el fondo oscuro
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });

  // Cerrar modal con la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  }
});
