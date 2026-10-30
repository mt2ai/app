# Pre-Diseño: PWA Tracker — Proyecto Naay (Metin2 Alquimia)
### App Web Progresiva para control de producción, refinamiento y auditoría semanal

---

> [!IMPORTANT]
> Esta app está diseñada para ser **ultra privada y 100% offline-first** (sin servidores externos, sin cuentas, sin login y sin rastreo). Todos los datos se guardan estrictamente en el `localStorage` del dispositivo. 
> 
> **Separación de conceptos:**
> - El **Manual Maestro del Sura** mantiene su matemática pura basada en constantes controladas (misiones diarias de 20 Cors).
> - La **PWA** incluye el módulo dinámico de **Eventos** para alertar al jugador en tiempo real (drops de Alubias, Cors de los martes, etc.) y registrar cualquier ganancia extra sin alterar la base matemática del plan.

---

## 1. Concepto Central

**Nombre propuesto:** `NaayTracker` o `DSS Manager`
**Stack sugerido:** HTML + CSS + Vanilla JS *(o React si prefieres componentes)* + Workbox (Service Worker)
**Instalación:** PWA — sin Play Store ni App Store. El usuario abre la URL y pulsa "Añadir a pantalla de inicio".

### Filosofía de diseño
- **Una pantalla, un objetivo** → Sin menús infinitos. El jugador abre la app, ve el semáforo y registra en 30 segundos.
- **Mobile-first** → Se usa mientras se juega en PC desde el teléfono.
- **Sin login** → Datos 100% locales. Sin cuentas, sin servidores.

---

## 2. Arquitectura de Pantallas (Flujo de Navegación)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          🏠 PANTALLA INICIO                            │
│     Semáforo Semanal  |  Progreso Global  |  ⚡ Evento Activo Hoy      │
│     [Registrar Hoy]   |  [Ver Semana]     |  [Radar Eventos]           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────┬───────────────┼───────────────┬────────────────┐
       │            │               │               │                │
       ▼            ▼               ▼               ▼                ▼
┌──────────┐  ┌──────────┐   ┌──────────────┐ ┌──────────────┐ ┌──────────┐
│📦GRANJEROS│  │💎INVENTARIO│  │ 📅 EVENTOS   │ │ 📖 BIBLIOTECA │ │🧪ALQUIMIA│
│ 4 chars  │  │Piedras DSS│  │  Radar Ruby  │ │  Docs .md    │ │Timer RNG │
│ Cors/día │  │por tipo   │  │  Hoy / Mes   │ │  integrados  │ │Stop-Loss │
└────┬─────┘  └─────┬────┘   └──────────────┘ └──────────────┘ └──────────┘
     │               │
     ▼               ▼               ▼               ▼
┌──────────┐  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│➕ CORS    │  │📊 ESTADÍSTICAS│ │ 🛡️ MAESTRÍA  │ │ 🔔 ALERTAS   │
│  EXTRA   │  │ 36 semanas   │ │  F2P NAAY    │ │  Disciplina  │
│ (Evento) │  │ Gráficas     │ │Biólogo / P's │ │  Notificac.  │
└──────────┘  └──────┬───────┘ └──────────────┘ └──────────────┘
                     │
                     ▼
              ┌──────────────┐
              │✅ CHECKLIST   │
              │  Domingo     │
              └──────────────┘
