# CampusFeed

CampusFeed es una aplicación web progresiva (PWA) para que docentes y responsables de área publiquen avisos de la comunidad universitaria. Los avisos muestran el avatar y la atribución del área: académica, eventos, deportes o servicios.

La interfaz está hecha con HTML, CSS y JavaScript y conserva los datos de cada dispositivo en su navegador.

## Funciones

- Publicar y explorar avisos por categoría.
- Buscar avisos y guardar favoritos.
- Guardar publicaciones y borradores localmente con IndexedDB.
- Abrir los recursos ya visitados sin conexión gracias al service worker y su caché.
- Instalar la aplicación en navegadores compatibles.
- Solicitar permiso y mostrar notificaciones del navegador.
- Procesar en el service worker notificaciones push recibidas.
- Adaptar la interfaz a escritorio y móvil.

Las publicaciones permanecen locales al navegador: no se sincroniza el muro entre dispositivos. Las notificaciones locales aparecen en el dispositivo desde el que se publica.

## Requisitos

- Un navegador moderno compatible con service workers e IndexedDB, por ejemplo Edge o Chrome.
- Un servidor estático local para desarrollo. La PWA debe abrirse en `localhost` o en un sitio HTTPS; abrir `index.html` directamente como `file://` no permite registrar el service worker.

Un servidor estático basta para usar la interfaz, guardar avisos sin conexión y mostrar notificaciones en el navegador.

## Ejecución local

Desde la carpeta raíz del proyecto ejecuta:

```bash
http-server -o
```

El comando sirve los archivos y abre el navegador. También puedes ejecutar `http-server` y abrir la dirección que indique la terminal.

## Modo sin conexión

La primera visita debe cargar con conexión para que el service worker instale la caché. Después:

1. Abre las herramientas de desarrollo del navegador y entra en **Application → Service Workers**.
2. Confirma que `sw.js` está activo y controla la página.
3. Selecciona **Offline** y recarga la página. Deja desactivado **Bypass for network**.
4. Comprueba que cargan la interfaz y los avatares. Publica un aviso y vuelve a recargar para confirmar que persiste.
5. Desactiva **Offline** cuando termines.

Los avisos, favoritos y borradores se almacenan en IndexedDB. Borrar los datos del sitio también los elimina. El service worker guarda el shell de la app y los cuatro avatares de área; cuando se cambia esta lista, aumenta la versión de caché declarada en `sw.js`.

## Notificaciones

Pulsa la campana y concede permiso cuando el navegador lo solicite. CampusFeed muestra una notificación de confirmación. Mientras la app está abierta, publicar un aviso también puede mostrar una notificación del navegador.

La entrega depende del permiso del navegador y de que Windows no bloquee las notificaciones. El modo **No molestar** puede ocultarlas.

## Estructura del proyecto

```text
.
├── index.html              # Interfaz y formulario de publicación
├── styles.css              # Diseño adaptable
├── app.js                  # Avisos, categorías, IndexedDB e interacción
├── sw.js                   # Precaché offline y apertura de notificaciones
├── config.js                # Configuración pública del frontend
├── manifest.webmanifest    # Nombre, alcance e iconos instalables
├── PROPUESTA.md            # Descripción de la propuesta del producto
└── img/
    ├── avatars/            # Avatares JPG de las áreas
    └── icons/              # Icono original y tamaños para la PWA
```

## Privacidad y alcance

Los datos del muro viven en el almacenamiento local del navegador. No se envían a una base de datos compartida. La selección del área indica la autoría que aparece en el aviso; el prototipo no implementa cuentas ni autenticación.
