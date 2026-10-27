# UFO RUN · revisión e implementación para CrazyGames v2.0.0

Fecha: 27 de octubre de 2026. Alcance: únicamente la edición independiente `ufo-crazygames/`, herramientas, pruebas y entregables de CrazyGames. El rechazo recibido es genérico: **no conocemos su causa específica**. Los problemas siguientes fueron observados en el proyecto; relacionarlos con la decisión editorial sigue siendo una hipótesis.

## 1. Problemas detectados

| Observación comprobada | Efecto para el jugador |
| --- | --- |
| Tras cargar se reproducía una introducción obligatoria. En la prueba local el menú tardó 8,521 s en 907×510 y 7,556 s en 800×450. | Retrasa el primer contacto con la mecánica. |
| Pulsar Play dejaba `flightStarted: false`; 1,1 s después aún no había obstáculos ni movimiento. | Hace falta una segunda acción sin que la primera haya empezado realmente la partida. |
| Cinco acciones de menú de peso similar y textos pequeños, varios de 9–11 px con fuente pixelada. | La acción principal y los objetivos resultan menos claros en un iframe pequeño. |
| Separación móvil multiplicada por 1,65, dificultad con saltos periódicos de velocidad y huecos aleatorios independientes. | Esperas innecesarias en móvil y cambios de ritmo/altura difíciles de anticipar. |
| Se reajustaba la Y de los planetas durante su recorrido para evitar columnas. | Las recompensas podían parecer que cambiaban de trayectoria de forma brusca. |
| Escudo calculado como dos duraciones del audio, reproduciendo el sonido otra vez a mitad. | Duración menos fácil de interpretar. |
| Planetas originales de gran resolución para dibujarlos a 80 px; música de 9,28 MB; conjunto estático de 16,43 MB. | Decodificación y transferencia innecesarias para esta presentación. |
| Botón propio de pantalla completa y Escape usado como control. | El botón contradice el requisito actual del portal; Escape también lo usa el navegador. |
| Poca explicación inmediata del siguiente objetivo y de la causa de derrota. | El jugador recibe menos ayuda para mejorar su siguiente intento. |

La integración de anuncios ya completaba las recompensas mediante callbacks correctamente. Se conservó ese contrato. Las otras versiones no se utilizaron como destino de estos cambios.

## 2. Cambios implementados

- Carga → menú → **Play inicia la partida con una sola acción**. La presentación y los créditos originales siguen disponibles en Flight guide → Studio & credits, con el orden Luis Zabala / Agustín Bustamante.
- Tutorial breve dentro de la partida, descartable con Got it. Primer vuelo con 1,4 s de margen para leer; el primer impulso manual cancela esa ayuda. Se recuerda cuando se descarta o se superan dos puertas.
- Tres primeras aberturas amplias y previsibles. A continuación se alternan tramos de cinco puertas de ascenso, descenso, zigzag o nivel; la altura cambia dentro de límites alcanzables, sin patrones consecutivos idénticos.
- Curvas de dificultad graduales y acotadas, comunes a ratón y táctil. Cada puerta ajusta un poco el ritmo; se limita tanto la velocidad máxima como la frecuencia mínima.
- Planetas y estrellas unidos al hueco de una puerta todavía fuera de pantalla: entran por la derecha, viajan horizontalmente con ella y conservan su Y. Continúa la cola que evita superponer varios especiales.
- Bolsa aleatoria con los nueve planetas antes de repetir. Primera estrella a partir de cinco puertas, siguientes cada doce; planetas cada tres. Los asteroides siguen exclusivos de Hard, alternan sus dos imágenes y mantienen su velocidad doble y aviso de entrada.
- Objetivos 5/10/25/50 puntos y posterior jefe; celebración de récord una vez por partida; resumen de puertas, planetas y tiempo, más consejo según la colisión.
- Impulso con partículas discretas, recompensas y destrucción con respuesta visual. El jefe avisa cada descarga y su aviso inicial ya no tiñe/parpadea toda la pantalla.
- Se preservan las seis naves, variantes destruidas, 22 logros, precios, monedas, récords por dificultad, clasificación local, tres fondos y jefe. También se conserva el perfil anterior y su clave de almacenamiento.

## 3. Cómo cambia la jugabilidad

