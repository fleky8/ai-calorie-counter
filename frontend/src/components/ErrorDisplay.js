import React, { useState } from 'react';
import styled from 'styled-components';
import { ErrorTypes } from '../services/errorService';
import { FaExclamationTriangle, FaWifi, FaServer, FaClock, FaLock, FaExclamationCircle, FaRedo, FaInfoCircle, FaTimes } from 'react-icons/fa';

// Estilos para el contenedor principal
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
  background-color: ${props => getBackgroundColor(props.errorType)};
  color: ${props => getTextColor(props.errorType)};
  border-left: 4px solid ${props => getBorderColor(props.errorType)};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  
  @media (min-width: 576px) {
    padding: 1.25rem;
  }
`;

// Estilos para el encabezado del error
const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
`;

// Estilos para el icono del error
const ErrorIcon = styled.div`
  margin-right: 0.75rem;
  font-size: 1.25rem;
  color: ${props => getBorderColor(props.errorType)};
  display: flex;
  align-items: center;
`;

// Estilos para el título del error
const ErrorTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

// Estilos para el mensaje del error
const ErrorMessage = styled.p`
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
`;

// Estilos para la acción recomendada
const ErrorAction = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.9;
`;

// Estilos para el botón de cerrar
const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 1;
  }
`;

// Estilos para el botón de reintentar
const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: ${props => getBorderColor(props.errorType)};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => getDarkerColor(props.errorType)};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Estilos para el contenedor de detalles técnicos
const ErrorDetails = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.8rem;
  opacity: 0.8;
`;

// Estilos para el botón de mostrar/ocultar detalles
const DetailsToggle = styled.button`
  background: transparent;
  border: none;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Función para obtener el color de fondo según el tipo de error
function getBackgroundColor(errorType) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return '#f8f9fa';
    case ErrorTypes.SERVER:
      return '#f8d7da';
    case ErrorTypes.TIMEOUT:
      return '#fff3cd';
    case ErrorTypes.VALIDATION:
      return '#d1ecf1';
    case ErrorTypes.PERMISSION:
      return '#f8d7da';
    case ErrorTypes.API_LIMIT:
      return '#fff3cd';
    case ErrorTypes.STORAGE:
      return '#d1ecf1';
    case ErrorTypes.FILE:
      return '#d1ecf1';
    default:
      return '#f8f9fa';
  }
}

// Función para obtener el color del texto según el tipo de error
function getTextColor(errorType) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return '#343a40';
    case ErrorTypes.SERVER:
      return '#721c24';
    case ErrorTypes.TIMEOUT:
      return '#856404';
    case ErrorTypes.VALIDATION:
      return '#0c5460';
    case ErrorTypes.PERMISSION:
      return '#721c24';
    case ErrorTypes.API_LIMIT:
      return '#856404';
    case ErrorTypes.STORAGE:
      return '#0c5460';
    case ErrorTypes.FILE:
      return '#0c5460';
    default:
      return '#343a40';
  }
}

// Función para obtener el color del borde según el tipo de error
function getBorderColor(errorType) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return '#6c757d';
    case ErrorTypes.SERVER:
      return '#dc3545';
    case ErrorTypes.TIMEOUT:
      return '#ffc107';
    case ErrorTypes.VALIDATION:
      return '#17a2b8';
    case ErrorTypes.PERMISSION:
      return '#dc3545';
    case ErrorTypes.API_LIMIT:
      return '#ffc107';
    case ErrorTypes.STORAGE:
      return '#17a2b8';
    case ErrorTypes.FILE:
      return '#17a2b8';
    default:
      return '#6c757d';
  }
}

// Función para obtener un color más oscuro para hover
function getDarkerColor(errorType) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return '#5a6268';
    case ErrorTypes.SERVER:
      return '#c82333';
    case ErrorTypes.TIMEOUT:
      return '#e0a800';
    case ErrorTypes.VALIDATION:
      return '#138496';
    case ErrorTypes.PERMISSION:
      return '#c82333';
    case ErrorTypes.API_LIMIT:
      return '#e0a800';
    case ErrorTypes.STORAGE:
      return '#138496';
    case ErrorTypes.FILE:
      return '#138496';
    default:
      return '#5a6268';
  }
}

