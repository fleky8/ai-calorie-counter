import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { uploadFile } from '../services/apiService';

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

// Datos de prueba para el análisis
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

describe('Flujo completo de análisis de imagen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadFile.mockResolvedValue(mockAnalysisResult);
  });

  test('flujo completo: captura de imagen → análisis → visualización', async () => {
    renderApp();
    
    // 1. Verificar que estamos en la pantalla de captura
    expect(screen.getByText('Analiza tus alimentos')).toBeInTheDocument();
    
    // 2. Simular la captura de una imagen
    // Crear un archivo de imagen simulado
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Crear un objeto URL.createObjectURL simulado
    URL.createObjectURL = jest.fn(() => 'blob:test-url');
    URL.revokeObjectURL = jest.fn();
    
    // Simular la subida de archivo
    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fireEvent.change(fileInput);
    
    // 3. Verificar que se muestra la vista previa
    await waitFor(() => {
      expect(screen.getByText('Imagen capturada correctamente')).toBeInTheDocument();
    });
    
    // 4. Confirmar la imagen
    const confirmButton = screen.getByText('Confirmar');
    fireEvent.click(confirmButton);
    
    // 5. Verificar que navegamos a la pantalla de análisis
    await waitFor(() => {
      expect(screen.getByText('Análisis de imagen')).toBeInTheDocument();
    });
    
    // 6. Iniciar el análisis
    const analyzeButton = screen.getByText('Analizar imagen');
    fireEvent.click(analyzeButton);
    
    // 7. Verificar que se muestra el estado de carga
    await waitFor(() => {
      expect(screen.getByText(/Analizando imagen|Preparando imagen/)).toBeInTheDocument();
    });
    
    // 8. Verificar que se llama a la API
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
    
    // 9. Verificar que se muestra el resultado
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/results');
    });
  });

  test('maneja errores durante el análisis', async () => {
    // Configurar el mock para simular un error
    uploadFile.mockRejectedValueOnce(new Error('Error de conexión'));
    
    renderApp();
    
    // Simular la captura de una imagen
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    URL.createObjectURL = jest.fn(() => 'blob:test-url');
    
    const fileInput = document.querySelector('input[type="file"]');
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    fireEvent.change(fileInput);
    
    // Confirmar la imagen
    await waitFor(() => {
      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);
    });
    
    // Iniciar el análisis
    await waitFor(() => {
      const analyzeButton = screen.getByText('Analizar imagen');
      fireEvent.click(analyzeButton);
    });
    
    // Verificar que se muestra el error
    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalled();
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
    
    // Verificar que se puede reintentar
    await waitFor(() => {
      expect(screen.getByText(/Reintentar/i)).toBeInTheDocument();
    });
  });
});