La intención es empezar antes, encontrar un ritmo de impulsos y aprender a leer rutas, en vez de esperar a que aparezca el desafío. Easy ofrece más margen; Normal gana velocidad suavemente; Hard exige más precisión e incorpora los asteroides. No se añadieron disparos, controles adicionales obligatorios ni otro género.

| Modo | Velocidad inicial → máxima | Hueco normal → mínimo | Jefe existente |
| --- | --- | --- | --- |
| Easy | 2,8 → 4,1 | 252 → 224 | 50 puntos / 20 s |
| Normal | 3,3 → 5,3 | 224 → 196 | 75 puntos / 30 s |
| Hard | 3,9 → 6,4 | 210 → 180 | 100 puntos / 40 s |

Valores de mundo de 600 unidades de alto; movimiento horizontal adaptado al ancho. Las tres primeras aberturas son como mínimo 260. Se conservan las colisiones por píxeles visibles. El UFO es un poco mayor para leerse mejor, la caída tiene velocidad máxima y el impulso ignora la repetición automática del teclado. Cada toque sigue siendo un impulso: no hace falta mantener pulsado.

El jefe continúa sustituyendo los pinchos durante su batalla. Se mantienen sus tiempos y premios; después de vencerlo vuelve el recorrido. El escudo y su contador duran una reproducción real del sonido: aproximadamente 4,36 s con el archivo actual, con respaldo de 5 s si aún no hay metadatos.

Estos ajustes mejoran aspectos verificables del ritmo y la claridad. Aún hacen falta partidas con personas para medir diversión, dificultad percibida y retención; el piloto automático no sustituye esa evaluación.

## 4. Presentación, rendimiento e integración

**Interfaz:** conserva título pixelado, colores, espacio, naves y marca. Play destaca; Hangar queda en segundo lugar y los extras tienen menor peso. Textos descriptivos con una fuente de interfaz más legible, panel de récord claro y distribución que cabe en horizontal pequeño. El aviso de logro se aparta de los botones al perder. Se respeta reducción de movimiento.

**Audio y recursos:** reajuste de volúmenes; misma música, con nivel normalizado y MP3 más pequeño, sin cortar duración ni cambiar velocidad. Los planetas y asteroides se preparan fuera del navegador al tamaño que realmente se usa; logo y jefe se reducen conservando su aspecto. No se incorporaron imágenes, música o sonidos de terceros. Esto no constituye una auditoría de las licencias de los recursos originales.

**Renderizado:** máscaras alfa y sprites precalculados durante la carga, caché reutilizada, máximo 80 partículas y ocho mensajes visuales, canvas sin reinicializaciones innecesarias y menús estáticos sin repintar el mundo. Los nodos de audio de puntuación se desconectan al terminar. Física fija a 80 pasos/s conservada.

**Carga:** progreso por tareas completadas; el SDK se inicializa en paralelo y ya no bloquea recursos listos. Si termina tarde recibe los estados de carga/juego en orden. Fallos de imágenes o de scripts locales muestran un reintento, sin fingir 100 %.

**SDK v3:** estados de carga, vuelo, pausa y victoria; prioridad del silencio de plataforma; pausa y silencio al perder foco, reanudación explícita; giro a vertical pausa y muestra el aviso de orientación. Se retiraron el fullscreen propio y los controles Escape. Space y flechas evitan el desplazamiento del navegador, incluso repetidas, sin interferir con atajos Ctrl/Cmd/Alt.

**Anuncios:** paquete en Basic Launch con `monetizationEnabled: false`. No se añadieron anuncios reales. Los flujos futuros de Full Launch siguen preparados: 50 monedas, límite de diez al día, 120 s entre premios, continuación única y alternativa de 100 monedas, sin apilar intersticial y continuación en la misma ronda. Los límites y saldos siguen siendo locales, no un sistema antifraude de servidor.

## 5. Pruebas y evidencia

**81 pruebas Node aprobadas:** 59 existentes de la web/API original, 15 nuevas de CrazyGames y siete del puente SDK. Incluyen 6.000 puertas generadas, límites de dificultad, duración de escudo, recompensas únicas, progreso previo, máscaras transparentes, física a 30/60/120/144/165 Hz, pausa, límites de partículas y cierre/recompensas del jefe en los tres modos.

**24 escenarios de navegador aprobados en Chrome y otros 24 en Edge**, sobre la carpeta final de producción. Cada batería comprueba las 12 resoluciones siguientes y los flujos adicionales:

