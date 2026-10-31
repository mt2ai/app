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
let EVENTOS_API_PROMISE = null;
let EVENTOS_API_LAST_ERROR = 0;
const EVENTOS_API_STORAGE_KEY = "naaytracker_eventos_cache";
const EVENTOS_API_REINTENTO_MS = 5 * 60 * 1000;

function leerEventosCacheLocal() {
  try {
    const raw = localStorage.getItem(EVENTOS_API_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

async function cargarEventosAPI() {
  if (EVENTOS_API_CACHE !== null) return EVENTOS_API_CACHE;

  // Si falló hace poco, usar la última copia guardada y no saturar la red
  if (EVENTOS_API_ERROR && Date.now() - EVENTOS_API_LAST_ERROR < EVENTOS_API_REINTENTO_MS) {
    return leerEventosCacheLocal();
  }

  if (EVENTOS_API_PROMISE) return EVENTOS_API_PROMISE;

  EVENTOS_API_LOADING = true;
  EVENTOS_API_PROMISE = (async () => {
    try {
      const resp = await fetch(API_EVENTOS_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      EVENTOS_API_CACHE = Array.isArray(data) ? data : [];
      EVENTOS_API_ERROR = false;
      try {
        localStorage.setItem(EVENTOS_API_STORAGE_KEY, JSON.stringify(EVENTOS_API_CACHE));
      } catch (e) {}
      console.log(`[NaayTracker] ${EVENTOS_API_CACHE.length} eventos cargados.`);
      return EVENTOS_API_CACHE;
    } catch (err) {
      console.warn("[NaayTracker] API no disponible:", err.message);
      EVENTOS_API_ERROR = true;
      EVENTOS_API_LAST_ERROR = Date.now();
      return leerEventosCacheLocal();
    } finally {
      EVENTOS_API_LOADING = false;
      EVENTOS_API_PROMISE = null;
    }
  })();

  return EVENTOS_API_PROMISE;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

const SVG_ICONS = {
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z"></path>',
  users: '<circle cx="9" cy="8" r="3"></circle><path d="M3.5 20a5.5 5.5 0 0 1 11 0"></path><path d="M16 5.3a3 3 0 0 1 0 5.4"></path><path d="M17.5 14.5A5.5 5.5 0 0 1 21 20"></path>',
  box: '<path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"></path><path d="M3 7.5V17l9 4 9-4V7.5"></path><path d="M12 12v9"></path>',
  flask: '<path d="M9 2h6"></path><path d="M10 2v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V2"></path><path d="M7.5 15h9"></path>',
  target: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"></circle>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"></path><path d="M14 10V4a2 2 0 0 0-4 0v7"></path><path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6.2-2.6L2.5 16.5a2 2 0 0 1 2.8-2.8L8 16"></path>',
  leaf: '<path d="M20 4c0 8-6 14-14 14 0-8 6-14 14-14Z"></path><path d="M4 20 14 10"></path>',
  play: '<path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" stroke="none"></path>',
  pause: '<path d="M8 5v14M16 5v14"></path>',
  check: '<path d="M4 12.5 9 17.5 20 6.5"></path>',
  clock: '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7v5l3 2"></path>',
  shield: '<path d="M12 3 20 6v5.5c0 4.5-3.2 8-8 9.5-4.8-1.5-8-5-8-9.5V6l8-3Z"></path>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"></ellipse><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7"></path><path d="M4 11v4c0 1.4 2.2 2.5 5 2.5 1 0 1.9-.1 2.7-.4"></path><path d="M14 12.5c2.8 0 5 1.1 5 2.5s-2.2 2.5-5 2.5-5-1.1-5-2.5"></path>',
  award: '<circle cx="12" cy="8" r="5"></circle><path d="M8.5 12 7 22l5-3 5 3-1.5-10"></path>',
  gem: '<path d="M6 3h12l3 6-9 12L3 9l3-6Z"></path><path d="M3 9h18M8.5 3 12 21M15.5 3 12 21"></path>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"></path><path d="m14 6 4 4"></path>',
  cart: '<circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle><path d="M3 4h2l2.5 11.5a2 2 0 0 0 2 1.5h8.5a2 2 0 0 0 2-1.6L21 7H6"></path>',
  refresh: '<path d="M20 7v5h-5"></path><path d="M20 12a8 8 0 1 1-2.3-5.7"></path>',
  note: '<path d="M6 3h9l5 5v13H6V3Z"></path><path d="M14 3v6h6"></path><path d="M9 13h6M9 17h6"></path>',
  settings: '<path d="M4 7h16M4 17h16"></path><circle cx="10" cy="7" r="2.2" fill="currentColor" stroke="none"></circle><circle cx="14" cy="17" r="2.2" fill="currentColor" stroke="none"></circle>',
  download: '<path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>',
  upload: '<path d="M12 16V4"></path><path d="m7 9 5-5 5 5"></path><path d="M5 21h14"></path>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M15 9V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4"></path>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"></path>',
  save: '<path d="M5 3h11l3 3v15H5V3Z"></path><path d="M8 3v6h8V3M8 21v-7h8v7"></path>',
  smartphone: '<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path>',
  globe: '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z"></path>',
  chevronRight: '<path d="m9 5 7 7-7 7"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  square: '<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"></rect>',
  x: '<path d="M6 6l12 12M18 6 6 18"></path>'
};

function svgIcon(name, className = "ui-icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG_ICONS[name] || ""}</svg>`;
}

function renderIconosEstaticos() {
  document.querySelectorAll("[data-icon]").forEach(el => {
    el.innerHTML = svgIcon(el.dataset.icon);
  });
}

function fechaLocalISO(d = new Date()) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function inicioSemanaISO(d = new Date()) {
  const copia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copia.getDay() + 6) % 7; // 0 = lunes
  copia.setDate(copia.getDate() - offset);
  return fechaLocalISO(copia);
}

function indiceDiaSemana(d = new Date()) {
  return (d.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
}

// El ciclo diario lo marca el servidor: medianoche en Europe/Madrid
// (equivale aproximadamente a las 18:00 en Tuxtepec).
function fechaJuegoISO(d = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);

  const valores = {};
  partes.forEach(p => { valores[p.type] = p.value; });
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function indiceDiaJuego(d = new Date()) {
  const fecha = new Date(fechaJuegoISO(d) + "T12:00:00");
  return (fecha.getDay() + 6) % 7;
}

function inicioSemanaJuegoISO(d = new Date()) {
  const fecha = new Date(fechaJuegoISO(d) + "T12:00:00");
  return inicioSemanaISO(fecha);
}

function numeroSeguro(valor, defecto = 0, min = -Infinity, max = Infinity) {
  const n = typeof valor === "number" ? valor : parseFloat(valor);
  if (!Number.isFinite(n)) return defecto;
  return Math.min(max, Math.max(min, n));
}

function enteroSeguro(valor, defecto = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Math.floor(numeroSeguro(valor, defecto, min, max));
}

const DIAS_TIEMPO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatearFechaCorta(iso) {
  const partes = String(iso || "").split("-");
  if (partes.length !== 3) return "";
  const dia = parseInt(partes[2], 10);
  const mes = parseInt(partes[1], 10) - 1;
  if (!MESES_CORTOS[mes]) return "";
  return `${dia} ${MESES_CORTOS[mes]}`;
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
  if (!hhmm) return { hora: "00:00", diaDelta: 0 };
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
    { id: "p10", etapa: 2, etapaNombre: "Etapa 2 (Sem 9-16)", texto: "REGLA DE ORO: NO fusionar pureza con solo 2 Míticas; iniciar banco de reserva", completado: false, cat: "alquimia", esHitoPlan: true },

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
  { id: "p21", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "¡Conseguir Rubí Mítico Excelente! (Culminación de la pirámide de ~16-30 Míticas)", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p22", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "Subir Rubí Excelente a +6 con reserva mínima de 20 alubias verdes", completado: false, cat: "alquimia", esHitoPlan: true },
  { id: "p23", etapa: 5, etapaNombre: "Etapa 5 (Sem 33-36)", texto: "Culminar la Meta de Equipo Principal con el poder del Rubí Excelente +6", completado: false, cat: "equipo", esHitoPlan: true }
];

const OBJETIVO_ALQUIMIA_DEFAULT = {
  titulo: "Alquimia Excelente",
  tipo: "excelente",
  meta: 1,
  descripcion: "Consigue una piedra dragón en calidad Excelente. El plan está pensado para una sola alquimia de máximo nivel."
};

const DEFAULT_STATE = {
  version: 7,
  perfil: {
    nombre: "Mi Cuenta",
    servidor: "Ruby"
  },
  semanaActual: 1,
  ultimoDia: "",
  inicioSemana: "",
  corsTotal: 0,
  corsExtraEventos: 0,
  corsSemanaActual: 0,
  semanaHistorial: [0, 0, 0, 0, 0, 0, 0], // L, M, X, J, V, S, D
  granjeros: [
    { id: 1, nombre: "Fragmentero 1", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 },
    { id: 2, nombre: "Fragmentero 2", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 },
    { id: 3, nombre: "Fragmentero 3", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 },
    { id: 4, nombre: "Fragmentero 4", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 }
  ],
  cronometroGeneral: {
    inicio: null,
    ultimoMs: 0,
    ultimoGranjero: null
  },
  historialTiempos: [],
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
  notificaciones: {
    permisoSolicitado: false,
    eventos: {},
    notificados: {}
  },
  fusionStats: {
    totalExitos: 0,
    totalFallos: 0,
    porTipo: {
      antiguas: { exitos: 0, fallos: 0 },
      legendarias: { exitos: 0, fallos: 0 },
      claridad: { exitos: 0, fallos: 0 },
      alubia: { exitos: 0, fallos: 0 }
    }
  },
  objetivoAlquimia: {
    actual: null,
    historial: [],
    inicializado: false
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

/**
 * Fusiona cualquier estado (localStorage o respaldo importado) con los valores
 * por defecto, preservando datos antiguos pero añadiendo campos nuevos.
 */
function mergeStateWithDefaults(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    parsed = {};
  }

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
  // Normalizar estadísticas de fusión
  if (!merged.fusionStats || typeof merged.fusionStats !== "object" || Array.isArray(merged.fusionStats)) {
    merged.fusionStats = JSON.parse(JSON.stringify(DEFAULT_STATE.fusionStats));
  } else {
    const statsPrevias = merged.fusionStats;
    merged.fusionStats = Object.assign({}, DEFAULT_STATE.fusionStats, statsPrevias, {
      porTipo: Object.assign({}, DEFAULT_STATE.fusionStats.porTipo, statsPrevias.porTipo || {})
    });
    Object.keys(DEFAULT_STATE.fusionStats.porTipo).forEach(tipo => {
      const prev = merged.fusionStats.porTipo[tipo] || {};
      merged.fusionStats.porTipo[tipo] = {
        exitos: Math.max(0, parseInt(prev.exitos, 10) || 0),
        fallos: Math.max(0, parseInt(prev.fallos, 10) || 0)
      };
    });
    merged.fusionStats.totalExitos = Math.max(0, parseInt(merged.fusionStats.totalExitos, 10) || 0);
    merged.fusionStats.totalFallos = Math.max(0, parseInt(merged.fusionStats.totalFallos, 10) || 0);
  }
  // Normalizar objetivo de alquimia
  if (!merged.objetivoAlquimia || typeof merged.objetivoAlquimia !== "object" || Array.isArray(merged.objetivoAlquimia)) {
    merged.objetivoAlquimia = { actual: null, historial: [], inicializado: false };
  } else {
    const oa = merged.objetivoAlquimia;
    merged.objetivoAlquimia = {
      actual: (oa.actual && typeof oa.actual === "object" && !Array.isArray(oa.actual))
        ? Object.assign({}, oa.actual)
        : null,
      historial: Array.isArray(oa.historial) ? oa.historial.slice(0, 30) : [],
      inicializado: !!oa.inicializado
    };
  }
  // Normalizar preferencias de notificaciones de eventos
  if (!merged.notificaciones || typeof merged.notificaciones !== "object" || Array.isArray(merged.notificaciones)) {
    merged.notificaciones = { permisoSolicitado: false, eventos: {}, notificados: {} };
  } else {
    const notifPrevias = merged.notificaciones;
    merged.notificaciones = Object.assign({}, DEFAULT_STATE.notificaciones, notifPrevias, {
      eventos: (notifPrevias.eventos && typeof notifPrevias.eventos === "object" && !Array.isArray(notifPrevias.eventos))
        ? Object.assign({}, notifPrevias.eventos)
        : {},
      notificados: (notifPrevias.notificados && typeof notifPrevias.notificados === "object" && !Array.isArray(notifPrevias.notificados))
        ? Object.assign({}, notifPrevias.notificados)
        : {}
    });
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
  // Normalizar estructura de granjeros
  if (!Array.isArray(merged.granjeros) || merged.granjeros.length !== 4) {
    const previos = Array.isArray(merged.granjeros) ? merged.granjeros : [];
    merged.granjeros = DEFAULT_STATE.granjeros.map((g, i) => Object.assign({}, g, previos[i] || {}));
  }
  merged.granjeros.forEach(g => {
    const totalMs = parseFloat(g.tiempoTotalMs);
    const ultimaMs = parseFloat(g.ultimaSesionMs);
    g.tiempoTotalMs = Number.isFinite(totalMs) && totalMs > 0
      ? totalMs
      : Math.max(0, parseInt(g.tiempoTotalSeg, 10) || 0) * 1000;
    g.ultimaSesionMs = Number.isFinite(ultimaMs) && ultimaMs > 0
      ? ultimaMs
      : Math.max(0, parseInt(g.ultimaSesionSeg, 10) || 0) * 1000;
    g.sesiones = Math.max(0, parseInt(g.sesiones, 10) || 0);
    g.nombre = String(g.nombre || `Fragmentero ${g.id || ""}`).slice(0, 40);
    g.hora = String(g.hora || "").slice(0, 10);
    g.hechoHoy = !!g.hechoHoy;
    delete g.cronoInicio;
  });
  // Normalizar cronómetro general
  if (!merged.cronometroGeneral || typeof merged.cronometroGeneral !== "object" || Array.isArray(merged.cronometroGeneral)) {
    merged.cronometroGeneral = { inicio: null, ultimoMs: 0, ultimoGranjero: null };
  } else {
    const cg = merged.cronometroGeneral;
    merged.cronometroGeneral = {
      inicio: (typeof cg.inicio === "number" && isFinite(cg.inicio)) ? cg.inicio : null,
      ultimoMs: Math.max(0, parseFloat(cg.ultimoMs) || 0),
      ultimoGranjero: (typeof cg.ultimoGranjero === "number") ? cg.ultimoGranjero : null
    };
  }

  // Historial de tiempos de todos los fragmenteros (se conserva entre ciclos)
  merged.historialTiempos = (Array.isArray(merged.historialTiempos) ? merged.historialTiempos : [])
    .filter(h => h && typeof h === "object" && !Array.isArray(h) && Number.isFinite(parseFloat(h.ms)) && parseFloat(h.ms) > 0)
    .map(h => ({
      ms: Math.round(parseFloat(h.ms)),
      granjeroIndex: enteroSeguro(h.granjeroIndex, 0, 0, 3),
      granjero: String(h.granjero || "Fragmentero").slice(0, 40),
      fecha: String(h.fecha || "").slice(0, 10),
      dia: String(h.dia || "").slice(0, 3),
      timestamp: Number.isFinite(Number(h.timestamp)) ? Number(h.timestamp) : 0
    }))
    .slice(0, 500);
  // Normalizar historial semanal
  if (!Array.isArray(merged.semanaHistorial) || merged.semanaHistorial.length !== 7) {
    merged.semanaHistorial = [0, 0, 0, 0, 0, 0, 0];
  } else {
    merged.semanaHistorial = merged.semanaHistorial.slice();
  }
  // Fechas de control diario/semanal según el día del servidor (Europe/Madrid)
  const migracionReset = (parsed.version || 0) < 7;
  if (!merged.ultimoDia || migracionReset) merged.ultimoDia = fechaJuegoISO();
  if (!merged.inicioSemana || migracionReset) merged.inicioSemana = inicioSemanaJuegoISO();

  // Sanitizar estado cargado o sincronizado (defensa contra datos manipulados)
  merged.semanaActual = enteroSeguro(merged.semanaActual, 1, 1, 36);
  merged.corsTotal = enteroSeguro(merged.corsTotal, 0, 0, 10000000);
  merged.corsExtraEventos = enteroSeguro(merged.corsExtraEventos, 0, 0, 10000000);
  merged.corsSemanaActual = enteroSeguro(merged.corsSemanaActual, 0, 0, 10000000);
  merged.semanaHistorial = merged.semanaHistorial.map(v => enteroSeguro(v, 0, 0, 100000));

  if (merged.perfil && typeof merged.perfil === "object") {
    merged.perfil.nombre = String(merged.perfil.nombre || "Mi Cuenta").slice(0, 60);
    merged.perfil.servidor = String(merged.perfil.servidor || "Ruby").slice(0, 40);
  }

  const gemasValidas = Object.keys(DEFAULT_STATE.ruedaDSS.slots);
  if (!gemasValidas.includes(merged.ruedaDSS.gemaActiva)) {
    merged.ruedaDSS.gemaActiva = "rubi";
  }
  const claridadesValidas = ["mate", "claro", "limpido", "brillante", "excelente", "ninguna"];
  gemasValidas.forEach(k => {
    const slot = merged.ruedaDSS.slots[k];
    if (!slot || typeof slot !== "object" || Array.isArray(slot)) {
      merged.ruedaDSS.slots[k] = JSON.parse(JSON.stringify(DEFAULT_STATE.ruedaDSS.slots[k]));
      return;
    }
    slot.stockAntiguas = enteroSeguro(slot.stockAntiguas, 0, 0, 1000000);
    slot.stockLegendarias = enteroSeguro(slot.stockLegendarias, 0, 0, 1000000);
    slot.stockMiticas = enteroSeguro(slot.stockMiticas, 0, 0, 1000000);
    slot.nivel = enteroSeguro(slot.nivel, 0, 0, 6);
    if (!claridadesValidas.includes(slot.claridad)) slot.claridad = "mate";
    if (!["en_progreso", "cola"].includes(slot.estado)) slot.estado = "cola";
  });

  Object.keys(DEFAULT_STATE.consumibles).forEach(k => {
    merged.consumibles[k] = enteroSeguro(merged.consumibles[k], 0, 0, 1000000);
  });

  merged.finanzas.saldoWons = numeroSeguro(merged.finanzas.saldoWons, 0, 0, 1e12);
  merged.finanzas.saldoYangKK = numeroSeguro(merged.finanzas.saldoYangKK, 0, 0, 1e12);
  merged.finanzas.metaCostoWons = numeroSeguro(merged.finanzas.metaCostoWons, 10, 0.1, 1e9);
  merged.finanzas.precioCompraRubiWons = numeroSeguro(merged.finanzas.precioCompraRubiWons, 4.5, 0, 1e9);
  merged.finanzas.precioCompraRubiKK = numeroSeguro(merged.finanzas.precioCompraRubiKK, 0, 0, 1e9);
  merged.finanzas.metaNombre = String(merged.finanzas.metaNombre || "Meta de Equipo Principal").slice(0, 80);

  Object.keys(merged.finanzas.alquimiaSecundaria || {}).forEach(k => {
    const item = merged.finanzas.alquimiaSecundaria[k];
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    item.stock = enteroSeguro(item.stock, 0, 0, 1000000);
    item.ultimoPrecioWons = numeroSeguro(item.ultimoPrecioWons, 0, 0, 1e9);
    item.ultimoPrecioKK = numeroSeguro(item.ultimoPrecioKK, 0, 0, 1e9);
    item.nombre = String(item.nombre || k).slice(0, 60);
  });

  merged.objetivos = (Array.isArray(merged.objetivos) ? merged.objetivos : [])
    .filter(o => o && typeof o === "object" && !Array.isArray(o))
    .map((o, index) => {
      const idNumerico = typeof o.id === "number" && Number.isFinite(o.id)
        ? Math.max(0, Math.floor(o.id))
        : null;
      const idSeguro = idNumerico !== null
        ? idNumerico
        : (String(o.id ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || `obj-${index}-${Date.now()}`);

      return {
        ...o,
        id: idSeguro,
        texto: String(o.texto ?? "").slice(0, 300),
        etapa: enteroSeguro(o.etapa, 1, 1, 5),
        cat: typeof o.cat === "string" ? o.cat.slice(0, 30) : "general",
        completado: !!o.completado,
        esHitoPlan: !!o.esHitoPlan
      };
    });

  normalizarProgresoPlanObjetivos(merged.objetivos);

  if (merged.objetivoAlquimia && merged.objetivoAlquimia.actual) {
    const actual = merged.objetivoAlquimia.actual;
    if (!actual || typeof actual !== "object" || Array.isArray(actual)) {
      merged.objetivoAlquimia.actual = null;
    } else {
      // El plan actual es una única alquimia Excelente; se migran metas antiguas.
      actual.tipo = OBJETIVO_ALQUIMIA_DEFAULT.tipo;
      actual.titulo = OBJETIVO_ALQUIMIA_DEFAULT.titulo;
      actual.descripcion = OBJETIVO_ALQUIMIA_DEFAULT.descripcion;
      actual.meta = 1;
      actual.creadoEn = String(actual.creadoEn || "").slice(0, 20);
      delete actual.gema;
      delete actual.catalogId;
    }
  }

  return merged;
}

function loadState() {
  const saved = localStorage.getItem("naaytracker_state");
  if (!saved) return mergeStateWithDefaults(null);
  try {
    return mergeStateWithDefaults(JSON.parse(saved));
  } catch (e) {
    return mergeStateWithDefaults(null);
  }
}

/**
 * Comprueba cambio de día/semana. Resetea los "hechoHoy" al cambiar de día y
 * avanza el contador de semanas (reiniciando acumulados) al cambiar de semana.
 */
function verificarCambioDia() {
  const hoy = fechaJuegoISO();
  const semana = inicioSemanaJuegoISO();
  let cambio = false;

  if (!STATE.inicioSemana) {
    STATE.inicioSemana = semana;
    cambio = true;
  } else if (STATE.inicioSemana !== semana) {
    const msSemana = 7 * 24 * 60 * 60 * 1000;
    const diff = new Date(semana + "T00:00:00") - new Date(STATE.inicioSemana + "T00:00:00");
    const semanasTranscurridas = Math.max(1, Math.round(diff / msSemana));
    STATE.semanaActual = Math.min(36, (STATE.semanaActual || 1) + semanasTranscurridas);
    STATE.corsSemanaActual = 0;
    STATE.semanaHistorial = [0, 0, 0, 0, 0, 0, 0];
    STATE.inicioSemana = semana;
    cambio = true;
  }

  if (!STATE.ultimoDia) {
    STATE.ultimoDia = hoy;
    cambio = true;
  } else if (STATE.ultimoDia !== hoy) {
    (STATE.granjeros || []).forEach(g => {
      g.hechoHoy = false;
      g.hora = "";
    });
    STATE.ultimoDia = hoy;
    cambio = true;
  }

  if (cambio) saveState();
  return cambio;
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
  if (typeof registrarCambioLocal === "function") registrarCambioLocal();
}

function estadoParaSincronizar() {
  const snapshot = JSON.parse(JSON.stringify(STATE));
  if (snapshot.cronometroGeneral) {
    snapshot.cronometroGeneral.inicio = null;
  }
  return snapshot;
}

function aplicarEstadoExterno(nuevoEstado) {
  STATE = mergeStateWithDefaults(nuevoEstado);
  saveState();
}

// ==========================================
// 3. NAVEGACIÓN Y VISTAS
// ==========================================

let activeView = "view-dashboard";
let activeZoom = "diario";

const VIEWS_ORDER = [
  "view-dashboard",
  "view-granjeros",
  "view-dss",
  "view-alquimia",
  "view-finanzas",
  "view-eventos"
];

function switchView(viewId, swipeDirection) {
  activeView = viewId;
  document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active", "swipe-next", "swipe-prev"));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add("active");
    if (swipeDirection) target.classList.add(`swipe-${swipeDirection}`);
  }

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

function cambiarVistaRelativa(delta) {
  const total = VIEWS_ORDER.length;
  const actual = VIEWS_ORDER.indexOf(activeView);
  const indice = actual === -1 ? 0 : actual;
  const siguiente = (indice + delta + total) % total;
  switchView(VIEWS_ORDER[siguiente], delta > 0 ? "next" : "prev");
}

function iniciarGestosSwipe() {
  const SWIPE_MIN = 55;
  const SWIPE_LOCK_MS = 350;
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let tracking = false;
  let locked = false;

  const esZonaIgnorada = el => {
    if (!el || !el.closest) return true;
    return !!el.closest("input, select, textarea, .etapa-pills-row, .zoom-selector, .subnav-tabs, .week-matrix, .styled-table");
  };

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { tracking = false; return; }
    if (document.querySelector(".modal-overlay.active")) { tracking = false; return; }
    if (esZonaIgnorada(e.target)) { tracking = false; return; }
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startT = Date.now();
    tracking = true;
  }, { passive: true });

  document.addEventListener("touchcancel", () => { tracking = false; }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;
    if (!e.changedTouches || !e.changedTouches.length) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Date.now() - startT > 1000) return;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    if (locked) return;

    locked = true;
    setTimeout(() => { locked = false; }, SWIPE_LOCK_MS);
    cambiarVistaRelativa(dx < 0 ? 1 : -1);
  }, { passive: true });
}

// ==========================================
// 4. CONTROL DE OBJETIVOS & HITOS DEL PLAN
// ==========================================

let activeFinanzasTab = "plan";
let filtroEtapaActual = 0;

const CAT_COLORS_OBJETIVOS = {
  alquimia: { icon: "gem", label: "Alquimia" },
  equipo:   { icon: "shield", label: "Equipo" },
  farmeo:   { icon: "bolt", label: "Farmeo" },
  finanzas: { icon: "coins", label: "Finanzas" },
  general:  { icon: "target", label: "Meta" }
};

function switchFinanzasTab(tabKey) {
  activeFinanzasTab = tabKey;
  document.querySelectorAll(".subnav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabKey);
  });
  const tabPlan = document.getElementById("tabFinanzasPlan");
  const tabMercado = document.getElementById("tabFinanzasMercado");
  const tabMetas = document.getElementById("tabFinanzasMetas");
  if (tabPlan) tabPlan.style.display = tabKey === "plan" ? "block" : "none";
  if (tabMercado) tabMercado.style.display = tabKey === "mercado" ? "block" : "none";
  if (tabMetas) tabMetas.style.display = tabKey === "metas" ? "block" : "none";
  renderObjetivos();
}

function setFiltroEtapa(etapaNum) {
  filtroEtapaActual = parseInt(etapaNum) || 0;
  document.querySelectorAll(".etapa-pill").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.etapa) === filtroEtapaActual);
  });
  renderObjetivos();
}

