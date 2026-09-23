# UFO RUN WEB

Versión web de UFO RUN, un juego arcade de estética pixel-art espacial.

## Jugar

- `Espacio`, clic o toque: iniciar la partida e impulsar el UFO. La física espera el primer impulso antes de comenzar.
- Esquiva los pinchos y asteroides diagonales; cada planeta suma un punto. Estrellas, planetas y asteroides ajustan su velocidad al ritmo actual de la partida para no quedarse atrás cuando aumenta la dificultad.
- Usa la estrella para obtener invencibilidad durante dos reproducciones consecutivas de su sonido; la cuenta regresiva aparece sobre la nave durante todo el efecto.
- Los planetas aparecen cada 3 obstáculos, las estrellas cada 18 y los asteroides cada 10. Las dos variantes de asteroide se intercalan en cada aparición y tienen prioridad en la cola para no quedar bloqueadas.
- Planetas, estrellas y asteroides entran progresivamente desde fuera del borde derecho y aparecen de uno en uno mediante una cola rotativa que distribuye sus apariciones. Los planetas avanzan siempre en horizontal; en móvil todos los objetos especiales avanzan horizontalmente desde una altura aleatoria, mientras que las estrellas y asteroides rebotan en diagonal en escritorio. Las variantes de asteroide se preparan durante la carga para evitar tirones en su primera aparición.
- Hay tres dificultades: Fácil elimina los asteroides y suaviza la velocidad, Normal conserva el equilibrio original y Difícil duplica la frecuencia de asteroides.
- El Devorador Cósmico aparece a los 50 puntos en Fácil y dura 20 segundos, a los 75 en Normal y dura 30 segundos, y a los 100 en Difícil y dura 40 segundos. La batalla reemplaza temporalmente los pinchos por proyectiles dirigidos y premia la victoria con 10 puntos y 50 monedas. El jefe flota y articula cabeza y cola antes de caer al ser derrotado.
- En móvil vertical, las tres dificultades tienen un ritmo más ágil; los pinchos conservan una abertura amplia y los asteroides se muestran más pequeños.
- Los puntos se guardan como monedas para desbloquear naves en el hangar.
- Al entrar por primera vez se solicita el nombre del piloto y se guarda en el navegador. Después queda bloqueado; el botón del lápiz permite cambiarlo por 100 monedas. El menú incluye una guía ilustrada, mejores puntajes y un ranking top 10 separados para Fácil, Normal y Difícil.
- Al perder se ofrece una continuación por anuncio una vez por partida. El hangar también ofrece 50 monedas por anuncio, hasta 10 veces por día.
- La apertura presenta a B&Z Studios y muestra los créditos de Luis Zabala y Agustín Bustamante antes del menú principal.
- `P`, `Escape` o el botón de pausa detienen realmente la partida. El menú de pausa y el panel admin bloquean el juego hasta cerrarse.
- El menú de logros reúne 22 retos permanentes con progreso, recompensa automática en monedas y alertas pixel-art acompañadas por sonidos normal y difícil. Incluye un logro por vencer al jefe en cada dificultad y otro difícil por derrotarlo en las tres.
- La invencibilidad evita el daño del techo y el suelo sin permitir que la nave atraviese los límites del escenario.
- El menú principal se adapta a la altura disponible para mantenerse completo en pantalla sin desplazamiento vertical.

## Portada promocional

La [portada de UFO RUN](src/ufo-run-cover.png) está lista para utilizarse en la página principal de Byz. El [prompt y las referencias](docs/ufo-run-cover.md) quedan documentados.

La tienda incluye seis naves, incluidas las skins Venezuela y Argentina. Las skins de países cuestan 48 monedas y cada nave conserva sus colores cuando queda destruida.

## Herramientas de prueba

Pulsa `F2` y usa la contraseña de pruebas para abrir el panel admin. En móvil también puedes mantener presionado durante 3 segundos el logo de B&Z en el menú o el contador de puntaje durante una partida; el segundo dedo continúa controlando la nave. Desde allí puedes agregar 100 monedas, alternar invencibilidad infinita o iniciar directamente una partida de prueba contra el jefe. Abrir el panel durante una partida pausa el juego.

## Integración de anuncios

La interfaz no concede premios si todavía no existe un proveedor. Para conectarlo, define `window.ufoRunShowRewardedAd` como una función asíncrona que recibe `{ placement }` (`continue` o `shop-coins`) y devuelve `true` únicamente cuando el usuario termina de ver el anuncio.

## Ranking global en Vercel

La ruta serverless `api/scores.js` publica y consulta el ranking global. En el proyecto de Vercel conecta una base Redis de Upstash y configura estas variables:

- `KV_REST_API_URL` y `KV_REST_API_TOKEN`, o
- `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`, o
- `UPSTASH_REDIS_REST_KV_REST_API_URL` y `UPSTASH_REDIS_REST_KV_REST_API_TOKEN` cuando la integración de Vercel se conecta con el prefijo `UPSTASH_REDIS_REST`.

Después vuelve a desplegar el proyecto. Si el servicio todavía no está configurado o no responde, el juego usa automáticamente el ranking guardado en el dispositivo. Las puntuaciones se validan en la API y los envíos tienen un límite diario por conexión.

## Ejecutar localmente

La parte jugable puede abrirse con cualquier servidor HTTP local; por ejemplo:

```bash
python -m http.server 4173
```

Después abre `http://127.0.0.1:4173/`. En ese modo el ranking usa el respaldo local; la API global se ejecuta al desplegar en Vercel.

## Pruebas

Ejecuta `node --test tests/game.test.cjs tests/scores-api.test.cjs` para comprobar frecuencias, transparencia de colisiones, recompensas, invencibilidad, ranking y adaptación a móvil.
