# UFO RUN — APK versión 1

Copia independiente de la versión web original en español. No cambia la web, la base de datos ni las copias de CrazyGames y GameDistribution.

## Instalar

El archivo entregable es `UFO-RUN-v1.0.0.apk`, en esta misma carpeta. Es una compilación de pruebas firmada con la clave de depuración de Android, no una publicación de Google Play.

1. Copia el APK al teléfono Android (Android 8.0 o posterior, con Android System WebView actualizado).
2. Abre el archivo y, si Android lo solicita, permite instalar aplicaciones desde esa fuente concreta.
3. Instala UFO RUN. Después puedes desactivar de nuevo ese permiso de instalación.

Funciona sin conexión y no solicita acceso a Internet, archivos personales, cámara ni contactos. Monedas, skins, nombre, logros y ranking se guardan en esta app, no se importan del navegador ni se sincronizan con Byz/Vercel. Desinstalar la app o borrar sus datos elimina el progreso. Mantiene las adaptaciones vertical y horizontal de la versión original.

Los anuncios siguen sin proveedor: esta versión no integra AdMob ni utiliza los anuncios de CrazyGames. Conserva las herramientas de prueba ocultas del juego original. No se debe publicar como versión final sin revisar anuncios, herramientas de prueba, políticas y firma de producción.

## Archivos

- `web/`: copia editable del juego y sus recursos; es lo que se empaqueta en el APK.
- `app/`: contenedor Android con WebViewAssetLoader, que sirve esos recursos desde un origen HTTPS local seguro.
- `UFO-RUN-v1.0.0.apk`: instalador de pruebas.

La app entra en pantalla completa nativa, permite ambas orientaciones y conserva la partida al girar. Al ir al fondo o pulsar Atrás se pausa y silencia el juego; se requiere continuar expresamente para reanudar una partida.

## Volver a compilar

Instala JDK 17 y Android SDK con plataforma Android 36 y Build Tools 36.0.0. Abre esta carpeta en Android Studio o configura `ANDROID_HOME` apuntando a tu SDK y ejecuta:

```powershell
.\gradlew.bat :app:exportApk
```

El proyecto fija Android Gradle Plugin 8.13.0, Gradle 8.14.3 y AndroidX WebKit 1.14.0. Una compilación nueva puede necesitar descargar esas dependencias. No incluyas claves privadas de producción ni `local.properties` en Git.

Para actualizaciones instalables sin perder progreso deben conservarse el identificador `com.bzstudios.uforun` y la misma clave de firma. La clave de depuración no debe usarse como clave final de publicación.

## Verificación de esta entrega

- `:app:exportApk` y `:app:lintDebug`: compilación correcta, sin errores de lint. Queda una advertencia informativa por fijar target SDK 36 en lugar de la API más reciente.
- Firma de depuración APK Signature Scheme v2 verificada con `apksigner`; alineación verificada con `zipalign`.
- Los 44 archivos de `web/` coinciden byte a byte con los recursos incluidos en el APK.
- Guardado, nombre, pantallas, controles, pausa al salir al fondo y retorno explícito comprobados en simulación Chrome del origen HTTPS local, en 390×844, 844×390 y 800×600.
- Las 59 pruebas del juego web original siguen pasando.
- No se ha probado la instalación en un teléfono Android ni en un emulador. Hace falta comprobarla en el dispositivo real antes de distribuirla como versión final.

Referencia técnica: https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