function renderListaObjetivosHtml(lista, mensajeVacio) {
  if (!lista.length) {
    return `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:12px 0;">${mensajeVacio}</p>`;
  }

  const activo = obtenerHitoActivoPlan();
  const activoId = activo ? activo.id : null;

  return lista.map(o => {
    const c = CAT_COLORS_OBJETIVOS[o.cat] || CAT_COLORS_OBJETIVOS.general;
    const esActivo = o.esHitoPlan && o.id === activoId && !o.completado;
    const bloqueado = o.esHitoPlan && !o.completado && !esActivo;
    const deshabilitado = o.esHitoPlan && (o.completado || bloqueado);

    const badgeEtapa = o.esHitoPlan
      ? `<span class="objective-tag plan">E${o.etapa || 1}</span>`
      : `<span class="objective-tag custom">Personal</span>`;
    const estadoBadge = o.esHitoPlan
      ? (o.completado ? "" : (esActivo
        ? `<span class="objective-tag active">Ahora</span>`
        : `<span class="objective-tag locked">Bloqueado</span>`))
      : "";

    const btnDel = o.esHitoPlan
      ? ""
      : `<button class="objective-delete" onclick="eliminarObjetivo('${escapeHtml(o.id)}')" title="Eliminar meta personalizada" aria-label="Eliminar meta">×</button>`;

    const clases = [o.completado ? "done" : "", esActivo ? "current" : "", bloqueado ? "locked" : ""].filter(Boolean).join(" ");

    return `
      <div class="objective-row ${clases}" ${bloqueado ? 'title="Completa el objetivo anterior para desbloquearlo"' : ""}>
        <label class="objective-main">
          <input type="checkbox" class="objective-check" ${o.completado ? 'checked' : ''} ${deshabilitado ? 'disabled' : ''} onchange="toggleObjetivo('${escapeHtml(o.id)}')">
          <span class="objective-text">${svgIcon(c.icon, "obj-icon")} ${escapeHtml(o.texto)}</span>
        </label>
        <div class="objective-side">
          ${badgeEtapa}
          ${estadoBadge}
          ${btnDel}
        </div>
      </div>
    `;
  }).join('');
}