```

> [!NOTE]
> La **Biblioteca** convierte los archivos `.md` en documentación navegable dentro de la app, eliminando la necesidad de tener un editor abierto para consultar el manual.

---

## 3. Pantallas Detalladas

---

### 🏠 PANTALLA 1 — Dashboard: Sistema de Cuádruple Zoom de Avance
#### (Diario ──> Semanal ──> Mensual ──> Global)

El usuario puede alternar instantáneamente entre **4 niveles de perspectiva** con un selector de pestañas en la parte superior del Dashboard:
```
[ ⚡ DIARIO ]    [ 📅 SEMANAL ]    [ 📆 MENSUAL ]    [ 🌍 GLOBAL ]
```

---

#### 1️⃣ VISTA DIARIA ("La Tarea de Hoy" — Cero Estrés)
* **Objetivo:** Ejecutar la sesión de 45–60 minutos de hoy sin pensar en nada más.

```
╔══════════════════════════════════════════════════════╗
║  NaayTracker     [⚡ DIARIO] [📅 SEM] [📆 MES] [🌍 GLOB]║
║──────────────────────────────────────────────────────║
║  HOY: Jueves 30 de Octubre   •   Meta diaria: 20 Cors ║
║                                                      ║
║  PROGRESO DE HOY:  15 / 20 Cors  (75%)               ║
║  ███████████████░░░░░                                ║
║                                                      ║
║  CHECK DE GRANJEROS (1 toque):                       ║
║  [✅] Granjero 1 (5 Cors) ── 19:12                   ║
║  [✅] Granjero 2 (5 Cors) ── 19:24                   ║
║  [✅] Granjero 3 (5 Cors) ── 19:40                   ║
║  [⬜] Granjero 4 (5 Cors) ── [ Marcar Hecho ✓ ]      ║
║                                                      ║
║  ⚡ RADAR HOY:                                       ║
║  • 16:00 - 20:00: Bendición Pequeña (Metins/Jefes)   ║
║                                                      ║
║  NAAY (Nivel 95):                                    ║
║  [ ] Bosque Encantado: 3-5 Metins + Guantes ladrón   ║
║  [ ] Donar EXP si barra > 50%                        ║
╚══════════════════════════════════════════════════════╝
```

---

#### 2️⃣ VISTA SEMANAL ("El Sprint de 7 Días" — Mantener el Enfoque)
* **Objetivo:** Medir la consistencia de la semana activa y auditar el semáforo.

```
╔══════════════════════════════════════════════════════╗
║  NaayTracker     [⚡ DIARIO] [📅 SEM] [📆 MES] [🌍 GLOB]║
║──────────────────────────────────────────────────────║
║  SEMANA 14 de 36  •  Semáforo actual: 🟢 VERDE       ║
║                                                      ║
║  CORS ESTA SEMANA:  110 / 140 Cors (Meta: ≥100 verde)║
║  ████████████████░░░░                                ║
║                                                      ║
║  MATRIZ DE LOS 7 DÍAS:                               ║
║  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐         ║
║  │ LUN │ MAR │ MIÉ │ JUE │ VIE │ SÁB │ DOM │         ║
║  │ 20  │ 20  │ 20  │ 15  │ 20  │ 15  │  -  │ Cors    ║
║  │ ✅  │ ✅  │ ✅  │ 🟡  │ ✅  │ 🟡  │ ⏳  │ Estado  ║
║  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘         ║
║                                                      ║
║  🎯 META CLAVE SEMANA 14 (Manual Maestro):           ║
║  • Stock objetivo al domingo: 4-5 Rubíes Míticos Mate║
║  • Cors acumulados objetivo: 1.960 Cors              ║
║                                                      ║
║  [📋 Abrir Checklist Dominical (5 min)]              ║
╚══════════════════════════════════════════════════════╝
```

---

#### 3️⃣ VISTA MENSUAL ("El Hito Estratégico" — Resultados Tangibles)
* **Objetivo:** Ver la evolución financiera, adquisición de equipo y saltos de grado.

```
╔══════════════════════════════════════════════════════╗
║  NaayTracker     [⚡ DIARIO] [📅 SEM] [📆 MES] [🌍 GLOB]║
║──────────────────────────────────────────────────────║
║  MES 4 (Semanas 13 a 16)  •  Hito: Fin Ciclo de Clase║
║                                                      ║
║  PRODUCCIÓN DEL MES:  490 / 560 Cors (88%)           ║
║  ██████████████████░░░                               ║
║                                                      ║
║  DESGLOSE POR SEMANAS:                               ║
║  Semana 13: 135 Cors  █████████████░ 🟢              ║
║  Semana 14: 124 Cors  ████████████░░ 🟢 (En curso)   ║
║  Semana 15:   0 Cors  ░░░░░░░░░░░░░░ ⏳              ║
║  Semana 16:   0 Cors  ░░░░░░░░░░░░░░ ⏳              ║
║                                                      ║
║  💰 FINANZAS Y EQUIPO DE ESTE MES:                   ║
║  • Venta de piedras secundarias: +38 Wons estimados  ║
║  • [✅] Adquirir Pendientes de Cielo +9 (+30-40 INT)  ║
║  • [⬜] Escudo con +12 INT para pre-casteo           ║
║                                                      ║
║  🏆 HITO DE CIERRE DE MES:                           ║
║  "Tener 6 a 8 Rubíes Míticos Mates en stock seguro"  ║
╚══════════════════════════════════════════════════════╝
```

---

#### 4️⃣ VISTA GLOBAL ("El Mapa del Tesoro" — La Gran Meta)
* **Objetivo:** Ver el panorama completo hacia el Rubí Mítico Excelente +6.

```
╔══════════════════════════════════════════════════════╗
║  NaayTracker     [⚡ DIARIO] [📅 SEM] [📆 MES] [🌍 GLOB]║
║──────────────────────────────────────────────────────║
║  PROGRESO TOTAL: 1.960 / 5.040 Cor Draconis (39%)    ║
║  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║
║                                                      ║
║  MAPA DE LAS 5 ETAPAS (Ruta Gamificada):             ║
║                                                      ║
║  [ETAPA 1] Cimientos & Antiguas (Sem 1-8)            ║
║  └── ✅ COMPLETADA (1.120 Cors acumulados)            ║
║                                                      ║
║  [ETAPA 2] Legendarias & Mítico Mate (Sem 9-16)      ║
║  └── 🔄 EN PROGRESO (Semana 14 / 36) ← ¡ESTÁS AQUÍ!  ║
║      ████████████░░░░ (75% de esta etapa)            ║
║                                                      ║
║  [ETAPA 3] Pureza Clara y Límpida (Sem 17-24)        ║
║  └── 🔒 Bloqueada (Meta: 3.360 Cors)                 ║
║                                                      ║
║  [ETAPA 4] Colchón de Brillantes (Sem 25-32)         ║
║  └── 🔒 Bloqueada (Meta: 4.480 Cors)                 ║
║                                                      ║
║  [ETAPA 5] Coronación: Excelente +6 (Sem 33-36)      ║
║  └── 🏆 META FINAL (5.040 Cors)                      ║
║                                                      ║
║  📅 Proyección a ritmo real: Finalización Semana 34  ║
║  [💎 Ver Inventario Completo]  [🧪 Sesión Alquimia]  ║
╚══════════════════════════════════════════════════════╝
```

---

### 👥 PANTALLA 2 — Panel de Granjeros y Modo Sesión Enfocada

**Objetivo:** Marcar la producción diaria de cada personaje (4 granjeros) y cronometrar la sesión para no perder tiempo.

```
╔═════════════════════════════════════════════════════╗
║  👥 Granjeros — Jueves 30 Oct                       ║
║─────────────────────────────────────────────────────║
║                                                     ║
║  ⏱️ CRONÓMETRO DE SESIÓN ENFOCADA (Anti-Distracciones)║
║  ┌───────────────────────────────────────────────┐  ║
║  │ Personaje Activo: Granjero 3 (Lv 30)          │  ║
║  │ ⏱️ Tiempo restante: [ 08:42 ] (de 12:00 min)  │  ║
║  │ [ ▶️ Pausar ]   [ ⏹️ Terminar y Siguiente ]    │  ║
║  └───────────────────────────────────────────────┘  ║
║                                                     ║
║  Granjero 1  [✅ 5 Cors]  Hora: 19:12 (Duró: 10m)    ║
║  Granjero 2  [✅ 5 Cors]  Hora: 19:24 (Duró: 11m)    ║
║  Granjero 3  [🔄 En curso...]                        ║
║  Granjero 4  [⬜ Pendiente]                         ║
║                                                     ║
║  Total hoy: 10 / 20 Cors  🟡                        ║
║  ─────────────────────────────────────────────────  ║
║  [ Marcar Granjero 3 Completado ✓ ]                 ║
║                                                     ║
║  Historial esta semana:                             ║
║  Lun ✅  Mar ✅  Mié ✅  Jue 🔄  Vie ⏳  Sáb ⏳  Dom ⏳ ║
╚═════════════════════════════════════════════════════╝
```

**Componentes:**
- **Cronómetro de 12 Minutos por Personaje:** Evita que la persona se distraiga en el chat o en la aldea. Cuando llega a cero emite un aviso sonoro suave para pasar al siguiente.
- Tarjeta por granjero con nombre editable y cálculo de tiempo empleado.
- Botón de un tap para marcar "5 Cors completados".
- Resumen semanal por días (iconos ✅ / ❌ / 🔄).

---

### 💎 PANTALLA 3 — Rueda de Alquimia Interactiva y Stock DSS

**Objetivo:** Gestión de la Rueda de Alquimia completa (6 ranuras elementales) y seguimiento de la piedra objetivo activa, con control de consumibles críticos.

```
╔═════════════════════════════════════════════════════╗
║  🎡 Rueda DSS y Consumibles — Proyecto Metin2       ║
║─────────────────────────────────────────────────────║
║                                                     ║
║  🎯 PIEDRA OBJETIVO ACTIVA: [ 🔴 Rubí Mítico ▼ ]     ║
║  ┌───────────────────────────────────────────────┐  ║
║  │ 🔴 Rubí:     [ 🔄 EN PROGRESO: Sem. 14 / 36 ] │  ║
║  │ 🟢 Jade:     [ ⏳ En cola para siguiente ]     │  ║
║  │ ⚫ Ónice:    [ ⏳ En cola ]                    │  ║
║  │ ⚪ Diamante: [ ⏳ En cola ]                    │  ║
║  │ 🔵 Zafiro:   [ ⏳ En cola ]                    │  ║
║  │ 🟠 Granate:  [ ⏳ En cola ]                    │  ║
║  │ 🏆 Al completar las 6: ¡Bono de Set Mítico!   │  ║
║  └───────────────────────────────────────────────┘  ║
║                                                     ║
║  🎒 RADAR DE CONSUMIBLES CRÍTICOS (Anti-Desabasto)  ║
║  ┌───────────────────────────────────────────────┐  ║
║  │ 🧤 Guantes de Ladrón (2h): [ 4 ]  🟢 Stock OK │  ║
║  │ 🍃 Alubias Verdes Dragón:  [ 28 / 60 ] (46%)  │  ║
║  │ ☀️ Elixir del Sol (M):     [ 2 ]  🟢 Stock OK │  ║
║  │ 🔮 Pociones Moradas:       [ 150 ]            │  ║
║  └───────────────────────────────────────────────┘  ║
║                                                     ║
║  CLASE (Para la piedra activa seleccionada) ──────  ║
║  Piedra Bruta      [ 0 ] ▲▼                         ║
║  Piedra Cortada    [ 0 ] ▲▼                         ║
║  Piedra Rara       [ 2 ] ▲▼                         ║
║  Piedra Antigua    [12 ] ▲▼  ✅ OK (Meta Sem 14: 10+)║
║  Piedra Legendaria [ 9 ] ▲▼                         ║
║  Piedra Mítica     [ 4 ] ▲▼                         ║
║                                                     ║
║  PUREZA (solo Míticas) ───────────────────────────  ║
║  Mate     [ 4 ] ▲▼                                  ║
║  Clara    [ 0 ] ▲▼                                  ║
║  Límpida  [ 0 ] ▲▼                                  ║
║  Brillante[ 0 ] ▲▼                                  ║
║  Excelente[ 0 ] ▲▼                                  ║
║                                                     ║
║  NIVEL (Mítica Excelente activa) ─────────────────  ║
║  [ +0 ]  [ +1 ]  [ +2 ]  [ +3 ]  [ +4 ]  [ +5 ]  [ +6 ] ║
╚═════════════════════════════════════════════════════╝
```

**Componentes:**
- Contadores +/- para cada categoría de piedra
- **Validación visual**: marca en verde si el stock está en el rango objetivo de la semana actual
- Comparación automática con la tabla del cronograma (⚠️ si está por debajo del objetivo)
- Sección separada: piedras secundarias (Diamante, Jade, Esmeralda, Zafiro) para calcular ingresos estimados en Wons

---

### 🧪 PANTALLA 4 — Sesión de Alquimia (Asistente RNG)

**Objetivo:** Guiar a la usuaria durante las fusiones con el protocolo de jitter.

```
╔════════════════════════════════════════╗
║  🧪 Sesión Alquimia — Clase: Antigua→  ║
║                       Legendaria       ║
║────────────────────────────────────────║
║                                        ║
║  Intento #3    Resultado: ✅ ÉXITO      ║
║  ─────────────────────────────────────  ║
║  ⏱️ Espera antes del siguiente:         ║
║                                        ║
║         [ 00:05 ]  ←  cuenta regresiva ║
║                                        ║
║  Fallos consecutivos: 0  🟢            ║
║  Éxitos hoy: 2  |  Fallos hoy: 1      ║
║                                        ║
║  [✅ ÉXITO]        [❌ FALLO]           ║
║                                        ║
║  ⚠️  STOP-LOSS activo (2 fallos = STOP) ║
╚════════════════════════════════════════╝
```

**Componentes:**
- Selector de pestaña activa (Clase / Pureza / Nivel)
- Selector de transición (ej. Antigua → Legendaria)
- Botones grandes **ÉXITO** / **FALLO** para registro con un tap
- **Temporizador de jitter** automático: genera entre 3 y 7 segundos aleatorios
- **Contador de fallos consecutivos** con alerta visual al llegar a 2
- Estadísticas de sesión: tasa de éxito real vs. teórica (40%)
- Al llegar a 2 fallos: alerta roja + modal de pausa de 60 segundos automático

---

### 📊 PANTALLA 5 — Estadísticas y Cronograma

**Objetivo:** Visualizar el progreso de las 36 semanas con datos reales vs. objetivo.

```
╔════════════════════════════════════════╗
║  📊 Progreso 36 Semanas                ║
║────────────────────────────────────────║
║                                        ║
║  Cors/Semana (Real vs Objetivo)        ║
║                                        ║
║  S01 ██████████░  130 / 140 🟢        ║
║  S02 ████████████ 140 / 140 🟢        ║
║  S03 ████████░░░  112 / 140 🟡        ║
║  S04 ██████░░░░░   89 / 140 🟡        ║
║  ...                                   ║
║                                        ║
║  Tabla de hitos:                       ║
║  ✅ Sem 4  — Primeras Antiguas         ║
║  ✅ Sem 8  — Stock Legendarios         ║
║  🔄 Sem 10 — Primer Mítico Mate ←aquí ║
║  ⬜ Sem 16 — Fin ciclo Clase           ║
║  ⬜ Sem 36 — Excelente +6 🏆           ║
╚════════════════════════════════════════╝
```

**Componentes:**
- Gráfico de barras horizontal (Cors reales vs. objetivo por semana)
- Lista de hitos con estado (✅ / 🔄 / ⬜)
- Proyección: "A este ritmo terminas en la semana X"
- Exportar datos (JSON o CSV) para backup

---

### 📖 PANTALLA 6 — Biblioteca de Documentación

**Objetivo:** Acceder a todos los manuales `.md` desde dentro de la app, renderizados como HTML limpio.

```
╔════════════════════════════════════════╗
║  📖 Biblioteca — Documentación Naay   ║
║────────────────────────────────────────║
║                                        ║
║  📌 MANUALES PRINCIPALES               ║
║  ─────────────────────────────────────║
║  [📋 Manual Maestro — Sura 95]        ║
║      El manual completo de operación  ║
║                                        ║
║  [⚗️  Plan Alquimia Mítica F2P]        ║
║      Matemáticas y probabilidad       ║
║                                        ║
║  [📅 Plan de Trabajo Diario]          ║
║      SOP granjeros + Naay             ║
║                                        ║
║  [⚔️  Mejora de Pegada — Sura 95]     ║
║      INT-Switching y Bosque Enc.      ║
║                                        ║
║  📌 REFERENCIA                         ║
║  ─────────────────────────────────────║
║  [👤 Plan Naay Sura 95]               ║
║  [🤝 Plan Pareja Naay+Guerrero]       ║
║  [📊 Tracker Semanal 36 Semanas]      ║
║                                        ║
╚════════════════════════════════════════╝
```

**Vista de lectura (al abrir un doc):**
```
╔════════════════════════════════════════╗
║  ← Volver    Manual Maestro Sura 95   ║
║────────────────────────────────────────║
║                                        ║
║  # Manual Operativo Maestro            ║
║                                        ║
║  ## 1. Fundamentos Conceptuales        ║
║  En el motor de Metin2 el sistema...   ║
║                                        ║
║  [Buscar en documento 🔍]             ║
║  [Ir a sección ▼]                     ║
╚════════════════════════════════════════╝
```

**Componentes:**
- Lista categorizada de documentos (Manuales / Referencia)
- Renderizado Markdown → HTML con **marked.js** (CDN, sin servidor)
- Buscador de texto dentro del documento activo
- Índice de secciones (saltar a `##` directamente)
- Los `.md` se empaquetan como strings dentro del Service Worker → disponibles **100% offline**

