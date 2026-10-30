# Manual Operativo Maestro: Proyecto "Naay" (Sura Espejo Nivel 95)
### Guía de Operaciones Diarias, Alquimia Industrial y Dominio de Alto Nivel

**Identificador de Cuenta:** Naay  
**Clase / Doctrina:** Sura Armas Mágicas (Espejo)  
**Nivel Operativo Fijado:** Nivel 95 (*Hard Cap* estricto de eficiencia de drop)  
**Meta Primaria:** Creación autónoma de **Rubí Mítico Excelente +6** y optimización máxima de DPS  
**Marco Temporal:** 36 a 40 Semanas (~8 a 9 Meses de Ejecución Sostenible)  

---

## 1. Fundamentos Conceptuales: Arquitectura del Sistema de Alquimia

En el motor de Metin2 (`dragon_soul_table.txt`), el sistema de Piedras Dragón (DSS) se estructura en **tres pestañas de refinamiento independientes** en el Alquimista:

```
[ PESTAÑA 1: CLASE (Grade) ]
Bruta ──> Cortada ──> Rara ──> Antigua ──> Legendaria ──> MÍTICA

[ PESTAÑA 2: GRADO DE PUREZA (Step) ]
Mate ──> Clara ──> Límpida ──> Brillante ──> EXCELENTE

[ PESTAÑA 3: POR NIVEL (+0 a +6) ]
Alubia Verde / Azul / Rosa del Dragón
```

---

### A. Refinamiento por Clase (Grade)
* **Requisito:** Se necesita otra piedra adicional del **mismo tipo (color), pureza y nivel**.
* **Mecánica:** A medida que aumenta la clase (Bruta $\rightarrow$ Cortada $\rightarrow$ Rara $\rightarrow$ Antigua $\rightarrow$ Legendaria $\rightarrow$ Mítica), van apareciendo **bonificaciones complementarias y adicionales** (que pueden variar entre 3 y 5 bonus).
* **Penalización por fallo:** Si el proceso falla, se destruye una piedra y **se recibe una única piedra de dragón de la misma clase**.
* **Ventana en el Alquimista:** Pestaña *"Clase"*.

---

### B. Refinamiento por Grado de Pureza (Step)
* **Los 5 Grados Oficiales:** **Mate $\rightarrow$ Clara $\rightarrow$ Límpida $\rightarrow$ Brillante $\rightarrow$ Excelente**.
* **Requisito:** Disponer de piedras de dragón de la **misma pureza, color y clase**.
* **Mecánica:** A medida que la pureza va aumentando, **el efecto de las bonificaciones que la piedra posee se incrementa**, pudiendo afectar ligeramente a otras bonificaciones adicionales.
* **Penalización por fallo:** Si el proceso falla, se destruye una piedra y **se recibe una única piedra de dragón con el mismo grado de pureza**.
* **Ventana en el Alquimista:** Pestaña *"Grado de Pureza"*.

---

