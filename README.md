# 💎 Mt2App — Metin2 DSS Companion & Roadmap Tracker (PWA)

**Mt2App** es una Progressive Web App (PWA) 100% offline-first diseñada para jugadores de Metin2. Proporciona una suite completa para la gestión de la **Alquimia de Piedras Dragón (DSS)**, control de **rutinas diarias de fragmenteros**, seguimiento de **objetivos del plan de 36 semanas**, calculadora probabilística anti-quiebra y radar en vivo de **eventos del servidor sincronizados con tu zona horaria local**.

---

## 🚀 Características Principales

### 1. 🎡 Rueda Interactiva de Alquimia DSS
* Control visual de los 6 slots de alquimia: **Rubí, Jade, Ónice, Diamante, Zafiro y Granate**.
* Gestión de claridad (**Mate, Claro, Límpido, Brillante, Excelente**) y nivel de mejora (**+0 a +6**).
* Control de inventario en tiempo real: Antiguas, Legendarias y Míticas.
* Proyección matemática de Cors teóricos acumulados y equivalencias.

### 2. 🧪 Asistente RNG: Jitter & Stop-Loss
* **Calculadora de Luz Verde inteligente:** Evalúa el riesgo real antes de cada intento de fusión según la etapa (Antigua, Legendaria, Claridad y Alubias Verdes), contemplando la curva decreciente de éxito oficial de Metin2.
* **Protocolo de Jitter:** Temporizador de desincronización aleatoria entre intentos para romper rachas negativas de RNG.
* **Stop-Loss Automático:** Pausa obligatoria de 60 segundos si se encadenan 2 fallos consecutivos.
* **Sincronización automática de stock:** Descuenta y suma piedras y alubias verdes directamente en tu inventario con cada éxito o fallo registrado.

### 3. 🎯 Control de Objetivos & Plan Maestro (36 Semanas)
* **14 Hitos Oficiales del Plan** organizados en sus 5 etapas estratégicas (Cimientos, Míticos Mates, Claridad Límpida, Colchón de Brillantes y Excelente +6).
* **Barra de Progreso del Plan Maestro:** Muestra el porcentaje de cumplimiento real de la ruta.
* **Filtros rápidos:** Hitos del Plan, Metas Personales del Usuario y Vista Integral.
* **Meta de Equipo Principal:** Seguimiento de piezas de equipo clave en Wons y Yang con barra de progreso.
* **Mercado de Venta de Alquimia:** Cotización y venta de piedras antiguas (incluyendo Rubí Antiguo y secundarias) para capitalizar y financiar objetivos de cuenta.

### 4. 👥 Control de Fragmenteros & Cronómetro
* Registro de 4 personajes diarios de Cors (20 Cors/día = 140 Cors/semana).
* Cronómetro anti-distracciones por personaje.
* Nombres personalizables para cada fragmentero desde la configuración.

### 5. 📅 Radar & Calendario de Eventos en Vivo
* Conversión automática y dinámica a la **hora local de tu dispositivo** (sirve para cualquier país y zona horaria del mundo).
* Filtro rápido **`💎 Solo Alquimia`** para destacar franjas de *Cor Draconis* y *Alubias Verdes*.
* Alertas de eventos activos y próximos para tu servidor configurado (*Ruby, Sapphire, Iberia, Europe, Teutonia, etc.*).

### 6. ⚙️ Respaldo y Limpieza 100% Offline
* Exportación e importación en formato JSON y código Base64 para migración entre dispositivos.
* Botón de **Limpieza Total (de fábrica)** para iniciar una cuenta en blanco desde cero.

---

## 📂 Estructura del Proyecto

```text
├── pwa/
│   ├── index.html       # Interfaz de usuario (PWA)
│   ├── app.js           # Lógica de estado, DSS, RNG, objetivos y eventos
│   ├── styles.css       # Estilos CSS oscuros y responsivos (Mobile-First)
│   ├── manifest.json    # Manifiesto de PWA instalable
│   └── sw.js            # Service Worker para funcionamiento offline
├── manual_maestro_naay_sura95.md    # Documentación estratégica del personaje
├── plan_alquimia_mitica_f2p.md      # Plan matemático y económico de alquimia
├── hoja_de_ruta_maestra_techo.md    # Hoja de ruta general
├── README.md                        # Documentación general del repositorio
└── .gitignore                       # Filtro de archivos
```

---

## 🛠️ Instalación y Uso

1. Abre `pwa/index.html` en cualquier navegador moderno (Chrome, Edge, Safari, Firefox).
2. Para instalarla como aplicación nativa en tu móvil o PC, pulsa en el menú del navegador: **"Instalar aplicación"** o **"Agregar a la pantalla de inicio"**.
3. Funciona de manera autónoma sin necesidad de conexión a internet para la gestión del inventario y del plan.

