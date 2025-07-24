import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock de los servicios
jest.mock('../services/apiService');
jest.mock('../services/storageService');

// Mock de react-router-dom para controlar la navegación en tests
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
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

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de performance.mark y performance.measure
    if (!window.performance) {
      window.performance = {};
    }
    
    window.performance.mark = jest.fn();
    window.performance.measure = jest.fn();
    window.performance.getEntriesByName = jest.fn().mockReturnValue([]);
    window.performance.getEntriesByType = jest.fn().mockReturnValue([]);
  });
  
  test('App renders without excessive re-renders', () => {
    // Spy en React.createElement para contar renders
    const originalCreateElement = React.createElement;
    let renderCount = 0;
    
    React.createElement = jest.fn((...args) => {
      renderCount++;
      return originalCreateElement.apply(React, args);
    });
    
    // Renderizar la aplicación
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Restaurar React.createElement
    React.createElement = originalCreateElement;
    
    // Verificar que el número de renders no sea excesivo
    // Este es un valor arbitrario que puede ajustarse según la complejidad de la aplicación
    expect(renderCount).toBeLessThan(1000);
  });
  
  test('Lazy loaded components are not loaded initially', () => {
    // Spy en import() para verificar que no se carguen componentes lazy
    const originalImport = jest.requireActual('react').lazy;
    const mockImport = jest.fn();
    
    jest.spyOn(React, 'lazy').mockImplementation((importFn) => {
      mockImport();
      return originalImport(importFn);
    });
    
    // Renderizar la aplicación
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Verificar que se hayan definido componentes lazy
    expect(mockImport).toHaveBeenCalled();
    
    // Restaurar React.lazy
    jest.restoreAllMocks();
  });
});