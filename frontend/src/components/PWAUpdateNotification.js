import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const UpdateContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #007bff;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 1000;
  max-width: 90%;
  width: 400px;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translate(-50%, 100px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const Message = styled.div`
  flex: 1;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button.attrs(props => ({
  primary: props.primary ? 'true' : undefined
}))`
  background: ${props => props.primary === 'true' ? 'white' : 'transparent'};
  color: ${props => props.primary === 'true' ? '#007bff' : 'white'};
  border: ${props => props.primary === 'true' ? 'none' : '1px solid white'};
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.primary === 'true' ? '#f8f9fa' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const PWAUpdateNotification = () => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  // const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Solo ejecutar si el service worker está disponible
    if ('serviceWorker' in navigator) {
      // Función para manejar nuevas actualizaciones
      const handleUpdate = (registration) => {
        // Verificar si hay un service worker esperando
        const waitingServiceWorker = registration.waiting;
        
        if (waitingServiceWorker) {
          // Hay una actualización disponible
          setWaitingWorker(waitingServiceWorker);
          setShowUpdateNotification(true);
        }
      };

      // Verificar si hay actualizaciones cuando la página se carga
      navigator.serviceWorker.ready.then((registration) => {
        // La aplicación está lista para trabajar offline
        setOfflineReady(true);
        
        // Verificar si hay una actualización esperando
        if (registration.waiting) {
          handleUpdate(registration);
        }

        // Escuchar por nuevas actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleUpdate(registration);
              }
            });
          }
        });
      });

      // Escuchar por actualizaciones controladas por el navegador
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // Función para actualizar la aplicación
  const updateApp = () => {
    if (waitingWorker) {
      // Enviar mensaje al service worker para activar la nueva versión
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateNotification(false);
    }
  };

  // Función para descartar la notificación
  const dismissNotification = () => {
    setShowUpdateNotification(false);
  };

  if (!showUpdateNotification) {
    return null;
  }

  return (
    <UpdateContainer>
      <Message>
        ¡Nueva versión disponible! Actualiza para obtener las últimas mejoras.
      </Message>
      <ButtonGroup>
        <Button onClick={dismissNotification}>Después</Button>
        <Button primary onClick={updateApp}>Actualizar</Button>
      </ButtonGroup>
    </UpdateContainer>
  );
};

export default PWAUpdateNotification;