907×510, 1216×684, 1077×606, 821×462, 1366×768, 1920×1080, 1536×864, 1280×720, 800×450 táctil, 1080×607 táctil, 568×320 táctil y 480×320 táctil, con DPR 1.

Se ejercitaron menú, tienda, ayuda, logros, récords, tutorial, inicio, pausa, derrota, reinicio, créditos, orientación, foco, teclado, iframe de otro origen sin permiso de fullscreen, SDK bloqueado/lento, almacenamiento bloqueado, silencio de plataforma y fallos de recursos/scripts. En flujos normales no hubo errores JS, respuestas HTTP fallidas ni errores de consola. Los fallos de red de las pruebas negativas se provocaron deliberadamente.

El SDK **oficial** se descargó e inicializó en localhost. Las pruebas de anuncios, configuración de silencio y callbacks usaron dobles de prueba: éxito, fallo, timeout, solicitud duplicada, límite diario, cooldown, continuación pagada y recompensada y no apilar anuncios. No se ejecutaron anuncios comerciales ni se probó un lanzamiento Full real.

**Partidas con entradas normales:** piloto que pulsa Space o envía toques al canvas, sin modificar puntuación, posición, física ni protección. Avanzó 74,76 s / 50 puntos en Easy, 92,09 s / 75 puntos en Normal táctil y 105,10 s / 100 puntos en Hard. Entró al jefe en los tres modos; perdió contra él en Easy/Normal y al dejar de impulsar en Hard. Las victorias, animación final, premio único y `happytime` se comprobaron por escenarios controlados, no como victorias naturales del piloto. Estas partidas usan reloj virtual respetando los fotogramas y pasos de física.

En una ejecución corta sin instrumentar el juego, con reloj real, se observaron 106 fotogramas RAF en 1,808 s y p95 de 16,8 ms. La muestra de heap JS fue de 2,81 MB; **no incluye toda la memoria gráfica/audio ni demuestra rendimiento sostenido en teléfonos**. En las partidas largas la caché llegó a 16 sprites y se observaron hasta 36 partículas activas, por debajo de su límite.

| Medición local | Versión anterior | v2.0.0 |
| --- | ---: | ---: |
| Archivos estáticos | 45 | 46 |
| Tamaño sin comprimir | 16.425.117 bytes | 6.915.506 bytes |
| Menú disponible, 907×510 Chrome | 8.521 ms | 1.252 ms |
| Menú disponible, 800×450 Chrome | 7.556 ms | 740 ms |
| Segundo impulso necesario tras Play | Sí | No |

Reducción del conjunto estático: **57,9 %**. Los tiempos de menú son muestras en esta PC con servidor local y SDK simulado, no una promesa de carga en red móvil. La introducción dejó de formar parte del camino obligatorio.

Durante el desarrollo una prueba encontró Records recortado a 568×320: se corrigió y repitió la batería. La primera herramienta de ZIP de Windows generaba separadores incorrectos: se sustituyó por entradas explícitas con `/`; el ZIP final pasó verificación de rutas, tamaños y SHA-256 de los 46 archivos.

Evidencia reproducible:

- [Resultados Node](../publishing/crazygames/qa-v2/unit-results.tap).
- [Chrome sobre producción](../publishing/crazygames/qa-v2/chrome-production/browser-results.json) y [Edge sobre producción](../publishing/crazygames/qa-v2/edge-production/browser-results.json).
- [Partidas y muestra de rendimiento](../publishing/crazygames/qa-v2/playthrough-results.json).
- [Auditoría del paquete y otras ediciones](../publishing/crazygames/qa-v2/package-audit.json).
- [Menú anterior](../publishing/crazygames/qa-v2/before-menu-907x510.png), [menú nuevo](../publishing/crazygames/qa-v2/chrome-production/menu-907x510.png), [vuelo móvil](../publishing/crazygames/qa-v2/chrome-production/flight-800x450.png), [resultado móvil](../publishing/crazygames/qa-v2/chrome-production/result-800x450.png).

La comprobación por hashes no encontró cambios en la web original ni GameDistribution. La carpeta APK ya tenía trabajo sin guardar y siguió recibiendo modificaciones ajenas a esta revisión: se registraron diferencias respecto de la instantánea inicial, se preservaron y no se incluyen en el commit de CrazyGames.

## 6. Archivos generados y recuperación