function normalizarProgresoPlanObjetivos(objetivos) {
  let bloqueado = false;
  HITOS_PLAN_MAESTRO.forEach(hito => {
    const objetivo = objetivos.find(o => o.id === hito.id);
    if (!objetivo) return;
    if (bloqueado) {
      objetivo.completado = false;
    } else if (!objetivo.completado) {
      bloqueado = true;
    }
  });
}

function obtenerHitosPlanSecuenciales() {
  const objetivos = STATE.objetivos || [];
  return HITOS_PLAN_MAESTRO
    .map(hito => objetivos.find(o => o.id === hito.id))
    .filter(Boolean);
}

function obtenerHitoActivoPlan() {
  return obtenerHitosPlanSecuenciales().find(o => !o.completado) || null;
}

function planMaestroCompletado() {
  const hitos = obtenerHitosPlanSecuenciales();
  return hitos.length > 0 && hitos.every(o => o.completado);
}

function reiniciarProgresoPlan() {
  HITOS_PLAN_MAESTRO.forEach(hito => {
    const objetivo = (STATE.objetivos || []).find(o => o.id === hito.id);
    if (objetivo) objetivo.completado = false;
  });
}

function objetivoAlquimiaActual() {
  return STATE.objetivoAlquimia ? STATE.objetivoAlquimia.actual : null;
}

function crearObjetivoAlquimiaExcelente() {
  return {
    id: `obj-${Date.now()}`,
    tipo: OBJETIVO_ALQUIMIA_DEFAULT.tipo,
    titulo: OBJETIVO_ALQUIMIA_DEFAULT.titulo,
    descripcion: OBJETIVO_ALQUIMIA_DEFAULT.descripcion,
    meta: 1,
    creadoEn: fechaLocalISO()
  };
}

function iniciarObjetivoAlquimia() {
  if (!STATE.objetivoAlquimia) {
    STATE.objetivoAlquimia = { actual: null, historial: [], inicializado: false };
  }
  if (!STATE.objetivoAlquimia.actual) {
    STATE.objetivoAlquimia.actual = crearObjetivoAlquimiaExcelente();
    saveState();
  }
}

function renderObjetivoAlquimia() {
  const cont = document.getElementById("objetivoAlquimiaBox");
  if (!cont) return;

  const oa = STATE.objetivoAlquimia || { actual: null, historial: [] };
  const actual = oa.actual;

  if (!actual) {
    cont.innerHTML = `
      <div class="current-goal-card empty">
        <div class="current-goal-head">
          <span class="current-goal-kicker">Objetivo de alquimia</span>
          <span class="goal-status muted">Sin definir</span>
        </div>
        <p class="current-goal-desc">El plan es conseguir una sola alquimia en calidad Excelente.</p>
        <button class="btn-primary goal-define-btn" onclick="iniciarObjetivoAlquimia()">${svgIcon("target", "btn-svg")} Comenzar Alquimia Excelente</button>
      </div>
    `;
    return;
  }

  const historial = oa.historial || [];
  const hitosPlan = obtenerHitosPlanSecuenciales();
  const hechosPlan = hitosPlan.filter(o => o.completado).length;
  const totalPlan = hitosPlan.length;
  const planCompleto = planMaestroCompletado();

  cont.innerHTML = `
    <div class="current-goal-card">
      <div class="current-goal-head">
        <span class="current-goal-kicker">Objetivo de alquimia</span>
        <span class="goal-status ${planCompleto ? "done" : ""}">${planCompleto ? "Listo para completar" : "En curso"}</span>
      </div>
      <div class="current-goal-main">
        <span class="current-goal-gem">${svgIcon("gem", "gem-svg")}</span>
        <div>
          <div class="current-goal-title">${escapeHtml(actual.titulo)}</div>
          <div class="current-goal-desc">${escapeHtml(actual.descripcion || "")}</div>
        </div>
      </div>
      <div class="goal-meta-row"><span>Plan maestro</span><strong>${hechosPlan} / ${totalPlan} objetivos</strong></div>
      ${planCompleto
        ? `<div class="goal-lock-hint ready">Plan completado. Ya puedes marcar tu alquimia como completada.</div>`
        : `<div class="goal-lock-hint">Completa los objetivos del plan en orden para desbloquear el botón.</div>`}
      <div class="current-goal-actions">
        <button class="btn-complete done" onclick="marcarObjetivoCompletado()" ${planCompleto ? "" : "disabled"}>${svgIcon("check", "btn-svg")} Completado</button>
        <button class="btn-complete" onclick="reiniciarObjetivoAlquimia()">${svgIcon("refresh", "btn-svg")} Reiniciar</button>
      </div>
      ${historial.length ? `<div class="goal-last">Completados: ${historial.length}${historial[0] ? ` · Último: ${escapeHtml(historial[0].titulo || "")}` : ""}</div>` : ""}
    </div>
  `;
}

function marcarObjetivoCompletado() {
  const actual = objetivoAlquimiaActual();
  if (!actual) return;

  if (!planMaestroCompletado()) {
    alert("Completa todos los objetivos del plan en orden antes de marcar la alquimia como completada.");
    return;
  }

  const texto = document.getElementById("objetivoCompletadoTexto");
  const sig = document.getElementById("objetivoCompletadoSiguiente");
  if (texto) texto.textContent = actual.titulo;
  if (sig) sig.textContent = "Comenzar una nueva alquimia reiniciará los objetivos del plan para volver a progresar desde el inicio.";

  const modal = document.getElementById("modalObjetivoCompletado");
  if (modal) modal.classList.add("active");
}

function archivarObjetivoActual() {
  const actual = objetivoAlquimiaActual();
  if (!actual) return;
  if (!Array.isArray(STATE.objetivoAlquimia.historial)) STATE.objetivoAlquimia.historial = [];
  STATE.objetivoAlquimia.historial.unshift(Object.assign({}, actual, { completadoEn: fechaLocalISO() }));
  STATE.objetivoAlquimia.historial = STATE.objetivoAlquimia.historial.slice(0, 30);
  STATE.objetivoAlquimia.actual = null;
}

