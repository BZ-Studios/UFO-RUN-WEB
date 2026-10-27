# UFO RUN para CrazyGames

La carpeta `ufo-crazygames/` contiene una copia independiente, en inglés y horizontal. No modifica la versión original de Vercel ni `ufo-gamedistribution/`.

## Probar

Desde la raíz del repositorio inicia un servidor HTTP, por ejemplo `python -m http.server 4173`, y abre `http://localhost:4173/ufo-crazygames/`. No abras `index.html` mediante `file://`.

- La pantalla de carga utiliza `src/loading-cover.webp` y una barra basada en recursos completados, no en un temporizador. Un error mantiene el mensaje y permite recargar.
- En vertical aparece el aviso de girar el dispositivo. Una partida se pausa al girar y requiere pulsar Resume al volver a horizontal.
- No depende de la API de Vercel ni de Redis. Perfil, monedas, logros y clasificación son locales a esta copia y al navegador/origen; no comparte cuentas con Byz.
- Si el SDK no carga, el juego continúa sin anuncios. El modo local del SDK no implica aprobación o publicación en el portal.

## Subir al portal

1. Crea una cuenta en [CrazyGames Developer Portal](https://developer.crazygames.com/).
2. Crea un juego HTML5 y selecciona orientación **Landscape**. Marca únicamente las plataformas que hayas probado.
3. Comprime **el contenido** de `ufo-crazygames/`: `index.html`, `css/`, `js/` y `src/` deben quedar en la raíz del ZIP, no dentro de otra carpeta. No subas el repositorio completo ni esta documentación.
4. Completa la ficha, imágenes y datos solicitados en el portal y revisa la versión en su entorno de pruebas antes de enviarla a evaluación.
5. Comprueba carga, sonido, pausa, controles, móvil horizontal y avisos de orientación. La revisión y la monetización dependen de CrazyGames; preparar el código no garantiza aceptación.

La revisión v2.0.0 pesa aproximadamente 6,92 MB sin comprimir. Las rutas de recursos son relativas. No necesita un Game ID de GameDistribution. La compilación verificada y el ZIP listo están en `publishing/crazygames/v2.0.0/` y `publishing/crazygames/ufo-run-crazygames-v2.0.0.zip`.

El [informe de revisión v2](crazygames-v2-review.md) detalla los cambios de jugabilidad, resultados, recuperación y pruebas pendientes. Play ahora inicia el vuelo en una acción; las instrucciones son descartables dentro de la partida y la introducción se conserva en Flight guide → Studio & credits. Para regenerar el paquete y repetir las pruebas, consultar [tools/crazygames/README.md](../tools/crazygames/README.md).

## SDK y anuncios

Se carga el SDK oficial v3 desde `https://sdk.crazygames.com/crazygames-sdk-v3.js`. Se notifican carga, inicio y pausa de juego y victoria contra el jefe; el silencio de la plataforma tiene prioridad sobre el ajuste local.

`js/crazy-config.js` deja `monetizationEnabled: false` para **Basic Launch**, que no permite anuncios. No cambies este valor hasta que CrazyGames habilite Full Launch y hayas probado los flujos en el portal.

La integración futura está preparada para:

- 50 monedas por vídeo completado, máximo 10 al día y 120 segundos entre recompensas.
- Una continuación por partida, ofrecida en una de cada tres partidas elegibles; alternativa de 100 monedas.
- Intersticiales únicamente al reiniciar después de una partida y nunca si ya se ofreció una continuación con anuncio.
- Ningún anuncio al entrar al juego, navegar por el menú o abrir la tienda.
- Ninguna recompensa si el anuncio falla o no se completa. La promesa de envío del SDK no cuenta como vídeo completado.

Los límites y el saldo siguen siendo locales; no son protección antifraude de servidor. Antes de añadir cuentas o progreso multidispositivo hay que planificar la migración y revisar los requisitos de datos de CrazyGames.

Documentación oficial: [requisitos técnicos](https://docs.crazygames.com/requirements/technical/), [SDK](https://docs.crazygames.com/sdk/intro/), [anuncios](https://docs.crazygames.com/requirements/ads/).

## Portada de carga

Creada con la herramienta de generación de imágenes integrada y convertida a WebP sin pérdida. El título, los textos y la barra son HTML/CSS, no forman parte de la imagen.

Prompt final:

```text
Use case: stylized-concept.
Asset type: production loading-screen background for the independent pixel-art HTML5 game UFO RUN, horizontal 16:9 composition, 1536x864 or similar wide landscape.
Scene: deep near-black navy outer space, crisp sparse white/cyan pixel stars, sweeping electric blue and violet nebula trails and a distant spiral galaxy. A playful little flying saucer with a bright green rounded dome, no pilot visible, thick dark pixel outline and a simple silver-gray disc hull accelerates toward the right, with a vivid cyan pixel exhaust trail. Small cratered gray asteroids, a glowing golden four-point power-up star and a blue-purple ringed planet create an arcade space-flight scene, with dark gray stone spike columns framing the far left and far right edges. These are the established subjects and colors of UFO RUN.
Style: polished hand-crafted 16-bit pixel art, clear stepped pixels, strong simple silhouettes, readable chunky spaceship similar to a classic tiny green dome over a silver saucer, restrained cyan/violet glow, not realistic, no 3D rendering, no soft painted details.
Composition: saucer and star as hero subjects across the middle-right; leave a broad quiet dark area in the upper-left for the game's title to be added in HTML, and a dark uncluttered lower 20 percent for a real loading progress bar. Exciting but uncluttered, legible at small web sizes. Keep key subjects inside safe margins so a 4:3 crop still reads well.
Constraints: generate only the background artwork, absolutely no words, letters, logos, watermark, buttons, frames, user interface or progress bars. Opaque full-bleed image.
```