**Documentos incluidos (solo Sura — excluye Guerrero):**

| Archivo | Incluir | Motivo |
|---|---|---|
| `manual_maestro_naay_sura95.md` | ✅ | Manual principal |
| `plan_alquimia_mitica_f2p.md` | ✅ | Base matemática |
| `plan_trabajo_naay_diario.md` | ✅ | SOP diario |
| `mejora_pegada_naay_sura95.md` | ✅ | Combate y DPS |
| `plan_naay_sura95.md` | ✅ | Resumen ejecutivo |
| `tracker_semanal_alquimia_naay.md` | ✅ | Referencia de hitos |
| `plan_pareja_naay_guerrero.md` | ⚠️ Opcional | Tiene info de ambos |
| `guia_guerrero_19_pve.md` | ❌ | Solo Guerrero |
| `hoja_de_ruta_maestra_techo.md` | ❌ | Solo Guerrero |

---

### ✅ PANTALLA 7 — Checklist Dominical

**Objetivo:** La revisión de 5 minutos del domingo automatizada.

```
╔════════════════════════════════════════╗
║  ✅ Checklist Domingo — Sem. 14        ║
║────────────────────────────────────────║
║                                        ║
║  [✅] +100 Cors producidos esta semana ║
║       → Real: 124 Cors  🟢            ║
║                                        ║
║  [⬜] Guantes de Ladrón en almacén    ║
║       → ¿Cuántos tienes? [ 3 ]        ║
║                                        ║
║  [⬜] Revisión anti-venta accidental  ║
║       → ¿Algún rubí vendido por error? ║
║         [No] / [Sí - recuperar]        ║
║                                        ║
║  [⬜] EXP de Naay < 90%              ║
║       → ¿Nivel sigue en 95? [Sí/No]  ║
║                                        ║
║  ─────────────────────────────────────  ║
║  🎉 Semana completada. ¡Buen trabajo!  ║
║  [Cerrar semana y abrir Semana 15]    ║
╚════════════════════════════════════════╝
```

