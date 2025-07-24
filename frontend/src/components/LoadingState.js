import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// Animación de rotación para el spinner
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// Contenedor principal
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  min-height: ${props => props.fullHeight ? '100vh' : '200px'};
`;

// Icono de carga
const Spinner = styled(FaSpinner)`
  font-size: 2rem;
  color: #007bff;
  animation: ${rotate} 1s linear infinite;
  margin-bottom: 1rem;
`;

// Icono de éxito
const SuccessIcon = styled(FaCheckCircle)`
  font-size: 2rem;
  color: #28a745;
  margin-bottom: 1rem;
`;

// Icono de error
const ErrorIcon = styled(FaExclamationCircle)`
  font-size: 2rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

// Mensaje principal
const Message = styled.p`
  font-size: 1rem;
  color: #343a40;
  margin: 0 0 0.5rem 0;
`;

// Mensaje secundario
const SubMessage = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
`;

// Barra de progreso
const ProgressBarContainer = styled.div`
  width: 100%;
  max-width: 300px;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin: 1rem 0;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background-color: #007bff;
  width: ${props => `${props.progress}%`};
  transition: width 0.3s ease;
`;

/**
 * Componente para mostrar estados de carga, éxito y error
 * @param {Object} props - Propiedades del componente
 * @param {string} props.status - Estado actual ('loading', 'success', 'error')
 * @param {string} props.message - Mensaje principal
 * @param {string} props.subMessage - Mensaje secundario
 * @param {number} props.progress - Progreso (0-100)
 * @param {boolean} props.fullHeight - Si debe ocupar toda la altura disponible
 * @param {React.ReactNode} props.children - Contenido adicional
 * @returns {JSX.Element} Componente de estado de carga
 */
const LoadingState = ({ 
  status = 'loading', 
  message, 
  subMessage, 
  progress,
  fullHeight = false,
  children 
}) => {
  // Determinar el icono según el estado
  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'loading':
      default:
        return <Spinner role="status" aria-live="polite" />;
    }
  };

  // Determinar el mensaje predeterminado según el estado
  const getDefaultMessage = () => {
    switch (status) {
      case 'success':
        return 'Operación completada con éxito';
      case 'error':
        return 'Ha ocurrido un error';
      case 'loading':
      default:
        return 'Cargando...';
    }
  };

  return (
    <Container fullHeight={fullHeight}>
      {renderIcon()}
      
      <Message>{message || getDefaultMessage()}</Message>
      
      {subMessage && <SubMessage>{subMessage}</SubMessage>}
      
      {typeof progress === 'number' && progress >= 0 && progress <= 100 && (
        <ProgressBarContainer>
          <ProgressBarFill 
            progress={progress} 
            role="progressbar" 
            aria-valuenow={progress} 
            aria-valuemin="0" 
            aria-valuemax="100"
          />
        </ProgressBarContainer>
      )}
      
      {children}
    </Container>
  );
};

export default LoadingState;