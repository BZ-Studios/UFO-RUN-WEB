# Portadas de UFO RUN para CrazyGames

Generadas con la herramienta de imágenes integrada (no API/CLI), tomando como referencias `src/ufo-run-cover.png` y `ufo-crazygames/src/loading-cover.webp`. Se crearon tres composiciones, no tres recortes de una sola imagen. Exportadas a las dimensiones exactas mediante un ajuste mecánico con Sharp (nearest-neighbour para conservar bordes pixel art).

Los archivos finales están en `publishing/crazygames/covers/`, fuera del paquete jugable para no aumentar su descarga:

- `ufo-run-landscape-1920x1080.png`
- `ufo-run-portrait-800x1200.png`
- `ufo-run-square-800x800.png`

Subir cada imagen al campo con la proporción correspondiente. No sustituyen los archivos del juego. No es necesario volver a subir el juego por estas portadas.

Referencia de requisitos: https://docs.crazygames.com/requirements/game-covers/

## Prompts finales

### landscape

```text
Use case: ads-marketing.
Asset type: final storefront cover artwork for the HTML5 arcade game UFO RUN, part of a consistent three-format cover set.
Input images: Image 1 is a reference for established game identity, title lettering, green saucer, spike obstacles and pixel-art style. Image 2 is a reference for the navy/cyan/violet galaxy palette and spatial energy. These are visual references, not edit targets.
Primary request: create a striking, polished original cover matching the game's established personality. A bright green rounded dome on a silver-gray flying saucer with a thick dark outline, no visible pilot, races toward a single golden four-point power-up star with a cyan pixel exhaust. Deep navy space with a restrained blue/violet nebula swirl, sparse bright stars, a small blue-purple ringed planet and dark gray spike columns at the far edges suggesting an obstacle corridor. Keep the UFO as the obvious main subject.
Style: premium crisp 16-bit game pixel art with clean stepped edges and intentional pixel clusters, sharp readable forms, not low-resolution blur or compression artifacts, no 3D or realistic painting. Restrained glow and high contrast; simplified uncluttered scene that remains legible as a small thumbnail.
Text (verbatim): "UFO RUN". Large bold chunky arcade lettering, UFO in white with cool pale-blue shading, RUN in luminous cyan with dark navy outline and restrained blue-violet edge glow. Spell U-F-O space R-U-N exactly. No other text.
Constraints: opaque full-bleed artwork, no added frame or border, no store logos, no studio logo, no UI, loading bars, buttons, arrows, subtitles, watermarks, promotional labels, or unrelated characters. Do not reproduce any browser interface. Keep title and saucer fully inside safe margins.
Format: horizontal 16:9, target 1920x1080 pixels or higher in exactly the same aspect ratio. Wide composition: large title across the upper third; hero saucer central-lower, slightly left of the gold star on its right, exhaust sweeping in from lower-left. Small ringed planet lower-right. Edge obstacles occupy only the outermost 8 percent and must not read as a border.
```

### portrait

```text
Use case: ads-marketing.
Asset type: final storefront cover artwork for the HTML5 arcade game UFO RUN, part of a consistent three-format cover set.
Input images: Image 1 is a reference for established game identity, title lettering, green saucer, spike obstacles and pixel-art style. Image 2 is a reference for the navy/cyan/violet galaxy palette and spatial energy. These are visual references, not edit targets.
Primary request: create a striking, polished original cover matching the game's established personality. A bright green rounded dome on a silver-gray flying saucer with a thick dark outline, no visible pilot, races toward a single golden four-point power-up star with a cyan pixel exhaust. Deep navy space with a restrained blue/violet nebula swirl, sparse bright stars, a small blue-purple ringed planet and dark gray spike columns at the far edges suggesting an obstacle corridor. Keep the UFO as the obvious main subject.
Style: premium crisp 16-bit game pixel art with clean stepped edges and intentional pixel clusters, sharp readable forms, not low-resolution blur or compression artifacts, no 3D or realistic painting. Restrained glow and high contrast; simplified uncluttered scene that remains legible as a small thumbnail.
Text (verbatim): "UFO RUN". Large bold chunky arcade lettering, UFO in white with cool pale-blue shading, RUN in luminous cyan with dark navy outline and restrained blue-violet edge glow. Spell U-F-O space R-U-N exactly. No other text.
Constraints: opaque full-bleed artwork, no added frame or border, no store logos, no studio logo, no UI, loading bars, buttons, arrows, subtitles, watermarks, promotional labels, or unrelated characters. Do not reproduce any browser interface. Keep title and saucer fully inside safe margins.
Format: vertical 2:3, target 800x1200 pixels or higher in exactly the same aspect ratio. Compose specifically as a tall poster, do not simply crop a horizontal image. Large title stacked in two centered lines, UFO above RUN, occupying the upper third; large hero saucer just below center banking right toward a single gold star upper-right of the saucer. Cyan exhaust curves diagonally from lower-left. Small ringed planet near lower-right; modest spike silhouettes in opposing corners with ample open flight space. Keep the whole title inside the canvas.
```

### square

```text
Use case: ads-marketing.
Asset type: final storefront cover artwork for the HTML5 arcade game UFO RUN, part of a consistent three-format cover set.
Input images: Image 1 is a reference for established game identity, title lettering, green saucer, spike obstacles and pixel-art style. Image 2 is a reference for the navy/cyan/violet galaxy palette and spatial energy. These are visual references, not edit targets.
Primary request: create a striking, polished original cover matching the game's established personality. A bright green rounded dome on a silver-gray flying saucer with a thick dark outline, no visible pilot, races toward a single golden four-point power-up star with a cyan pixel exhaust. Deep navy space with a restrained blue/violet nebula swirl, sparse bright stars, a small blue-purple ringed planet and dark gray spike columns at the far edges suggesting an obstacle corridor. Keep the UFO as the obvious main subject.
Style: premium crisp 16-bit game pixel art with clean stepped edges and intentional pixel clusters, sharp readable forms, not low-resolution blur or compression artifacts, no 3D or realistic painting. Restrained glow and high contrast; simplified uncluttered scene that remains legible as a small thumbnail.
Text (verbatim): "UFO RUN". Large bold chunky arcade lettering, UFO in white with cool pale-blue shading, RUN in luminous cyan with dark navy outline and restrained blue-violet edge glow. Spell U-F-O space R-U-N exactly. No other text.
Constraints: opaque full-bleed artwork, no added frame or border, no store logos, no studio logo, no UI, loading bars, buttons, arrows, subtitles, watermarks, promotional labels, or unrelated characters. Do not reproduce any browser interface. Keep title and saucer fully inside safe margins.
Format: square 1:1, target 800x800 pixels or higher in exactly the same aspect ratio. Compose specifically for a compact square thumbnail: big title centered across the upper third; green saucer large and readable center-lower, flying right toward one gold star; cyan exhaust diagonally trailing to the lower-left. One small ringed planet in the lower-right, just a hint of gray spike columns at far corners. Keep it exceptionally clear and simple, with generous safe margins around the title.
```