---

### 📅 PANTALLA 8 — Radar y Calendario de Eventos Multi-Servidor (Gameforge)

**Objetivo:** Visualizar en tiempo real qué eventos están activos, qué drops otorgan y registrar ganancias extra de Cors sin romper la base matemática del plan.

> [!TIP]
> **Compatibilidad Universal con Todos los Servidores de Gameforge:**  
> La base de datos JSON de 1.500+ registros ya contiene los eventos de **todos los servidores oficiales**. La app incluye un selector de servidor que filtra automáticamente según las reglas de grupos de Gameforge:
> `[ Servidor Activo: Ruby ▼ ]` *(Opciones: Ruby, Iberia, Europe, Sapphire, Onyx, Teutonia, Germania, TigerGhost, Nyx, Italia)*.

```
╔══════════════════════════════════════════════════════════════════╗
║  📅 Radar de Eventos       [ Servidor: Ruby ▼ ] [ Mes: Noviembre▼]║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  🔴 AHORA MISMO ACTIVO (Servidor Ruby):                          ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ 💎 Alubia Verde del Dragón                                 │  ║
║  │ ⏰ 12:00 a 16:00 (Quedan: 45 min)                           │  ║
║  │ 📍 Drop: Metines y Jefes  •  Aplica a: Grupo Onyx/Ruby     │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  ⏰ PRÓXIMOS HOY:                                                ║
║  • 16:00 - 20:00: Pergamino Bendición (Metins y Jefes)           ║
║  • 20:00 - 23:59: Nugget Verde (Metins y Jefes)                  ║
║                                                                  ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  🗓️ VISTA SEMANAL FIJA (Filtrada para el servidor elegido):      ║
║  [Lun] Alubia Verde (12-16)                                      ║
║  [Mar] ⭐ Cor Draconis (12-16)                                   ║
║  [Mié] Rompecabezas Pez (0-12)                                   ║
║  [Jue] Bendición Pequeña (16-20)                                 ║
║  [Vie] Caja Luz Luna (20-24)                                     ║
║                                                                  ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  [➕ Registrar Cors Extra de Evento]   [⚙️ Cambiar Servidor / Fuente]║
╚══════════════════════════════════════════════════════════════════╝
```

