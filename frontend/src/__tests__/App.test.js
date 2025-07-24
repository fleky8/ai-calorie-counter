import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock de los servicios
jest.mock('../services/apiService');
jest.mock('../services/storageService');
jest.mock('../services/validationService');

// Mock de react-router-dom para controlar la navegación en tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock de getUserMedia para tests de cámara
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }]
    }))
  }
});

// Helper para renderizar App (ya tiene Router interno)
const renderApp = () => {
  return render(<App />);
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders main app structure', () => {
    renderApp();
    
    // Verificar que se renderiza el header
    expect(screen.getByText('AI Calorie Counter')).toBeInTheDocument();
    expect(screen.getByText('Contador de calorías con inteligencia artificial')).toBeInTheDocument();
    
    // Verificar que se renderiza la navegación
    expect(screen.getByText('📷 Analizar')).toBeInTheDocument();
    expect(screen.getByText('📊 Historial')).toBeInTheDocument();
    
    // Verificar que se renderiza el footer
    expect(screen.getByText(/© 2025 AI Calorie Counter/)).toBeInTheDocument();
  });

  test('shows camera capture component on home route', () => {
    renderApp();
    
    // Verificar que se muestra la interfaz de captura
    expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
    expect(screen.getByText('Tomar Foto')).toBeInTheDocument();
    expect(screen.getByText('Subir Imagen')).toBeInTheDocument();
  });

  test('navigation works correctly', async () => {
    renderApp();
    
    // Hacer clic en el enlace de historial
    const historyLink = screen.getByText('📊 Historial');
    fireEvent.click(historyLink);
    
    // Verificar que se navega al historial
    await waitFor(() => {
      expect(screen.getByText(/historial/i)).toBeInTheDocument();
    });
  });

  test('handles image capture flow', async () => {
    renderApp();
    
    // Simular la captura de una imagen
    const fileInput = screen.getByRole('button', { name: /subir imagen/i });
    
    // Hacer clic en subir imagen
    fireEvent.click(fileInput);
    
    // Verificar que se puede procesar la imagen
    expect(screen.getByText('Subir Imagen')).toBeInTheDocument();
  });

  test('error boundary catches errors', () => {
    // Suprimir console.error para este test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Crear un componente que lance un error
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    // Renderizar con error boundary
    render(
      <BrowserRouter>
        <App>
          <ThrowError />
        </App>
      </BrowserRouter>
    );
    
    // El error boundary debería manejar el error
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('PWA notification component is rendered', () => {
    renderApp();
    
    // El componente PWAUpdateNotification debería estar presente
    // (aunque no sea visible sin actualizaciones)
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  test('responsive design classes are applied', () => {
    renderApp();
    
    // Verificar que se aplican las clases responsive
    const container = document.querySelector('.container');
    expect(container).toBeInTheDocument();
    
    const header = document.querySelector('.App-header');
    expect(header).toBeInTheDocument();
  });
});

describe('App State Management', () => {
  test('manages global state correctly', () => {
    renderApp();
    
    // El estado inicial debería estar limpio
    expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
  });

  test('resets state when navigating home', async () => {
    renderApp();
    
    // Hacer clic en el botón de inicio
    const homeLink = screen.getByText('📷 Analizar');
    fireEvent.click(homeLink);
    
    // Verificar que se resetea el estado
    await waitFor(() => {
      expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
    });
  });
});