function reiniciarObjetivoAlquimia() {
  if (!confirm("¿Reiniciar el objetivo actual? Se empezará de nuevo con Alquimia Excelente.")) return;
  STATE.objetivoAlquimia.actual = crearObjetivoAlquimiaExcelente();
  switchFinanzasTab("plan");
  saveState();
}

function completarObjetivo(accion) {
  cerrarModal("modalObjetivoCompletado");
  if (!objetivoAlquimiaActual()) return;
  if (accion === "continuar") return;

  archivarObjetivoActual();
  if (accion === "nueva") {
    reiniciarProgresoPlan();
    STATE.objetivoAlquimia.actual = crearObjetivoAlquimiaExcelente();
  }
  switchFinanzasTab("plan");
  saveState();
}

function renderObjetivos() {
  const objs = STATE.objetivos || [];
  const hitosPlan = objs.filter(o => o.esHitoPlan);
  const hechosPlan = hitosPlan.filter(o => o.completado).length;
  const pctPlan = hitosPlan.length ? Math.round((hechosPlan / hitosPlan.length) * 100) : 0;

  // Renderizar caja de progreso del plan maestro
  const progBox = document.getElementById("progresoPlanBox");
  if (progBox) {
    progBox.innerHTML = `
      <div class="plan-progress">
        <div class="plan-progress-head">
          <span>${svgIcon("award", "obj-icon")} Progreso Plan Maestro</span>
          <span class="semaphore-badge ${pctPlan >= 80 ? 'semaphore-green' : (pctPlan >= 40 ? 'semaphore-yellow' : 'semaphore-red')}">${hechosPlan}/${hitosPlan.length} · ${pctPlan}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${pctPlan >= 80 ? 'green' : ''}" style="width:${pctPlan}%;"></div>
        </div>
      </div>
    `;
  }

  // Hitos del plan (pestaña Plan), filtrados por etapa
  const contPlan = document.getElementById("listaObjetivos");
  if (contPlan) {
    let filtrados = hitosPlan;
    if (filtroEtapaActual > 0) {
      filtrados = filtrados.filter(o => o.etapa === filtroEtapaActual);
    }
    contPlan.innerHTML = renderListaObjetivosHtml(filtrados, "No hay hitos en esta etapa.");
  }

  // Metas personales (pestaña Mi Meta)
  const contCustom = document.getElementById("listaObjetivosCustom");
  if (contCustom) {
    const custom = objs.filter(o => !o.esHitoPlan);
    contCustom.innerHTML = renderListaObjetivosHtml(custom, "No has añadido metas personales aún. ¡Escribe una arriba para agregarla!");
  }
}

function toggleObjetivo(id) {
  const o = (STATE.objetivos || []).find(x => String(x.id) === String(id));
  if (!o) return;

  if (!o.esHitoPlan) {
    o.completado = !o.completado;
    saveState();
    return;
  }

  // Los hitos del plan son secuenciales y quedan bloqueados al completarse.
  if (o.completado) return;
  const activo = obtenerHitoActivoPlan();
  if (!activo || String(activo.id) !== String(o.id)) return;

  o.completado = true;
  saveState();
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
  const objetivo = objetivoAlquimiaActual();
  const gemaKey = (objetivo && GEMA_INFO_MAP[objetivo.gema]) ? objetivo.gema : (STATE.ruedaDSS.gemaActiva || "rubi");
  const gema = GEMA_INFO_MAP[gemaKey] || GEMA_INFO_MAP.rubi;

  const costoWons = STATE.finanzas.precioCompraRubiWons !== undefined ? STATE.finanzas.precioCompraRubiWons : 4.5;
  const costoKK = STATE.finanzas.precioCompraRubiKK !== undefined ? STATE.finanzas.precioCompraRubiKK : 0;
  const costoTotalKK = (costoWons * 100) + costoKK;

  const saldoActualTotalKK = (STATE.finanzas.saldoWons * 100) + STATE.finanzas.saldoYangKK;

  if (saldoActualTotalKK < costoTotalKK) {
    const faltanKK = costoTotalKK - saldoActualTotalKK;
    const faltanW = (faltanKK / 100).toFixed(1);
    alert(`Fondos insuficientes para comprar 1 ${gema.nombre} Antiguo.\n\nPrecio: ${costoWons}W ${costoKK > 0 ? costoKK + 'kk' : ''}\nTu saldo: ${STATE.finanzas.saldoWons}W y ${STATE.finanzas.saldoYangKK}kk\nTe faltan: ~${faltanW} Wons.\n\nVende más piedras secundarias en el mercado para acumular fondos.`);
    return;
  }

  const nuevoSaldoKK = saldoActualTotalKK - costoTotalKK;
  STATE.finanzas.saldoWons = Math.floor(nuevoSaldoKK / 100);
  STATE.finanzas.saldoYangKK = Math.round(nuevoSaldoKK % 100);

  if (!STATE.ruedaDSS.slots[gemaKey]) {
    STATE.ruedaDSS.slots[gemaKey] = { estado: "en_progreso", claridad: "mate", nivel: 0, stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0 };
  }
  STATE.ruedaDSS.slots[gemaKey].stockAntiguas = (STATE.ruedaDSS.slots[gemaKey].stockAntiguas || 0) + 1;

  vibrar(60);
  saveState();

  const stockNuevo = STATE.ruedaDSS.slots[gemaKey].stockAntiguas;
  alert(`${gema.nombre} Antiguo comprado con éxito.\n\nSe descontaron ${costoWons} Wons ${costoKK > 0 ? '+ ' + costoKK + 'kk' : ''} de tus fondos.\nTu stock de ${gema.nombre} Antiguo sube a: ${stockNuevo} piedras.`);
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

function setJitterStatus(texto) {
  const el = document.getElementById("jitterStatus");
  if (el) el.textContent = texto;
}

function registrarIntentoFusion(tipo, esExito) {
  if (!STATE.fusionStats) {
    STATE.fusionStats = JSON.parse(JSON.stringify(DEFAULT_STATE.fusionStats));
  }
  const stats = STATE.fusionStats;
  if (!stats.porTipo[tipo]) stats.porTipo[tipo] = { exitos: 0, fallos: 0 };

  if (esExito) {
    stats.totalExitos++;
    stats.porTipo[tipo].exitos++;
  } else {
    stats.totalFallos++;
    stats.porTipo[tipo].fallos++;
  }
}

function renderFusionStats() {
  const donut = document.getElementById("fusionDonutFill");
  const rateEl = document.getElementById("fusionRate");
  const winsEl = document.getElementById("fusionWins");
  const lossesEl = document.getElementById("fusionLosses");
  const totalEl = document.getElementById("fusionTotal");
  const hintEl = document.getElementById("fusionStatsHint");
  if (!donut || !rateEl) return;

  const stats = STATE.fusionStats || { totalExitos: 0, totalFallos: 0 };
  const exitos = stats.totalExitos || 0;
  const fallos = stats.totalFallos || 0;
  const total = exitos + fallos;
  const rate = total ? Math.round((exitos / total) * 100) : 0;

  const radio = 15;
  const circunferencia = 2 * Math.PI * radio;
  const relleno = (rate / 100) * circunferencia;
  donut.setAttribute("stroke-dasharray", `${relleno} ${circunferencia}`);
  donut.style.stroke = total === 0 ? "#2a2f3a" : (rate >= 50 ? "var(--green)" : "var(--gold)");

  if (rateEl) rateEl.textContent = total ? `${rate}%` : "—";
  if (winsEl) winsEl.textContent = exitos;
  if (lossesEl) lossesEl.textContent = fallos;
  if (totalEl) totalEl.textContent = `${total} intento${total === 1 ? "" : "s"}`;
  if (hintEl) hintEl.textContent = total ? `${exitos} de ${total}` : "Sin intentos";
}

function ejecutarIntentoAlquimia(esExito) {
  if (stopLossActive) {
    alert("🚨 STOP-LOSS ACTIVO: Espera a que termine la pausa de 60 segundos.");
    return;
  }

  const gemaKey = STATE.ruedaDSS.gemaActiva || "rubi";
  const gemaSlot = STATE.ruedaDSS.slots[gemaKey];
  const tipoIntento = document.getElementById("tipoIntentoAlquimia")?.value || "antiguas";
  const autoSync = document.getElementById("chkAutoSyncStock")?.checked ?? true;

  if (!gemaSlot) {
    alert("⚠️ No hay una gema activa seleccionada en el Almacén DSS.");
    return;
  }

  // Validar material antes de registrar el intento (evita éxitos sin stock)
  if (autoSync) {
    const nAnt = gemaSlot.stockAntiguas || 0;
    const nLeg = gemaSlot.stockLegendarias || 0;
    const nMit = gemaSlot.stockMiticas || 0;
    const nAlu = STATE.consumibles.alubiasVerdes || 0;
    let faltante = "";

    if (tipoIntento === "antiguas") {
      if (esExito && nAnt < 2) faltante = "Necesitas 2 piedras Antiguas para registrar un éxito.";
      if (!esExito && nAnt < 1) faltante = "No tienes piedras Antiguas que perder.";
    } else if (tipoIntento === "legendarias") {
      if (esExito && nLeg < 2) faltante = "Necesitas 2 piedras Legendarias para registrar un éxito.";
      if (!esExito && nLeg < 1) faltante = "No tienes piedras Legendarias que perder.";
    } else if (tipoIntento === "claridad") {
      if (esExito && nMit < 2) faltante = "Necesitas 2 Míticas para subir la Claridad.";
      if (!esExito && nMit < 1) faltante = "No tienes Míticas que perder.";
    } else if (tipoIntento === "alubia") {
      if (nAlu < 1) faltante = "No tienes Alubias Verdes para consumir.";
    }

    if (faltante) {
      alert("⚠️ Stock insuficiente: " + faltante);
      return;
    }
  }

  registrarIntentoFusion(tipoIntento, esExito);
  if (!autoSync) saveState();

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
    setJitterStatus(`Éxito registrado${detalleCambio}. Pausa de Jitter activada:`);
    iniciarJitterCountdown();
  } else {
    consecutiveFails++;
    setJitterStatus(`Fallo registrado${detalleCambio}.`);
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
      setJitterStatus("Listo para el siguiente clic.");
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
      setJitterStatus("Pausa cumplida. Estado reseteado.");
      document.getElementById("btnExito").disabled = false;
      document.getElementById("btnFallo").disabled = false;
    }
  }, 1000);
}

// ==========================================
// 8. CRONÓMETRO DE GRANJEROS
// ==========================================

function formatearCronometro(ms) {
  const totalDecimas = Math.max(0, Math.floor((ms || 0) / 100));
  const decimas = totalDecimas % 10;
  const totalSegundos = Math.floor(totalDecimas / 10);
  const segundos = totalSegundos % 60;
  const minutos = Math.floor(totalSegundos / 60) % 60;
  const horas = Math.floor(totalSegundos / 3600);

  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundos).padStart(2, "0");
  return horas > 0
    ? `${horas}:${mm}:${ss}.${decimas}`
    : `${mm}:${ss}.${decimas}`;
}

function cronometroGeneralCorriendo() {
  return !!(STATE.cronometroGeneral && STATE.cronometroGeneral.inicio);
}

function iniciarCronometroGeneral() {
  verificarCambioDia();
  if (cronometroGeneralCorriendo()) return;

  STATE.cronometroGeneral = { inicio: Date.now(), ultimoMs: 0, ultimoGranjero: null };
  saveState();
  actualizarCronometroGeneral();
}

function resetCronometroGeneral() {
  if (cronometroGeneralCorriendo() && !confirm("¿Reiniciar el cronómetro? Se perderá el tiempo actual.")) return;
  STATE.cronometroGeneral = { inicio: null, ultimoMs: 0, ultimoGranjero: null };
  saveState();
  actualizarCronometroGeneral();
}