**Mapeo Oficial de Grupos de Servidores (Motor de Filtrado):**
* **Ruby & Sapphire:** Pertenecen al grupo `Onyx` + eventos `global`.
* **Iberia:** Pertenece al grupo `Iberia`, `especial` + `global`.
* **Europe:** Pertenece al grupo `Europe`, `Iberia` + `global`.
* **TigerGhost:** Pertenece al grupo `Azrael`, `especial` + `global`.
* **Nyx:** Eventos dedicados `Nyx` + `global`.

Si la app se comparte con alguien que juegue en *Iberia* o *Europe*, la app cambia el calendario completo con solo hacer clic en el desplegable.

**Componentes y Arquitectura de Eventos:**
1. **Radar en Tiempo Real:** Reloj interno que calcula contra la hora del dispositivo si hay un evento corriendo en ese instante con barra de cuenta regresiva.
2. **Calendario Fijo Offline (Capa 1):** El esquema semanal de Ruby está compilado dentro de la app (no requiere internet ni fuentes externas).
3. **Consumo Dinámico Opcional (Capa 2):** Lee el JSON estructurado de la hoja para incorporar eventos especiales del mes si hay conexión.
4. **Editor Manual Local (Capa 3):** Botón `[+ Añadir Evento]` para ingresar eventos relámpago anunciados por Gameforge en Discord.
5. **Registro de Cors Extra:** Los Cors obtenidos durante eventos de drop (ej. Martes) se contabilizan en una casilla separada `corsExtra`. Suman al progreso general hacia los 5.040 Cors, acortando el plazo, pero **sin alterar** la meta base de 20 Cors/día de los granjeros.

---

### 🛡️ PANTALLA 9 — Maestría y Crecimiento F2P del Personaje (Multi-Clase)
#### (Mejoras permanentes que NO cuestan Won: Biólogo, Habilidades a P y Maestría)

**Objetivo:** Guiar el desarrollo del poder bruto del personaje principal mediante sistemas nativos del juego que no dependen de la economía ni del mercado, usando los **iconos oficiales de Metin2**.

> [!TIP]
> **Arquitectura Dinámica Multi-Clase:**  
> La app NO está amarrada al Sura. En la cabecera puedes seleccionar cualquier clase y doctrina. Al cambiar de clase, los iconos, nombres de habilidades a Perfect Master (P) y recomendaciones del Biólogo se adaptan al instante.

