import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { uploadFile } from '../services/apiService';
import { saveAnalysis, getHistory } from '../services/storageService';

// Mock de los servicios
jest.mock('../services/apiService');
jest.mock('../services/storageService');

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

// Mock de URL.createObjectURL y URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

// Datos de prueba para el análisis completo
const mockAnalysisResult = {
  success: true,
  message: 'Se detectaron 2 alimentos en la imagen',
  data: {
    foodItems: [
      { name: 'Manzana', confidence: 0.95 },
      { name: 'Plátano', confidence: 0.87 }
    ],
    nutritionData: {
      totalCalories: 180,
      macronutrients: {
        proteins: 1.5,
        carbohydrates: 45,
        fats: 0.5,
        fiber: 5.2
      },
      detectedFoods: [
        {
          name: 'Manzana',
          calories: 80,
          estimatedWeight: 150,
          confidence: 0.95,
          macronutrients: {
            proteins: 0.5,
            carbohydrates: 20,
            fats: 0.2,
            fiber: 3.0
          }
        },
        {
          name: 'Plátano',
          calories: 100,
          estimatedWeight: 120,
          confidence: 0.87,
          macronutrients: {
            proteins: 1.0,
            carbohydrates: 25,
            fats: 0.3,
            fiber: 2.2
          }
        }
      ],
      summary: {
        totalFoodsDetected: 2,
        foodsProcessed: 2,
        foodsNotFound: 0,
        averageConfidence: 0.91
      }
    },
    imageInfo: {
      size: 1024000,
      mimetype: 'image/jpeg',
      processedAt: new Date().toISOString()
    }
  }
};

// Helper para renderizar App con Router
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Integración Completa de la Aplicación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadFile.mockResolvedValue(mockAnalysisResult);
    saveAnalysis.mockReturnValue({ ...mockAnalysisResult, id: '123', date: new Date().toISOString() });
    getHistory.mockReturnValue([]);
  });

  test('flujo completo: captura → análisis → resultados → historial', async () => {
    renderApp();
    
    // 1. Verificar que la aplicación se renderiza correctamente
    expect(screen.getByText('AI Calorie Counter')).toBeInTheDocument();
    expect(screen.getByText('Contador de calorías con inteligencia artificial')).toBeInTheDocument();
    
    // 2. Verificar navegación inicial
    expect(screen.getByText('📷 Analizar')).toBeInTheDocument();
    expect(screen.getByText('📊 Historial')).toBeInTheDocument();
    
    // 3. Verificar pantalla de captura
    expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
    expect(screen.getByText('Tomar Foto')).toBeInTheDocument();
    expect(screen.getByText('Subir Imagen')).toBeInTheDocument();
    
    // 4. Simular subida de imagen
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // 5. Verificar vista previa de imagen
    await waitFor(() => {
      expect(screen.getByText('Imagen capturada correctamente')).toBeInTheDocument();
    });
    
    // 6. Confirmar imagen y navegar a análisis
    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText('Análisis de imagen')).toBeInTheDocument();
    });
    
    // 7. Iniciar análisis
    const analyzeButton = screen.getByText('Analizar imagen');
    fireEvent.click(analyzeButton);
    
    // 8. Verificar estados de progreso
    await waitFor(() => {
      expect(screen.getByText(/Preparando imagen|Analizando imagen/)).toBeInTheDocument();
    });
    
    // 9. Verificar llamada a API
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(
        '/api/analyze-image',
        expect.any(File),
        expect.objectContaining({
          enableRetry: true,
          maxRetries: 2
        })
      );
    });
    
    // 10. Verificar navegación a resultados
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/results');
    });
    
    // 11. Simular navegación manual a resultados para verificar componente
    // (En un test real, esto se haría automáticamente)
    // Renderizar nuevamente con estado de resultados
    const { rerender } = renderApp();
    
    // Simular que tenemos resultados
    const appWithResults = (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    rerender(appWithResults);
    
    // 12. Verificar que se guarda en historial
    expect(saveAnalysis).toHaveBeenCalled();
    
    // 13. Navegar al historial
    const historyLink = screen.getByText('📊 Historial');
    fireEvent.click(historyLink);
    
    await waitFor(() => {
      expect(screen.getByText('Historial de Análisis')).toBeInTheDocument();
    });
    
    // 14. Verificar que se carga el historial
    expect(getHistory).toHaveBeenCalled();
  });

  test('manejo de errores en el flujo completo', async () => {
    // Configurar error en la API
    uploadFile.mockRejectedValueOnce(new Error('Error de conexión'));
    
    renderApp();
    
    // Simular subida de imagen
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Confirmar imagen
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);
    });
    
    // Iniciar análisis
    await waitFor(() => {
      const analyzeButton = screen.getByText('Analizar imagen');
      fireEvent.click(analyzeButton);
    });
    
    // Verificar manejo de error
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalled();
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
    
    // Verificar opción de reintento
    await waitFor(() => {
      expect(screen.getByText(/Reintentar/i)).toBeInTheDocument();
    });
  });

  test('navegación entre rutas funciona correctamente', async () => {
    renderApp();
    
    // Verificar navegación a historial
    const historyLink = screen.getByText('📊 Historial');
    fireEvent.click(historyLink);
    
    await waitFor(() => {
      expect(screen.getByText('Historial de Análisis')).toBeInTheDocument();
    });
    
    // Verificar navegación de vuelta a inicio
    const homeLink = screen.getByText('📷 Analizar');
    fireEvent.click(homeLink);
    
    await waitFor(() => {
      expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
    });
  });

  test('responsive design funciona en diferentes tamaños de pantalla', () => {
    // Simular pantalla móvil
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
    
    renderApp();
    
    // Verificar que los elementos responsive están presentes
    const container = document.querySelector('.container');
    expect(container).toBeInTheDocument();
    
    // Simular pantalla de escritorio
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
    
    renderApp();
    
    // Verificar que la aplicación sigue funcionando
    expect(screen.getByText('AI Calorie Counter')).toBeInTheDocument();
  });
});