function detenerCronometroEnGranjero(index, guardar = true) {
  const cg = STATE.cronometroGeneral;
  const g = STATE.granjeros[index];
  if (!cg || !cg.inicio || !g) return 0;

  const ms = Math.max(0, Date.now() - cg.inicio);
  if (ms > 0) {
    g.tiempoTotalMs = (g.tiempoTotalMs || 0) + ms;
    g.ultimaSesionMs = ms;
    g.sesiones = (g.sesiones || 0) + 1;

    const ahora = new Date();
    const fechaCiclo = fechaJuegoISO(ahora);
    const fechaObj = new Date(fechaCiclo + "T12:00:00");
    const diaCiclo = DIAS_TIEMPO[(fechaObj.getDay() + 6) % 7];

    if (!Array.isArray(STATE.historialTiempos)) STATE.historialTiempos = [];
    STATE.historialTiempos.unshift({
      ms: Math.round(ms),
      granjeroIndex: index,
      granjero: g.nombre,
      fecha: fechaCiclo,
      dia: diaCiclo,
      timestamp: ahora.getTime()
    });
    STATE.historialTiempos = STATE.historialTiempos.slice(0, 500);
  }

  STATE.cronometroGeneral = { inicio: null, ultimoMs: ms, ultimoGranjero: index };

  if (guardar) {
    saveState();
    actualizarCronometroGeneral();
  }
  return ms;
}

function completarFragmentero(index) {
  verificarCambioDia();
  const g = STATE.granjeros[index];
  if (!g) return;

  // Si ya estaba completado, se desmarca y se descuenta el progreso.
  if (g.hechoHoy) {
    toggleGranjero(index);
    return;
  }

  // Un solo botón: detiene y registra el tiempo, luego marca los 5 Cors.
  if (cronometroGeneralCorriendo()) {
    detenerCronometroEnGranjero(index, false);
  }
  toggleGranjero(index);
  actualizarCronometroGeneral();
}

function actualizarCronometroGeneral() {
  const digits = document.getElementById("stopwatchDigits");
  const hint = document.getElementById("stopwatchHint");
  const startBtn = document.getElementById("stopwatchStartBtn");
  const cg = STATE.cronometroGeneral || {};
  const corriendo = !!cg.inicio;
  const ms = corriendo ? Math.max(0, Date.now() - cg.inicio) : (cg.ultimoMs || 0);

  if (digits) {
    digits.textContent = formatearCronometro(ms);
    digits.classList.toggle("running", corriendo);
  }

  if (startBtn) {
    startBtn.disabled = corriendo;
    startBtn.innerHTML = corriendo
      ? `${svgIcon("clock", "btn-svg")} Corriendo`
      : `${svgIcon("play", "btn-svg")} ${ms ? "Iniciar de nuevo" : "Iniciar"}`;
  }

  if (hint) {
    if (corriendo) {
      hint.textContent = "Corriendo · pulsa “Completar” en el fragmentero que termine.";
    } else if (cg.ultimoMs && cg.ultimoGranjero !== null && cg.ultimoGranjero !== undefined) {
      const g = STATE.granjeros[cg.ultimoGranjero];
      hint.textContent = `Último registro: ${g ? g.nombre : "Fragmentero"} · ${formatearCronometro(cg.ultimoMs)}`;
    } else {
      hint.textContent = "Pulsa Iniciar y para con el fragmentero que termine.";
    }
  }
}

function renderRendimientoFragmenteros() {
  const cont = document.getElementById("farmersChart");
  if (!cont) return;

  const historial = Array.isArray(STATE.historialTiempos) ? STATE.historialTiempos : [];
  const mejor = historial.reduce((best, h) => (!best || h.ms < best.ms ? h : best), null);
  const recientes = historial.slice(0, 14).reverse();
  const maxReciente = recientes.length ? Math.max(...recientes.map(h => h.ms)) : 1;

  const recordHtml = mejor
    ? `<div class="record-panel">
        <span class="record-icon">${svgIcon("award", "record-svg")}</span>
        <div class="record-info">
          <span class="record-label">Mejor tiempo</span>
          <strong class="record-time">${formatearCronometro(mejor.ms)}</strong>
          <span class="record-meta">${escapeHtml(mejor.granjero)} · ${escapeHtml(mejor.dia)} ${formatearFechaCorta(mejor.fecha)}</span>
        </div>
        <span class="record-badge">Récord</span>
      </div>`
    : `<div class="record-panel empty">
        <span class="record-icon">${svgIcon("award", "record-svg")}</span>
        <div class="record-info">
          <span class="record-label">Mejor tiempo</span>
          <span class="record-meta">Aún no hay tandas registradas.</span>
        </div>
      </div>`;

  const trendHtml = recientes.length
    ? `<div class="chart-head trend-head">
        <span>Evolución reciente</span>
        <span>Últimas ${recientes.length} tandas</span>
      </div>
      <div class="trend-bars">
        ${recientes.map((h, idx) => {
          const pct = Math.max(6, Math.round((h.ms / maxReciente) * 100));
          const previo = idx > 0 ? recientes[idx - 1] : null;
          const color = !previo ? "#d9b44a" : (h.ms < previo.ms ? "#3fb27f" : (h.ms > previo.ms ? "#e05a4f" : "#d9b44a"));
          const title = `${h.granjero || "Fragmentero"} · ${formatearCronometro(h.ms)} · ${h.dia || ""} ${formatearFechaCorta(h.fecha)}`;
          return `<div class="trend-col" title="${escapeHtml(title)}">
            <div class="trend-bar" style="height:${pct}%;background:${color}"></div>
            <span class="trend-label">${escapeHtml(h.dia || "")}</span>
          </div>`;
        }).join("")}
      </div>
      <div class="trend-note">Verde = mejora · Rojo = más lento</div>`
    : "";

  const filas = (STATE.granjeros || []).map((g, i) => {
    const sesiones = g.sesiones || 0;
    const total = g.tiempoTotalMs || 0;
    return {
      i,
      nombre: g.nombre,
      sesiones,
      total,
      ultima: g.ultimaSesionMs || 0,
      promedio: sesiones ? total / sesiones : 0
    };
  });

  const conDatos = filas.filter(f => f.sesiones > 0);
  const maxPromedio = conDatos.length ? Math.max(...conDatos.map(f => f.promedio)) : 0;
  const minPromedio = conDatos.length ? Math.min(...conDatos.map(f => f.promedio)) : 0;
  const totalSesiones = conDatos.reduce((acc, f) => acc + f.sesiones, 0);
  const totalTiempo = conDatos.reduce((acc, f) => acc + f.total, 0);
  const media = totalSesiones ? totalTiempo / totalSesiones : 0;
  const masRapido = conDatos.find(f => f.promedio === minPromedio);
  const masLento = conDatos.find(f => f.promedio === maxPromedio);
  const hayComparacion = conDatos.length > 1 && maxPromedio !== minPromedio;

  const filasHtml = filas.map(f => {
    const pct = f.promedio > 0 && maxPromedio > 0 ? Math.max(5, Math.round((f.promedio / maxPromedio) * 100)) : 0;
    let clase = "";
    if (hayComparacion && f.promedio === minPromedio) clase = "fast";
    else if (hayComparacion && f.promedio === maxPromedio) clase = "slow";
    else if (f.sesiones > 0) clase = "mid";

    return `<div class="farmer-bar-row" title="${escapeHtml(f.nombre)} · ${f.sesiones} sesión(es) · última ${f.ultima ? formatearCronometro(f.ultima) : "—"}">
      <span class="fb-name">${escapeHtml(f.nombre)}</span>
      <div class="fb-track"><div class="fb-fill ${clase}" style="width:${pct}%"></div></div>
      <span class="fb-time">${f.sesiones ? formatearCronometro(f.promedio) : "—"}</span>
    </div>`;
  }).join("");

  cont.innerHTML = `
    ${recordHtml}
    <div class="chart-head">
      <span>Rendimiento por fragmentero</span>
      <span class="chart-head-right">
        Promedio por sesión
        <button class="chart-reset" onclick="reiniciarTiemposFragmenteros()" title="Reiniciar tiempos" aria-label="Reiniciar tiempos">${svgIcon("refresh", "btn-svg")}</button>
      </span>
    </div>
    <div class="farmer-bars">${filasHtml}</div>
    <div class="farmer-chart-foot">
      ${conDatos.length
        ? `<span>Media: <strong>${formatearCronometro(media)}</strong></span>${masRapido && masLento && hayComparacion ? `<span>${escapeHtml(masRapido.nombre)} más rápido · ${escapeHtml(masLento.nombre)} más lento</span>` : ""}`
        : `<span>Inicia el cronómetro y pulsa Completar con un fragmentero para registrar el primer tiempo.</span>`}
    </div>
    ${trendHtml}
  `;
}

function reiniciarTiemposFragmenteros() {
  if (!confirm("¿Reiniciar el historial de tiempos, récords y sesiones de los 4 fragmenteros? El cronómetro activo también se detendrá.")) return;
  (STATE.granjeros || []).forEach(g => {
    g.tiempoTotalMs = 0;
    g.ultimaSesionMs = 0;
    g.sesiones = 0;
  });
  STATE.historialTiempos = [];
  STATE.cronometroGeneral = { inicio: null, ultimoMs: 0, ultimoGranjero: null };
  saveState();
  actualizarCronometroGeneral();
}

// ==========================================
// 9. RENDERIZADO VISUAL
// ==========================================