```
╔══════════════════════════════════════════════════════════════════╗
║  🛡️ Crecimiento F2P    [ Clase: Sura ▼ ] [ Doctrina: Espejo ▼ ]  ║
║                        [ Personaje: Naay ] [ Nivel: 95 ]         ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  🧬 MISIONES DEL BIÓLOGO (Stats Permanentes)                     ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ Misión Activa: Lv 90 - Noticias de los Líderes (32 / 50)   │  ║
║  │ [========================░░░░░░░░░░░░]  64%                 │  ║
║  │ ⏱️ Próxima entrega disponible en: 03h 45m                   │  ║
║  │ [ Entregar Noticia Hoy ✓ ]                                 │  ║
║  │                                                            │  ║
║  │ Recompensa al completar: +10% Daño contra Monstruos / Jefes│  ║
║  │                                                            │  ║
║  │ HISTORIAL DE MEJORAS YA ADQUIRIDAS:                        │  ║
║  │ • Lv 30 Dientes de Orco:  ✅ +10% Velocidad de Movimiento  │  ║
║  │ • Lv 40 Libros Maldición: ✅ +5% Velocidad de Ataque       │  ║
║  │ • Lv 50 Recuerdos Demonio:✅ +60 Defensa Física            │  ║
║  │ • Lv 60 Bolas de Hielo:   ✅ +50 Valor de Ataque Puro      │  ║
║  │ • Lv 70 Ramas de Zelkova: ✅ +10% Resistencia al Daño      │  ║
║  │ • Lv 80 Tablillas Tugyi:  ✅ +10% Valor de Ataque          │  ║
║  │ • Lv 85 Ramas Bosque Rojo:✅ +10% Resistencia Mágica       │  ║
║  │                                                            │  ║
║  │ 🔒 PRÓXIMAS JOYAS (Elección de Ataque Recomendada):        │  ║
║  │ • Lv 92 Joyas de Envidia: ⏳ Meta: +50 Valor de Ataque     │  ║
║  │ • Lv 94 Joyas del Valor:  ⏳ Meta: +60 Valor de Ataque     │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  🔮 HABILIDADES A PERFECT MASTER (P) (Adaptadas a la Doctrina)   ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ (Si eliges Sura Espejo):                                   │  ║
║  │ 🔮 HOJA ENCANTADA (Prioridad 1 - Robo de Vida & DPS)       │  ║
║  │    Rango: G4 ──> Progreso: [■■■■░░░░░░] 4/10 Piedras Alma │  ║
║  │    [ Piedra Alma Leída Hoy ✓ ]  (Karma: Caballeroso 🟢)    │  ║
║  │                                                            │  ║
║  │ 🛡️ MIEDO (Prioridad 2 - Inmunidad y Reducción de Daño)     │  ║
║  │    Rango: M8 ──> Progreso: [■■■■■■■■░░] 8/10 Libros a M9   │  ║
║  │    [ Libro Leído Hoy ✓ ]                                   │  ║
║  │                                                            │  ║
║  │ (Si cambias a Guerrero Corporal):                          │  ║
║  │ ⚔️ AURA DE ESPADA ──> [■■■■■░░░░░] M5 (Libros a G1)        │  ║
║  │ 🌀 BERSERK        ──> [■■■■■■■■░░] M8 (Libros a G1)        │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  🐎 MAESTRÍAS Y PASIVAS F2P                                      ║
║  • Caballo Militar (Lv 21):   ✅ DESBLOQUEADO (Pegada a caballo)║
║  • Liderazgo (Libros Sun-Zi): 🔄 Rango M4 (Daño de grupo)     │  ║
║  • Polimorfismo (Orbes):      🔄 Rango G1 (Daño en Jefe)      │  ║
║  • Idiomas (Shinsoo/Chunjo):  ✅ Completados al 100%          │  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Lógica y Beneficio Estratégico:**
1. **Sinergia con el Daño en Bosque Encantado:**
   * Un Sura con **Hoja Encantada en P** y **Biólogo 92/94 (+110 Valor de Ataque puro permanente)** destruye los Metins de Bosque en la mitad de tiempo, incluso con equipo F2P modesto.
2. **Temporizador de Cooldown:**
   * Reloj inteligente para entrega del Biólogo (cada 24 horas o tiempo correspondiente según investigación).
   * Reloj inteligente de lectura de libros de habilidad (evita desperdiciar horas).
3. **Control de Karma para Piedras Alma:**
   * Para subir de G1 a P se utilizan Piedras Alma que consumen puntos de Karma. La app monitorea si el personaje está en rango seguro (Caballeroso) o si debe farmear monstruos para recuperar puntos antes de la siguiente piedra.

---

### 🔔 PANTALLA 10 — Sistema de Notificaciones Inteligentes y Disciplina
#### (Alertas Locales en PC / Móvil — 100% Ultra-Privadas, Sin Servidor Externo)

**Filosofía:** En Metin2 la consistencia diaria es el 90% del éxito. Si un día se olvida fragmentar, la semana se descuadra. La PWA utiliza la **Web Notifications API** local del navegador para avisar en momentos críticos **sin enviar ningún dato a internet**.

```
╔══════════════════════════════════════════════════════════════════╗
║  🔔 Centro de Alertas y Notificaciones Locales                   ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  ⚙️ CONFIGURACIÓN DE DISCIPLINA Y RECORDATORIOS:                 ║
║                                                                  ║
║  1. ALERTA DE FRAGMENTACIÓN INCOMPLETA (Diaria)         [ ACTIVADO ]║
║     Hora límite configurable: [ 21:00 hs ]                       ║
║     • Si a esa hora los 4 granjeros no tienen 20 Cors:           ║
║       📲 "¡Atención! Aún faltan 2 personajes por fragmentar      ║
║           hoy (10/20 Cors). Quedan ~20 min para cerrar el día."  ║
║                                                                  ║
║  2. ALERTA DE RIESGO DE SEMÁFORO (Fin de semana)        [ ACTIVADO ]║
║     Día de disparo: Viernes a las 18:00 hs                       ║
║     • Si la cuenta va por debajo de 70 Cors:                     ║
║       ⚠️ "¡Semáforo en riesgo! Llevas 50 Cors esta semana.        ║
║           Necesitas 50 Cors este finde para alcanzar luz verde." ║
║                                                                  ║
║  3. ALERTA DE RADAR DE EVENTOS CLAVE DE RUBY             [ ACTIVADO ]║
║     Anticipación: [ 15 minutos antes ]                           ║
║     • Martes a las 11:45 hs:                                     ║
║       💎 "¡En 15 min inicia Drop de Cor Draconis (12-16h)!"       ║
║     • Lunes a las 11:45 hs:                                      ║
║       🍃 "¡En 15 min inicia Drop de Alubias Verdes (12-16h)!"    ║
║                                                                  ║
║  4. ALERTA DE COOLDOWN: BIÓLOGO Y LIBROS                 [ ACTIVADO ]║
║     • Apenas se cumpla el tiempo de espera:                      ║
║       🧬 "¡El Biólogo está listo para recibir tu Noticia!"       ║
║       🔮 "¡Ya puedes leer tu Libro de Hoja Encantada!"           ║
║                                                                  ║
║  [ 🔔 Probar Notificación en este Dispositivo ]                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Mecanismo Técnico de Privacidad Absoluta:**
* **Sin Firebase ni servidores push:** Las alertas se programan directamente en el hilo local del navegador (`ServiceWorkerRegistration.showNotification()` o `Notification` en ventana activa).
* **Funciona en segundo plano:** Si la app está instalada en el escritorio (Chrome/Edge en Windows) o agregada a la pantalla de inicio en el móvil (Android/iOS), las notificaciones aparecen en el centro de actividades del sistema operativo.
* **Cero spam:** Solo salta si hay una tarea pendiente o un evento de alto impacto confirmado.

---

### 💰 PANTALLA 11 — Finanzas F2P y Mercado de Alquimia Secundaria

