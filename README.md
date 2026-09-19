# UFO RUN WEB

Versión web de UFO RUN, un juego arcade de estética pixel-art espacial.

## Jugar

- `Espacio`, clic o toque: impulsar el UFO.
- Esquiva los pinchos y asteroides diagonales; cada planeta suma un punto.
- Usa la estrella para obtener invencibilidad durante exactamente el mismo tiempo que dura su sonido.
- Los planetas aparecen cada 3 obstáculos superados. Las estrellas y los asteroides aparecen cada 12, desfasados entre sí.
- Planetas, estrellas y asteroides entran desde fuera del borde derecho y avanzan en diagonal, rebotando arriba y abajo.
- Los puntos se guardan como monedas para desbloquear naves en el hangar.

## Portada promocional

La [portada de UFO RUN](src/ufo-run-cover.png) está lista para utilizarse en la página principal de Byz. El [prompt y las referencias](docs/ufo-run-cover.md) quedan documentados.

La tienda incluye cinco naves, incluida la skin Venezuela. Cada nave conserva sus colores cuando queda destruida.

## Ejecutar localmente

El proyecto es estático. Puede abrirse con cualquier servidor HTTP local; por ejemplo:

```bash
python -m http.server 4173
```

Después abre `http://127.0.0.1:4173/`.

## Pruebas

Ejecuta `node --test tests/game.test.cjs` para comprobar frecuencias, transparencia de colisiones, recompensas, invencibilidad y adaptación a móvil.