function renderAll() {
  renderHeader();
  renderDashboardZoom();
  renderConsumiblesDash();
  renderDashboardSummary();
  renderGranjeros();
  renderRendimientoFragmenteros();
  renderEventosRadar();   // async — actualiza el DOM cuando resuelve
  renderRuedaDSS();
  renderObjetivos();
  renderObjetivoAlquimia();
  renderFinanzas();
  renderCalculadoraLuzVerde();
  renderFusionStats();
  renderEstadoNotificaciones();
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

function renderDashboardSummary() {
  const hitos = (STATE.objetivos || []).filter(o => o.esHitoPlan);
  const hechos = hitos.filter(o => o.completado).length;
  const pct = hitos.length ? Math.round((hechos / hitos.length) * 100) : 0;

  const semanaEl = document.getElementById("dashSemana");
  if (semanaEl) semanaEl.textContent = `${STATE.semanaActual || 1} / 36`;
  const corsEl = document.getElementById("dashSemanaCors");
  if (corsEl) corsEl.textContent = `${STATE.corsSemanaActual || 0} / 140`;
  const planEl = document.getElementById("dashPlanPct");
  if (planEl) planEl.textContent = `${pct}%`;

  renderDashboardChart();
}

function renderDashboardChart() {
  const cont = document.getElementById("dashboardChart");
  if (!cont) return;

  const dias = ["L", "M", "X", "J", "V", "S", "D"];
  const hoy = indiceDiaJuego();
  const historial = STATE.semanaHistorial || [0, 0, 0, 0, 0, 0, 0];

  cont.innerHTML = dias.map((dia, i) => {
    const valor = Math.max(0, Math.min(20, historial[i] || 0));
    const pct = Math.round((valor / 20) * 100);
    const clases = [i === hoy ? "today" : "", valor >= 20 ? "complete" : ""].filter(Boolean).join(" ");
    return `<div class="chart-col ${clases}">
      <span class="chart-value">${valor || ""}</span>
      <div class="chart-track"><div class="chart-bar" style="height:${pct}%"></div></div>
      <span class="chart-label">${dia}</span>
    </div>`;
  }).join("");
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

  const hechos = (STATE.granjeros || []).filter(g => g.hechoHoy).length;
  const corsHoy = hechos * 5;
  const dashBadge = document.getElementById("dashCorsBadge");
  if (dashBadge) {
    dashBadge.textContent = `Ciclo: ${corsHoy}/20 Cors`;
    dashBadge.className = `brand-badge ${corsHoy === 20 ? 'semaphore-green' : ''}`;
  }

  if (activeZoom === "diario") {
    const pct = Math.round((corsHoy / 20) * 100);

    cont.innerHTML = `
      <div class="card-title" style="margin-bottom:6px;">
        <span>${svgIcon("bolt", "obj-icon")} Tarea del ciclo</span>
        <span class="semaphore-badge ${pct === 100 ? 'semaphore-green' : 'semaphore-yellow'}">${corsHoy} / 20 Cors (${pct}%)</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${pct === 100 ? 'green' : ''}" style="width: ${pct}%"></div>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
        ${hechos === 4 ? '¡Cuota del ciclo completada!' : `Faltan ${4 - hechos} personaje(s) por fragmentar.`}
      </p>
      <button class="btn-primary" onclick="switchView('view-granjeros')" style="padding: 9px; font-size: 0.82rem;">${svgIcon("users", "btn-svg")} Abrir Fragmenteros ${svgIcon("chevronRight", "btn-svg")}</button>
    `;
  } else if (activeZoom === "semanal") {
    const cors = STATE.corsSemanaActual;
    const pct = Math.min(100, Math.round((cors / 140) * 100));
    const semColor = cors >= 100 ? 'semaphore-green' : (cors >= 70 ? 'semaphore-yellow' : 'semaphore-red');

      const diaHoyIdx = indiceDiaJuego(); // día actual del servidor (Europe/Madrid)
      cont.innerHTML = `
      <div class="card-title">
        <span>${svgIcon("calendar", "obj-icon")} Semana ${STATE.semanaActual} de 36</span>
        <span class="semaphore-badge ${semColor}">${cors} / 140 Cors</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${cors >= 100 ? 'green' : ''}" style="width: ${pct}%"></div>
      </div>
      <div class="week-matrix">
        ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => {
          const valorDia = STATE.semanaHistorial[i] || 0;
          const estadoDia = valorDia >= 20 ? "done" : (valorDia > 0 ? "partial" : "pending");
          return `
          <div class="day-cell ${i === diaHoyIdx ? 'today' : ''}">
            <span class="day-name">${d}</span>
            <span class="day-val">${valorDia}</span>
            <span class="day-status ${estadoDia}" aria-hidden="true"></span>
          </div>`;
        }).join('')}
      </div>
      <p class="week-goal">
        ${svgIcon("target", "obj-icon")} Meta Semana ${STATE.semanaActual}: mantener el semáforo en verde (≥100 Cors).
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
        <span>${svgIcon("calendar", "obj-icon")} Mes ${mesNum} (Semanas ${semInicio}–${semFin})</span>
        <span class="semaphore-badge ${semColor2}">${corsMesActual} Cors sem. ${STATE.semanaActual} (${pctMes}%)</span>
      </div>
      <div class="progress-track"><div class="progress-fill ${pctMes >= 90 ? 'green' : ''}" style="width: ${pctMes}%;"></div></div>
      <div class="info-box">
        <strong>${svgIcon("award", "obj-icon")} Hito Mes ${mesNum}</strong>
        <p>6-8 Míticos Mates y comprar ${escapeHtml(STATE.finanzas.metaNombre)}.</p>
        <p class="info-box-note">Total global acumulado: <strong>${corsMesTotal} / 5040 Cors</strong></p>
      </div>
    `;
  } else if (activeZoom === "global") {
    const pct = Math.min(100, Math.round((STATE.corsTotal / 5040) * 100));
    const etapaActual = Math.min(5, Math.ceil((STATE.semanaActual || 1) / 8));
    const etapas = [
      { n: 1, nombre: "Cimientos", rango: "Sem 1-8" },
      { n: 2, nombre: "Míticos Mates", rango: "Sem 9-16" },
      { n: 3, nombre: "Pureza Clara & Límpida", rango: "Sem 17-24" },
      { n: 4, nombre: "Colchón de Brillantes", rango: "Sem 25-32" },
      { n: 5, nombre: "Excelente +6", rango: "Sem 33-36" }
    ];
    const filasEtapas = etapas.map(e => {
      const estado = e.n < etapaActual ? "done" : (e.n === etapaActual ? "current" : "locked");
      return `<div class="stage-row ${estado}">
        <span class="stage-dot" aria-hidden="true"></span>
        <span>Etapa ${e.n}: ${e.nombre} (${e.rango})</span>
        ${estado === "current" ? '<span class="stage-now">Estás aquí</span>' : ""}
      </div>`;
    }).join("");
    cont.innerHTML = `
      <div class="card-title">
        <span>${svgIcon("target", "obj-icon")} Progreso total hacia Excelente +6</span>
        <span class="semaphore-badge semaphore-green">${STATE.corsTotal} / 5040 Cors (${pct}%)</span>
      </div>
      <div class="progress-track"><div class="progress-fill ruby" style="width: ${pct}%;"></div></div>
      <div class="stage-list">
        ${filasEtapas}
      </div>
    `;
  }
}

function renderGranjeros() {
  const cont = document.getElementById("farmersList");
  if (!cont) return;

  const cronometroActivo = cronometroGeneralCorriendo();

  cont.innerHTML = STATE.granjeros.map((g, i) => {
    const ultima = g.ultimaSesionMs ? formatearCronometro(g.ultimaSesionMs) : "—";
    const meta = `${g.hora ? `Listo ${escapeHtml(g.hora)} · ` : ""}${g.sesiones ? `${g.sesiones} ses.` : "Sin tiempos"}`;

    return `
    <div class="farmer-row">
      <div class="farmer-name">
        <span class="farmer-status ${g.hechoHoy ? 'done' : ''}">${svgIcon(g.hechoHoy ? "check" : "clock")}</span>
        <div class="farmer-info">
          <span class="farmer-name-text">${escapeHtml(g.nombre)}</span>
          <span class="farmer-meta">${meta}</span>
        </div>
      </div>
      <span class="farmer-clock">${ultima}</span>
      <button class="btn-complete farmer-complete-btn ${g.hechoHoy ? 'done' : ''}" onclick="completarFragmentero(${i})">
        ${g.hechoHoy
          ? svgIcon("check", "btn-svg") + " Completado"
          : (cronometroActivo
            ? svgIcon("square", "btn-svg") + " Completar"
            : svgIcon("plus", "btn-svg") + " 5 Cors")}
      </button>
    </div>`;
  }).join('');
}

function toggleGranjero(index) {
  verificarCambioDia();
  const g = STATE.granjeros[index];
  if (!g) return;

  g.hechoHoy = !g.hechoHoy;
  const diaIdx = indiceDiaJuego();

  if (g.hechoHoy) {
    const d = new Date();
    g.hora = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    STATE.corsSemanaActual += 5;
    STATE.corsTotal += 5;
    STATE.semanaHistorial[diaIdx] = (STATE.semanaHistorial[diaIdx] || 0) + 5;
  } else {
    g.hora = "";
    STATE.corsSemanaActual = Math.max(0, STATE.corsSemanaActual - 5);
    STATE.corsTotal = Math.max(0, STATE.corsTotal - 5);
    STATE.semanaHistorial[diaIdx] = Math.max(0, (STATE.semanaHistorial[diaIdx] || 0) - 5);
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

// ==========================================
// NOTIFICACIONES POR EVENTO (CAMPANITA)
// ==========================================

function claveEventoNotificacion(ev) {
  const tipo = (ev.tipo_evento || "").trim().toLowerCase();
  // Los eventos estáticos se repiten cada semana: el aviso vale para todos sus días
  const fecha = tipo === "estatico" ? "" : (ev.fecha || "").trim();
  const dia = tipo === "estatico" ? "" : (ev.dia_semana || "").trim();
  return [
    tipo,
    (ev.servidor || "").trim(),
    fecha,
    dia,
    normalizarHora(ev.hora_inicio),
    normalizarHora(ev.hora_fin),
    (ev.nombre_evento || "").trim()
  ].join("|");
}

function notificacionEventoActiva(clave) {
  return !!(STATE.notificaciones && STATE.notificaciones.eventos && STATE.notificaciones.eventos[clave]);
}

function iconoCampana(activa) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
    <path d="M10 21h4"></path>
    ${activa ? `<path d="M12 2.5v1.2"></path>` : `<line x1="4" y1="4" x2="20" y2="20"></line>`}
  </svg>`;
}

function eventoEstaActivoAhora(ev, hora) {
  const hi = normalizarHora(ev.hora_inicio);
  const hf = normalizarHora(ev.hora_fin);
  if (hi <= hf) return hora >= hi && hora <= hf;
  return hora >= hi || hora <= hf;
}

function renderEstadoNotificaciones() {
  const btn = document.getElementById("btnActivarNotificaciones");
  const estado = document.getElementById("notifEstadoEventos");
  if (!btn && !estado) return;

  const soportado = typeof Notification !== "undefined";
  const permiso = soportado ? Notification.permission : "unsupported";
  const activos = Object.keys(STATE.notificaciones?.eventos || {}).length;

  if (btn) {
    btn.disabled = !soportado;
    btn.classList.toggle("active", permiso === "granted");
    if (!soportado) btn.textContent = "Sin soporte";
    else if (permiso === "granted") btn.textContent = "Avisos activados";
    else if (permiso === "denied") btn.textContent = "Avisos bloqueados";
    else btn.textContent = "Activar avisos";
  }

  if (estado) {
    if (!soportado) estado.textContent = "Este navegador no soporta notificaciones.";
    else if (permiso === "denied") estado.textContent = "Permiso bloqueado en el navegador.";
    else if (permiso === "granted") estado.textContent = activos ? `${activos} evento(s) con aviso (app abierta)` : "Elige eventos con la campanita.";
    else estado.textContent = "Activa el permiso y elige eventos con la campanita.";
  }
}

async function solicitarPermisoNotificaciones() {
  if (typeof Notification === "undefined") {
    alert("Este navegador no soporta notificaciones.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    alert("Las notificaciones están bloqueadas. Actívalas desde los ajustes del navegador para este sitio.");
    return false;
  }

  try {
    const resultado = await Notification.requestPermission();
    if (STATE.notificaciones) {
      STATE.notificaciones.permisoSolicitado = true;
    }
    return resultado === "granted";
  } catch (e) {
    alert("No se pudo solicitar el permiso de notificaciones.");
    return false;
  }
}

async function enviarNotificacion(titulo, cuerpo, tag) {
  const opciones = {
    body: cuerpo,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: tag ? `naaytracker-${tag}` : "naaytracker-evento"
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === "function") {
        await reg.showNotification(titulo, opciones);
        return;
      }
    }
    new Notification(titulo, opciones);
  } catch (e) {
    console.warn("[NaayTracker] No se pudo mostrar la notificación:", e);
  }
}

async function toggleNotificacionEvento(clave, nombre) {
  if (!clave) return;
  if (!STATE.notificaciones) {
    STATE.notificaciones = { permisoSolicitado: false, eventos: {}, notificados: {} };
  }
  if (!STATE.notificaciones.eventos) STATE.notificaciones.eventos = {};

  if (STATE.notificaciones.eventos[clave]) {
    delete STATE.notificaciones.eventos[clave];
    saveState();
    renderEstadoNotificaciones();
    return;
  }

  const permitido = await solicitarPermisoNotificaciones();
  if (!permitido) {
    renderEstadoNotificaciones();
    return;
  }

  STATE.notificaciones.eventos[clave] = true;
  saveState();
  renderEstadoNotificaciones();
  procesarNotificacionesEventos();
}

async function activarNotificacionesEventos() {
  const permitido = await solicitarPermisoNotificaciones();
  renderEstadoNotificaciones();
  if (permitido) procesarNotificacionesEventos();
}

let NOTIF_PROCESANDO = false;

async function procesarNotificacionesEventos() {
  if (NOTIF_PROCESANDO) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  NOTIF_PROCESANDO = true;
  try {
    const eventos = await cargarEventosAPI();
    if (!eventos.length) return;

    const servidor = STATE.perfil.servidor || "Ruby";
    const filtrados = filtrarEventosPorServidor(eventos, servidor);
    const now = new Date();
    const fechaHoy = fechaLocalISO(now);
    const diaHoy = DIA_API_MAP[now.getDay()];
    const horaActual = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const prefs = STATE.notificaciones?.eventos || {};
    if (!STATE.notificaciones) STATE.notificaciones = { permisoSolicitado: true, eventos: {}, notificados: {} };
    if (!STATE.notificaciones.notificados) STATE.notificaciones.notificados = {};
    const notificados = STATE.notificaciones.notificados;

    // Limpiar registros de días anteriores para permitir avisos diarios
    Object.keys(notificados).forEach(k => {
      if (notificados[k] !== fechaHoy) delete notificados[k];
    });

    const activosHoy = filtrados.filter(ev => {
      const tipo = (ev.tipo_evento || "").toLowerCase();
      const esHoy = tipo === "estatico" ? ev.dia_semana === diaHoy : ev.fecha === fechaHoy;
      return esHoy && eventoEstaActivoAhora(ev, horaActual);
    });

    let enviados = 0;
    for (const ev of activosHoy) {
      const clave = claveEventoNotificacion(ev);
      if (!prefs[clave] || notificados[clave] === fechaHoy) continue;

      await enviarNotificacion(
        ev.nombre_evento,
        `Evento activo ${ev.hora_inicio}–${ev.hora_fin} · ${servidor}`,
        clave
      );
      notificados[clave] = fechaHoy;
      enviados++;
    }

    if (enviados > 0) saveState();
  } finally {
    NOTIF_PROCESANDO = false;
  }
}

function iniciarListaNotificaciones() {
  const cont = document.getElementById("eventosList");
  if (!cont) return;
  cont.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-notif");
    if (!btn) return;
    e.preventDefault();
    toggleNotificacionEvento(btn.dataset.notifKey, btn.dataset.notifNombre);
  });
}

async function renderEventosRadar() {
  const el = document.getElementById("radarEventBox");
  if (!el) return;

  el.innerHTML = `
    <div class="radar-header"><span>${svgIcon("calendar", "obj-icon")} Radar de eventos</span><span style="font-size:0.75rem; color:var(--text-muted);">Cargando...</span></div>
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

  const badge = `<span style="font-size:0.7rem; background:rgba(212,160,23,0.15); border:1px solid var(--gold); color:var(--gold); padding:1px 6px; border-radius:10px; margin-left:6px;">${escapeHtml(servidor)}</span>`;

  if (EVENTOS_API_ERROR && filtrados.length === 0) {
    el.innerHTML = `<div class="radar-header"><span>Sin conexión</span></div><div class="radar-content" style="font-size:0.82rem; color:var(--text-muted);">No se pudieron cargar los eventos en vivo.</div>`;
    return;
  }

  if (activo) {
    const esAlq = esEventoAlquimia(activo.nombre_evento);
    const ico = activo.tipo_evento === "especial"
      ? `${svgIcon("calendar", "obj-icon")} Especial`
      : activo.tipo_evento === "grupo"
        ? `${svgIcon("users", "obj-icon")} Grupo`
        : `${svgIcon("bolt", "obj-icon")} Activo ahora`;
    const alqBadge = esAlq ? '<span class="event-tag">Alquimia</span>' : "";
    let tip = escapeHtml(activo.descripcion || "");
    if (esAlq) {
      if (activo.nombre_evento.toLowerCase().includes("cor draconis")) {
        tip = "<strong>¡Farmea Cors ahora!</strong> Pasa tus 4 granjeros para duplicar cors durante esta franja.";
      } else if (activo.nombre_evento.toLowerCase().includes("alubia")) {
        tip = "<strong>¡Cosecha de Alubias!</strong> Acumula alubias para subir tu DSS a +4 / +6.";
      }
    }

    el.innerHTML = `
      <div class="radar-header"><span>${ico} ${badge} ${alqBadge}</span><span>${escapeHtml(activo.hora_inicio)} – ${escapeHtml(activo.hora_fin)}</span></div>
      <div class="radar-content">${escapeHtml(activo.nombre_evento)}</div>
      <div style="font-size:0.8rem; color:${esAlq ? 'var(--green)' : 'var(--text-muted)'}; margin-top:4px;">${tip}</div>`;
  } else if (proximos.length > 0) {
    const prox = proximos[0];
    const esAlqProx = esEventoAlquimia(prox.nombre_evento);
    const alqBadge = esAlqProx ? '<span class="event-tag">Alquimia</span>' : "";
    el.innerHTML = `
      <div class="radar-header"><span>${svgIcon("clock", "obj-icon")} Próximo hoy ${badge} ${alqBadge}</span><span>Inicia ${escapeHtml(prox.hora_inicio)}</span></div>
      <div class="radar-content">${escapeHtml(prox.nombre_evento)}</div>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${escapeHtml(prox.descripcion || "")}</div>
      ${proximos.length > 1 ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:6px;">+${proximos.length-1} más hoy</div>` : ""}`;
  } else {
    el.innerHTML = `<div class="radar-header"><span>${svgIcon("calendar", "obj-icon")} Radar ${badge}</span></div><div class="radar-content" style="font-size:0.85rem; color:var(--text-muted);">Sin eventos hoy para ${escapeHtml(servidor)}.</div>`;
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

  cont.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:20px 0;">Cargando calendario de eventos...</p>`;

  const eventos  = await cargarEventosAPI();
  const servidor = STATE.perfil.servidor || "Ruby";
  let filtrados = filtrarEventosPorServidor(eventos, servidor);

  // Aplicar filtro de Alquimia si está activo
  if (filtroEventosActual === "alquimia") {
    filtrados = filtrados.filter(ev => esEventoAlquimia(ev.nombre_evento));
  }

  if (filtrados.length === 0) {
    const mensaje = EVENTOS_API_ERROR
      ? "Sin conexión y sin copia local de eventos guardada."
      : `Sin eventos ${filtroEventosActual === 'alquimia' ? 'de Alquimia' : ''} encontrados para <strong>${escapeHtml(servidor)}</strong>.`;
    cont.innerHTML = `<p style="color:var(--ruby); font-size:0.85rem; text-align:center; padding:20px 0;">${mensaje}</p>`;
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
    return `<div class="event-day-group">
      <div class="event-day ${esHoy ? "today" : ""}">${diasLabel[dia]}</div>
      ${evs.map(ev => {
        const activo = esHoy && estaActivo(ev.hora_inicio, ev.hora_fin, horaActual);
        const esAlq = esEventoAlquimia(ev.nombre_evento);
        const claveNotif = claveEventoNotificacion(ev);
        const notifActiva = notificacionEventoActiva(claveNotif);
        return `<div class="event-row ${activo ? "active" : ""}">
          <div class="event-main">
            <div class="event-name">
              ${escapeHtml(ev.nombre_evento)}
              ${esAlq ? '<span class="event-tag">Alquimia</span>' : ''}
            </div>
          </div>
          <div class="event-meta">
            <span class="event-time">${escapeHtml(ev.hora_inicio)}–${escapeHtml(ev.hora_fin)}</span>
            <button class="btn-notif ${notifActiva ? 'active' : ''}" data-notif-key="${escapeHtml(claveNotif)}" data-notif-nombre="${escapeHtml(ev.nombre_evento)}" title="${notifActiva ? 'Desactivar aviso' : 'Activar aviso'}" aria-label="${notifActiva ? 'Desactivar aviso' : 'Activar aviso'}">${iconoCampana(notifActiva)}</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }).join("");

  const htmlEstaticos = estaticos.length ? `
    <div class="event-section">
      <div class="event-section-title">Calendario semanal ${filtroEventosActual === 'alquimia' ? '· Alquimia' : ''}</div>
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
    <div class="event-section">
      <div class="event-section-title monthly">${meses[mesActual]} ${añoActual} · Eventos especiales ${filtroEventosActual === 'alquimia' ? '· Alquimia' : ''}</div>
      ${eventosMes.map(ev => {
        const esPasado = ev.fecha < fechaHoy;
        const esHoy2   = ev.fecha === fechaHoy;
        const activo   = esHoy2 && estaActivo(ev.hora_inicio, ev.hora_fin, horaActual);
        const dia      = parseInt(ev.fecha.split("-")[2]);
        const esAlq    = esEventoAlquimia(ev.nombre_evento);
        const claveNotif = claveEventoNotificacion(ev);
        const notifActiva = notificacionEventoActiva(claveNotif);
        return `<div class="event-row event-row-month ${activo ? "active" : ""} ${esPasado ? "past" : ""}">
          <div class="event-main">
            <div class="event-name">
              ${escapeHtml(ev.nombre_evento)}
              ${esAlq ? '<span class="event-tag">Alquimia</span>' : ''}
            </div>
            ${ev.descripcion ? `<div class="event-desc">${escapeHtml(ev.descripcion)}</div>` : ""}
          </div>
          <div class="event-meta event-meta-col">
            <div class="event-date">${dia} ${meses[mesActual].slice(0,3)}</div>
            <div class="event-time">${escapeHtml(ev.hora_inicio)}${ev.hora_fin ? '–' + escapeHtml(ev.hora_fin) : ''}</div>
            <button class="btn-notif ${notifActiva ? 'active' : ''}" data-notif-key="${escapeHtml(claveNotif)}" data-notif-nombre="${escapeHtml(ev.nombre_evento)}" title="${notifActiva ? 'Desactivar aviso' : 'Activar aviso'}" aria-label="${notifActiva ? 'Desactivar aviso' : 'Activar aviso'}">${iconoCampana(notifActiva)}</button>
          </div>
        </div>`;
      }).join("")}
    </div>` :
    `<p class="event-empty">Sin eventos ${filtroEventosActual === 'alquimia' ? 'de Alquimia' : ''} en ${meses[mesActual]} para <strong>${escapeHtml(servidor)}</strong>.</p>`;

  cont.innerHTML = htmlEstaticos + htmlMes;
}


const GEMA_INFO_MAP = {
  rubi:     { nombre: "Rubí", color: "var(--ruby)", stat: "Valor Ataque + Media" },
  jade:     { nombre: "Jade", color: "var(--green)", stat: "Max HP + Robo Vida" },
  onice:    { nombre: "Ónice", color: "#b0b8c4", stat: "Bloqueo + Res. Crítico" },
  diamante: { nombre: "Diamante", color: "#ffffff", stat: "Ataque Mágico + Habilidad" },
  zafiro:   { nombre: "Zafiro", color: "var(--blue)", stat: "Fuerza vs Razas" },
  granate:  { nombre: "Granate", color: "var(--gold)", stat: "SP + Res. Relámpago" }
};

function iconoGema(key, className = "gem-svg") {
  const info = GEMA_INFO_MAP[key] || GEMA_INFO_MAP.rubi;
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3h12l3 6-9 12L3 9l3-6Z" fill="${info.color}" stroke="rgba(255,255,255,.45)" stroke-width="1"></path>
    <path d="M3 9h18M8.5 3 12 21M15.5 3 12 21" fill="none" stroke="rgba(0,0,0,.28)" stroke-width=".8"></path>
  </svg>`;
}

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
        <div class="gem-card ${esActiva ? "active" : ""}" onclick="cambiarGemaActiva('${k}')">
          <div class="gem-icon">${iconoGema(k)}</div>
          <div class="gem-name">${g.nombre}</div>
          <div class="gem-stock">${subtitulo}</div>
        </div>
      `;
    }).join('');
  }

  // 2. Actualizar detalles de la Gema Activa
  const infoActiva = GEMA_INFO_MAP[gemaKey] || GEMA_INFO_MAP.rubi;
  const titleEl = document.getElementById("activeGemaTitle");
  if (titleEl) titleEl.innerHTML = `${iconoGema(gemaKey)} <span>${infoActiva.nombre}</span>`;
  const statEl = document.getElementById("activeGemaStat");
  if (statEl) statEl.textContent = infoActiva.stat;

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
  if (asisBadge) asisBadge.innerHTML = `${iconoGema(gemaKey, "badge-gem")} <span>${infoActiva.nombre}</span>`;

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
        <span>${svgIcon("target", "obj-icon")} Potencial directo en almacén:</span>
        <strong style="color:var(--gold);">+${potLegendarias} Legendarias / +${potMiticas} Míticas</strong>
      </div>
      <div style="padding: 8px 10px; background: rgba(212, 160, 23, 0.08); border-left: 3px solid var(--gold); border-radius: 4px; font-size: 0.74rem; line-height: 1.45; margin-bottom: 6px;">
        <strong style="color: var(--gold);">${svgIcon("note", "obj-icon")} Pirámide de Claridad a Excelente (Metin2):</strong><br>
        • <strong>Mate → Claro:</strong> Requiere 2 Míticas Mate (Colchón seguro: <strong>4 Míticas</strong>).<br>
        • <strong>Claro → Límpido:</strong> Requiere 2 Claras (Equivale a 4 Míticas Mate exitosas).<br>
        • <strong>Límpido → Brillante:</strong> Requiere 2 Límpidas (Equivale a 8 Míticas Mate exitosas).<br>
        • <strong>Brillante → Excelente:</strong> Requiere 2 Brillantes (Equivale a 16+ Míticas Mate teóricas; ~25-35 reales por tasa del ~30-35%).
      </div>
      <div style="font-size:0.73rem; color:var(--text-muted); line-height:1.4;">
        ${svgIcon("shield", "obj-icon")} <strong>Regla Anti-Quiebra de Claridad:</strong> Nunca fusiones pureza con solo 2 Míticas. Un fallo destruye la piedra y paraliza semanas de trabajo. Acumula siempre <strong>4+ Míticas</strong> antes de intentar subir pureza.
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

