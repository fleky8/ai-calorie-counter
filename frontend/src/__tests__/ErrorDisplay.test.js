import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorDisplay from '../components/ErrorDisplay';
import { AppError, ErrorTypes } from '../services/errorService';

describe('ErrorDisplay', () => {
  test('renderiza correctamente un error de red', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    expect(screen.getByText('Error de conexión')).toBeInTheDocument();
  });
  
  test('no renderiza nada si no hay error', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    
    expect(container.firstChild).toBeNull();
  });
  
  test('muestra la acción recomendada', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText(error.getRecommendedAction())).toBeInTheDocument();
  });
  
  test('llama a onRetry cuando se hace clic en el botón de reintentar', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    const onRetry = jest.fn();
    
    render(<ErrorDisplay error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Reintentar');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  
  test('llama a onClose cuando se hace clic en el botón de cerrar', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    const onClose = jest.fn();
    
    render(<ErrorDisplay error={error} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Cerrar');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  
  test('no muestra el botón de cerrar si showClose es false', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    
    render(<ErrorDisplay error={error} showClose={false} />);
    
    expect(screen.queryByLabelText('Cerrar')).not.toBeInTheDocument();
  });
  
  test('no muestra el botón de reintentar si showRetry es false', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    
    render(<ErrorDisplay error={error} showRetry={false} />);
    
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });
  
  test('no muestra el botón de reintentar si el error no es recuperable', () => {
    const error = new AppError('Error de validación', ErrorTypes.VALIDATION);
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });
  
  test('muestra y oculta los detalles técnicos al hacer clic en el botón', () => {
    const error = new AppError('Error de conexión', ErrorTypes.NETWORK);
    error.id = 'test-id';
    
    render(<ErrorDisplay error={error} />);
    
    // Inicialmente los detalles están ocultos
    expect(screen.queryByText('ID de error:')).not.toBeInTheDocument();
    
    // Hacer clic en el botón para mostrar detalles
    const detailsButton = screen.getByText('Mostrar detalles técnicos');
    fireEvent.click(detailsButton);
    
    // Ahora los detalles deberían estar visibles
    expect(screen.getByText('ID de error:')).toBeInTheDocument();
    expect(screen.getByText('test-id')).toBeInTheDocument();
    
    // El botón debería cambiar su texto
    expect(screen.getByText('Ocultar detalles técnicos')).toBeInTheDocument();
    
    // Hacer clic de nuevo para ocultar detalles
    fireEvent.click(screen.getByText('Ocultar detalles técnicos'));
    
    // Los detalles deberían estar ocultos de nuevo
    expect(screen.queryByText('ID de error:')).not.toBeInTheDocument();
  });
});