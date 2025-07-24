import React, { Component } from 'react';
import styled from 'styled-components';
import { AppError, ErrorTypes } from '../services/errorService';
import ErrorDisplay from './ErrorDisplay';

const FallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  color: #343a40;
`;

const Message = styled.p`
  margin-bottom: 1.5rem;
  color: #6c757d;
  max-width: 600px;
`;

const ResetButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0069d9;
  }
`;

/**
 * Componente de límite de errores (Error Boundary)
 * Captura errores en componentes hijos y muestra una interfaz de recuperación
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar la UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Convertir a AppError si no lo es
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          error.message,
          ErrorTypes.UNKNOWN,
          error,
          { componentStack: errorInfo?.componentStack }
        );
    
    // Registrar el error
    appError.logError();
    
    // Actualizar el estado con la información del error
    this.setState({
      error: appError,
      errorInfo: errorInfo
    });
    
    // Llamar al callback onError si existe
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Llamar al callback onReset si existe
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      // Renderizar el componente de fallback personalizado si se proporciona
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset
        });
      }
      
      // Renderizar el fallback predeterminado
      return (
        <FallbackContainer>
          <Title>Algo salió mal</Title>
          <Message>
            Ha ocurrido un error inesperado. Puedes intentar reiniciar el componente
            o volver a cargar la página.
          </Message>
          
          <ErrorDisplay 
            error={this.state.error}
            showRetry={false}
            showClose={false}
            showDetails={true}
          />
          
          <ResetButton onClick={this.handleReset}>
            Reiniciar componente
          </ResetButton>
        </FallbackContainer>
      );
    }

    // Si no hay error, renderizar los hijos normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;