function abrirModalRegistrarPiedras() {
  const sel = document.getElementById("regGema");
  if (!sel) return;

  sel.innerHTML = Object.keys(GEMA_INFO_MAP)
    .map(k => `<option value="${k}">${GEMA_INFO_MAP[k].nombre}</option>`)
    .join("");
  sel.value = STATE.ruedaDSS.gemaActiva || "rubi";

  const clase = document.getElementById("regClase");
  if (clase) clase.value = "stockAntiguas";
  const cantidad = document.getElementById("regCantidad");
  if (cantidad) cantidad.value = 1;

  const modal = document.getElementById("modalRegistrarPiedras");
  if (modal) modal.classList.add("active");
}

function guardarRegistroPiedras() {
  const gemaSel = document.getElementById("regGema");
  const claseSel = document.getElementById("regClase");
  const cantidadInput = document.getElementById("regCantidad");
  if (!gemaSel || !claseSel) return;

  const gemaKey = gemaSel.value;
  const campo = claseSel.value;
  const camposValidos = ["stockAntiguas", "stockLegendarias", "stockMiticas"];
  if (!GEMA_INFO_MAP[gemaKey] || !camposValidos.includes(campo)) return;

  const cantidad = Math.max(1, parseInt(cantidadInput && cantidadInput.value, 10) || 1);

  if (!STATE.ruedaDSS.slots[gemaKey]) {
    STATE.ruedaDSS.slots[gemaKey] = {
      estado: "en_progreso", claridad: "mate", nivel: 0,
      stockAntiguas: 0, stockLegendarias: 0, stockMiticas: 0
    };
  }

  STATE.ruedaDSS.slots[gemaKey][campo] = (STATE.ruedaDSS.slots[gemaKey][campo] || 0) + cantidad;
  STATE.ruedaDSS.gemaActiva = gemaKey;

  vibrar(35);
  cerrarModal("modalRegistrarPiedras");
  saveState();
}


