import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { AppError, ErrorTypes } from '../services/errorService';

const ErrorContainer = styled.div.attrs(props => ({
  severity: props.severity || 'error'
}))`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin: 0.5rem 0;
  border-left: 4px solid;
  
  ${props => {
    switch (props.severity) {
      case 'warning':
        return `
          background-color: #fff3cd;
          border-color: #ffc107;
          color: #856404;
        `;
      case 'info':
        return `
          background-color: #d1ecf1;
          border-color: #17a2b8;
          color: #0c5460;
        `;
      default:
        return `
          background-color: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        `;
    }
  }}
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
  margin-top: 0.1rem;
`;

const ContentContainer = styled.div`
  flex: 1;
`;

const ErrorTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ErrorAction = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.8;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const ErrorDetails = styled.details`
  margin-top: 0.5rem;
  
  summary {
    cursor: pointer;
    font-size: 0.85rem;
    opacity: 0.8;
    margin-bottom: 0.5rem;
  }
  
  pre {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    overflow-x: auto;
    margin: 0;
  }
`;

/**
 * Componente para mostrar errores de validación de manera elegante
 */
const ValidationErrorDisplay = ({ 
  error, 
  onDismiss, 
  showDetails = false,
  className 
}) => {
  if (!error) return null;

  // Determinar el tipo de error y la severidad
  const getSeverity = (error) => {
    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorTypes.VALIDATION:
        case ErrorTypes.FILE:
          return 'warning';
        case ErrorTypes.API_LIMIT:
          return 'info';
        default:
          return 'error';
      }
    }
    return 'error';
  };

  // Obtener el icono apropiado
  const getIcon = (severity) => {
    switch (severity) {
      case 'warning':
        return <FaExclamationTriangle />;
      case 'info':
        return <FaInfoCircle />;
      default:
        return <FaExclamationTriangle />;
    }
  };

  // Obtener el título del error
  const getTitle = (error) => {
    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorTypes.VALIDATION:
          return 'Error de validación';
        case ErrorTypes.FILE:
          return 'Error de archivo';
        case ErrorTypes.NETWORK:
          return 'Error de conexión';
        case ErrorTypes.SERVER:
          return 'Error del servidor';
        case ErrorTypes.TIMEOUT:
          return 'Tiempo de espera agotado';
        case ErrorTypes.PERMISSION:
          return 'Error de permisos';
        case ErrorTypes.API_LIMIT:
          return 'Límite de solicitudes alcanzado';
        case ErrorTypes.STORAGE:
          return 'Error de almacenamiento';
        default:
          return 'Error';
      }
    }
    return 'Error';
  };

  const severity = getSeverity(error);
  const icon = getIcon(severity);
  const title = getTitle(error);
  
  // Obtener mensaje y acción recomendada
  const message = error instanceof AppError ? error.getUserMessage() : error.message;
  const recommendedAction = error instanceof AppError ? error.getRecommendedAction() : null;

  return (
    <ErrorContainer severity={severity} className={className}>
      <IconContainer>
        {icon}
      </IconContainer>
      
      <ContentContainer>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorMessage>{message}</ErrorMessage>
        
        {recommendedAction && (
          <ErrorAction>{recommendedAction}</ErrorAction>
        )}
        
        {showDetails && error instanceof AppError && (
          <ErrorDetails>
            <summary>Detalles técnicos</summary>
            <pre>
              {JSON.stringify({
                id: error.id,
                type: error.type,
                timestamp: error.timestamp,
                data: error.data
              }, null, 2)}
            </pre>
          </ErrorDetails>
        )}
      </ContentContainer>
      
      {onDismiss && (
        <CloseButton onClick={onDismiss} title="Cerrar">
          <FaTimes />
        </CloseButton>
      )}
    </ErrorContainer>
  );
};

export default ValidationErrorDisplay;