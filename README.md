# UFO RUN WEB

Versión web de UFO RUN, un juego arcade de estética pixel-art espacial.

## Jugar

- `Espacio`, clic o toque: impulsar el UFO.
- Esquiva los pinchos y asteroides diagonales, que viajan al doble de velocidad que los coleccionables; cada planeta suma un punto.
- Usa la estrella para obtener invencibilidad durante exactamente el mismo tiempo que dura su sonido; un contador de 5 segundos aparece sobre la nave al comenzar el efecto.
- Los planetas aparecen cada 3 obstáculos, las estrellas cada 12 y los asteroides cada 10. Las dos variantes de asteroide se intercalan en cada aparición.
- Planetas, estrellas y asteroides entran progresivamente desde fuera del borde derecho. En móvil avanzan horizontalmente desde una altura aleatoria; en escritorio se mueven en diagonal y rebotan arriba y abajo.
- Los puntos se guardan como monedas para desbloquear naves en el hangar.
- Al perder se ofrece una continuación por anuncio una vez por partida. El hangar también ofrece 50 monedas por anuncio, hasta 10 veces por día.
- La apertura presenta a B&Z Studios y muestra los créditos de Luis Zabala y Agustín Bustamante antes del menú principal.

## Portada promocional

La [portada de UFO RUN](src/ufo-run-cover.png) está lista para utilizarse en la página principal de Byz. El [prompt y las referencias](docs/ufo-run-cover.md) quedan documentados.

La tienda incluye seis naves, incluidas las skins Venezuela y Argentina. Las skins de países cuestan 48 monedas y cada nave conserva sus colores cuando queda destruida.

## Integración de anuncios

La interfaz no concede premios si todavía no existe un proveedor. Para conectarlo, define `window.ufoRunShowRewardedAd` como una función asíncrona que recibe `{ placement }` (`continue` o `shop-coins`) y devuelve `true` únicamente cuando el usuario termina de ver el anuncio.

## Ejecutar localmente

El proyecto es estático. Puede abrirse con cualquier servidor HTTP local; por ejemplo:

```bash
python -m http.server 4173
```

Después abre `http://127.0.0.1:4173/`.

## Pruebas

Ejecuta `node --test tests/game.test.cjs` para comprobar frecuencias, transparencia de colisiones, recompensas, invencibilidad y adaptación a móvil.