function renderFinanzas() {
  const elWons = document.getElementById("saldoWons");
  if (elWons) elWons.textContent = STATE.finanzas.saldoWons;
  const elYang = document.getElementById("saldoYang");
  if (elYang) elYang.textContent = STATE.finanzas.saldoYangKK;

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
          <td><strong>${escapeHtml(item.nombre)}</strong></td>
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
              ${svgIcon("chevronRight", "btn-svg")} Vender
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Panel de Arbitraje / Reinversión ligado al objetivo actual
  const panelArb = document.getElementById("panelArbitrajeRubi");
  const arbTitulo = document.getElementById("arbTitulo");
  const arbBoton = document.getElementById("arbBoton");
  if (panelArb) {
    const objetivo = objetivoAlquimiaActual();
    const gemaKey = (objetivo && GEMA_INFO_MAP[objetivo.gema]) ? objetivo.gema : (STATE.ruedaDSS.gemaActiva || "rubi");
    const gema = GEMA_INFO_MAP[gemaKey] || GEMA_INFO_MAP.rubi;

    const cWons = STATE.finanzas.precioCompraRubiWons !== undefined ? STATE.finanzas.precioCompraRubiWons : 4.5;
    const cKK = STATE.finanzas.precioCompraRubiKK !== undefined ? STATE.finanzas.precioCompraRubiKK : 0;
    const precioTxt = `${cWons}W${cKK > 0 ? ' + ' + cKK + 'kk' : ''}`;

    const saldoTotalKK = (STATE.finanzas.saldoWons * 100) + (STATE.finanzas.saldoYangKK || 0);
    const costoUnitarioKK = (cWons * 100) + cKK;
    const comprables = costoUnitarioKK > 0 ? Math.floor(saldoTotalKK / costoUnitarioKK) : 0;
    const stock = STATE.ruedaDSS?.slots?.[gemaKey]?.stockAntiguas || 0;

    if (arbTitulo) {
      arbTitulo.innerHTML = `${svgIcon("refresh", "obj-icon")} Reinversión: Comprar ${gema.nombre} Antiguo`;
    }
    if (arbBoton) {
      arbBoton.innerHTML = `${svgIcon("cart", "btn-svg")} Comprar 1 ${gema.nombre} (-${precioTxt} → +1 al stock)`;
    }

    panelArb.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-input); padding:8px 10px; border-radius:var(--radius-sm); border:1px solid rgba(231,76,60,0.25);">
        <div>
          <span style="color:var(--text-muted); font-size:0.75rem;">Cotización compra:</span>
          <strong style="color:var(--gold); margin-left:4px;">${precioTxt}</strong>
        </div>
        <div>
          <span style="color:var(--text-muted); font-size:0.75rem;">Poder de compra:</span>
          <strong style="color:${comprables > 0 ? 'var(--green)' : 'var(--text-dim)'}; margin-left:4px;">
            ${comprables} ${gema.nombre}(es)
          </strong>
        </div>
      </div>
      <div style="font-size:0.73rem; color:var(--text-muted); margin-top:5px; text-align:right;">
        Stock en almacén: <strong style="color:var(--gold);">${stock} ${gema.nombre} Antiguo(s)</strong>
      </div>
      ${objetivo ? `<div style="font-size:0.68rem; color:var(--text-dim); margin-top:5px; text-align:right;">Vinculado a: ${escapeHtml(objetivo.titulo)}</div>` : ""}
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
    stockLabel = `Stock de ${escapeHtml(gemaKey.toUpperCase())} Legendario: ${stockLeg} piedras`;
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
    stockLabel = `Stock de ${escapeHtml(gemaKey.toUpperCase())} Mítico: ${stockMit} piedras | Claridad Actual: ${escapeHtml(clarActual.toUpperCase())}`;

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
        : `🟢 ¡Luz Verde para Claridad (${escapeHtml(clarActual.toUpperCase())} ➔ ${siguienteClaridad.toUpperCase()})! Tienes colchón de ${stockMit} Míticas (2 intentos). Si falla el primero, te quedarán piedras para reintentar. [${piramideCosto}]`;
    } else {
      semColor = "green";
      prob = `${tasaPaso} (Colchón Óptimo 3+ intentos)`;
      dictamen = `💎 ¡Colchón Óptimo de Seguridad (${stockMit} Míticas)! Tienes margen para amortiguar hasta 2 fallos consecutivos y lograr el salto a ${siguienteClaridad}. Respeta la pausa Jitter.`;
    }
  } else {
    // Tipo: antiguas (Fusión Antiguas ➔ Legendaria)
    const stockAnt = gemaData.stockAntiguas || 0;
    stockLabel = `Stock de ${escapeHtml(gemaKey.toUpperCase())} Antiguo: ${stockAnt} piedras`;

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

  const dictamenLimpio = dictamen
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE0F}\s]+/u, "")
    .replace(/➔/g, "→");

  el.innerHTML = `
    <div class="calc-head">
      <span class="calc-label">${stockLabel}</span>
      <span class="semaphore-badge semaphore-${semColor}">${prob}</span>
    </div>
    <p class="calc-dictamen">${dictamenLimpio}</p>
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
      { id: 1, nombre: "Fragmentero 1", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 },
      { id: 2, nombre: "Fragmentero 2", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 },
      { id: 3, nombre: "Fragmentero 3", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 },
      { id: 4, nombre: "Fragmentero 4", hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 }
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
      STATE.granjeros.push({ id: i + 1, nombre: nombre, hechoHoy: false, hora: "", tiempoMin: 0, tiempoTotalMs: 0, ultimaSesionMs: 0, sesiones: 0 });
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
      if (!data || typeof data !== "object" || Array.isArray(data) ||
          (!("corsTotal" in data) && !("perfil" in data) && !("version" in data))) {
        throw new Error("El archivo no parece un respaldo de NaayTracker.");
      }
      STATE = mergeStateWithDefaults(data);
      saveState();
      alert("✅ Copia de seguridad restaurada con éxito.");
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
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Código inválido.");
      }
      STATE = mergeStateWithDefaults(data);
      saveState();
      alert("✅ Datos restaurados con éxito desde el código.");
    } catch (e) {
      alert("❌ Código inválido.");
    }
  }
}

function restablecerTodosLosDatos() {
  const confirmacion = confirm("⚠️ ¿Estás seguro de que deseas BORRAR TODOS los datos de este dispositivo?\n\nEsta acción reiniciará tu progreso local y desconectará la sincronización. La copia en la nube NO se borra: podrás restaurarla después con tu código de sincronización.");
  if (!confirmacion) return;

  if (typeof desconectarSyncSilencioso === "function") {
    desconectarSyncSilencioso();
  } else {
    localStorage.removeItem("naaytracker_sync");
  }

  localStorage.removeItem("naaytracker_state");
  STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
  STATE.ultimoDia = fechaJuegoISO();
  STATE.inicioSemana = inicioSemanaJuegoISO();
  saveState();
  renderAll();
  cerrarModal("modalAjustes");
  alert("🧹 Datos locales borrados y sincronización desconectada. La copia en la nube sigue disponible si vuelves a conectar tu código.");
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
  renderIconosEstaticos();
  verificarCambioDia();
  renderAll();
  actualizarCronometroGeneral();
  iniciarGestosSwipe();
  iniciarListaNotificaciones();
  iniciarObjetivoAlquimia();
  if (typeof iniciarSyncAutomatico === "function") iniciarSyncAutomatico();

  // Actualizar el cronómetro con precisión de décimas
  setInterval(actualizarCronometroGeneral, 100);

  // Mantener los contadores al día aunque la app quede abierta varios días
  setInterval(verificarCambioDia, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      verificarCambioDia();
      procesarNotificacionesEventos();
    }
  });

  // Comprobar eventos activos seleccionados cada minuto
  setInterval(procesarNotificacionesEventos, 60 * 1000);
  setTimeout(procesarNotificacionesEventos, 3000);

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
    navigator.serviceWorker.register("./sw.js")
      .then(() => procesarNotificacionesEventos())
      .catch(console.error);
  }
});