### C. Refinamiento por Nivel (+0 a +6)
Para este tipo de refinamiento se utiliza la piedra ya terminada junto con un ítem consumible especial:
* **[Alubia Verde del Dragón](file:///d:/metin2/es-ES):** Se obtiene de piedras Metin en el juego o en la ItemShop (la opción estándar F2P).
* **[Alubia Azul del Dragón](file:///d:/metin2/es-ES):** Se obtiene de Huevo Mágico o ItemShop (mayor probabilidad de éxito).
* **[Alubia Rosa del Dragón](file:///d:/metin2/es-ES):** Se obtiene de eventos especiales (Tómbola / Evento Aniversario).
* **Mecánica:** Se coloca la Alubia y la piedra en la ventana *"Nivel"* y se pulsa "Refinar".
* **Penalización por fallo:** El refinamiento puede fallar; en caso de fallo, **el nivel de la piedra puede ser reducido o permanecer sin cambios** (la piedra nunca se destruye en esta pestaña). Se repite hasta alcanzar **+6**.

### A. La Regla del Pre-Casteo de Inteligencia (INT-Switching)
En el motor de combate de Metin2, el valor de ataque y la tasa de robo de vida que otorga **Hoja Encantada** se calculan **únicamente en el milisegundo en que se activa la habilidad**.
* **El Fenómeno:** Si activas *Hoja Encantada* con 90 de INT, otorga un bono base. Si la activas con **140 de INT**, el bono se incrementa en más de $+250$ puntos de ataque puro.
* **La Regla de Oro:** Aunque luego te cambies a un equipo enfocado en Fuerza o Vida, **el valor de ataque de la Hoja se queda congelado en su nivel máximo durante toda su duración**.

### B. El Umbral de Inmunidad Elemental en Bosque Encantado
En los mapas de nivel 95, el daño de los monstruos no se reduce acumulando solo defensa física convencional; se anula mediante la **Resistencia Elemental (Viento)**:
* A $0\%$ de Resistencia al Viento: Los grupos de monstruos te aplican impactos de $1.500$ a $2.500$ de daño por segundo.
* A **$\ge 75\%$ de Resistencia al Viento**: El motor reduce el daño recibido a cifras residuales ($50$ a $100$ puntos por impacto).
* **Sinergia:** Con *Hoja Encantada* activa absorbiendo vida continuamente y el daño enemigo reducido al mínimo, Naay se convierte en un personaje matemáticamente inmortal.

### C. La Ventana de Oro del Nivel 95
A nivel 95 exacto, el algoritmo de drop de Metin2 otorga la **máxima probabilidad de caída de objetos ($\sim 100\%$)** frente a las piedras Metin de nivel 95, 100 y 105. Subir a nivel 96 o superior no incrementa el daño de forma significativa y comienza a penalizar el drop en mapas de nivel 90.

---

## 2. Teoría Probabilística y Comportamiento del Servidor (RNG)

Para ejecutar las fusiones de alquimia con base científica y no caer en trampas algorítmicas, se deben aplicar los principios matemáticos que rigen el generador de números del servidor:

### A. La Trampa de los Hiperplanos de Marsaglia (Por qué nunca fusionar como máquina)
El servidor de Metin2 en C++ utiliza un generador de congruencia lineal clásico:
$$X_{n+1} = (a \cdot X_n + c) \pmod m$$
* **El Problema del Clic Rápido:** Los números pseudoaleatorios consecutivos no se distribuyen de forma perfectamente homogénea en el tiempo; tienden a agruparse en secuencias geométricas (hiperplanos).
* **El Riesgo Real:** Si la probabilidad de éxito requiere un valor bajo ($\le 40$) y el generador atraviesa una banda densa de valores altos ($> 40$), hacer clics rápidos y continuos (cada 200–500 ms) atrapa al jugador en un **bucle de fallos consecutivos en bloque**.

### B. El Protocolo de Jitter Temporal (Desincronización de Semilla)
* **La Regla de Oro:** Queda estrictamente prohibido fusionar en ráfaga rítmica o automática.
* **Procedimiento:** Entre cada intento de refinado en el Alquimista, se debe aplicar un **retraso aperiódico variable de 3 a 7 segundos**:
  * Intento 1 $\rightarrow$ Pausa de 3 segundos.
  * Intento 2 $\rightarrow$ Pausa de 6 segundos.
  * Intento 3 $\rightarrow$ Pausa de 4 segundos.
* **Mecánica Subyacente:** Como el servidor atiende simultáneamente a cientos de jugadores y entidades, esas pausas permiten que **otros procesos del servidor consuman números de la secuencia del generador**, rompiendo cualquier acumulación matemática desfavorable para Naay.

### C. La Regla de Parada Óptima ("Stop-Loss" de 2 Fallos Consecutivos)
* Si durante una sesión de subida de piedras se registran **2 fallos consecutivos**:
  1. **DETENERSE INMEDIATAMENTE.**
  2. Cerrar la ventana del Alquimista.
  3. Pausar la actividad durante **60 segundos** o cambiar de canal (CH).
* **Fundamento:** Esta pausa fuerza la rotación del estado estocástico del hilo del servidor antes de volver a exponer recursos valiosos.

### D. Distribución Binomial y Certeza Acumulada
La probabilidad de que **al menos 1 intento tenga éxito** en $n$ intentos con probabilidad base $p = 0.40$ sigue la ecuación:
$$P(\ge 1 \text{ éxito}) = 1 - (1 - p)^n = 1 - (0.60)^n$$

* **Con $n = 2$ piedras:** $P = 1 - (0.60)^2 = \mathbf{64\%}$ *(Alto riesgo de quiebra: 36% de pérdida total).*
* **Con $n = 3$ piedras:** $P = 1 - (0.60)^3 = \mathbf{78.4\%}$.
* **Con $n = 4$ piedras:** $P = 1 - (0.60)^4 = \mathbf{87\%}$ *(Umbral mínimo operativo recomendado).*
* **Con $n = 6$ piedras:** $P = 1 - (0.60)^6 = \mathbf{95.3\%}$ *(Casi certeza matemática absoluta).*

---

## 3. Marco Psicológico y Ritmo Sostenible (Anti-Burnout)

El mayor enemigo de un jugador F2P no son los fallos del alquimista, sino la fatiga mental (*burnout*). Para transformar este plan en una experiencia gratificante y libre de estrés:

### A. La Filosofía del "Hábito Atómico" (Micro-Sesiones)
* **No juegues maratones:** Las sesiones continuas de más de 2 horas provocan cansancio y errores operativos (vender objetos por accidente, fusionar piedras sin lote).
* **El poder de los 15 minutos:** Cada personaje granjero requiere únicamente **10 a 12 minutos de atención enfocada**. Considera cada granjero como un bloque independiente que puedes completar en pausas del día.

### B. Gestión de la Frustración en el Alquimista
* El juego tiene programada una tasa de éxito promedio del **$40\%$ al $50\%$**. Esto significa que **fallar la mitad de las veces es lo normal, no una mala racha**.
* Para proteger la motivación, el plan prohíbe terminantemente realizar intentos con recursos únicos. **Solo se fusiona cuando existe un colchón de reserva**. Si una fusión falla, el colchón mantiene el progreso intacto.

### C. La Auto-Recompensa por Hitos (Sin Quemar Recursos)
* **Regla Estricta de Alquimia:** En Metin2, **NUNCA se debe equipar una piedra en la rueda si el objetivo final es subirla de rango**, ya que para equiparla se vincula al personaje y retirarla requiere *Tenazas del Tiempo* (con riesgo de romperla), impidiendo usarla en fusiones posteriores.
* **El Enfoque Correcto:** La rueda de alquimia de Naay se mantiene **intacta y vacía** hasta que la pieza definitiva (**Rubí Mítico Excelente**) esté forjada y lista en el inventario.
* **La Verdadera Recompensa de los Hitos:**
  * **Mes 2:** Celebrar la consolidación de las primeras piedras clase **Antigua** y la venta de excedentes (Diamantes/Jades) para estrenar mejoras directas de equipo compradas en mercado (como el Talismán de Viento o piezas de INT).
  * **Mes 5 (Semana 20-22):** Celebrar el hito de tener los primeros **Rubíes Míticos Clara/Límpidos** en stock seguro y la apertura de la pestaña de Pureza.
  * **Mes 9 (Semana 36):** La recompensa suprema: inserción definitiva del **Rubí Mítico Excelente +6** en la rueda activa.

---

## 4. Plantillas de Horarios y Ritmos de Trabajo

El plan está diseñado para adaptarse al estilo de vida de tu esposa. No exige un horario rígido; se puede ejecutar bajo cualquiera de estas tres modalidades:

```
[ MODALIDAD A: Flujo Continuo ] ──> 1 sola sesión de 60 minutos (Tarde o Noche)
[ MODALIDAD B: Doble Turno ]    ──> 30 min por la mañana + 30 min por la tarde
[ MODALIDAD C: Jornada Flexible]──> 15 min en cualquier hueco libre del día
```

### Opción 1: Sesión de Flujo Continuo (60 Minutos - Bloque Vespertino)
Ideal para realizar después de las responsabilidades diarias:
* **19:00 - 19:40 (40 min):** Ciclo continuo de los 4 granjeros (10 min por personaje).
* **19:40 - 19:45 (5 min):** Pausa, estiramiento, beber agua. Naay recoge los 20 Cors en el almacén.
* **19:45 - 20:00 (15 min):** Naay entra a Bosque Encantado: apertura de Cors, destrucción de 3 Metins y recolección de Guantes de Ladrón. Sesión finalizada.

### Opción 2: Sesión Fraccionada (Mañana / Tarde)
Ideal si se dispone de poco tiempo seguido:
* **Turno Matutino (25 min):** Granjero 1 y Granjero 2 completan su cuota (10 Cors al almacén).
* **Turno Vespertino / Nocturno (35 min):** Granjero 3 y Granjero 4 completan su cuota. Naay procesa la alquimia y hace su incursión en Bosque.

---

## 5. Manual de Procedimientos Operativos (SOP Paso a Paso)

### MÓDULO 1: El Ciclo de Extracción (Granjeros 1 al 4)
* **Objetivo:** 50 Fragmentos de Piedra Dragón por personaje (5 Cor Draconis).
* **Preparación:**
  1. Conectar al granjero de turno.
  2. Abrir el Almacén General de la aldea y retirar el **Kit Universal de Farmeo Nivel 30**.
  3. Equipar el set y verificar que el inventario tenga espacio libre ($\ge 2$ páginas vacías).
* **Ruta de Extracción:**
  * **Destino prioritario:** Mazmorra de Monos Fácil (últimas dos salas).
  * **Destino secundario:** City 2 (zona de arqueros y generales salvajes).
* **Técnica de Combate:** Agrupar de 3 a 5 grupos de monstruos, activar habilidad de daño de área y limpiar. En Mazmorra de Monos, los 50 fragmentos se obtienen entre **8 y 12 minutos**.
* **Cierre de Ciclo:**
  1. Regresar a la aldea / teletransporte.
  2. Depositar el Kit de Farmeo en el Almacén General.
  3. Depositar los 5 Cor Draconis en el Almacén General.
  4. Desconectar y pasar al siguiente granjero.

---

### MÓDULO 2: La Operación de Naay (Nivel 95)
* **Objetivo:** Centralización de alquimia y suministro de Guantes de Ladrón.
* **Fase A (Alquimia):**
  1. Conectar a Naay.
  2. Retirar los **20 Cor Draconis** del Almacén General y transferirlos a su inventario DSS.
  3. Abrir los 20 contenedores.
* **Fase B (Incursión en Bosque Encantado):**
  1. **Secuencia de Pre-Casteo:**
     * Equipar accesorios de Inteligencia (Pendientes de Cielo +9, escudo de INT).
     * Pulsar tecla de **Hoja Encantada**.
     * Equipar de inmediato el set de combate (Resistencia a Viento y Espada Envenenada).
  2. **Localización de Metins:**
     * Recorrer la ruta principal de Bosque Encantado buscando Metins de nivel 100 (Metin de los Árboles) o nivel 105.
     * Con el pre-casteo y la resistencia a viento, destruir de 3 a 5 Metins.
  3. **Recolección y Cierre:**
     * Recoger los **Guantes de Ladrón de 2 horas**.
     * Depositar 1 Guante en el almacén de cuenta para los granjeros del día siguiente.
     * Donar la experiencia acumulada al Gremio si la barra supera el $50\%$ para mantener el nivel en 95 exacto.

---

## 6. Cronograma Maestro y Hoja de Ruta (Plan Realista de 8 a 9 Meses)

Al contemplar la cadena matemática completa de **6 Clases + 5 Grados de Pureza (Mate → Clara → Límpida → Brillante → Excelente) + Nivel (+0 a +6)** con las tasas de fallo oficiales, el volumen total requerido asciende a $\sim 4.500\text{ a } 5.000\text{ Cor Draconis}$ acumulados.

```
[ ETAPA 1: MESES 1 - 2 ] ──> [ ETAPA 2: MESES 3 - 4 ] ──> [ ETAPA 3: MESES 5 - 6 ] ──> [ ETAPA 4: MESES 7 - 8 ] ──> [ ETAPA 5: MES 9 ]
 Cimientos y Antiguas         Legendarias y Míticos        Límpidas y Brillantes        El Colchón de Seguridad      EXCELENTE +6
 1.200 Cors (Stock)           Primeros Míticos Mates       Fusión a Clara y Límpida     3-4 Brillantes Míticas       Remate con Alubias
```

---

### ETAPA 1: Cimientos y Generación de Antiguas (Meses 1 y 2 - Semanas 1 a 8)
* **Producción Acumulada:** $20\text{ Cors/día} \times 60\text{ días} = \mathbf{1.200\text{ Cor Draconis}}$.
* **Foco en el Alquimista:** Refinamiento masivo en pestaña **"Clase"**:
  * Bruta $\rightarrow$ Cortada $\rightarrow$ Rara $\rightarrow$ **Antigua**.
* **Finanzas:** Venta de piedras Antiguas secundarias (Diamantes, Jades, etc.) para acumular Wons y comprar el equipo de Viento/INT de Naay.
* **Hito al Día 60:** Stock de **10 a 14 Rubíes Antiguos** en el almacén.

---

### ETAPA 2: Salto a Legendaria y Mítica Mate (Meses 3 y 4 - Semanas 9 a 16)
* **Producción Acumulada:** Otros 1.200 Cors (Total: **2.400 Cor Draconis**).
* **Foco en el Alquimista:**
  * Refinar en pestaña **"Clase"**: Rubíes Antiguos $\rightarrow$ Legendarios $\rightarrow$ **Míticos Mates**.
* **[HITO] Equipamiento INT-Switching Operativo (antes de Semana 14):**
  Con los Wons acumulados de la venta de piedras Antiguas secundarias (Diamantes/Jades), adquirir en el mercado de jugadores:
  * **Pendientes de Cielo +9** con al menos 3 diamantes refinados (objetivo: +30 a +40 de INT).
  * **Escudo o arma secundaria** con bonus de +12 INT o superior.
  * Verificar la secuencia completa de pre-casteo en campo antes de la Semana 15.
* **Hito al Día 120:** Stock base de **8 a 12 Rubíes Míticos Mates** y set de INT-Switching completamente operativo.

---

### ETAPA 3: El Embudo de Pureza: Mate $\rightarrow$ Clara $\rightarrow$ Límpida (Meses 5 y 6 - Semanas 17 a 24)
* **Producción Acumulada:** Otros 1.200 Cors (Total: **3.600 Cor Draconis**).
* **Foco en el Alquimista:** Cambio a la pestaña **"Grado de Pureza"**:
  * Fusión de Rubíes Míticos: **Mate $\rightarrow$ Clara**.
  * Fusión de Rubíes Míticos: **Clara $\rightarrow$ Límpida**.
* **Hito al Día 180:** Stock de **4 a 6 Rubíes Míticos Límpidos** y primeros intentos a Brillante.

---

### ETAPA 4: Consolidación a Brillante y Colchón de Fusión (Meses 7 y 8 - Semanas 25 a 32)
* **Producción Acumulada:** Otros 1.200 Cors (Total: **4.800 Cor Draconis**).
* **Foco en el Alquimista:** Pestaña **"Grado de Pureza"**:
  * Fusión de Límpidos $\rightarrow$ **Brillantes**.
* **Protocolo Anti-Quiebra Estricto:** Prohibido tocar el botón de Excelente hasta tener **3 a 4 Rubíes Míticos Brillantes**.

---

### ETAPA 5: La Coronación: Mítico Excelente y Nivel +6 (Mes 9 - Semanas 33 a 36)
* **Objetivo:** Fabricación final y mejora.
* **Procedimiento:**
  1. Refinar en pestaña **"Grado de Pureza"**: Brillante $\rightarrow$ **EXCELENTE**.
  2. Refinar en pestaña **"Nivel"**: Aplicar *Alubias Verdes / Azules del Dragón* hasta alcanzar **+6** (la piedra nunca se rompe; si falla, se repite hasta subir).
  3. **Equipamiento:** Inserción en la rueda de Naay. El objetivo de máxima pegada queda completado al 100%.

---

## 7. Registro de Progreso y Cuadro de Mando Semanal (Audit Tracker - 36 Semanas)

La extracción de Cor Draconis es un proceso con tasa de fallo cero; el verdadero embudo radica en la conversión secuencial de **Clase** (6 niveles) y posteriormente de **Pureza** (5 grados: Mate $\rightarrow$ Clara $\rightarrow$ Límpida $\rightarrow$ Brillante $\rightarrow$ Excelente).

Para auditar el avance con rigor matemático, el usuario debe contrastar sus existencias reales cada domingo frente a las cifras objetivo del calendario sincronizado a **36 semanas (9 meses)**:

| Semana | Cors Totales Acumulados | Objetivo Rubí RARO (Stock) | Objetivo Rubí ANTIGUO (Stock) | Objetivo Rubí LEGENDARIO | Objetivo Rubí MÍTICO (Pureza Exacta) | Pestaña Activa en Alquimista | Estado / Hito Clave |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Semana 01** | 140 Cors | 3 - 4 | 0 | 0 | 0 | Clase | Instalación del hábito y primeros Brutos. |
| **Semana 02** | 280 Cors | 6 - 8 | 1 | 0 | 0 | Clase | Primer Rubí Antiguo forjado. |
| **Semana 04** | 560 Cors | 14 - 16 | **3 - 4** | 0 | 0 | Clase | **Cierre Mes 1:** Base de Antiguas lista. |
| **Semana 06** | 840 Cors | 20 - 24 | 6 - 7 | 1 | 0 | Clase | Primer Rubí Legendario forjado. |
| **Semana 08** | 1.120 Cors | — | **10 - 12** | **3 - 4** | 0 | Clase | **Cierre Mes 2:** Stock sólido de Legendarios. |
| **Semana 10** | 1.400 Cors | — | 14 - 16 | 5 - 6 | **1 (Mítico Mate)** | Clase | **Primer Rubí Mítico Mate.** |
| **Semana 12** | 1.680 Cors | — | 18 - 20 | 7 - 8 | 2 - 3 (Mítico Mate) | Clase | **Cierre Mes 3:** Acumulación Mítico Mate. |
| **Semana 14** | 1.960 Cors | — | 22+ | 9 - 10 | 4 - 5 (Mítico Mate) | Clase | Refuerzo de Míticos Mates. |
| **Semana 16** | 2.240 Cors | — | — | **12+** | **6 - 8 (Mítico Mate)** | Clase | **Cierre Mes 4:** Fin del ciclo de Clase. |
| **Semana 18** | 2.520 Cors | — | — | — | **3 - 4 (Mítico Clara)** | Pureza | Salto a Grado de Pureza: **Clara**. |
| **Semana 20** | 2.800 Cors | — | — | — | **6 - 8 (Mítico Clara)** | Pureza | **Cierre Mes 5:** Stock de Claras listo. |
| **Semana 22** | 3.080 Cors | — | — | — | **2 - 3 (Mítico Límpida)**| Pureza | Salto a Grado de Pureza: **Límpida**. |
| **Semana 24** | 3.360 Cors | — | — | — | **4 - 5 (Mítico Límpida)**| Pureza | **Cierre Mes 6:** Stock de Límpidas listo. |
| **Semana 26** | 3.640 Cors | — | — | — | **1 - 2 (Mítico Brillante)**| Pureza | Primer Rubí Mítico Brillante forjado. |
| **Semana 28** | 3.920 Cors | — | — | — | **2 - 3 (Mítico Brillante)**| Pureza | **Cierre Mes 7:** Consolidación Brillante. |
| **Semana 30** | 4.200 Cors | — | — | — | 3 (Mítico Brillante) | Pureza | Construcción de colchón anti-quiebra. |
| **Semana 32** | 4.480 Cors | — | — | — | **3 - 4 (Mítico Brillante)**| Pureza | **Cierre Mes 8: COLCHÓN LISTO (Luz Verde).** |
| **Semana 34** | 4.760 Cors | — | — | — | **1 EXCELENTE (+0)** | Pureza | **FUSIÓN A EXCELENTE CONFIRMADA.** |
| **Semana 36** | **5.040 Cors** | — | — | — | **1 EXCELENTE (+6)** | Nivel | **Cierre Mes 9: MEJORA +6 CON ALUBIAS.** |

---

## 8. Lista de Control de Calidad y Motivación Semanal

Para que tu esposa evalúe su progreso cada domingo por la tarde:

```
[ SEMAFORO DE CONTROL SEMANAL ]
🟢 Verde:   >= 100 Cors producidos en la semana      ──> Todo marcha según el plan.
🟡 Amarillo:  70 a 99 Cors producidos                 ──> Ajustar fin de semana sin agobios.
🔴 Rojo:    < 70 Cors producidos                    ──> Reducir tiempo y volver a 15 min/día.
```

### Checklist del Domingo (5 minutos):
- [ ] ¿Se han completado al menos 100 Cor Draconis en la semana?
- [ ] ¿Hay al menos 3 a 5 Guantes de Ladrón de reserva en el almacén?
- [ ] ¿Se ha revisado que ningún Rubí haya sido vendido por error?
- [ ] ¿La experiencia de Naay sigue por debajo del 90% para no subir de nivel?
- [ ] **Celebración:** Reconocer el esfuerzo de la semana y disfrutar de una sesión de juego libre.