// Función para obtener el icono según el tipo de error
function getErrorIcon(errorType) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return <FaWifi />;
    case ErrorTypes.SERVER:
      return <FaServer />;
    case ErrorTypes.TIMEOUT:
      return <FaClock />;
    case ErrorTypes.VALIDATION:
      return <FaExclamationCircle />;
    case ErrorTypes.PERMISSION:
      return <FaLock />;
    case ErrorTypes.API_LIMIT:
      return <FaExclamationCircle />;
    case ErrorTypes.STORAGE:
      return <FaExclamationCircle />;
    case ErrorTypes.FILE:
      return <FaExclamationCircle />;
    default:
      return <FaExclamationTriangle />;
  }
}

// Función para obtener el título según el tipo de error
function getErrorTitle(errorType) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return 'Error de conexión';
    case ErrorTypes.SERVER:
      return 'Error del servidor';
    case ErrorTypes.TIMEOUT:
      return 'Tiempo de espera agotado';
    case ErrorTypes.VALIDATION:
      return 'Error de validación';
    case ErrorTypes.PERMISSION:
      return 'Error de permisos';
    case ErrorTypes.API_LIMIT:
      return 'Límite de API alcanzado';
    case ErrorTypes.STORAGE:
      return 'Error de almacenamiento';
    case ErrorTypes.FILE:
      return 'Error de archivo';
    default:
      return 'Error inesperado';
  }
}

/**
 * Componente para mostrar errores de manera consistente
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.error - Objeto de error (AppError)
 * @param {Function} props.onRetry - Función a ejecutar al reintentar
 * @param {Function} props.onClose - Función a ejecutar al cerrar
 * @param {boolean} props.showClose - Indica si se debe mostrar el botón de cerrar
 * @param {boolean} props.showRetry - Indica si se debe mostrar el botón de reintentar
 * @param {boolean} props.showDetails - Indica si se deben mostrar los detalles técnicos
 * @returns {JSX.Element} Componente de error
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onClose, 
  showClose = true, 
  showRetry = true,
  showDetails = false
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(showDetails);
  
  // Si no hay error, no mostrar nada
  if (!error) return null;
  
  // Determinar si el error es recuperable
  const isRecoverable = error.isRecoverable && error.isRecoverable();
  
  return (
    <ErrorContainer errorType={error.type}>
      {showClose && (
        <CloseButton onClick={onClose} aria-label="Cerrar">
          <FaTimes />
        </CloseButton>
      )}
      
      <ErrorHeader>
        <ErrorIcon errorType={error.type}>
          {getErrorIcon(error.type)}
        </ErrorIcon>
        <ErrorTitle>{getErrorTitle(error.type)}</ErrorTitle>
      </ErrorHeader>
      
      <ErrorMessage>{error.getUserMessage()}</ErrorMessage>
      
      {error.getRecommendedAction && (
        <ErrorAction>{error.getRecommendedAction()}</ErrorAction>
      )}
      
      {showRetry && isRecoverable && onRetry && (
        <RetryButton 
          errorType={error.type} 
          onClick={onRetry}
          aria-label="Reintentar"
        >
          <FaRedo /> Reintentar
        </RetryButton>
      )}
      
      <DetailsToggle 
        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        aria-expanded={showTechnicalDetails}
      >
        <FaInfoCircle />
        {showTechnicalDetails ? 'Ocultar detalles técnicos' : 'Mostrar detalles técnicos'}
      </DetailsToggle>
      
      {showTechnicalDetails && (
        <ErrorDetails>
          <p><strong>ID de error:</strong> {error.id}</p>
          <p><strong>Tipo:</strong> {error.type}</p>
          <p><strong>Mensaje:</strong> {error.message}</p>
          <p><strong>Fecha:</strong> {error.timestamp?.toLocaleString()}</p>
          {error.data && Object.keys(error.data).length > 0 && (
            <p><strong>Datos:</strong> {JSON.stringify(error.data)}</p>
          )}
        </ErrorDetails>
      )}
    </ErrorContainer>
  );
};

export default ErrorDisplay;