**Objetivo:** Control estricto de la monetización de la fábrica de Cors. Las piedras de **Rubí se reservan 100% para Naay**, mientras que las **5 piedras secundarias (Diamante, Jade, Zafiro, Granate, Ónice)** se venden en mercado para financiar el equipo de INT y Viento.

```
╔══════════════════════════════════════════════════════════════════╗
║  💰 Mercado de Alquimia Secundaria    Saldo: 24 Wons | 450kk Yang ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  🎯 META DE EQUIPO ACTIVA:                                       ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ 📿 Pendientes de Cielo +9 (+30 a +40 INT para Pre-Casteo)  │  ║
║  │ Costo de mercado estimado: 35 Wons                         │  ║
║  │ [============================░░░░░░░░░░░░] 24 / 35 Wons    │  ║
║  │ 🟢 Faltan: 11 Wons (68% completado)                        │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  💎 LIBRETA DE COTIZACIÓN DE PIEDRAS ANTIGUAS (Historial):       ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ PIEDRA            STOCK VENTA   ÚLTIMO PRECIO     WONS TOTAL   │  ║
║  │ ─────────────────────────────────────────────────────────  │  ║
║  │ 💎 Diamante Antiguo   [ 2 ]     4.5 Wons (Hace 3d)   +9.0 Wons │  ║
║  │ 💎 Jade Antiguo       [ 1 ]     3.8 Wons (Hace 5d)   +3.8 Wons │  ║
║  │ 💎 Zafiro Antiguo     [ 3 ]     2.5 Wons (Hace 1sem) +7.5 Wons │  ║
║  │ 💎 Granate Antiguo    [ 1 ]     2.0 Wons (Hace 1sem) +2.0 Wons │  ║
║  │ 💎 Ónice Antiguo      [ 2 ]     3.2 Wons (Ayer)      +6.4 Wons │  ║
║  │                                                            │  ║
║  │ 💰 Total Wons generados por Alquimia Secundaria: 28.7 Wons │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  [ ➕ VENDER ALQUIMIA HOY ] (Resta 1 al stock y suma Wons)       ║
╚══════════════════════════════════════════════════════════════════╝
```

**Flujo Especializado para Alquimia (Sin Basura de Inventario):**
1. Tu esposa o tú abren los Cors diarios.
2. Al fusionar en el Alquimista, salen piedras **Antiguas secundarias** (Diamante, Jade, etc.).
3. Tocas `[ ➕ Vender Alquimia ]`:
   * Seleccionas cuál vendiste (ej. *Jade Antiguo*).
   * Te muestra el último precio guardado (**3.8 Wons**).
   * Si el mercado subió o bajó, ajustas el precio en 1 segundo.
4. Al confirmar:
   * **Resta 1** al stock de piedras para venta.
   * **Actualiza la cotización** del servidor en la libreta.
   * **Suma los Wons directamente** a la barra de la meta del equipo de Naay.

---

### 🧮 PANTALLA 12 — Calculadora de Luz Verde de Fusión (Simulador Anti-Quiebra)

**Objetivo:** Evitar la impulsividad en el Alquimista respondiendo a la pregunta: *¿Tengo stock suficiente para intentar subir o el riesgo de perderlo todo es demasiado alto?*

