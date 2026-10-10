# Propuesta de PWA: CampusFeed

## Problema

Los avisos universitarios suelen estar dispersos en grupos y carteles. Cuando no hay conexión, es difícil recuperar información que se había consultado.

## Producto

CampusFeed es una aplicación web progresiva que permite publicar y consultar avisos de una comunidad universitaria. Puede instalarse en dispositivos compatibles, recuperar avisos y borradores guardados sin conexión y mostrar notificaciones sobre publicaciones.

## Público y alcance del prototipo

Docentes y representantes responsables de las áreas académica, eventos, deportes y servicios. Todos publican en un único rol de representante; cada aviso se identifica por su área y avatar. El muro y los favoritos se guardan por dispositivo.

## Requisitos y solución

| Requisito | Solución |
|---|---|
| Funciones sin red | Service worker con precaché local y fallback de navegación; IndexedDB para avisos, favoritos y borradores. |
| Manifest e iconos | Nombre, colores, inicio y alcance relativos; iconos 192, 512 y maskable. |
| Notificaciones | Permiso solicitado con botón; notificaciones locales al activar la campana y publicar avisos. |
| Publicación en GitHub Pages | Frontend estático sin recursos externos y rutas relativas compatibles con subcarpetas. |

## Flujo de exposición

Abrir → activar notificaciones → publicar → observar notificación → guardar favorito → escribir borrador → activar Offline en Application → recargar → consultar avisos y recuperar borrador → publicar sin conexión.

## Identidad visual

Verde oscuro, crema y verde claro. Tipografía del sistema, tarjetas de avisos e ilustración de campus con CSS. Los recursos se incluyen localmente para evitar dependencias de red.

## Posibles ampliaciones

Autenticación, muro compartido con base de datos, permisos por rol, moderación y envío de avisos pendientes al reconectar.

