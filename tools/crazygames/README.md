# Herramientas de la edición CrazyGames

Todas las rutas de los comandos son relativas a la raíz del repositorio. No cambian la web original, GameDistribution ni APK.

## Probar y generar el paquete

Requiere Node.js 22 y PowerShell 5.1 o superior para el ZIP. No hace falta instalar dependencias para estas operaciones:

```powershell
node tools/crazygames/serve.cjs
# Abrir http://127.0.0.1:4173
powershell -NoProfile -ExecutionPolicy Bypass -File tools/crazygames/package.ps1
# Producción: publishing/crazygames/v2.0.0/
# ZIP: publishing/crazygames/ufo-run-crazygames-v2.0.0.zip
```

El build copia los recursos permitidos, comprueba sintaxis JS, rutas de assets con mayúsculas/minúsculas, presupuesto móvil, ausencia de probes de QA y anuncios desactivados. El empaquetador crea rutas ZIP con `/` y verifica el hash de cada entrada contra el manifiesto externo. Repetir el build solo sobrescribe sus archivos conocidos; si aparece uno inesperado se detiene para inspeccionarlo. No borra directorios ni modifica otras ediciones.

## Pruebas automáticas

```powershell
node --test tests/game.test.cjs tests/scores-api.test.cjs tests/crazygames.test.cjs tests/crazygames-sdk.test.cjs
```

Si Git identifica al propietario del repositorio de otra manera, puede necesitar el ajuste local `safe.directory`. No desactives controles del sistema ni marques cualquier repositorio como seguro.

Pruebas de navegador: Playwright es una herramienta **de desarrollo**, no se incluye en el juego. Se puede resolver desde el entorno o indicar la ruta absoluta de su módulo con `PLAYWRIGHT_MODULE`; en este equipo también se detecta el runtime de Codex. `CRAZY_BROWSER` permite indicar Chrome o Edge instalado. Para revisar la compilación:

```powershell
$env:CRAZY_GAME_ROOT='publishing/crazygames/v2.0.0'
$env:CRAZY_QA_OUTPUT='publishing/crazygames/qa-v2/chrome-production'
node tests/crazygames.browser.cjs
$env:CRAZY_BROWSER='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
$env:CRAZY_QA_OUTPUT='publishing/crazygames/qa-v2/edge-production'
node tests/crazygames.browser.cjs
```

Las pruebas agregan temporalmente probes al JS servido por su propio servidor, nunca a la fuente ni al build. El SDK oficial se comprueba por separado; los anuncios usan callbacks simulados, sin tráfico publicitario real. Se necesita red para el caso de SDK oficial.

```powershell
node tests/crazygames.playthrough.cjs
node tools/crazygames/audit.cjs
```

El piloto manda impulsos de teclado/táctiles y lee el estado; no modifica física, protección ni puntuación. Acelera el reloj respetando cada paso de animación/física. También hace una prueba breve sin probes con tiempo real. No representa una evaluación humana de diversión ni una medición de un teléfono real. La auditoría compara tamaño contra la versión anterior y produce hash del ZIP. Opcionalmente `CRAZY_PROTECTED_SNAPSHOT` puede señalar una instantánea JSON de hashes tomada antes del trabajo para comprobar otras ediciones; registra cambios paralelos de APK sin revertirlos.

## Recursos preparados

Los PNG finales ya están incluidos. Para volver a obtenerlos de los originales de la web se necesita Sharp, solo como herramienta de desarrollo:

```powershell
$env:SHARP_MODULE='RUTA_ABSOLUTA_AL_MODULO_SHARP'
node tools/crazygames/prepare-assets.cjs --write
```

Prepara los mismos recortes de planetas a 80×80, los asteroides a 64×64, logo a 360 px y jefe a 920 px. Usa vecino más próximo y conserva los originales de las otras ediciones. Revisar los recortes si el arte original cambia.

La música de esta versión se recodificó desde `src/musica/musica_fondo_2.mp3` mediante FFmpeg, conservando velocidad/duración:

```text
ffmpeg -i ORIGINAL -map 0:a:0 -map_metadata 0 -af loudnorm=I=-20:TP=-2:LRA=9 -c:a libmp3lame -q:a 5 -ar 44100 SALIDA_TEMPORAL.mp3
```

Usar una salida temporal y luego sustituir únicamente el MP3 de la copia CrazyGames. No es necesario repetir la conversión para construir o probar el juego.

Informe: [docs/crazygames-v2-review.md](../../docs/crazygames-v2-review.md). Nunca se envía el juego al portal desde estas herramientas.