```
╔══════════════════════════════════════════════════════════════════╗
║  🧮 Calculadora de Fusión DSS         [ Seleccionar: RUBÍ ▼ ]    ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  TRANSICIÓN A CONSULTAR:                                         ║
║  [ Pestaña: Clase ▼ ]  ──>  De: [ Antigua ▼ ] a [ Legendaria ▼ ]║
║                                                                  ║
║  TU STOCK ACTUAL REGISTRADO:  [ 4 ] Rubíes Antiguos              ║
║                                                                  ║
║  📊 ANÁLISIS PROBABILÍSTICO (Algoritmo de Marsaglia / Binomial): ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ 🟢 LUZ VERDE OPERATIVA: 87.0% de probabilidad de éxito     │  ║
║  │                                                            │  ║
║  │ • Con 2 piedras: 64.0%  (⚠️ Riesgo de quiebra alto: 36%)   │  ║
║  │ • Con 3 piedras: 78.4%  (🟡 Riesgo moderado)               │  ║
║  │ • Con 4 piedras: 87.0%  (🟢 ZONA SEGURA RECOMENDADA)       │  ║
║  │ • Con 6 piedras: 95.3%  (💎 Certeza matemática)            │  ║
║  │                                                            │  ║
║  │ DICTAMEN DE LA APP:                                        │  ║
║  │ "Tienes stock suficiente. Si ejecutas con el protocolo de │  ║
║  │  Jitter (pausas de 3 a 7 segundos) y Stop-Loss a los      │  ║
║  │  2 fallos, la probabilidad de quiebra es de apenas 13%."   │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║                                                                  ║
║  [ 🧪 Iniciar Sesión de Alquimia Asistida con Jitter ]           ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 4. Modelo de Datos (localStorage / IndexedDB)

```json
{
  "semanaActual": 14,
  "fechaInicio": "2026-03-01",
  "cors": {
    "total": 1960,
    "totalExtraEventos": 85,
    "porSemana": [140, 140, 112, 89, 130, "..."]
  },
  "finanzas": {
    "saldoWons": 24,
    "saldoYangKK": 450,
    "metaActiva": {
      "nombre": "Pendientes de Cielo +9 (+30-40 INT)",
      "costoWons": 35
    },
    "alquimiaSecundaria": {
      "diamante": { "nombre": "Diamante Antiguo", "stock": 2, "ultimoPrecioWons": 4.5, "totalWons": 9.0 },
      "jade": { "nombre": "Jade Antiguo", "stock": 1, "ultimoPrecioWons": 3.8, "totalWons": 3.8 },
      "zafiro": { "nombre": "Zafiro Antiguo", "stock": 3, "ultimoPrecioWons": 2.5, "totalWons": 7.5 },
      "granate": { "nombre": "Granate Antiguo", "stock": 1, "ultimoPrecioWons": 2.0, "totalWons": 2.0 },
      "onice": { "nombre": "Ónice Antiguo", "stock": 2, "ultimoPrecioWons": 3.2, "totalWons": 6.4 }
    }
  },
  "consumibles": {
    "guantesLadron2h": 4,
    "alubiasVerdesAcumuladas": 28,
    "elixiresSol": 2,
    "pocionesMoradas": 150
  },
  "notificaciones": {
    "activaDisciplinaDiaria": true,
    "horaDisciplina": "21:00",
    "activaRiesgoSemaforo": true,
    "activaRadarEventos": true,
    "minutosAntesEvento": 15,
    "activaCooldownBiologo": true,
    "activaCooldownLibros": true
  },
  "eventos": {
    "fuenteUrl": "https://opensheet.elk.sh/18ODsqbcn1SolrmseW05kmu0Pnvf3tj-nPnuTYZ17X3s/Hoja%201",
    "eventosLocales": [
      { "nombre": "Cajas Luz Luna", "fecha": "2026-11-01", "horaInicio": "20:00", "horaFin": "23:59", "descripcion": "Drop general" }
    ]
  },
  "personajeNaay": {
    "nivel": 95,
    "biologo": {
      "misionActual": "noticias_lideres_90",
      "entregadas": 32,
      "totalRequeridas": 50,
      "ultimoTimestamp": "2026-10-30T10:15:00",
      "eleccionJoyas92": "ataque_50",
      "eleccionJoyas94": "ataque_60"
    },
    "habilidades": {
      "hojaEncantada": { "rango": "G4", "piedrasExitosas": 4, "ultimaLectura": "2026-10-30T12:00:00" },
      "miedo": { "rango": "M8", "librosExitosos": 8, "ultimaLectura": "2026-10-29T20:00:00" },
      "armaduraEncantada": { "rango": "M6", "librosExitosos": 6, "ultimaLectura": "2026-10-29T20:00:00" },
      "remolinoDragon": { "rango": "M3", "librosExitosos": 3, "ultimaLectura": null }
    },
    "pasivas": {
      "caballoMilitar": 21,
      "liderazgo": "M4",
      "polimorfismo": "G1",
      "karma": 20000
    }
  },
  "inventario": {
    "rubi": {
      "clase": { "bruta":0, "cortada":0, "rara":2, "antigua":12, "legendaria":9, "mitica":4 },
      "pureza": { "mate":4, "clara":0, "limpida":0, "brillante":0, "excelente":0 },
      "nivel": 0
    },
    "otrasColor": {}
  },
  "granjeros": [
    { "nombre": "Granjero1", "historial": { "2026-10-30": true, "2026-10-29": true } },
    { "nombre": "Granjero2", "historial": {} },
    { "nombre": "Granjero3", "historial": {} },
    { "nombre": "Granjero4", "historial": {} }
  ],
  "sesionesAlquimia": [
    { "fecha": "2026-10-30", "tipo": "clase", "transicion": "antigua-legendaria", "exitos": 2, "fallos": 1 }
  ],
  "hitos": {
    "semana4": false, "semana8": false, "semana10": true
  }
}
```

---

## 5. Stack Técnico Recomendado

| Capa | Opción Simple | Opción Pro |
|---|---|---|
| **UI** | HTML + CSS Variables + Vanilla JS | React + Tailwind CSS |
| **Estado** | localStorage | IndexedDB (idb-keyval) |
| **PWA/Offline** | Workbox (CDN) | Vite PWA Plugin |
| **Gráficas** | Chart.js (CDN) | Recharts (si React) |
| **Notificaciones** | Web Notifications API | — |
| **Deploy** | GitHub Pages (gratis) | Netlify / Vercel |
| **Instalación** | Manifest.json + Service Worker | Mismo |

> [!TIP]
> Si quieres la versión más rápida de construir: **HTML + Tailwind CDN + Alpine.js + Chart.js**. Sin bundlers, sin npm, un solo archivo `index.html`. Abre en cualquier navegador y se puede instalar como PWA.

---

## 6. Fases de Construcción

```
FASE 1 (1-2 días) — MVP
  └── Dashboard con semáforo
  └── Registro de Cors por granjero
  └── Persistencia en localStorage
  └── Instalable como PWA

FASE 2 (2-3 días) — Core
  └── Inventario de piedras
  └── Cronograma 36 semanas hardcodeado
  └── Comparación real vs. objetivo
  └── Checklist dominical

FASE 3 (2-3 días) — Asistente
  └── Sesión de alquimia con temporizador jitter
  └── Stop-loss automático (2 fallos)
  └── Estadísticas y gráficas

FASE 4 (1-2 días) — Biblioteca
  └── Lector de markdown integrado (marked.js)
  └── 6 documentos .md empaquetados en la app
  └── Buscador por sección
  └── Disponible 100% offline vía Service Worker

FASE 5 (opcional) — Extras
  └── Exportar / Importar JSON (backup)
  └── Modo oscuro
  └── Notificaciones push recordatorio diario
```

---

## 7. Paleta Visual Sugerida

| Token | Color | Uso |
|---|---|---|
| `--bg-dark` | `#0f0f1a` | Fondo principal (temática oscura Metin2) |
| `--bg-card` | `#1a1a2e` | Tarjetas / paneles |
| `--accent-gold` | `#d4a017` | Títulos, énfasis, oro del juego |
| `--accent-ruby` | `#c0392b` | Rubí — color principal del objeto meta |
| `--green` | `#27ae60` | Semáforo verde / éxito |
| `--yellow` | `#f39c12` | Semáforo amarillo / advertencia |
| `--red` | `#e74c3c` | Semáforo rojo / stop-loss |
| `--text-primary` | `#ecf0f1` | Texto principal |
| `--text-muted` | `#7f8c8d` | Texto secundario |

---

> [!NOTE]
> Toda la lógica de negocio (tabla de 36 semanas, umbrales del semáforo, protocolo jitter 3-7s, stop-loss 2 fallos) ya está documentada en el manual. La app es simplemente la interfaz interactiva de ese mismo manual.

