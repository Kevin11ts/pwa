# Imágenes de CampusFeed

Se utilizan los JPG del usuario en `img/avatars`: `academico.jpg`, `eventos.jpg`, `deportes.jpg` y `cafeteria.jpg`.

El avatar se elige por categoría. Los avisos los publica una sola clase de usuario: el representante docente o responsable del área. Cada tarjeta muestra «Representante de [área]» y el avatar correspondiente; no hay roles de estudiante y no hacen falta avatares personales de docentes.

El logo original es `img/icons/icono.jpg`. Se muestra en la cabecera y se usa para generar `icon-192.jpg`, `icon-512.jpg` y `icon-maskable-512.jpg`, que necesita el manifest de la PWA. Todos son JPG; se eliminaron los SVG y PNG provisionales.

Si cambias el logo, reemplaza los JPG manteniendo sus nombres y dimensiones; después aumenta la versión `CACHE` en `sw.js` para renovar la caché offline.
