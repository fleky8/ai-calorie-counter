import React, { useState, useEffect } from 'react';
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

// Animación de pulso para el contenedor
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
`;

// Contenedor principal
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: ${props => {
    switch (props.status) {
      case 'success':
        return '#f0fff4';
      case 'error':
        return '#fff5f5';
      default:
        return '#f8f9fa';
    }
  }};
  border-radius: 8px;
  border: 1px solid ${props => {
    switch (props.status) {
      case 'success':
        return '#c3e6cb';
      case 'error':
        return '#f5c6cb';
      default:
        return '#e9ecef';
    }
  }};
  margin: 1rem 0;
  animation: ${props => props.animate ? pulse : 'none'} 2s infinite;
  transition: all 0.3s ease;
`;

// Icono de estado
const StatusIcon = styled.div`
  font-size: 2rem;
  color: ${props => {
    switch (props.status) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      default:
        return '#007bff';
    }
  }};
  animation: ${props => props.spin ? rotate : 'none'} 1s linear infinite;
  margin-bottom: 1rem;
`;

// Mensaje principal
const Message = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
  color: #343a40;
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

// Mensaje secundario
const SubMessage = styled.p`
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  text-align: center;
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

// Pasos de progreso
const StepsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  margin-top: 1rem;
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StepDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#007bff' : props.completed ? '#28a745' : '#e9ecef'};
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
`;

const StepLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.active ? '#007bff' : props.completed ? '#28a745' : '#6c757d'};
  text-align: center;
  max-width: 80px;
`;

/**
 * Componente para mostrar feedback visual del progreso de una operación
 * @param {Object} props - Propiedades del componente
 * @param {string} props.status - Estado actual ('loading', 'success', 'error')
 * @param {string} props.message - Mensaje principal
 * @param {string} props.subMessage - Mensaje secundario
 * @param {number} props.progress - Progreso (0-100)
 * @param {Array} props.steps - Pasos del proceso
 * @param {number} props.currentStep - Paso actual (índice)
 * @param {boolean} props.animate - Si debe mostrar animación de pulso
 * @returns {JSX.Element} Componente de feedback visual
 */
const ProgressFeedback = ({
  status = 'loading',
  message,
  subMessage,
  progress,
  steps,
  currentStep = 0,
  animate = true
}) => {
  const [progressValue, setProgressValue] = useState(progress || 0);
  
  // Actualizar progreso automáticamente si no se proporciona un valor específico
  useEffect(() => {
    if (typeof progress === 'number') {
      setProgressValue(progress);
    } else if (status === 'loading' && steps && steps.length > 0) {
      // Calcular progreso basado en pasos
      const stepProgress = ((currentStep + 1) / steps.length) * 100;
      setProgressValue(stepProgress);
    }
  }, [progress, status, steps, currentStep]);
  
  // Renderizar icono según el estado
  const renderIcon = () => {
    switch (status) {
      case 'success':
        return (
          <StatusIcon status="success">
            <FaCheckCircle />
          </StatusIcon>
        );
      case 'error':
        return (
          <StatusIcon status="error">
            <FaExclamationCircle />
          </StatusIcon>
        );
      case 'loading':
      default:
        return (
          <StatusIcon status="loading" spin>
            <FaSpinner />
          </StatusIcon>
        );
    }
  };
  
  // Determinar mensaje predeterminado según el estado
  const getDefaultMessage = () => {
    switch (status) {
      case 'success':
        return '¡Operación completada con éxito!';
      case 'error':
        return 'Ha ocurrido un error';
      case 'loading':
      default:
        return 'Procesando...';
    }
  };
  
  // Renderizar pasos si se proporcionan
  const renderSteps = () => {
    if (!steps || steps.length === 0) return null;
    
    return (
      <StepsContainer>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepDot 
              active={index === currentStep} 
              completed={index < currentStep} 
            />
            <StepLabel 
              active={index === currentStep}
              completed={index < currentStep}
            >
              {step}
            </StepLabel>
          </Step>
        ))}
      </StepsContainer>
    );
  };
  
  return (
    <Container status={status} animate={animate && status === 'loading'}>
      {renderIcon()}
      
      <Message>{message || getDefaultMessage()}</Message>
      
      {subMessage && <SubMessage>{subMessage}</SubMessage>}
      
      {progressValue > 0 && (
        <ProgressBarContainer>
          <ProgressBarFill 
            progress={progressValue} 
            role="progressbar" 
            aria-valuenow={progressValue} 
            aria-valuemin="0" 
            aria-valuemax="100"
          />
        </ProgressBarContainer>
      )}
      
      {renderSteps()}
    </Container>
  );
};

export default ProgressFeedback;