- **Fuente editable:** `ufo-crazygames/`.
- **Producción estática:** `publishing/crazygames/v2.0.0/`.
- **ZIP para el portal:** `publishing/crazygames/ufo-run-crazygames-v2.0.0.zip`, 6.766.712 bytes.
- **Manifiesto por archivo:** `publishing/crazygames/manifest-v2.0.0.json`.
- **Instrucciones para reproducir pruebas/build:** [tools/crazygames/README.md](../tools/crazygames/README.md).

El ZIP contiene `index.html` en su raíz y únicamente `css/`, `js/`, `src/`. No contiene pruebas, documentación, herramientas, API, credenciales ni las demás ediciones. No hay dependencias nuevas en ejecución; solo se carga externamente el SDK oficial.

SHA-256 del ZIP: `226200e97a54b8f23bc180326d08afff5ed06cf80e541856e92fdab5e68eeb17`.

La edición anterior completa permanece recuperable en Git en `d0ecd74d3a385bbf61d558d7d96ef823120770a6`. Para extraerla sin tocar la carpeta de trabajo actual:

```powershell
git archive --format=zip --output=UFO-RUN-CrazyGames-anterior.zip d0ecd74d3a385bbf61d558d7d96ef823120770a6 ufo-crazygames
```

El archivo de recuperación lleva la carpeta exterior; es para recuperar la fuente, no el ZIP nuevo para el portal. Si Git solicita marcar este repositorio como seguro, emplear el ajuste `safe.directory` correspondiente a la ubicación local.

Para respetar tanto la instrucción de commit/push como la de no publicar automáticamente, la revisión se guarda en GitHub con la etiqueta `crazygames-v2.0.0-review`, sin avanzar `origin/main`, la rama conectada al despliegue de producción. No se crea una publicación en el portal ni un GitHub Release. El commit queda también en la rama local actual; un push posterior de esa rama incluirá esta revisión.

## 7. Evaluación final y pendientes reales

**Listo técnicamente para cargar y revisar en el portal**, manteniendo Basic Launch e interfaz en inglés horizontal. Se verificaron las rutas relativas, estructura, límites de tamaño/cantidad, una acción para jugar, estados SDK, presentación en los tamaños indicados y controles del navegador. No se ha enviado ni publicado en CrazyGames.

Antes de enviarlo, probar esa misma carpeta/ZIP en la previsualización de CrazyGames y en un Android y un iPhone reales. Quedan pendientes Safari/iOS, rendimiento/memoria sostenidos en equipos de gama baja, políticas reales de audio interrumpido en iOS, sonido escuchado por personas con altavoces/auriculares, anuncios Full comerciales y una prueba humana de dificultad/diversión. La simulación táctil de Chromium no equivale a probar Safari ni hardware móvil.

Los perfiles/rankings siguen siendo locales; no se implementaron Byz ID, Supabase ni ranking compartido. La sincronización automática del portal depende de su entorno y no se validó desde localhost. Confirmar derechos de distribución de los recursos originales antes de presentar: no se agregaron recursos de terceros en esta revisión, pero no se aportaron sus licencias.

La originalidad, atractivo y retención siguen bajo criterio editorial. Superar estas pruebas **no garantiza aprobación**, y no permite atribuir el rechazo previo a una causa concreta.

Documentación oficial consultada: [calidad y onboarding](https://docs.crazygames.com/requirements/quality/), [jugabilidad, tamaños, teclas y fullscreen](https://docs.crazygames.com/requirements/gameplay/), [requisitos técnicos](https://docs.crazygames.com/requirements/technical/), [FAQ](https://docs.crazygames.com/faq/). La documentación actual permite hasta 1.500 archivos y 250 MB totales, con descarga inicial máxima de 50 MB y 20 MB para móvil: este paquete completo queda por debajo del límite móvil.

## 8. Resumen para una nueva presentación

> UFO RUN has received a substantial gameplay and presentation update. Players can now start flying with one click, with optional in-game guidance and immediate retries. We rebalanced all three difficulty curves, introduced readable obstacle sequences, stabilized collectible placement and added clearer progress, collision feedback and boss attack cues. The updated interface is tested across desktop and landscape mobile viewport sizes. Asset optimization reduced the static build by 58%, while preserving the game's pixel-art identity, ships, achievements and boss encounters. We also verified CrazyGames SDK lifecycle events, platform mute, focus handling and Basic Launch ad restrictions in Chrome and Edge. The game remains a focused, one-button arcade flight challenge.
