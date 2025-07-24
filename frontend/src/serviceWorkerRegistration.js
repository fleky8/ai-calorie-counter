// Este archivo maneja el registro del service worker para habilitar funcionalidades PWA

// Función para registrar el service worker
export function register() {
  if ('serviceWorker' in navigator) {
    // Registrar el service worker solo en producción o cuando se ejecuta en localhost
    const isProduction = process?.env?.NODE_ENV === 'production';
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
        window.location.hostname === '[::1]' ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
    );

    if (isProduction || isLocalhost) {
      window.addEventListener('load', () => {
        const swUrl = `${process?.env?.PUBLIC_URL || ''}/serviceWorker.js`;

        if (isLocalhost) {
          // Estamos en localhost, verificar si el service worker existe
          checkValidServiceWorker(swUrl);
          
          // Agregar información adicional para desarrolladores
          console.log(
            'Esta aplicación web se está ejecutando en modo de desarrollo. ' +
              'El Service Worker no funcionará si el servidor no envía encabezados válidos. ' +
              'Consulta https://create-react-app.dev/docs/making-a-progressive-web-app/ para más información.'
          );
        } else {
          // No estamos en localhost, registrar el service worker normalmente
          registerValidSW(swUrl);
        }
      });
    }
  }
}

// Función para registrar un service worker válido
function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      // Manejar actualizaciones del service worker
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // En este punto, el service worker actualizado ha sido instalado
              console.log(
                'Nuevo contenido está disponible y se usará cuando todas las ' +
                  'pestañas de esta página se cierren.'
              );

              // Opcional: Mostrar notificación al usuario sobre la actualización
              if (window.confirm('¡Hay una nueva versión disponible! ¿Quieres actualizar ahora?')) {
                window.location.reload();
              }
            } else {
              // En este punto, todo ha sido precacheado
              console.log('El contenido está cacheado para uso offline.');
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('Error durante el registro del Service Worker:', error);
    });
}

// Función para verificar si el service worker es válido
function checkValidServiceWorker(swUrl) {
  // Verificar si podemos encontrar el service worker
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      // Asegurarse de que el service worker existe y que realmente estamos obteniendo un archivo JS
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No se encontró el service worker, probablemente sea otra aplicación
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker encontrado, proceder normalmente
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('No se pudo conectar. La aplicación se está ejecutando en modo offline.');
    });
}

// Función para desregistrar el service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}